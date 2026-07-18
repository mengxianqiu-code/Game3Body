import { StarsField } from './StarsField.jsx';
import { DIFFICULTY, DIFFICULTY_DEFS, CHAPTER_META } from '../constants.js';

const DIFFICULTY_LIST = [DIFFICULTY.EASY, DIFFICULTY.NORMAL, DIFFICULTY.HARD];

export function MainMenu({ onStart, difficulty = 'normal', onDifficultyChange }) {
  const titleChars = ['星', '际', '逃', '亡'];

  return (
    <div className="scene active" id="menu">
      <StarsField />
      <div className="title">
        {titleChars.map((ch, i) => (
          <span key={i} className="title-char">{ch}</span>
        ))}
      </div>
      <div className="subtitle">THREE-BODY · STARSEA</div>

      {/* 章节预览 */}
      <div className="menu-chapters">
        {Object.entries(CHAPTER_META).map(([num, meta]) => (
          <div key={num} className="menu-chapter-item">
            <span className="menu-chapter-num">{num.padStart(2, '0')}</span>
            <span className="menu-chapter-title">{meta.title}</span>
          </div>
        ))}
      </div>

      {/* 难度选择 */}
      <div className="menu-difficulty">
        <div className="menu-difficulty-label">难 度</div>
        <div className="menu-difficulty-options">
          {DIFFICULTY_LIST.map((d) => {
            const def = DIFFICULTY_DEFS[d];
            const isActive = difficulty === d;
            return (
              <button
                key={d}
                className={`menu-difficulty-btn ${isActive ? 'active' : ''}`}
                onClick={() => onDifficultyChange && onDifficultyChange(d)}
                type="button"
              >
                {def.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 开始按钮 */}
      <button className="start-wrap" aria-label="开始" onClick={onStart}>
        开 始
      </button>

      <div className="footer-hint">CLICK · TOUCH · M 键 静 音</div>

      <style>{menuStyles}</style>
    </div>
  );
}

const menuStyles = `
#menu {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

#menu .title {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 32px;
  letter-spacing: 0.5em;
  color: var(--bone, #e8e6df);
}

#menu .title-char {
  opacity: 0;
  animation: title-fade-in 0.6s ease forwards;
}

#menu .title-char:nth-child(1) { animation-delay: 0.1s; }
#menu .title-char:nth-child(2) { animation-delay: 0.25s; }
#menu .title-char:nth-child(3) { animation-delay: 0.4s; }
#menu .title-char:nth-child(4) { animation-delay: 0.55s; }

@keyframes title-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

#menu .subtitle {
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.4em;
  color: var(--cyan-fade, #2a5d6a);
  margin-bottom: 32px;
}

.menu-chapters {
  display: flex;
  gap: 24px;
  margin-bottom: 28px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--shadow, #555);
}

.menu-chapter-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 2px;
  transition: border-color 0.3s ease, color 0.3s ease;
}

.menu-chapter-item:hover {
  border-color: var(--cyan-fade, #2a5d6a);
  color: var(--cyan-signal, #7fd4e8);
}

.menu-chapter-num {
  font-size: 9px;
  letter-spacing: 0.3em;
  color: var(--cyan-fade, #2a5d6a);
}

.menu-chapter-title {
  font-size: 11px;
}

.menu-difficulty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
}

.menu-difficulty-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.4em;
  color: var(--shadow, #555);
}

.menu-difficulty-options {
  display: flex;
  gap: 8px;
}

.menu-difficulty-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.3em;
  color: var(--shadow, #555);
  background: transparent;
  border: 1px solid var(--dim, #2a2f3a);
  padding: 8px 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.menu-difficulty-btn:hover {
  border-color: var(--cyan-fade, #2a5d6a);
  color: var(--cyan-signal, #7fd4e8);
}

.menu-difficulty-btn.active {
  border-color: var(--cyan-signal, #7fd4e8);
  color: var(--cyan-signal, #7fd4e8);
  background: rgba(127, 212, 232, 0.08);
}

.start-wrap {
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  font-size: 14px;
  letter-spacing: 0.5em;
  color: var(--cyan-signal, #7fd4e8);
  background: transparent;
  border: 1px solid var(--cyan-signal, #7fd4e8);
  padding: 14px 40px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease, color 0.2s ease;
  outline: none;
  margin-bottom: 24px;
}

.start-wrap:hover {
  background: var(--cyan-signal, #7fd4e8);
  color: var(--ink-void, #05060a);
}

.start-wrap::before,
.start-wrap::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border: 1px solid var(--cyan-signal, #7fd4e8);
  transition: all 0.2s ease;
}

.start-wrap::before {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
}

.start-wrap::after {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
}

.start-wrap:hover::before,
.start-wrap:hover::after {
  width: 14px;
  height: 14px;
}

.footer-hint {
  position: absolute;
  bottom: 30px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.4em;
  color: var(--shadow, #444);
}

.completion-hint {
  position: absolute;
  top: 30px;
  right: 30px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--shadow, #555);
}
`;