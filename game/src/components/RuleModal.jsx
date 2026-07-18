import { useEffect } from 'react';

/**
 * 关卡内 ? 按钮弹出的精简规则
 * @param {string} chapter - '1' | '2' | '3' | '4'
 */
const CHAPTER_RULES = {
  1: {
    title: '信 号 监 测 员',
    rules: [
      '数 字 = 周 围 雷 数',
      '第 一 次 点 击 安 全 区 3×3',
      '右 下 角 显 示 距 信 号 源 格 数',
      '踩 雷 3 次 失 败',
    ],
  },
  2: {
    title: '飞 船 驾 驶 员',
    rules: [
      '移 动 扫 描 带 · 触 之 累 警 告',
      '星 体 引 力 内 加 速',
      '警 告 上 限 = 失 败',
      '到 达 逃 逸 点 通 关',
    ],
  },
  3: {
    title: '威 慑 纪 元',
    rules: [
      '本 轮 随 机 3 个 判 断 标 准',
      '3 条 全 满 足 = 真 威 胁',
      '极 性 可 能 翻 转',
      '按 Q 拦 截 · P 放 行',
      '空 格 暂 停 查 看 标 准',
    ],
  },
  4: {
    title: '逃 离 二 向 箔',
    rules: [
      '环 数 = 简 3 / 普 4 / 困 5',
      '白 点 入 判 定 弧 = 点 击',
      '激 活 3 个 后 慢 动 作',
      '二 维 化 满 = 失 败',
    ],
  },
};

export function RuleModal({ chapter, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === '?' || e.key === 'q' || e.key === 'Q') {
        if (e.key === 'Escape' || e.key === '?') onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const data = CHAPTER_RULES[chapter] || CHAPTER_RULES['1'];

  return (
    <div className="rule-modal-overlay" onClick={onClose}>
      <div className="rule-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rule-modal-header">
          <div className="rule-modal-title">{data.title}</div>
          <button className="rule-modal-close" onClick={onClose} aria-label="关闭">×</button>
        </div>
        <ul className="rule-modal-list">
          {data.rules.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        <div className="rule-modal-hint">按 ESC 或 ? 关 闭</div>
      </div>
      <style>{ruleModalStyles}</style>
    </div>
  );
}

const ruleModalStyles = `
.rule-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 6, 10, 0.75);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: rule-modal-fade 0.25s ease;
  font-family: 'JetBrains Mono', monospace;
}

@keyframes rule-modal-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.rule-modal {
  background: var(--ink-deep, #0b1018);
  border: 1px solid var(--cyan-fade, #2a5d6a);
  padding: 28px 36px;
  min-width: 320px;
  max-width: 480px;
  box-shadow: 0 0 40px rgba(127, 212, 232, 0.2);
  animation: rule-modal-slide 0.3s ease;
}

@keyframes rule-modal-slide {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.rule-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--dim, #2a2f3a);
}
.rule-modal-title {
  font-family: 'Cormorant Garamond', 'Songti SC', serif;
  font-size: 20px;
  letter-spacing: 0.4em;
  color: var(--bone, #e8e6df);
}
.rule-modal-close {
  background: transparent;
  border: 1px solid var(--cyan-fade, #2a5d6a);
  color: var(--cyan-fade, #2a5d6a);
  width: 28px;
  height: 28px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.rule-modal-close:hover {
  border-color: var(--cyan-signal, #7fd4e8);
  color: var(--cyan-signal, #7fd4e8);
}

.rule-modal-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--bone, #e8e6df);
  line-height: 2;
}
.rule-modal-list li {
  padding-left: 14px;
  position: relative;
}
.rule-modal-list li::before {
  content: '·';
  position: absolute;
  left: 0;
  color: var(--cyan-fade, #2a5d6a);
}

.rule-modal-hint {
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--shadow, #555);
  text-align: right;
}
`;