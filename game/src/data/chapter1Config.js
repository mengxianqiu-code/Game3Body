/**
 * 第一关：信号监测员
 * 扫雷网格参数、信号/雷数量、容错、音调距离映射
 */

import { CHAPTER1_GRID } from '../constants.js';

export const chapter1Config = {
  grid: CHAPTER1_GRID,  // { ROWS: 10, COLS: 15, TOTAL: 150, MINE_DENSITY: 0.12 }
  // 三档难度的容错次数（与 DIFFICULTY_DEFS.scanFailures 一致）
  maxLives: { easy: 3, normal: 3, hard: 2 },
  // 距离驱动的音调提示文字
  proximityLabels: [
    { max: 0,  text: '信 号 源' },
    { max: 2,  text: '信 号 增 强' },
    { max: 5,  text: '靠 近 了' },
    { max: 9,  text: '微 弱 信 号' },
    { max: 14, text: '几 乎 是 噪 音' },
    { max: 99, text: '纯 噪 音' },
  ],
};