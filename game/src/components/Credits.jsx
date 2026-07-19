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

      <div className="credits-line" />

      <div className="credits-disclaimer">
        <div className="credits-disclaimer-title">版 权 与 致 敬 声 明</div>
        <div className="credits-disclaimer-body">
          本 作 品 为 个 人 非 商 业 学 习 项 目 ，
          仅 作 为 对 刘 慈 欣 先 生《 三 体 》三 部 曲 的 致 敬 之 作 。
          游 戏 中 涉 及 的 世 界 观 、 人 物 姓 名 、 概 念 与 名 词
          （ 如 面 壁 计 划 、 执 剑 人 、 掩 体 纪 元 、 曲 率 引 擎 、 二 向 箔 等 ）
          均 来 源 于 原 著 ， 所 有 相 关 知 识 产 权 归 原 作 者 刘 慈 欣
          及 出 版 方 重 庆 出 版 集 团 · 科 幻 图 书 品 牌 所 有 。
        </div>
        <div className="credits-disclaimer-body">
          本 项 目 未 复 制 、 改 编 或 商 业 化 利 用 原 著 任 何 正 文 段 落 ，
          全 部 对 话 与 文 案 均 为 独 立 创 作 ， 故 事 演 绎 属 于 二 次 创 作 性 解 读 。
          如 本 作 品 不 当 使 用 涉 及 侵 权 ，
          项 目 作 者 将 在 收 到 通 知 后 第 一 时 间 删 除 相 关 内 容 。
        </div>
        <div className="credits-disclaimer-support">
          支 持 原 作 · 推 荐 购 买 正 版《 三 体 》三 部 曲
        </div>
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

.credits-disclaimer {
  margin-top: 20px;
  max-width: 520px;
  padding: 18px 22px;
  border: 1px solid rgba(127, 212, 232, 0.12);
  background: rgba(127, 212, 232, 0.03);
  text-align: left;
  font-family: 'JetBrains Mono', monospace;
}
.credits-disclaimer-title {
  font-size: 11px;
  letter-spacing: 0.4em;
  color: var(--cyan-fade, #2a5d6a);
  margin-bottom: 12px;
  text-align: center;
}
.credits-disclaimer-body {
  font-size: 10.5px;
  line-height: 1.9;
  letter-spacing: 0.12em;
  color: rgba(232, 230, 223, 0.55);
  margin-bottom: 10px;
  text-indent: 2em;
}
.credits-disclaimer-support {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed rgba(127, 212, 232, 0.15);
  font-size: 10px;
  letter-spacing: 0.35em;
  color: rgba(127, 212, 232, 0.7);
  text-align: center;
  font-family: 'Cormorant Garamond', 'Songti SC', serif;
  font-style: italic;
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