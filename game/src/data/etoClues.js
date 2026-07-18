/**
 * ETO（地球三体组织）隐藏线索系统
 * - 每关通关后 40% 概率掉落 1 条
 * - 集齐 4 条解锁隐藏结局
 */
export const ETO_CLUES = [
  {
    id: 'eto-1',
    chapter: 1,
    text: '降 临 派 在 2007 年 就 已 经 知 道 回 复 信 号 的 后 果。',
    source: 'ETO 通 讯 截 获 · 残 卷',
  },
  {
    id: 'eto-2',
    chapter: 2,
    text: '面 壁 者 罗 辑 的 咒 语 已 经 生 效 —— 三 体 人 无 法 阻 止 他 的 破 壁。',
    source: 'ETO 内 部 备 忘',
  },
  {
    id: 'eto-3',
    chapter: 3,
    text: '执 剑 人 交 接 仪 式 的 失 败 早 已 被 预 测 ：人 类 不 感 谢 罗 辑。',
    source: 'ETO 战 略 推 演',
  },
  {
    id: 'eto-4',
    chapter: 4,
    text: '掩 体 不 是 诺 亚 方 舟 · 太 阳 系 的 命 运 在 190 秒 内 已 被 写 下。',
    source: 'ETO 文 明 终 局 档 案',
  },
];

export const ETO_DROP_RATE = 0.4; // 每关通关后掉率

/**
 * 在某关通关时尝试获取一条该关的 ETO 线索
 * @returns {object|null} 线索对象或 null
 */
export function rollEtoClue(chapter, alreadyCollected) {
  if (Math.random() > ETO_DROP_RATE) return null;
  const candidate = ETO_CLUES.find(
    (c) => c.chapter === chapter && !alreadyCollected.includes(c.id)
  );
  return candidate || null;
}