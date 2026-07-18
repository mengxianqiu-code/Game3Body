/**
 * 第四关：逃离二向箔
 * 多环 QTE 参数、二维化进度
 */

import { DIFFICULTY_DEFS } from '../constants.js';

// 直接复用 constants.js 中的 DIFFICULTY_DEFS 配置
export const chapter4Config = {
  // 环的半径范围（确保所有环在 viewBox 800×600 内）
  baseRadius: 80,
  radiusStep: 45,
  // 判定弧（30° = π/6）
  arcSpan: Math.PI / 6,
  // 二维化进度条
  collapse: {
    baseRate: 2.5,        // %/秒
    slowMoRate: 1.0,      // 慢动作时的速率
    slowMoTriggerAt: 3,   // 第 3 个参数激活后触发慢动作
    slowMoDuration: 3000, // 慢动作持续 3 秒
    missPenalty: 3,       // 误点一次的进度惩罚
  },
  // 慢动作救援（仅困难模式有意义）
  rescue: {
    enabled: true,
    onThirdFragment: true,
  },
};

// 简化引用
export const DIFFICULTY_RING_CONFIG = DIFFICULTY_DEFS;