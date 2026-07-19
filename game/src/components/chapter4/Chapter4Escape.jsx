import { useEffect, useMemo, useRef, useState } from 'react';
import { StarsField } from '../StarsField.jsx';
import { RuleModal } from '../RuleModal.jsx';
import { chapter4Sfx } from '../../audio/presets.js';
import { DIFFICULTY_DEFS, COLORS, CHAPTER_META } from '../../constants.js';

const VIEWBOX = { w: 800, h: 600 };
const CENTER = { x: 400, y: 300 };

/* ============== 工具函数 ============== */
function generateRings(count, speedRange) {
  const [minS, maxS] = speedRange;
  const rings = [];
  // 环位置：均匀分布在飞船周围（飞船固定在中央）
  // 调整半径范围确保所有环都在 viewBox (800×600) 内
  const baseRadius = 80;
  const radiusStep = 45;
  for (let i = 0; i < count; i++) {
    // 每个环独立转速（差异 ≥ 30%）
    const t = count === 1 ? 0.5 : i / (count - 1);
    const periodMs = minS * 1000 + (maxS * 1000 - minS * 1000) * t;
    // 相位错开
    const phaseOffset = Math.random() * Math.PI * 2;
    // 蓝点位置（参数点）
    const blueAngle = Math.random() * Math.PI * 2;
    rings.push({
      id: i,
      radius: baseRadius + i * radiusStep,
      periodMs,
      phaseOffset,
      blueAngle,
      // 当前白点角度（运行时更新）
      whiteAngle: phaseOffset,
      activated: false,
      // 蓝点周围的判定弧（30°，即 ±15°）
      arcSpan: Math.PI / 6, // 30°
    });
  }
  return rings;
}

function angleInArc(whiteAngle, blueAngle, arcSpan) {
  // 判断白点是否在蓝点的判定弧内
  let diff = whiteAngle - blueAngle;
  // 归一化到 [-π, π]
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return Math.abs(diff) <= arcSpan;
}

