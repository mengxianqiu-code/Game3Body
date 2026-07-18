import { useEffect, useMemo, useRef, useState } from 'react';
import { StarsField } from '../StarsField.jsx';
import { RuleModal } from '../RuleModal.jsx';
import { chapter1Sfx } from '../../audio/presets.js';
import { CHAPTER1_GRID, DIFFICULTY_DEFS, COLORS, CHAPTER_META } from '../../constants.js';

const { ROWS, COLS, MINE_DENSITY } = CHAPTER1_GRID;
const MAX_DISTANCE = ROWS + COLS - 2;

/* ============== 工具函数 ============== */

/** 生成信号源 + 地雷分布 + 每格的相邻雷数
 *
 * @param {number} firstClickIdx - 第一次点击的位置索引；提供时会在该位置 3×3 范围内
 *                                 不放雷，且信号源放到 3×3 范围外，确保第一次点击
 *                                 必定展开出一小片区域（且不会一击命中）。
 *                                 传 null 时按全网格随机生成。
 */
function generateGrid(rows, cols, mineCount, firstClickIdx = null) {
  const TOTAL = rows * cols;

  // 1) 计算"安全区"：firstClickIdx 周围 3×3（最多 9 格）
  const safeIndices = new Set();
  if (firstClickIdx != null) {
    const r = Math.floor(firstClickIdx / cols);
    const c = firstClickIdx % cols;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        safeIndices.add(nr * cols + nc);
      }
    }
  }

  // 2) 随机生成信号源（必须在安全区之外）
  const signalCandidates = [];
  for (let i = 0; i < TOTAL; i++) {
    if (!safeIndices.has(i)) signalCandidates.push(i);
  }
  const signalIdx = signalCandidates[Math.floor(Math.random() * signalCandidates.length)];

  // 3) 随机生成地雷（排除信号源 + 安全区）
  const mines = new Set();
  const mineCandidates = [];
  for (let i = 0; i < TOTAL; i++) {
    if (safeIndices.has(i)) continue;
    if (i === signalIdx) continue;
    mineCandidates.push(i);
  }
  // Fisher-Yates 洗牌后取前 mineCount 个
  for (let i = mineCandidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mineCandidates[i], mineCandidates[j]] = [mineCandidates[j], mineCandidates[i]];
  }
  for (let i = 0; i < mineCount && i < mineCandidates.length; i++) {
    mines.add(mineCandidates[i]);
  }

  // 4) 计算每格的相邻雷数（0-8）
  const adjacent = new Array(TOTAL).fill(0);
  for (let i = 0; i < TOTAL; i++) {
    if (mines.has(i)) continue;
    const r = Math.floor(i / cols);
    const c = i % cols;
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (mines.has(nr * cols + nc)) count++;
      }
    }
    adjacent[i] = count;
  }
  return { signalIdx, mines, adjacent };
}

/** 获取一格的所有相邻格（含自身用于自动展开） */
function getNeighbors(idx, rows, cols, includeSelf = false) {
  const r = Math.floor(idx / cols);
  const c = idx % cols;
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!includeSelf && dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      out.push(nr * cols + nc);
    }
  }
  return out;
}

/** BFS 自动展开（数字为 0 的格子递归展开邻居） */
function floodReveal(start, revealed, mines, adjacent, rows, cols) {
  const result = new Set(revealed);
  const queue = [start];
  while (queue.length > 0) {
    const idx = queue.shift();
    if (result.has(idx) || mines.has(idx)) continue;
    result.add(idx);
    if (adjacent[idx] === 0) {
      getNeighbors(idx, rows, cols, true).forEach((n) => {
        if (!result.has(n) && !mines.has(n)) {
          queue.push(n);
        }
      });
    }
  }
  return result;
}

function manhattanDistance(idxA, idxB, cols) {
  const rA = Math.floor(idxA / cols);
  const cA = idxA % cols;
  const rB = Math.floor(idxB / cols);
  const cB = idxB % cols;
  return Math.abs(rA - rB) + Math.abs(cA - cB);
}

function proximityLabel(diff) {
  if (diff === 0) return '信 号 源';
  if (diff <= 2) return '信 号 增 强';
  if (diff <= 5) return '靠 近 了';
  if (diff <= 9) return '微 弱 信 号';
  if (diff <= 14) return '几 乎 是 噪 音';
  return '纯 噪 音';
}

function proximityGlow(diff) {
  return Math.max(0, 1 - diff / MAX_DISTANCE);
}

