import { useEffect, useState, useMemo } from 'react';
import { StarsField } from './StarsField.jsx';
import { stopAllChapterAudio } from '../audio/presets.js';
import { computeOverallRating } from '../gameState.js';
import { OVERALL_RATING } from '../constants.js';

const ENDING_LINES = {
  success: [
    '你带着四段记忆离开——它们将是你在新维度里唯一的方向。',
    '跃迁的那一刻，你的身体化作了一束纯粹的光。',
    '三维的形体留在原地，你的思考却先一步抵达了彼岸。',
    '你留下的最后一个问题，比任何答案都更响亮。',
  ],
  poetic: '即使不再是三维的形态，思考仍在继续——以另一种方式存在下去。',
};

function pickLine(variant) {
  if (variant === 'poetic') return ENDING_LINES.poetic;
  const lines = ENDING_LINES.success;
  return lines[Math.floor(Math.random() * lines.length)];
}

function getRating(score) {
  for (const tier of ['S', 'A', 'B', 'C', 'D']) {
    if (score >= OVERALL_RATING[tier].min) {
      return { tier, ...OVERALL_RATING[tier] };
    }
  }
  return { tier: 'D', ...OVERALL_RATING.D };
}

export function EndingScreen({ variant = 'success', scores, onRestart }) {
  const [showText, setShowText] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [showRating, setShowRating] = useState(false);

  const rating = useMemo(() => getRating(computeOverallRating(scores)), [scores]);
  const line = useMemo(() => pickLine(variant), [variant]);

  useEffect(() => {
    stopAllChapterAudio();
    const t1 = setTimeout(() => setShowText(true), 300);
    const t2 = setTimeout(() => setShowBadge(true), 1200);
    const t3 = setTimeout(() => setShowRating(true), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const c1 = scores.chapter1 || {};
  const c2 = scores.chapter2 || {};
  const c3 = scores.chapter3 || {};
  const c4 = scores.chapter4 || {};

  return (
    <div className="scene active" id="ending">
      <StarsField />

      {/* 总评分大字 */}
      {showRating && (
        <div className="ending-rating">
          <div className="ending-rating-tier">{rating.tier}</div>
          <div className="ending-rating-label">{rating.label.replace(`${rating.tier} · `, '')}</div>
        </div>
      )}

      {/* 旁白 */}
      <div className={`quote ${showText ? 'in' : ''}`}>{line}</div>

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
  justify-content: center;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
  padding: 40px;
  font-family: 'JetBrains Mono', monospace;
}

.quote {
  margin-bottom: 40px;
  font-size: 14px;
  letter-spacing: 0.3em;
  line-height: 1.8;
  text-align: center;
  color: var(--bone, #e8e6df);
  max-width: 720px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.quote.in {
  opacity: 1;
  transform: translateY(0);
}

.ending-rating {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
  animation: ending-rating-in 1.2s ease;
}

@keyframes ending-rating-in {
  from { opacity: 0; transform: translate(-50%, -30px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

.ending-rating-tier {
  font-size: 80px;
  letter-spacing: 0.05em;
  font-weight: 200;
  line-height: 1;
  color: var(--cyan-signal, #7fd4e8);
  text-shadow: 0 0 30px rgba(127, 212, 232, 0.5);
}

.ending-rating-label {
  font-size: 11px;
  letter-spacing: 0.4em;
  color: var(--shadow, #555);
  margin-top: 8px;
}

.score-badge {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 36px 60px;
  padding: 40px 60px;
  border: 1px solid var(--shadow, #555);
  background: rgba(5, 6, 10, 0.65);
  opacity: 0;
  transition: opacity 0.8s ease;
}

.score-badge.in {
  opacity: 1;
}

.score-chapter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.score-chapter-title {
  font-size: 10px;
  letter-spacing: 0.4em;
  color: var(--cyan-fade, #2a5d6a);
  margin-bottom: 8px;
  border-bottom: 1px solid var(--shadow, #555);
  padding-bottom: 4px;
}

.score-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  letter-spacing: 0.15em;
}

.score-label {
  color: var(--shadow, #555);
}

.score-value {
  color: var(--bone, #e8e6df);
}

.restart-wrap {
  margin-top: 40px;
  background: transparent;
  border: 1px solid var(--cyan-signal, #7fd4e8);
  color: var(--cyan-signal, #7fd4e8);
  padding: 12px 36px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.4em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.restart-wrap:hover {
  background: rgba(127, 212, 232, 0.1);
  box-shadow: 0 0 20px rgba(127, 212, 232, 0.3);
}
`;
