/* eslint-disable */
/**
 * 《三体：星际逃亡》常量配置
 * 章节枚举、主题变量、时长配置
 */

export const GAME_PHASE = {
  MENU: 'MENU',
  TRANSITION: 'TRANSITION',
  CHAPTER_1: 'CHAPTER_1',
  CHAPTER_2: 'CHAPTER_2',
  CHAPTER_3: 'CHAPTER_3',
  CHAPTER_4: 'CHAPTER_4',
  GAME_OVER: 'GAME_OVER',
  ENDING: 'ENDING',
};

/* ============== 难度配置 ============== */
export const DIFFICULTY = {
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard',
};

export const DIFFICULTY_DEFS = {
  easy:   { label: '简 单', ringCount: 3, ringSpeedRange: [2.5, 4.5], infoCount: 10, infoDurationMs: 3500, scanFailures: 3 },
  normal: { label: '普 通', ringCount: 4, ringSpeedRange: [2.0, 3.5], infoCount: 12, infoDurationMs: 3000, scanFailures: 3 },
  hard:   { label: '困 难', ringCount: 5, ringSpeedRange: [1.5, 2.8], infoCount: 14, infoDurationMs: 2700, scanFailures: 2 },
};

/* ============== 第一关：扫雷 10×15 ============== */
export const CHAPTER1_GRID = {
  ROWS: 10,
  COLS: 15,
  TOTAL: 150,
  MINE_DENSITY: 0.22,  // 22% 雷密度（150 × 22% ≈ 33 雷）
};

/* ============== 资源键（参考《低语》保留） ============== */
export const RESOURCE_KEYS = {
  FUEL: 'fuel',
  HULL: 'hull',
  ENERGY: 'energy',
  DATA: 'data',
};

export const RESOURCE_DEFS = {
  fuel:   { max: 100, label: '燃 料', color: '#7fd4e8', icon: '◆', warnAt: 25 },
  hull:   { max: 100, label: '船 体', color: '#d9455f', icon: '◇', warnAt: 50, criticalAt: 25 },
  energy: { max: 100, label: '能 量', color: '#a8e8c8', icon: '◈', warnAt: 30, regen: 0.4 },
  data:   { max: 50,  label: '数 据', color: '#e8d87f', icon: '○', warnAt: 40 },
};

/* ============== CSS 变量（与《低语》一致） ============== */
export const CSS_VARS = {
  inkVoid: 'var(--ink-void)',
  inkDeep: 'var(--ink-deep)',
  cyanSignal: 'var(--cyan-signal)',
  cyanFade: 'var(--cyan-fade)',
  bone: 'var(--bone)',
  rustWarn: 'var(--rust-warn)',
  shadow: 'var(--shadow)',
};

/* ============== 颜色调色板 ============== */
export const COLORS = {
  bg: '#05060a',
  bgDeep: '#0a0d14',
  cyan: '#7fd4e8',
  cyanFade: '#2a5d6a',
  bone: '#e8e6df',
  warn: '#d9455f',
  ok: '#a8e8c8',
  mine: '#d9455f',
  signal: '#7fd4e8',
  dim: '#2a2f3a',
  gold: '#e8d87f',
};

/* ============== 章节标题与描述 ============== */
export const CHAPTER_META = {
  1: {
    title: '信 号 监 测 员',
    subtitle: '第一关 · 三体世界',
    description: '在 10×15 的扫雷网格中，通过声音找到隐藏信号源',
  },
  2: {
    title: '飞 船 驾 驶 员',
    subtitle: '第二关 · 星际航行',
    description: '驾驶飞船躲避外星文明扫描，抵达右上角逃逸点',
  },
  3: {
    title: '威 慑 纪 元',
    subtitle: '第三关 · 地球视角',
    description: '判断涌来的信息哪条是真威胁，按下威慑开关',
  },
  4: {
    title: '逃 离 二 向 箔',
    subtitle: '第四关 · 终极逃亡',
    description: '校准多个曲率引擎参数，启动星环号跃迁',
  },
};

/* ============== 总评分等级 ============== */
export const OVERALL_RATING = {
  S: { min: 90, label: 'S · 完美的逃亡' },
  A: { min: 75, label: 'A · 优秀的表现' },
  B: { min: 60, label: 'B · 顺利通关' },
  C: { min: 40, label: 'C · 勉强通过' },
  D: { min: 0,  label: 'D · 人类存续' },
};