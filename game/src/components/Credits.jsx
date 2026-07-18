import { StarsField } from './StarsField.jsx';

const CREDITS = [
  { role: '原 作',  name: '刘 慈 欣' },
  { role: '          ',  name: '《 三 体 》·《 黑暗森林 》·《 死神永生 》' },
  { role: '策 划',  name: 'Game3Body Team' },
  { role: '程 序',  name: 'Claude (Anthropic) 协同' },
  { role: '音 效',  name: 'Web Audio API · 0 字节资源' },
  { role: '美 术',  name: '纯 SVG · 0 位图资源' },
  { role: '',        name: '' },
  { role: '特 别 鸣 谢', name: '《 三 体 · 低 语 》' },
  { role: '          ',  name: '技术栈与设计语言参考' },
];

export function Credits({ onClose }) {
  return (
    <div className="scene active credits-scene in" id="credits">
      <StarsField />

      <div className="credits-title">星 海 之 外</div>
      <div className="credits-subtitle">CREDITS</div>

      <div className="credits-line" />

      <div className="credits-list">
        {CREDITS.map((c, i) => (
          <div key={i} className="credits-row">
            <span className="credits-role">{c.role}</span>
            <span className="credits-name">{c.name}</span>
          </div>
        ))}
      </div>

      <div className="credits-line" />

      <div className="credits-epigraph">
        <div className="credits-epigraph-text">" 给 时 间 以 生 命 ， 给 宇 宙 以 思 想 "</div>
        <div className="credits-epigraph-from">— 刘 慈 欣 · 《 三 体 · 死 神 永 生 》</div>
      </div>

      <button className="credits-close" onClick={onClose}>
        ← 返 回 主 菜 单
      </button>

      <style>{creditsStyles}</style>
    </div>
  );
}

const creditsStyles = `
.credits-scene {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  font-family: 'JetBrains Mono', monospace;
  background: rgba(5, 6, 10, 0.94);
}

.credits-title {
  font-family: 'Cormorant Garamond', 'Songti SC', serif;
  font-size: 40px;
  letter-spacing: 0.5em;
  color: var(--bone, #e8e6df);
  text-shadow: 0 0 30px rgba(127, 212, 232, 0.3);
}
.credits-subtitle {
  font-size: 10px;
  letter-spacing: 0.5em;
  color: var(--cyan-fade, #2a5d6a);
  margin: 4px 0 28px;
}

.credits-line {
  width: 200px;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--cyan-fade, #2a5d6a), transparent);
}

.credits-list {
  margin: 28px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
  min-width: 280px;
}

.credits-row {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 12px;
  font-size: 12px;
  letter-spacing: 0.25em;
}
.credits-role {
  color: var(--cyan-fade, #2a5d6a);
  min-width: 88px;
  text-align: right;
}
.credits-name {
  color: var(--bone, #e8e6df);
  text-align: left;
}

.credits-epigraph {
  margin-top: 24px;
  text-align: center;
  font-family: 'Cormorant Garamond', 'Songti SC', serif;
}
.credits-epigraph-text {
  font-size: 14px;
  letter-spacing: 0.3em;
  color: var(--bone, #e8e6df);
  opacity: 0.7;
}
.credits-epigraph-from {
  margin-top: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--shadow, #555);
}

.credits-close {
  position: absolute;
  top: 30px;
  left: 30px;
  background: transparent;
  border: 1px solid var(--cyan-fade, #2a5d6a);
  color: var(--cyan-fade, #2a5d6a);
  padding: 8px 18px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.3em;
  cursor: pointer;
  transition: all 0.2s ease;
}
.credits-close:hover {
  border-color: var(--cyan-signal, #7fd4e8);
  color: var(--cyan-signal, #7fd4e8);
}
`;