/* ============== 数字配色（经典扫雷） ============== */
const NUMBER_COLORS = {
  1: '#5b9bd5', // 浅蓝
  2: '#4caf50', // 绿
  3: '#e57373', // 红
  4: '#5e35b1', // 紫
  5: '#ff8f00', // 橙
  6: '#00838f', // 青
  7: '#424242', // 灰
  8: '#000000', // 黑
};

/* ============== 主组件 ============== */
export function Chapter1Signal({ difficulty = 'normal', onComplete }) {
  const diff = DIFFICULTY_DEFS[difficulty] || DIFFICULTY_DEFS.normal;
  const mineCount = Math.floor(ROWS * COLS * MINE_DENSITY);
  const maxLives = diff.scanFailures;

  const [grid, setGrid] = useState(() => generateGrid(ROWS, COLS, mineCount, null));
  const { signalIdx, mines, adjacent } = grid;
  const firstClickRef = useRef(false);

  const [revealed, setRevealed] = useState(() => new Set());
  const [minesHit, setMinesHit] = useState(new Set());
  const [lives, setLives] = useState(maxLives);
  const [lastClick, setLastClick] = useState(null);
  const [toast, setToast] = useState('');
  const [currentDistance, setCurrentDistance] = useState(null); // 最近一次点击距信号源的曼哈顿距离
  const [completed, setCompleted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const startRef = useRef(performance.now());
  const scanLoopStopRef = useRef(null);
  const minesRef = useRef(mines);
  const adjacentRef = useRef(adjacent);
  const signalIdxRef = useRef(signalIdx);

  // 同步 ref（让 handleCellClick 能读到最新的 grid 数据）
  useEffect(() => {
    minesRef.current = mines;
    adjacentRef.current = adjacent;
    signalIdxRef.current = signalIdx;
  }, [mines, adjacent, signalIdx]);

  // 启动背景扫描音
  useEffect(() => {
    scanLoopStopRef.current = chapter1Sfx.startScanLoop();
    return () => {
      if (scanLoopStopRef.current) scanLoopStopRef.current();
      chapter1Sfx.stopScanLoop();
    };
  }, []);

  function handleCellClick(idx, isDoubleClick = false) {
    if (completed || revealed.has(idx)) return;

    // 第一次点击：重新生成 grid（保证 5×5 区域无雷 + 信号源在外）
    if (!firstClickRef.current) {
      firstClickRef.current = true;
      const newGrid = generateGrid(ROWS, COLS, mineCount, idx);
      setGrid(newGrid);
      // 用新 grid 处理这次点击（直接走后续流程）
      processClick(idx, newGrid);
      return;
    }
    processClick(idx, grid);
  }

  function processClick(idx, activeGrid) {
    const { mines: m, adjacent: a, signalIdx: sig } = activeGrid;
    setLastClick(idx);

    // 是地雷
    if (m.has(idx)) {
      chapter1Sfx.mineHit();
      setMinesHit((prev) => new Set(prev).add(idx));
      setRevealed((prev) => new Set(prev).add(idx));
      const newLives = lives - 1;
      setLives(newLives);
      setToast(`踩 雷 · 剩 余 ${newLives} 次 容 错`);
      setTimeout(() => setToast(''), 1500);
      setCurrentDistance(manhattanDistance(idx, sig, COLS)); // 踩雷也记录距离
      if (navigator.vibrate) navigator.vibrate(120);

      if (newLives <= 0) {
        chapter1Sfx.gameOver();
        if (scanLoopStopRef.current) scanLoopStopRef.current();
        chapter1Sfx.stopScanLoop();
        const score = {
          timeUsed: Math.floor((performance.now() - startRef.current) / 1000),
          errors: maxLives,
          hits: maxLives,
          decoysClicked: 0,
        };
        setTimeout(() => {
          onComplete && onComplete(score, { reason: '容 错 耗 尽' });
        }, 1500);
      }
      return;
    }

    // 是普通格子：自动展开（数字为 0 时）
    const newRevealed = floodReveal(idx, revealed, m, a, ROWS, COLS);
    setRevealed(newRevealed);

    // 计算距离信号源，播放音调
    const dist = manhattanDistance(idx, sig, COLS);
    setCurrentDistance(dist); // 右下角显示
    chapter1Sfx.tuningNoise(dist);

    if (dist <= 2) chapter1Sfx.signalNear();
    // 移除中央 proximityLabel toast（距离数字已经够了）

    // 胜利条件 1：玩家直接点到信号源
    // 胜利条件 2：自动展开（floodReveal）波及到了信号源
    const signalFound = dist === 0 || newRevealed.has(sig);
    if (signalFound) {
      chapter1Sfx.signalFound();
      setCompleted(true);
      if (scanLoopStopRef.current) scanLoopStopRef.current();
      chapter1Sfx.stopScanLoop();
      const score = {
        timeUsed: Math.floor((performance.now() - startRef.current) / 1000),
        errors: (maxLives - lives),
        hits: minesHit.size,
        decoysClicked: 0,
      };
      setTimeout(() => {
        onComplete && onComplete(score);
      }, 1500);
    }
  }

  const signalRow = Math.floor(signalIdx / COLS);
  const signalCol = signalIdx % COLS;
  const currentGlow = lastClick != null
    ? proximityGlow(manhattanDistance(lastClick, signalIdx, COLS))
    : 0;

  return (
    <div className="scene active ch1-scene" id="chapter1">
      <StarsField />
      <div className="ch1-glow" style={{ opacity: 0.15 + currentGlow * 0.5 }} />

      {/* HUD */}
      <div className="ch1-hud">
        <div className="ch1-title">{CHAPTER_META[1].title}</div>
        <div className="ch1-subtitle">{CHAPTER_META[1].subtitle}</div>
        <div className="ch1-lives">
          {Array.from({ length: maxLives }).map((_, i) => (
            <span key={i} className={`ch1-life ${i < lives ? 'on' : 'off'}`}>◆</span>
          ))}
          <span className="ch1-lives-label">容 错</span>
        </div>
        <button className="ch1-help" onClick={() => setShowHelp(true)} aria-label="规则说明">?</button>
      </div>

      {showHelp && <RuleModal chapter="1" onClose={() => setShowHelp(false)} />}

      <div className="ch1-lede">
        听 声 找 信 号 · 数字 = 相 邻 雷 数
      </div>

      {/* 扫雷网格（含数字） */}
      <div className="ch1-grid-wrap">
        <svg
          className="ch1-grid"
          viewBox={`0 0 ${COLS * 40} ${ROWS * 40}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {Array.from({ length: ROWS * COLS }).map((_, idx) => {
            const r = Math.floor(idx / COLS);
            const c = idx % COLS;
            const isRevealed = revealed.has(idx);
            const isMine = minesHit.has(idx);
            const isSignal = isRevealed && idx === signalIdx;
            const num = adjacent[idx];
            return (
              <g key={idx}>
                <rect
                  x={c * 40 + 2}
                  y={r * 40 + 2}
                  width={36}
                  height={36}
                  rx={3}
                  className={`ch1-cell ${isRevealed ? 'revealed' : ''} ${isMine ? 'mine' : ''} ${isSignal ? 'signal' : ''}`}
                  onClick={() => handleCellClick(idx)}
                />
                {/* 数字（非 0、已翻开、非雷、非信号源） */}
                {isRevealed && !isMine && !isSignal && num > 0 && (
                  <text
                    x={c * 40 + 20}
                    y={r * 40 + 27}
                    className="ch1-cell-number"
                    textAnchor="middle"
                    fill={NUMBER_COLORS[num] || '#888'}
                  >
                    {num}
                  </text>
                )}
                {/* 踩雷标记 */}
                {isMine && (
                  <text x={c * 40 + 20} y={r * 40 + 26} className="ch1-cell-text mine-text" textAnchor="middle">✕</text>
                )}
                {/* 信号源标记 */}
                {isSignal && (
                  <>
                    <text x={c * 40 + 20} y={r * 40 + 26} className="ch1-cell-text signal-text" textAnchor="middle">◆</text>
                    <circle cx={c * 40 + 20} cy={r * 40 + 20} r="14" fill="none" stroke="#7fd4e8" strokeWidth="1.5" opacity="0.8" />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 中央 toast（仅踩雷时短暂显示） */}
      {toast && <div className="ch1-toast" key={toast}>{toast}</div>}

      {/* 右下角：距离信号源的具体格子数（持续显示） */}
      {!completed && currentDistance != null && (
        <div className="ch1-distance">
          距 信 号 源 · <span className="ch1-distance-val">{currentDistance}</span> 格
        </div>
      )}

      {/* 信号源方位提示（开发用，正式发布可隐藏） */}
      {!completed && (
        <div className="ch1-direction">
          信 号 方 位 · 行 {signalRow + 1} · 列 {signalCol + 1} · 已 翻 {revealed.size} 格
        </div>
      )}

      <style>{chapterStyles}</style>
    </div>
  );
}

/* ============== 局部样式 ============== */
const chapterStyles = `
.ch1-scene {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.ch1-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at center, transparent 30%, var(--cyan-signal, #7fd4e8) 100%);
  transition: opacity 0.4s ease;
  z-index: 1;
}

.ch1-hud {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
}

.ch1-title {
  font-size: 16px;
  letter-spacing: 0.4em;
  color: var(--bone, #e8e6df);
  margin-bottom: 6px;
}

.ch1-subtitle {
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--cyan-fade, #2a5d6a);
  margin-bottom: 12px;
}

.ch1-lives {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  font-size: 14px;
}

.ch1-life {
  font-size: 12px;
  transition: all 0.3s ease;
}

.ch1-life.on { color: var(--cyan-signal, #7fd4e8); }
.ch1-life.off { color: var(--dim, #2a2f3a); }

.ch1-lives-label {
  margin-left: 12px;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: var(--shadow, #555);
}

.ch1-lede {
  position: absolute;
  top: 130px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  letter-spacing: 0.25em;
  color: var(--shadow, #555);
  z-index: 10;
}

.ch1-grid-wrap {
  position: relative;
  width: min(85vw, 720px);
  height: min(60vh, 480px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.ch1-grid {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
}

.ch1-cell {
  fill: var(--ink-deep, #0a0d14);
  stroke: var(--dim, #2a2f3a);
  stroke-width: 1;
  cursor: pointer;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.ch1-cell:hover {
  fill: #15181f;
  stroke: var(--cyan-fade, #2a5d6a);
}

.ch1-cell.revealed {
  fill: #06080c;
  stroke: var(--shadow, #444);
  stroke-width: 0.5;
}

.ch1-cell.mine {
  fill: rgba(217, 69, 95, 0.2);
  stroke: var(--rust-warn, #d9455f);
  animation: ch1-mine-flash 1s ease infinite;
}

.ch1-cell.signal {
  fill: rgba(127, 212, 232, 0.3);
  stroke: var(--cyan-signal, #7fd4e8);
  stroke-width: 2;
  animation: ch1-signal-pulse 1.5s ease infinite;
}

.ch1-cell-number {
  font-size: 18px;
  font-weight: bold;
  pointer-events: none;
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
}

.ch1-cell-text {
  font-size: 18px;
  font-weight: bold;
  pointer-events: none;
}

.mine-text { fill: var(--rust-warn, #d9455f); }
.signal-text { fill: var(--cyan-signal, #7fd4e8); }

@keyframes ch1-mine-flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes ch1-signal-pulse {
  0%, 100% { stroke-width: 2; opacity: 1; }
  50% { stroke-width: 3; opacity: 0.7; }
}

.ch1-toast {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  font-size: 18px;
  letter-spacing: 0.4em;
  color: var(--cyan-signal, #7fd4e8);
  padding: 12px 24px;
  background: rgba(10, 13, 20, 0.85);
  border: 1px solid var(--cyan-fade, #2a5d6a);
  border-radius: 2px;
  pointer-events: none;
  z-index: 20;
  animation: ch1-toast-in 0.3s ease;
}

@keyframes ch1-toast-in {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

.ch1-direction {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--shadow, #444);
  z-index: 10;
}

.ch1-distance {
  position: absolute;
  bottom: 30px;
  right: 30px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--cyan-fade, #2a5d6a);
  padding: 10px 18px;
  background: rgba(10, 13, 20, 0.75);
  border: 1px solid var(--cyan-fade, #2a5d6a);
  z-index: 10;
  animation: ch1-distance-in 0.3s ease;
}

.ch1-distance-val {
  color: var(--cyan-signal, #7fd4e8);
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 0;
  margin: 0 4px;
}

@keyframes ch1-distance-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.ch1-help {
  position: absolute;
  top: 40px;
  right: 30px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--cyan-fade, #2a5d6a);
  background: transparent;
  color: var(--cyan-fade, #2a5d6a);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  z-index: 11;
  transition: all 0.2s ease;
}
.ch1-help:hover {
  border-color: var(--cyan-signal, #7fd4e8);
  color: var(--cyan-signal, #7fd4e8);
  background: rgba(127, 212, 232, 0.1);
}
`;
