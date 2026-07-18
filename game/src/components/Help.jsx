import { StarsField } from './StarsField.jsx';

const HELP_DATA = [
  {
    num: '01',
    title: '信 号 监 测 员',
    goal: '在 10×15 的扫雷网格中，找到隐藏信号源。',
    rules: [
      '数字 = 周 围 8 格 内 的 地 雷 数',
      '第 一 次 点 击 会 暴 露 3×3 安 全 区',
      '右 下 角 实 时 显 示 距 信 号 源 的 格 子 数',
      '踩 雷 3 次 即 失 败',
    ],
    keys: '鼠 标 点 击',
  },
  {
    num: '02',
    title: '飞 船 驾 驶 员',
    goal: '驾驶飞船穿越战区，抵达逃逸点。',
    rules: [
      '屏 幕 上 有 移 动 扫 描 带，触 之 累 计 警 告',
      '星 体 引 力 场 内 可 以 加 速',
      '警 告 累 计 达 上 限 即 失 败',
      '成 功 到 达 逃 逸 点 即 通 关',
    ],
    keys: 'W / A / S / D 或 方 向 键',
  },
  {
    num: '03',
    title: '威 慑 纪 元',
    goal: '判断涌来的信息哪条是真威胁。',
    rules: [
      '本 轮 随 机 选 3 个 判 断 标 准',
      '3 条 标 准 全 部 满 足 = 真 威 胁',
      '每 条 标 准 的 "异 常" / "正 常" 极 性 可 能 翻 转',
      '按 Q 拦 截 · 按 P 放 行',
      '游 戏 中 按 空 格 可 暂 停 查 看 当 前 标 准',
    ],
    keys: 'Q / P / Space',
  },
  {
    num: '04',
    title: '逃 离 二 向 箔',
    goal: '校准所有曲率引擎参数，启动星环号跃迁。',
    rules: [
      '难 度 决 定 环 数：简 单 3 / 普 通 4 / 困 难 5',
      '所 有 环 一 次 性 显 示，可 自 由 选 择 激 活 顺 序',
      '白 点 进 入 蓝 点 周 围 的 判 定 弧 即 可 点 击',
      '击 中 3 个 后 进 入 慢 动 作 抢 救 模 式',
      '二 维 化 进 度 条 满 则 失 败',
    ],
    keys: '鼠 标 点 击 蓝 点',
  },
];

export function Help({ onClose }) {
  return (
    <div className="scene active help-scene in" id="help">
      <StarsField />

      <div className="help-title">游 戏 说 明</div>
      <div className="help-subtitle">HOW TO PLAY</div>

      <div className="help-list">
        {HELP_DATA.map((c, i) => (
          <div key={i} className="help-card" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="help-card-num">{c.num}</div>
            <div className="help-card-title">{c.title}</div>
            <div className="help-card-goal"><span className="help-tag">目 标</span>{c.goal}</div>
            <ul className="help-rules">
              {c.rules.map((r, j) => (
                <li key={j}>{r}</li>
              ))}
            </ul>
            <div className="help-keys"><span className="help-tag">操 作</span>{c.keys}</div>
          </div>
        ))}
      </div>

      <button className="help-close" onClick={onClose}>
        ← 返 回 主 菜 单
      </button>

      <style>{helpStyles}</style>
    </div>
  );
}

const helpStyles = `
.help-scene {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 60px 24px 80px;
  font-family: 'JetBrains Mono', monospace;
  background: rgba(5, 6, 10, 0.94);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.help-title {
  font-family: 'Cormorant Garamond', 'Songti SC', serif;
  font-size: 32px;
  letter-spacing: 0.5em;
  color: var(--bone, #e8e6df);
}
.help-subtitle {
  font-size: 10px;
  letter-spacing: 0.5em;
  color: var(--cyan-fade, #2a5d6a);
  margin-bottom: 32px;
}

.help-list {
  width: min(880px, 96vw);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
@media (max-width: 720px) {
  .help-list { grid-template-columns: 1fr; }
}

.help-card {
  padding: 20px 24px;
  border: 1px solid var(--dim, #2a2f3a);
  background: rgba(10, 13, 20, 0.6);
  animation: help-card-in 0.5s ease both;
  transition: border-color 0.2s ease;
}
.help-card:hover { border-color: var(--cyan-fade, #2a5d6a); }

@keyframes help-card-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.help-card-num {
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--cyan-fade, #2a5d6a);
  margin-bottom: 4px;
}
.help-card-title {
  font-family: 'Cormorant Garamond', 'Songti SC', serif;
  font-size: 18px;
  letter-spacing: 0.3em;
  color: var(--bone, #e8e6df);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--dim, #2a2f3a);
}
.help-card-goal, .help-keys {
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--bone, #e8e6df);
  margin-bottom: 12px;
  line-height: 1.7;
}

.help-rules {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
  font-size: 10px;
  letter-spacing: 0.15em;
  color: var(--shadow, #888);
  line-height: 1.8;
}
.help-rules li {
  padding-left: 12px;
  position: relative;
}
.help-rules li::before {
  content: '·';
  position: absolute;
  left: 0;
  color: var(--cyan-fade, #2a5d6a);
}

.help-tag {
  display: inline-block;
  font-size: 9px;
  letter-spacing: 0.3em;
  padding: 2px 8px;
  margin-right: 8px;
  border: 1px solid var(--cyan-fade, #2a5d6a);
  color: var(--cyan-fade, #2a5d6a);
  vertical-align: middle;
}

.help-close {
  position: fixed;
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
  z-index: 10;
}
.help-close:hover {
  border-color: var(--cyan-signal, #7fd4e8);
  color: var(--cyan-signal, #7fd4e8);
}
`;