/* ============== 主组件 ============== */
export function Chapter4Escape({ difficulty = 'normal', onComplete }) {
  const diff = DIFFICULTY_DEFS[difficulty] || DIFFICULTY_DEFS.normal;
  const ringCount = diff.ringCount;

  const rings = useMemo(
    () => generateRings(ringCount, diff.ringSpeedRange),
    [ringCount, diff.ringSpeedRange]
  );

  const [progress, setProgress] = useState(0); // 0-100，二维化进度
  const [slowMo, setSlowMo] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [activationOrder, setActivationOrder] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const [victoryText, setVictoryText] = useState(''); // 胜利文字逐字浮现

  const startRef = useRef(performance.now());
  const animFrameRef = useRef(null);
  const collapseStopRef = useRef(null);
  const [, force] = useState(0);

  // 启动二维化背景音
  useEffect(() => {
    collapseStopRef.current = chapter4Sfx.startCollapseHum();
    return () => {
      if (collapseStopRef.current) collapseStopRef.current();
      chapter4Sfx.stopCollapseHum();
    };
  }, []);

  // 主动画循环：更新白点角度 + 进度条
  useEffect(() => {
    if (completed) return;
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last;
      last = now;
      const speedFactor = slowMo ? 0.3 : 1;
      // 进度条：基础推进 + 慢动作减缓
      setProgress((p) => {
        const inc = (dt / 1000) * (slowMo ? 1.0 : 2.5); // 基础速率 2.5%/s（约 40 秒走完）
        return Math.min(100, p + inc);
      });
      // 更新每个环的白点角度
      rings.forEach((r) => {
        const omega = (2 * Math.PI) / r.periodMs; // 弧度/毫秒
        r.whiteAngle += omega * dt * speedFactor;
      });
      force((n) => n + 1);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [rings, slowMo, completed]);

  // 检查进度条满了 → 失败
  useEffect(() => {
    if (progress >= 100 && !completed) {
      handleFail();
    }
    // eslint-disable-next-line
  }, [progress]);

  function handleFail() {
    chapter4Sfx.ringMiss();
    if (collapseStopRef.current) collapseStopRef.current();
    chapter4Sfx.stopCollapseHum();
    const score = {
      timeUsed: Math.floor((performance.now() - startRef.current) / 1000),
      fragmentsCollected: activationOrder.length,
      order: activationOrder,
    };
    setTimeout(() => {
      onComplete && onComplete(score, { reason: '被 二 维 化' });
    }, 800);
  }

  function handleRingClick(ring) {
    if (ring.activated || completed) return;
    const hit = angleInArc(ring.whiteAngle, ring.blueAngle, ring.arcSpan);
    if (hit) {
      ring.activated = true;
      const newOrder = [...activationOrder, ring.id];
      setActivationOrder(newOrder);
      chapter4Sfx.ringLocked(ring.id);

      // 第 3 个参数激活后，进入慢动作抢救窗口
      if (newOrder.length === 3 && ringCount > 3) {
        setSlowMo(true);
        setTimeout(() => setSlowMo(false), 3000);
      }

      // 全部激活 → 胜利
      if (newOrder.length === ringCount) {
        setCompleted(true);
        if (collapseStopRef.current) collapseStopRef.current();
        chapter4Sfx.stopCollapseHum();
        chapter4Sfx.warp();
        // 胜利文字逐字浮现
        const lines = [
          '曲 率 引 擎 启 动 ……',
          '星 环 号 进 入 光 速 ……',
          '二维化的太阳系在身后归于沉寂。',
          '你携带着四段记忆——',
          '它们将是你在新维度里唯一的方向。',
        ];
        let acc = '';
        let idx = 0;
        const iv = setInterval(() => {
          if (idx >= lines.length) { clearInterval(iv); return; }
          acc += (acc ? '\n' : '') + lines[idx];
          setVictoryText(acc);
          idx++;
        }, 900);
        const score = {
          timeUsed: Math.floor((performance.now() - startRef.current) / 1000),
          fragmentsCollected: newOrder.length,
          order: newOrder,
        };
        // 文字全部浮现 + 3 秒停留后回调
        setTimeout(() => {
          onComplete && onComplete(score);
        }, lines.length * 900 + 3000);
      }
    } else {
      // 时机错误
      chapter4Sfx.ringMiss();
      // 进度条小幅推进作为惩罚
      setProgress((p) => Math.min(100, p + 3));
    }
  }

  // 二维化压扁效果（CSS scaleY）
  const scaleY = Math.max(0.05, 1 - progress / 100);

  return (
    <div className="scene active ch4-scene" id="chapter4">
      <StarsField />

      {showHelp && <RuleModal chapter="4" onClose={() => setShowHelp(false)} />}

      {/* 二维化容器（scaleY 压扁） */}
      <div
        className="ch4-collapse-layer"
        style={{
          transform: `scaleY(${scaleY})`,
          opacity: Math.max(0.3, 1 - progress / 150),
        }}
      >
        <svg viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} preserveAspectRatio="xMidYMid meet">
          {/* 飞船（中心） */}
          <g className="ch4-ship">
            <polygon
              points={`${CENTER.x - 18},${CENTER.y + 18} ${CENTER.x + 18},${CENTER.y + 18} ${CENTER.x},${CENTER.y - 18}`}
              fill="none"
              stroke={COLORS.cyan}
              strokeWidth="2"
            />
            <circle cx={CENTER.x} cy={CENTER.y} r="6" fill={COLORS.cyan} opacity="0.6" />
          </g>

          {/* 多个激活环 */}
          {rings.map((ring) => {
            const isActivated = ring.activated;
            const blueX = CENTER.x + Math.cos(ring.blueAngle) * ring.radius;
            const blueY = CENTER.y + Math.sin(ring.blueAngle) * ring.radius;
            const whiteX = CENTER.x + Math.cos(ring.whiteAngle) * ring.radius;
            const whiteY = CENTER.y + Math.sin(ring.whiteAngle) * ring.radius;
            // 判定弧（30°，从蓝点 ±15°）
            const arcStart = ring.blueAngle - ring.arcSpan;
            const arcEnd = ring.blueAngle + ring.arcSpan;
            const arcStartX = CENTER.x + Math.cos(arcStart) * ring.radius;
            const arcStartY = CENTER.y + Math.sin(arcStart) * ring.radius;
            const arcEndX = CENTER.x + Math.cos(arcEnd) * ring.radius;
            const arcEndY = CENTER.y + Math.sin(arcEnd) * ring.radius;
            return (
              <g key={ring.id} className={`ch4-ring ${isActivated ? 'activated' : ''}`}>
                {/* 环路径 */}
                <circle
                  cx={CENTER.x}
                  cy={CENTER.y}
                  r={ring.radius}
                  fill="none"
                  stroke={isActivated ? COLORS.cyan : COLORS.dim}
                  strokeWidth="1"
                  opacity={isActivated ? 0.4 : 0.7}
                  strokeDasharray={isActivated ? '0' : '4 4'}
                />
                {/* 判定弧（绿色，30°） */}
                {!isActivated && (
                  <path
                    d={`M ${arcStartX} ${arcStartY} A ${ring.radius} ${ring.radius} 0 0 1 ${arcEndX} ${arcEndY}`}
                    fill="none"
                    stroke={COLORS.ok}
                    strokeWidth="3"
                    opacity="0.8"
                  />
                )}
                {/* 蓝点（参数点） */}
                {!isActivated && (
                  <circle
                    cx={blueX}
                    cy={blueY}
                    r="14"
                    fill={COLORS.cyan}
                    opacity="0.5"
                    onClick={() => handleRingClick(ring)}
                    style={{ cursor: 'pointer' }}
                  >
                    <animate attributeName="r" values="14;18;14" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* 激活后的标记 */}
                {isActivated && (
                  <circle cx={blueX} cy={blueY} r="8" fill={COLORS.cyan} opacity="0.9" />
                )}
                {/* 白点（动点） */}
                {!isActivated && (
                  <circle cx={whiteX} cy={whiteY} r="6" fill="#fff" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* HUD */}
      <div className="ch4-hud">
        <div className="ch4-title">{CHAPTER_META[4].title}</div>
        <div className="ch4-subtitle">{CHAPTER_META[4].subtitle}</div>
        <div className="ch4-progress-label">
          二 维 化 进 程
          <span className="ch4-progress-value">{Math.floor(progress)}%</span>
        </div>
        <div className="ch4-progress-bar">
          <div
            className="ch4-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="ch4-status">
          已 激 活 · {activationOrder.length} / {ringCount}
        </div>
        <button className="ch4-help" onClick={() => setShowHelp(true)} aria-label="规则说明">?</button>
        {slowMo && <div className="ch4-slowmo">慢 动 作 · 抢 救 模 式</div>}
      </div>

      {/* 胜利文字逐字浮现 */}
      {completed && victoryText && (
        <div className="ch4-victory-text">
          {victoryText.split('\n').map((line, i) => (
            <div key={i} className="ch4-victory-line">{line}</div>
          ))}
        </div>
      )}

      <style>{chapter4Styles}</style>
    </div>
  );
}

/* ============== 局部样式 ============== */
const chapter4Styles = `
.ch4-scene {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ch4-collapse-layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center center;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.ch4-collapse-layer svg {
  width: min(100vw, 100vh * 1.5);
  height: min(100vh, 100vw / 1.5);
  max-width: 100%;
  max-height: 100%;
  overflow: visible;
}

.ch4-hud {
  position: absolute;
  top: max(30px, env(safe-area-inset-top, 0px) + 12px);
  left: max(30px, env(safe-area-inset-left, 0px) + 12px);
  z-index: 10;
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  color: var(--bone, #e8e6df);
  min-width: 240px;
}

.ch4-title {
  font-size: 14px;
  letter-spacing: 0.4em;
  margin-bottom: 4px;
  color: var(--cyan-signal, #7fd4e8);
}

.ch4-subtitle {
  font-size: 9px;
  letter-spacing: 0.25em;
  color: var(--cyan-fade, #2a5d6a);
  margin-bottom: 16px;
}

.ch4-progress-label {
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--shadow, #555);
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.ch4-progress-value {
  color: var(--rust-warn, #d9455f);
  font-weight: bold;
}

.ch4-progress-bar {
  width: 240px;
  height: 4px;
  background: var(--dim, #2a2f3a);
  border: 1px solid var(--shadow, #555);
  position: relative;
  overflow: hidden;
}

.ch4-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--rust-warn, #d9455f), #ff7585);
  transition: width 0.2s linear;
}

.ch4-status {
  margin-top: 16px;
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--cyan-signal, #7fd4e8);
}

.ch4-slowmo {
  margin-top: 8px;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--rust-warn, #d9455f);
  animation: ch4-blink 0.5s ease infinite alternate;
}

@keyframes ch4-blink {
  from { opacity: 0.5; }
  to { opacity: 1; }
}

.ch4-ring circle {
  cursor: pointer;
}

.ch4-ring.activated circle {
  cursor: default;
}

.ch4-help {
  position: absolute;
  top: max(40px, env(safe-area-inset-top, 0px) + 16px);
  right: max(30px, env(safe-area-inset-right, 0px) + 12px);
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
.ch4-help:hover {
  border-color: var(--cyan-signal, #7fd4e8);
  color: var(--cyan-signal, #7fd4e8);
  background: rgba(127, 212, 232, 0.1);
}

.ch4-victory-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 20;
  padding: 24px;
  text-align: center;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 80%);
  animation: ch4-victory-bg-in 1.2s ease;
}

@keyframes ch4-victory-bg-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.ch4-victory-line {
  font-family: 'Cormorant Garamond', 'Songti SC', 'STSong', serif;
  font-size: 22px;
  letter-spacing: 0.35em;
  line-height: 2;
  color: var(--cyan-signal, #7fd4e8);
  text-shadow: 0 0 16px rgba(127, 212, 232, 0.65);
  opacity: 0;
  animation: ch4-victory-line-in 1s ease forwards;
}

.ch4-victory-line:nth-child(1) { animation-delay: 0s; }
.ch4-victory-line:nth-child(2) { animation-delay: 0.4s; }
.ch4-victory-line:nth-child(3) { animation-delay: 0.8s; }
.ch4-victory-line:nth-child(4) { animation-delay: 1.2s; }
.ch4-victory-line:nth-child(5) { animation-delay: 1.6s; }

@keyframes ch4-victory-line-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
`;