/**
 * 第三关：威慑纪元
 * 判断标准、信息流参数、误报代价
 */

export const chapter3Config = {
  // 三个判断标准（每次随机选 3 个）
  // 每个标准有 text 和 exampleSvg（演示图）
  judgmentCriteria: [
    {
      key: 'color',
      title: '色 彩 不 协 调',
      // 真威胁判定：颜色与背景对比度低（暗淡）
      test: (info) => info.color === 'dim',
    },
    {
      key: 'shape',
      title: '形 状 不 规 则',
      // 真威胁判定：形状对称性低于阈值
      test: (info) => info.shape === 'irregular',
    },
    {
      key: 'motion',
      title: '动 态 混 乱',
      // 真威胁判定：动态随机性高
      test: (info) => info.motion === 'chaotic',
    },
    {
      key: 'size',
      title: '尺 寸 异 常',
      test: (info) => info.size === 'anomaly',
    },
    {
      key: 'position',
      title: '位 置 偏 移',
      test: (info) => info.position === 'edge',
    },
  ],
  // 信息流配置
  infoFlow: {
    totalCount: { easy: 10, normal: 12, hard: 14 },  // 总条数
    realThreatRatio: 1 / 3,  // 真威胁：假信息 = 1:3
    durationMs: { easy: 3500, normal: 3000, hard: 2700 },  // 单条显示时长
    spawnInterval: { min: 2000, max: 3000 },  // 出现间隔随机范围
    firstSpawnDelay: { min: 2000, max: 3000 },  // 首条延迟
  },
  // 误报代价
  errorPenalty: {
    firstError: 'progress_down_30',  // 首次按错，进度-30%
    secondError: 'game_over',        // 第二次按错 = 失败
  },
  // 威慑值进度条
  deterrence: {
    initial: 50,
    correctHitBonus: 15,
    firstErrorPenalty: -30,
  },
  // 真威胁预警
  warningFlashMs: 500,  // 真威胁出现前 0.5 秒屏幕红光预警
};