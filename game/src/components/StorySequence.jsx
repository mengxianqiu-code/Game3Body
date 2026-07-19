import { useEffect, useState } from 'react';
import { StarsField } from './StarsField.jsx';
import { STORY } from '../data/storyLines.js';

/**
 * 升级版过场组件
 * - 3 秒扫描线 + 标题浮现
 * - 文案逐句浮现（每句 0.45s）
 * - 如有 choice：进入选择阶段，按 1 / 2 或点击按钮
 */
export function StorySequence({ storyKey, onChoice, onDone }) {
  const story = STORY[storyKey];
  const [lineCount, setLineCount] = useState(0); // 已浮现的句子数
  const [showChoice, setShowChoice] = useState(false);
  const [scanX, setScanX] = useState(0);
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTitle(true), 300);
    // 扫描线 0 → 100% 在 0-1.5s 之间
    let raf;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / 1500);
      setScanX(p * 100);
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      clearTimeout(t1);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!story) return;
    const total = story.lines.length;
    if (lineCount >= total) {
      // 文案结束
      if (story.choice) {
        // 等玩家选择
        setShowChoice(true);
      } else {
        // 直接结束（短暂停留后回调）
        const t = setTimeout(() => onDone && onDone(), 1400);
        return () => clearTimeout(t);
      }
      return;
    }
    const t = setTimeout(() => setLineCount((n) => n + 1), 450);
    return () => clearTimeout(t);
  }, [lineCount, story, onDone]);

  // 监听键盘选择
  useEffect(() => {
    if (!showChoice || !story.choice) return;
    const onKey = (e) => {
      if (e.key === '1') return choose(story.choice.options[0]);
      if (e.key === '2') return choose(story.choice.options[1]);
      if (e.key === 'Enter' || e.key === ' ') {
        return choose(story.choice.options[1]); // 默认直接逃亡
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showChoice, story]);

  function choose(option) {
    if (onChoice) onChoice(option.id);
    setTimeout(() => onDone && onDone(), 600);
  }

  if (!story) {
    return (
      <div className="scene active" id="story">
        <StarsField />
        <div style={{ color: 'var(--shadow)', padding: 40 }}>剧 情 缺 失</div>
      </div>
    );
  }

  return (
    <div className="scene active story-scene in" id="story">
      <StarsField />

      {/* 扫描线 */}
      <div className="story-scan" style={{ left: `${scanX}%` }} />

      {/* 章节标题 */}
      <div className={`story-title-block ${showTitle ? 'in' : ''}`}>
        <div className="story-title">{story.title}</div>
        {story.subtitle && <div className="story-subtitle">{story.subtitle}</div>}
      </div>

      {/* 文案区 */}
      <div className="story-lines">
        {story.lines.slice(0, lineCount).map((line, i) => (
          <div key={i} className="story-line in">{line}</div>
        ))}
      </div>

      {/* 选择阶段 */}
      {showChoice && story.choice && (
        <div className="story-choice">
          <div className="story-choice-prompt">{story.choice.prompt}</div>
          <div className="story-choice-options">
            {story.choice.options.map((opt, i) => (
              <button
                key={opt.id}
                className="story-choice-btn"
                onClick={() => choose(opt)}
              >
                <span className="story-choice-num">{i + 1}</span>
                <span className="story-choice-label">{opt.label}</span>
              </button>
            ))}
          </div>
          <div className="story-choice-hint">按 1 或 2 选 择 · 默 认 直 接 逃 亡（按 Enter / Space）</div>
        </div>
      )}

      {/* 跳过提示（仅 intro 阶段） */}
      {story.skipHint && !showChoice && lineCount < story.lines.length && (
        <div className="story-skip-hint">{story.skipHint}</div>
      )}

      <style>{storyStyles}</style>
    </div>
  );
}

const storyStyles = `
.story-scene {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: max(16px, env(safe-area-inset-top, 0px));
  padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
  background: rgba(5, 6, 10, 0.92);
  opacity: 0;
  transition: opacity 0.4s ease;
}
.story-scene.in { opacity: 1; }

.story-scan {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(to bottom, transparent 0%, rgba(127,212,232,0.5) 30%, rgba(127,212,232,0.9) 50%, rgba(127,212,232,0.5) 70%, transparent 100%);
  box-shadow: 0 0 20px rgba(127, 212, 232, 0.6);
  z-index: 5;
  transition: opacity 0.4s ease;
}

.story-title-block {
  text-align: center;
  margin-bottom: 36px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.story-title-block.in { opacity: 1; transform: translateY(0); }

.story-title {
  font-family: 'Cormorant Garamond', 'Songti SC', 'STSong', serif;
  font-size: 48px;
  letter-spacing: 0.4em;
  color: var(--bone, #e8e6df);
  text-shadow: 0 0 30px rgba(127, 212, 232, 0.3);
}
.story-subtitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.4em;
  color: var(--cyan-fade, #2a5d6a);
  margin-top: 8px;
}

.story-lines {
  text-align: center;
  max-width: 720px;
  font-family: 'Cormorant Garamond', 'Songti SC', 'STSong', serif;
  font-size: 18px;
  letter-spacing: 0.3em;
  line-height: 2.2;
  color: var(--bone, #e8e6df);
  min-height: 240px;
  padding: 0 24px;
}

.story-line {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.story-line.in { opacity: 1; transform: translateY(0); }

.story-choice {
  margin-top: 24px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  animation: story-choice-in 0.5s ease;
}
@keyframes story-choice-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.story-choice-prompt {
  font-size: 14px;
  letter-spacing: 0.5em;
  color: var(--rust-warn, #d9455f);
  margin-bottom: 20px;
}

.story-choice-options {
  display: flex;
  gap: 24px;
  justify-content: center;
}

.story-choice-btn {
  background: transparent;
  border: 1px solid var(--cyan-fade, #2a5d6a);
  color: var(--bone, #e8e6df);
  padding: 14px 28px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  letter-spacing: 0.3em;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
}
.story-choice-btn:hover {
  border-color: var(--cyan-signal, #7fd4e8);
  background: rgba(127, 212, 232, 0.1);
}

.story-choice-num {
  color: var(--cyan-fade, #2a5d6a);
  font-size: 11px;
  padding: 2px 6px;
  border: 1px solid var(--cyan-fade, #2a5d6a);
}
.story-choice-label {
  color: var(--bone, #e8e6df);
}

.story-choice-hint {
  margin-top: 16px;
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--shadow, #555);
}

.story-skip-hint {
  position: absolute;
  bottom: max(40px, env(safe-area-inset-bottom, 0px) + 16px);
  left: 50%;
  transform: translateX(-50%);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.3em;
  color: var(--cyan-fade, #2a5d6a);
  animation: story-blink 1.4s ease infinite;
}
@keyframes story-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;