# 《三体：星际逃亡》

> 本地网页版 · Phase 1 原型已完成

## 启动

```bash
npm install
npm run dev       # 开发服务器 http://localhost:5173
npm run build     # 生产构建到 dist/
npm run preview   # 预览构建产物
```

## 当前状态（Phase 1 原型）

| 项目 | 状态 |
|------|------|
| 工程脚手架（React 18 + Vite） | ✅ |
| 全局状态机（4 关路由） | ✅ |
| 第1关 10×15 扫雷 + 声音定位 | ✅ |
| 第4关 多环 QTE（3/4/5 环 + 异速 + 自由顺序） | ✅ |
| 第2关 飞船驾驶员 | ⏳ Phase 2 |
| 第3关 威慑纪元 | ⏳ Phase 2 |
| 难度选择 UI | ⏳ Phase 4 |
| 总评分系统 | ⏳ Phase 4 |

## 项目结构

```
game/
├── index.html                       # 启动页（THREE-BODY · STARSEA）
├── package.json                     # React 18 + Vite
├── vite.config.js                   # Vite 配置
├── dist/                            # 构建产物（~196 KB）
├── src/
│   ├── main.jsx                     # 入口
│   ├── App.jsx                      # 顶层路由（4 关）
│   ├── gameState.js                 # 全局状态机（4 关）
│   ├── constants.js                 # 配置常量
│   ├── audio/
│   │   ├── synth.js                 # 14 个原子能力（程序化合成）
│   │   └── presets.js               # 4 关事件预设
│   ├── components/
│   │   ├── MainMenu.jsx             # 主菜单
│   │   ├── ChapterTransition.jsx    # 章节转场
│   │   ├── EndingScreen.jsx         # 结局
│   │   ├── GameOverScreen.jsx       # 失败画面
│   │   ├── StarsField.jsx           # 星点背景
│   │   ├── ErrorBoundary.jsx        # 错误兜底
│   │   ├── chapter1/Chapter1Signal.jsx
│   │   └── chapter4/Chapter4Escape.jsx
│   ├── data/                        # 章节配置（待补充）
│   ├── hooks/                       # useAudio / useGameTimer
│   └── styles/                      # 全局样式
└── test/                            # 测试（待补充）
```

## 设计要点

### 风格对齐《三体•低语》
- 纯 SVG + 0 位图 + 0 滤镜
- Web Audio API 程序化合成（0 音频资源）
- 配色：`#05060a` 深底 + `#7fd4e8` 冷青 + `#d9455f` 警告红
- 交互：纯点击/触屏，M 键静音

### 第1关：10×15 扫雷
- 网格：10 行 × 15 列（共 150 格）
- 雷密度：12%（约 18 个雷）
- 距离驱动音调：5 档（嗡 / 嗡- / 中 / 哔- / 哔）
- 三次容错机制
- 视觉副反馈：屏幕边缘光晕（距离越近越亮）

### 第4关：多环 QTE
- 环数按难度：简单 3 / 普通 4 / 困难 5
- 各环转速独立（差异 ≥ 30%）
- 自由选择激活顺序
- 30° 绿色判定弧
- 第 3 个参数激活后进入慢动作抢救（困难模式）
- 二维化进度条 + CSS scaleY 压扁效果

## 验证

- ✅ `npm run build` 成功（196 KB dist/）
- ✅ Vite dev server 在 5173 端口正常运行
- ✅ 所有模块端点 200 OK
- ✅ App.jsx 4 关路由正常加载
- ✅ 第1关和第4关组件可独立访问

## 下一步（Phase 2）

1. 实现第2关：飞船驾驶员（躲避扫描）
2. 实现第3关：威慑纪元（真假威胁）
3. 创建数据配置文件（chapter1-4Config.js）
4. 完善总评分系统
5. 难度选择 UI

## 验收

打开浏览器访问 http://localhost:5173/ 验证：
- 主菜单可点击"开始"
- 第1关：10×15 网格可点击，有音调反馈和文字提示
- 第4关：3-5 环同时显示，白点转动，30° 弧判定窗口
- M 键可切换静音