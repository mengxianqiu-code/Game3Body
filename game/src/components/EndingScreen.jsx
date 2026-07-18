import { useEffect, useState, useMemo } from 'react';
import { StarsField } from './StarsField.jsx';
import { stopAllChapterAudio } from '../audio/presets.js';
import { computeOverallRating } from '../gameState.js';
import { OVERALL_RATING } from '../constants.js';
import { ETO_CLUES } from '../data/etoClues.js';

const ENDING_VARIANTS = {
  eto_full: {
    title: '新 文 明 · 你 是 播 种 者',
    desc: '你带走的不仅是记忆——还有文明的火种。ETO 在你身后记录下了这一切。',
    quote: '当 第 二 个 宇 宙 中 出 现 第 一 个 思 考 ，你 才 真 正 完 成 了 旅 程 。',
    accent: 'eto',
  },
  s_perfect: {
    title: '完 美 的 逃 亡',
    desc: '你带着四段记忆离开——它们将是你在新维度里唯一的方向。',
    quote: '曲 率 引 擎 启 动 …… 星 环 号 进 入 光 速 ……',
    accent: 'cyan',
  },
  shelter_escape: {
    title: '掩 体 没 有 救 你',
    desc: '但它给了你 8 分钟——刚好够曲率引擎启动。',
    quote: '木 星 背 后 的 城 市 ，已 经 化 为 一 张 薄 薄 的 素 描 。',
    accent: 'cyan',
  },
  standard: {
    title: '你 离 开 了 三 维',
    desc: '跃迁的那一刻，你的身体化作了一束纯粹的光。',
    quote: '三 维 的 形 体 留 在 原 地 ，你 的 思 考 却 先 一 步 抵 达 了 彼 岸 。',
    accent: 'cyan',
  },
  barely: {
    title: '二 维 化 已 开 始',
    desc: '你还在光速中——但身后的世界已化为素描。',
    quote: '你 留 下 的 最 后 一 个 问 题 ，比 任 何 答 案 都 更 响 亮 。',
    accent: 'rust',
  },
  failed: {
    title: '太 阳 系 已 化 为 素 描',
    desc: '三维形体留在原地。你的思考……先一步抵达了彼岸。',
    quote: '即 使 不 再 是 三 维 的 形 态 ，思 考 仍 在 继 续 —— 以 另 一 种 方 式 存 在 下 去 。',
    accent: 'rust',
  },
};

function pickVariant(score, etoCount, shelterChoice) {
  if (etoCount === 4) return 'eto_full';
  if (score >= 90) return 's_perfect';
  if (score >= 60) return shelterChoice === 'shelter' ? 'shelter_escape' : 'standard';
  if (score >= 40) return 'barely';
  return 'failed';
}

function getRating(score) {
  for (const tier of ['S', 'A', 'B', 'C', 'D']) {
    if (score >= OVERALL_RATING[tier].min) {
      return { tier, ...OVERALL_RATING[tier] };
    }
  }
  return { tier: 'D', ...OVERALL_RATING.D };
}

