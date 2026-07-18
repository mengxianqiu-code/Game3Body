/**
 * 第二关：飞船驾驶员
 * 扫描带路径、引力度、飞船参数
 *
 * 坐标系：SVG viewBox 800×600
 * - 起点：左下角 (80, 500)
 * - 终点：右上角 (720, 80)
 *
 * 扫描带设计：水平矩形在地图上横扫
 * - h1：从左上 (-150, 100) 横扫到右下 (950, 450)
 * - h2：从右上 (950, 200) 横扫到左下 (-150, 500)
 * - 飞船需要根据扫描带 Y 位置调整飞行高度
 */

export const chapter2Config = {
  viewBox: { width: 800, height: 600 },
  shipStart: { x: 80, y: 500 },
  escapePoint: { x: 720, y: 80 },
  // 1 个行星（提供引力加速）
  gravityBodies: [
    { x: 400, y: 300, radius: 35, mass: 'large', color: '#e8d87f' },
  ],
  // 2 条移动扫描带
  hunters: [
    {
      id: 'h1',
      pathStart: { x: -150, y: 100 },   // 起点（地图外左上）
      pathEnd:   { x:  950, y: 450 },   // 终点（地图外右下）
      scanThickness: 70,                 // 扫描带垂直厚度
      scanLength: 1100,                  // 扫描带水平长度（覆盖地图 + 边缘）
      scanPeriodMs: 6500,                // 7 秒一轮
      scanActiveMs: 5000,                // 5 秒扫描 + 1.5 秒冷却
      color: '#d9455f',
    },
    {
      id: 'h2',
      pathStart: { x:  950, y: 200 },   // 起点（地图外右上）
      pathEnd:   { x: -150, y: 500 },   // 终点（地图外左下）
      scanThickness: 90,
      scanLength: 1100,
      scanPeriodMs: 5500,
      scanActiveMs: 4500,
      color: '#a04050',
    },
  ],
  // 飞船移动参数
  ship: {
    speed: 280,        // 像素/秒（推力）
    rotationDuration: 0.3,
  },
  // 容错次数
  maxWarnings: { easy: 4, normal: 3, hard: 2 },
  // 引力影响范围
  gravityInfluenceRadius: 100,
};