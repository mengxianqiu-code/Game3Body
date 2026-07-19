import { StarsField } from './StarsField.jsx';
import { DIFFICULTY, DIFFICULTY_DEFS, CHAPTER_META } from '../constants.js';

const DIFFICULTY_LIST = [DIFFICULTY.EASY, DIFFICULTY.NORMAL, DIFFICULTY.HARD];

export function MainMenu({
  onStart,
  difficulty = 'normal',
  onDifficultyChange,
  bestScore,
  etoCount = 0,
  onOpenSettings,
  onOpenHelp,
  onOpenCredits,
}) {
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

      {/* 最高分 + ETO 进度 */}
      <div className="menu-stats">
        <div className="menu-stat">
          <span className="menu-stat-label">最 高 威 慑 度</span>
          <span className="menu-stat-value">{bestScore ?? '—'}</span>
        </div>
        <div className="menu-stat-divider" />
        <div className="menu-stat">
          <span className="menu-stat-label">ETO 线 索</span>
          <span className="menu-stat-value">{etoCount} / 4</span>
        </div>
      </div>

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

      {/* 局外导航 */}
      <div className="menu-nav">
        <button className="menu-nav-btn" onClick={onOpenHelp} type="button">
          <span className="menu-nav-icon">?</span>
          <span className="menu-nav-label">规 则</span>
        </button>
        <button className="menu-nav-btn" onClick={onOpenSettings} type="button">
          <span className="menu-nav-icon">⚙</span>
          <span className="menu-nav-label">设 置</span>
        </button>
        <button className="menu-nav-btn" onClick={onOpenCredits} type="button">
          <span className="menu-nav-icon">☆</span>
          <span className="menu-nav-label">名 单</span>
        </button>
      </div>

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
  font-family: 'Cormorant Garamond', 'Songti SC', 'STSong', serif;
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
  margin-bottom: 24px;
}

.menu-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 8px 24px;
  border: 1px solid var(--dim, #2a2f3a);
  font-family: 'JetBrains Mono', monospace;
}
.menu-stat {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.menu-stat-label {
  font-size: 9px;
  letter-spacing: 0.3em;
  color: var(--cyan-fade, #2a5d6a);
}
.menu-stat-value {
  font-size: 13px;
  letter-spacing: 0.15em;
  color: var(--bone, #e8e6df);
  font-weight: bold;
}
.menu-stat-divider {
  width: 1px;
  height: 14px;
  background: var(--dim, #2a2f3a);
}

.menu-chapters {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
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
  margin-bottom: 24px;
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

.menu-nav {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.menu-nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 1px solid var(--dim, #2a2f3a);
  padding: 10px 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  font-family: 'JetBrains Mono', monospace;
  min-width: 70px;
}

.menu-nav-btn:hover {
  border-color: var(--cyan-fade, #2a5d6a);
}

.menu-nav-icon {
  font-size: 14px;
  color: var(--cyan-fade, #2a5d6a);
}

.menu-nav-label {
  font-size: 9px;
  letter-spacing: 0.3em;
  color: var(--shadow, #555);
}

.menu-nav-btn:hover .menu-nav-icon,
.menu-nav-btn:hover .menu-nav-label {
  color: var(--cyan-signal, #7fd4e8);
}

.footer-hint {
  position: absolute;
  bottom: max(30px, env(safe-area-inset-bottom, 0px) + 12px);
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.4em;
  color: var(--shadow, #444);
}

.completion-hint {
  position: absolute;
  top: max(30px, env(safe-area-inset-top, 0px) + 12px);
  right: max(30px, env(safe-area-inset-right, 0px) + 12px);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--shadow, #555);
}
`;