export function EndingScreen({ variant = 'success', scores, etoClues = [], shelterChoice = null, onRestart }) {
  const [showText, setShowText] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showClues, setShowClues] = useState(false);

  const rating = useMemo(() => getRating(computeOverallRating(scores)), [scores]);
  const endingKey = useMemo(
    () => pickVariant(computeOverallRating(scores), etoClues.length, shelterChoice),
    [scores, etoClues, shelterChoice]
  );
  const ending = ENDING_VARIANTS[endingKey] || ENDING_VARIANTS.standard;

  useEffect(() => {
    stopAllChapterAudio();
    const t1 = setTimeout(() => setShowText(true), 300);
    const t2 = setTimeout(() => setShowBadge(true), 1200);
    const t3 = setTimeout(() => setShowRating(true), 2400);
    const t4 = setTimeout(() => setShowClues(true), 3400);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, []);

  const c1 = scores.chapter1 || {};
  const c2 = scores.chapter2 || {};
  const c3 = scores.chapter3 || {};
  const c4 = scores.chapter4 || {};
  const accentColor = ending.accent === 'rust' ? 'var(--rust-warn, #d9455f)' :
                       ending.accent === 'eto'  ? 'var(--gold, #e8d87f)' :
                                                  'var(--cyan-signal, #7fd4e8)';

  return (
    <div className="scene active" id="ending">
      <StarsField />

      {/* 结局标题 */}
      <div className={`ending-title-block ${showText ? 'in' : ''}`}>
        <div className="ending-title" style={{ color: accentColor }}>{ending.title}</div>
        <div className="ending-desc">{ending.desc}</div>
        <div className="ending-quote">{ending.quote}</div>
      </div>

      {/* 总评分大字 */}
      {showRating && (
        <div className="ending-rating">
          <div className="ending-rating-tier" style={{ color: accentColor }}>{rating.tier}</div>
          <div className="ending-rating-label">{rating.label.replace(`${rating.tier} · `, '')}</div>
          <div className="ending-rating-score">{computeOverallRating(scores)} / 100</div>
        </div>
      )}

      {/* 详细分数 */}
      <div className={`score-badge ${showBadge ? 'in' : ''}`}>
        <div className="score-chapter">
          <div className="score-chapter-title">第 一 章 · 信 号 监 测</div>
          <ScoreRow label="用 时" value={`${c1.timeUsed || 0}s`} />
          <ScoreRow label="错 误" value={`${c1.errors || 0} / 3`} />
          <ScoreRow label="信 号 探 测" value={`${c1.hits || 0}`} />
        </div>
        <div className="score-chapter">
          <div className="score-chapter-title">第 二 章 · 飞 船 驾 驶</div>
          <ScoreRow label="用 时" value={`${c2.timeUsed || 0}s`} />
          <ScoreRow label="扫 描 警 告" value={`${c2.warnings || 0}`} />
        </div>
        <div className="score-chapter">
          <div className="score-chapter-title">第 三 章 · 威 慑 纪 元</div>
          <ScoreRow label="威 慑 值" value={`${c3.deterrence ?? 50}`} />
          <ScoreRow label="判 断 错 误" value={`${c3.errors || 0}`} />
        </div>
        <div className="score-chapter">
          <div className="score-chapter-title">第 四 章 · 逃 离 二 向</div>
          <ScoreRow label="用 时" value={`${c4.timeUsed || 0}s`} />
          <ScoreRow label="碎 片 激 活" value={`${c4.fragmentsCollected || 0}`} />
        </div>
      </div>

      {/* ETO 线索揭示 */}
      {showClues && (
        <div className="eto-clues">
          <div className="eto-clues-title">
            E TO 隐 藏 线 索 · {etoClues.length} / {ETO_CLUES.length}
            {etoClues.length === ETO_CLUES.length && (
              <span className="eto-clues-bonus">· 隐 藏 结 局 已 解 锁</span>
            )}
          </div>
          <div className="eto-clues-grid">
            {ETO_CLUES.map((c) => {
              const collected = etoClues.includes(c.id);
              return (
                <div key={c.id} className={`eto-clue ${collected ? 'collected' : 'missing'}`}>
                  <div className="eto-clue-num">CH {String(c.chapter).padStart(2, '0')}</div>
                  <div className="eto-clue-text">{collected ? c.text : '—— 线 索 未 获 取 ——'}</div>
                  <div className="eto-clue-source">{collected ? c.source : ''}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button className="restart-wrap" onClick={onRestart}>再 来 一 次</button>

      <style>{endingStyles}</style>
    </div>
  );
}

function ScoreRow({ label, value }) {
  return (
    <div className="score-row">
      <span className="score-label">{label}</span>
      <span className="score-value">{value}</span>
    </div>
  );
}

const endingStyles = `
.scene#ending {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 24px 40px;
  width: 100%;
  min-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  font-family: 'JetBrains Mono', monospace;
}

.ending-title-block {
  text-align: center;
  margin-bottom: 24px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.ending-title-block.in { opacity: 1; transform: translateY(0); }

.ending-title {
  font-family: 'Cormorant Garamond', 'Songti SC', 'STSong', serif;
  font-size: 36px;
  letter-spacing: 0.4em;
  font-weight: 200;
  margin-bottom: 12px;
}

.ending-desc {
  font-size: 13px;
  letter-spacing: 0.3em;
  line-height: 1.8;
  color: var(--bone, #e8e6df);
  max-width: 680px;
  margin: 0 auto 12px;
}

.ending-quote {
  font-family: 'Cormorant Garamond', 'Songti SC', serif;
  font-size: 14px;
  letter-spacing: 0.3em;
  color: var(--cyan-fade, #2a5d6a);
  font-style: italic;
}

.ending-rating {
  text-align: center;
  margin: 16px 0 24px;
  animation: ending-rating-in 1.2s ease;
}

@keyframes ending-rating-in {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

.ending-rating-tier {
  font-size: 80px;
  letter-spacing: 0.05em;
  font-weight: 200;
  line-height: 1;
  text-shadow: 0 0 30px currentColor;
}
.ending-rating-label {
  font-size: 11px;
  letter-spacing: 0.4em;
  color: var(--shadow, #555);
  margin-top: 8px;
}
.ending-rating-score {
  font-size: 14px;
  letter-spacing: 0.3em;
  color: var(--cyan-fade, #2a5d6a);
  margin-top: 6px;
}

.score-badge {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px 48px;
  padding: 24px 40px;
  border: 1px solid var(--shadow, #555);
  background: rgba(5, 6, 10, 0.65);
  max-width: 880px;
  width: 100%;
  opacity: 0;
  transition: opacity 0.8s ease;
}
.score-badge.in { opacity: 1; }

@media (max-width: 720px) {
  .score-badge { grid-template-columns: 1fr; gap: 16px; padding: 20px; }
}

.score-chapter { display: flex; flex-direction: column; gap: 6px; }

.score-chapter-title {
  font-size: 10px;
  letter-spacing: 0.4em;
  color: var(--cyan-fade, #2a5d6a);
  margin-bottom: 6px;
  border-bottom: 1px solid var(--shadow, #555);
  padding-bottom: 4px;
}

.score-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  letter-spacing: 0.15em;
}
.score-label { color: var(--shadow, #555); }
.score-value { color: var(--bone, #e8e6df); }

.eto-clues {
  margin-top: 36px;
  max-width: 880px;
  width: 100%;
  animation: eto-fade-in 1s ease;
}
@keyframes eto-fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.eto-clues-title {
  font-size: 11px;
  letter-spacing: 0.4em;
  color: var(--cyan-fade, #2a5d6a);
  margin-bottom: 16px;
  text-align: center;
}
.eto-clues-bonus {
  color: var(--gold, #e8d87f);
  margin-left: 8px;
}

.eto-clues-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 720px) { .eto-clues-grid { grid-template-columns: 1fr; } }

.eto-clue {
  padding: 14px 18px;
  border: 1px solid var(--dim, #2a2f3a);
  background: rgba(10, 13, 20, 0.6);
}
.eto-clue.collected { border-color: var(--gold, #e8d87f); }
.eto-clue.missing { opacity: 0.35; }

.eto-clue-num {
  font-size: 9px;
  letter-spacing: 0.3em;
  color: var(--gold, #e8d87f);
  margin-bottom: 6px;
}
.eto-clue-text {
  font-family: 'Cormorant Garamond', 'Songti SC', serif;
  font-size: 13px;
  letter-spacing: 0.2em;
  line-height: 1.8;
  color: var(--bone, #e8e6df);
  margin-bottom: 6px;
}
.eto-clue-source {
  font-size: 9px;
  letter-spacing: 0.2em;
  color: var(--cyan-fade, #2a5d6a);
  text-align: right;
}

.restart-wrap {
  margin-top: 32px;
  background: transparent;
  border: 1px solid var(--cyan-signal, #7fd4e8);
  color: var(--cyan-signal, #7fd4e8);
  padding: 12px 36px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.4em;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 40px;
}

.restart-wrap:hover {
  background: rgba(127, 212, 232, 0.1);
  box-shadow: 0 0 20px rgba(127, 212, 232, 0.3);
}
`;