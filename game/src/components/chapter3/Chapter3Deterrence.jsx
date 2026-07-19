import { useEffect, useMemo, useRef, useState } from 'react';
import { StarsField } from '../StarsField.jsx';
import { chapter3Sfx, stopAllChapterAudio } from '../../audio/presets.js';
import { DIFFICULTY_DEFS, COLORS, CHAPTER_META } from '../../constants.js';
import { chapter3Config } from '../../data/chapter3Config.js';
import { RuleModal } from '../RuleModal.jsx';

/* ============== 工具函数 ============== */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}
function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ============== 信息生成器 ============== */

/**
 * 极性翻转机制：
 *   每个判断标准有 50% 概率被翻转。
 *   - polarity='default' → "异常特征" = dim/irregular/chaotic/anomaly/edge
 *   - polarity='inverted' → "异常特征" = bright/regular/smooth/normal/center
 *   也就是说本轮 dim 算异常，下轮可能 bright 才算异常。
 *   玩家无法记忆，只能通过试错理解当前轮的"极性"。
 */

/** 每个 key 对应的"默认异常特征"和"默认正常特征" */
const KEY_FIELD = {
  color:    { anomaly: 'dim',     normal: 'bright'   },
  shape:    { anomaly: 'irregular', normal: 'regular' },
  motion:   { anomaly: 'chaotic', normal: 'smooth'   },
  size:     { anomaly: 'anomaly', normal: 'normal'   },
  position: { anomaly: 'edge',    normal: 'center'   },
};

/** 给定极性，给一个 key 返回它的"异常值" */
function anomalyValueFor(criterion) {
  const { anomaly, normal } = KEY_FIELD[criterion.key];
  return criterion.polarity === 'inverted' ? normal : anomaly;
}
/** 给定极性，给一个 key 返回它的"正常值" */
function normalValueFor(criterion) {
  const { anomaly, normal } = KEY_FIELD[criterion.key];
  return criterion.polarity === 'inverted' ? anomaly : normal;
}

/** 用极性表判断一个 info 是否在所有 criteria 上都"异常" */
function isActualThreat(info, criteria) {
  return criteria.every((c) => {
    const expected = anomalyValueFor(c);
    const field = c.key;
    return info[field] === expected;
  });
}

/** 给定 criterion，返回它的中文特征标签（用于本轮规则展示） */
const CRITERION_LABELS = {
  color:    { anomaly: '暗 色',   normal: '亮 色'   },
  shape:    { anomaly: '不 规 则', normal: '规 则 形' },
  motion:   { anomaly: '抖 动',   normal: '平 稳'   },
  size:     { anomaly: '异 常 尺 寸', normal: '正 常 尺 寸' },
  position: { anomaly: '偏 位',   normal: '居 中'   },
};

function describeThreat(c) {
  const v = anomalyValueFor(c);
  return CRITERION_LABELS[c.key][v];
}
function describeFake(c) {
  const v = normalValueFor(c);
  return CRITERION_LABELS[c.key][v];
}

/** 生成一条真威胁：选中的 3 个 criterion 强制为异常值；其余 2 个维度 50/50 随机
 *  这样玩家每次看到的"威胁"在 5 个特征上都不一样，必须按当前轮规则判断
 */
function buildThreatInfo(criteria, allKeys, seed) {
  const info = { isThreat: true, randomSeed: seed };
  const selectedKeys = new Set(criteria.map((c) => c.key));
  criteria.forEach((c) => { info[c.key] = anomalyValueFor(c); });
  // 未选中的维度 50% 概率取异常值，让威胁的视觉特征每次都有变化
  allKeys.forEach((k) => {
    if (!selectedKeys.has(k)) {
      const { anomaly, normal } = KEY_FIELD[k];
      info[k] = Math.random() > 0.5 ? anomaly : normal;
    }
  });
  return info;
}
/** 生成一条假信息：选中的 3 个 criterion 强制为正常值；其余 2 个维度 50/50 随机 */
function buildFakeInfo(criteria, allKeys, seed) {
  const info = { isThreat: false, randomSeed: seed };
  const selectedKeys = new Set(criteria.map((c) => c.key));
  criteria.forEach((c) => { info[c.key] = normalValueFor(c); });
  // 未选中的维度 50/50 随机，让假信息的视觉特征也有变化
  allKeys.forEach((k) => {
    if (!selectedKeys.has(k)) {
      const { anomaly, normal } = KEY_FIELD[k];
      info[k] = Math.random() > 0.5 ? anomaly : normal;
    }
  });
  return info;
}

const ALL_KEYS = chapter3Config.judgmentCriteria.map((c) => c.key);

function generateInfoBatch(criteria) {
  // 1/3 真威胁，2/3 假信息
  const { totalCount } = chapter3Config.infoFlow;
  const realCount = Math.max(2, Math.floor(totalCount.normal * chapter3Config.infoFlow.realThreatRatio));
  const fakesCount = totalCount.normal - realCount;

  const batch = [];
  for (let i = 0; i < realCount; i++) {
    batch.push({ ...buildThreatInfo(criteria, ALL_KEYS, Math.random() * 9999), key: `t-${i}` });
  }
  for (let i = 0; i < fakesCount; i++) {
    batch.push({ ...buildFakeInfo(criteria, ALL_KEYS, Math.random() * 9999), key: `f-${i}` });
  }
  return shuffle(batch);
}

/* ============== 视觉渲染 ============== */

/** 用种子生成稳定的伪随机数（保证视觉在多次渲染间一致） */
function seededRandom(seed) {
  let s = (seed % 233280) || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function InfoSwatch({ info }) {
  /* === 用 info.randomSeed 派生本地 RNG === */
  const seed = info.randomSeed || 1;
  const rng = useMemo(() => seededRandom(seed), [seed]);
  const r = () => rng();

  /* === 维度 1：色彩 === */
  // dim：暗色 + 红/紫/棕 随机（每次不同）
  const dimPalette = ['#4a3030', '#3a2a3a', '#2a3530', '#403028', '#382838'];
  const strokeDimPalette = ['#8a3a3a', '#a04060', '#8a4a30', '#a04040', '#903050'];
  const dimFill = dimPalette[Math.floor(r() * dimPalette.length)];
  const strokeFill = strokeDimPalette[Math.floor(r() * strokeDimPalette.length)];
  const fill = info.color === 'dim' ? dimFill : COLORS.cyan;
  const opacity = info.color === 'dim' ? 0.5 + r() * 0.15 : 0.95;
  const strokeColor = info.color === 'dim' ? strokeFill : COLORS.cyan;
  const strokeWidth = info.color === 'dim' ? 1.5 + r() * 1.5 : 0.8;

  /* === 维度 2：尺寸 === */
  // anomaly：极小 4-10 / 极大 28-42，随机选 + 随机具体值
  const sizeSmall = 4 + r() * 6;
  const sizeLarge = 28 + r() * 14;
  const baseR = info.size === 'anomaly'
    ? (r() > 0.5 ? sizeSmall : sizeLarge)
    : 16 + r() * 4;

  /* === 维度 3：形状 === */
  // regular：完美六边形（边数也随机：5-7）
  const sidesRegular = 5 + Math.floor(r() * 3); // 5,6,7
  const regularPts = [];
  for (let i = 0; i < sidesRegular; i++) {
    const a = (2 * Math.PI / sidesRegular) * i - Math.PI / 2;
    // 正多边形但允许 ±5% 抖动让"普通"看着像手绘
    const wobble = info.shape === 'regular' ? 0.95 + r() * 0.1 : 1;
    regularPts.push(`${baseR * Math.cos(a) * wobble},${baseR * Math.sin(a) * wobble}`);
  }
  // irregular：随机 5-8 个顶点，其中一个明显外凸
  const sidesIrregular = 5 + Math.floor(r() * 4);
  const convexIdx = Math.floor(r() * sidesIrregular);
  const irregularPts = [];
  for (let i = 0; i < sidesIrregular; i++) {
    const baseA = (2 * Math.PI / sidesIrregular) * i - Math.PI / 2;
    const baseR_i = baseR * (0.5 + r() * 0.5);
    let x = baseR_i * Math.cos(baseA);
    let y = baseR_i * Math.sin(baseA);
    if (i === convexIdx) {
      // 凸出角：长度 1.4-2.2 倍，方向略偏
      x *= 1.4 + r() * 0.8;
      y *= 1.4 + r() * 0.8;
    } else {
      // 其他顶点也随机扰动
      x *= 0.7 + r() * 0.6;
      y *= 0.7 + r() * 0.6;
    }
    irregularPts.push(`${x},${y}`);
  }

  const shapePts = info.shape === 'irregular' ? irregularPts.join(' ') : regularPts.join(' ');

  /* === 维度 4：运动 === */
  // chaotic：旋转角度、速度、闪烁频率全随机
  const rotationDur = 0.6 + r() * 1.5;  // 0.6-2.1 秒
  const flickerDur = 0.15 + r() * 0.45; // 0.15-0.6 秒
  const scaleDur = 0.3 + r() * 0.8;
  const rotationValues = r() > 0.5 ? '0;360;-360' : '0;-360;360;180;0';

  /* === 维度 5：位置 === */
  // edge：方向随机（4 个角之一）+ 距离 30-70
  const edgeAngle = r() * 2 * Math.PI;
  const edgeDist = 30 + r() * 40;
  const offsetX = info.position === 'edge' ? Math.cos(edgeAngle) * edgeDist : 0;
  const offsetY = info.position === 'edge' ? Math.sin(edgeAngle) * edgeDist : 0;

  /* === 渲染 === */
  return (
    <g transform={`translate(${offsetX}, ${offsetY})`}>
      <g className={`ch3-shape ${info.motion}`}>
        <polygon
          points={shapePts}
          fill={fill}
          opacity={opacity}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        {info.motion === 'chaotic' && (
          <>
            <polygon
              points={shapePts}
              fill="none"
              stroke="#d9455f"
              strokeWidth="1"
              opacity="0.7"
            >
              <animate attributeName="opacity" values="0.9;0.2;0.9;0.3;0.9" dur={`${flickerDur}s`} repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="scale" values="1;1.3;0.8;1.2;1" dur={`${scaleDur}s`} repeatCount="indefinite" />
            </polygon>
            <animateTransform attributeName="transform" type="rotate" values={rotationValues} dur={`${rotationDur}s`} repeatCount="indefinite" />
          </>
        )}
        {info.motion === 'smooth' && (
          <animate attributeName="opacity" values={`${opacity};${opacity * 0.85};${opacity}`} dur="2s" repeatCount="indefinite" />
        )}
      </g>
      {info.size === 'anomaly' && (
        <circle r="20" fill="none" stroke={COLORS.cyan} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
      )}
    </g>
  );
}

/* ============== 图形示例（单图） ============== */
function regularHex(r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${r * Math.cos(a)},${r * Math.sin(a)}`);
  }
  return pts.join(' ');
}
function irregularHex(r) {
  // 一角明显外凸的不对称多边形
  const pts = [
    [0, -r],
    [r * 0.4, -r * 0.3],
    [r * 1.5, -r * 0.1],
    [r * 0.5, r * 0.3],
    [r * 0.2, r],
    [-r * 0.8, -r * 0.4],
  ].map(([x, y]) => `${x},${y}`);
  return pts.join(' ');
}

/**
 * 单个示例图形：根据 which（threat/fake）渲染对应极性下的视觉特征。
 * 用更大 viewBox（-25..25）+ 居中定位，方便嵌入卡片中。
 */
function MiniShape({ criterion, which }) {
  const k = criterion.key;
  const val = which === 'threat' ? anomalyValueFor(criterion) : normalValueFor(criterion);

  let size = 11;
  let fill = COLORS.cyan;
  let opacity = 0.95;
  let pts = regularHex(size);
  let animated = false;
  let offsetX = 0;

  // 根据 which 给边框一个明确的语义色：真=红，假=青
  const sideStroke = which === 'threat' ? '#d9455f' : COLORS.cyan;

  switch (k) {
    case 'color':
      fill = val === 'dim' ? '#4a3030' : COLORS.cyan;
      opacity = val === 'dim' ? 0.55 : 0.95;
      break;
    case 'shape':
      pts = val === 'irregular' ? irregularHex(size) : regularHex(size);
      break;
    case 'motion':
      if (val === 'chaotic') animated = true;
      break;
    case 'size':
      size = val === 'anomaly' ? 16 : 11;
      pts = regularHex(size);
      break;
    case 'position':
      if (val === 'edge') offsetX = 9;
      break;
    default:
      break;
  }

  return (
    <svg viewBox="-25 -22 50 44" width="56" height="50" className={`ch3-mini-shape ch3-mini-${which}`}>
      <g transform={`translate(${offsetX}, 0)`}>
        <polygon
          points={pts}
          fill={fill}
          opacity={opacity}
          stroke={sideStroke}
          strokeWidth="1"
        />
        {animated && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0;360;-360;180"
            dur="1.2s"
            repeatCount="indefinite"
          />
        )}
      </g>
    </svg>
  );
}

/* ============== 主组件 ============== */
export function Chapter3Deterrence({ difficulty = 'normal', onComplete }) {
  const diff = DIFFICULTY_DEFS[difficulty] || DIFFICULTY_DEFS.normal;
  const totalCount = chapter3Config.infoFlow.totalCount[difficulty] || chapter3Config.infoFlow.totalCount.normal;
  const durationMs = chapter3Config.infoFlow.durationMs[difficulty] || chapter3Config.infoFlow.durationMs.normal;
  const spawnInterval = chapter3Config.infoFlow.spawnInterval;
  const firstSpawn = chapter3Config.infoFlow.firstSpawnDelay;

  // 选取 3 个判断标准 + 给每个标准随机极性（决定哪个特征算"异常"）
  const criteria = useMemo(() => {
    const withPolarity = chapter3Config.judgmentCriteria.map((c) => ({
      ...c,
      polarity: Math.random() > 0.5 ? 'inverted' : 'default',
    }));
    const shuffled = shuffle(withPolarity);
    return shuffled.slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 信息批次（真威胁：3 个被选标准**全部**按当前极性取异常值；假信息：全部取正常值；未选维度随机）
  const batch = useMemo(() => {
    const realCount = Math.max(2, Math.floor(totalCount * chapter3Config.infoFlow.realThreatRatio));
    const fakesCount = totalCount - realCount;
    const out = [];
    for (let i = 0; i < realCount; i++) {
      out.push({ ...buildThreatInfo(criteria, ALL_KEYS, Math.random() * 9999), key: `t-${i}` });
    }
    for (let i = 0; i < fakesCount; i++) {
      out.push({ ...buildFakeInfo(criteria, ALL_KEYS, Math.random() * 9999), key: `f-${i}` });
    }
    return shuffle(out);
  }, [criteria, totalCount]);

  const [deterrence, setDeterrence] = useState(chapter3Config.deterrence.initial); // 威慑值 0-100
  const [errCount, setErrCount] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentInfo, setCurrentInfo] = useState(null); // { info, expiresAt, enteredAt }
  const [flashRed, setFlashRed] = useState(0); // 真威胁预警闪
  const [sweepUp, setSweepUp] = useState(0); // 成功反馈闪
  const [progress, setProgress] = useState(0); // 信息显示进度 0-1
  const [completed, setCompleted] = useState(false);
  const [showCriteria, setShowCriteria] = useState(true); // 阶段开始展示 3 个判断标准
  const [showPausedCriteria, setShowPausedCriteria] = useState(false); // 游戏中空格键暂停
  const [showHelp, setShowHelp] = useState(false);

  const spawnTimerRef = useRef(null);
  const deadlineTimerRef = useRef(null);
  const rafRef = useRef(null);
  const lastFrameRef = useRef(performance.now());
  const ambientStopRef = useRef(null);
  const completedRef = useRef(false);
  const pausedRef = useRef(false);

  // 启动环境音
  useEffect(() => {
    ambientStopRef.current = chapter3Sfx.startCollapseHum();
    return () => {
      if (ambientStopRef.current) ambientStopRef.current();
      chapter3Sfx.stopCollapseHum();
      stopAllChapterAudio();
    };
  }, []);

  // 完成判定 + 进度动画
  useEffect(() => {
    if (completed) return;
    const tick = (now) => {
      const dt = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;

      // 当前信息显示进度
      if (currentInfo) {
        const total = currentInfo.expiresAt - currentInfo.enteredAt;
        const elapsed = now - currentInfo.enteredAt;
        const p = Math.max(0, Math.min(1, elapsed / total));
        setProgress(p);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    lastFrameRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [currentInfo, completed]);

  // 主流程：spawn → 等待 → 下一轮
  useEffect(() => {
    if (completed) return;
    if (showCriteria) {
      // 阶段一：展示判断标准 —— 等玩家按 空格 才开始
      return;
    }

    if (currentIdx >= batch.length) {
      // 全部信息处理完成 → 通关
      if (!completedRef.current) {
        completedRef.current = true;
        setCompleted(true);
        chapter3Sfx.poeticEnding();
        if (ambientStopRef.current) ambientStopRef.current();
        setTimeout(() => {
          onComplete && onComplete({
            deterrence,
            errors: errCount,
            total: batch.length,
          });
        }, 2000);
      }
      return;
    }

    const info = batch[currentIdx];
    const enteredAt = performance.now();
    const expiresAt = enteredAt + durationMs;
    setCurrentInfo({ info, enteredAt, expiresAt });
    setProgress(0);

    // 真威胁预警（提前 0.5 秒闪红）—— 用极性表判断
    if (isActualThreat(info, criteria)) {
      const warnT = setTimeout(() => setFlashRed(Date.now()), Math.max(0, durationMs - chapter3Config.warningFlashMs));
      deadlineTimerRef.current = setTimeout(() => {
        // 时间到未处理：自动判定为"威胁但未拦截"
        handleAutoResolve(info);
      }, expiresAt - performance.now());
      return () => {
        clearTimeout(warnT);
        clearTimeout(deadlineTimerRef.current);
      };
    } else {
      // 假信息的 deadline = 时间到自动消失
      deadlineTimerRef.current = setTimeout(() => {
        handleAutoResolve(info);
      }, expiresAt - performance.now());
      return () => clearTimeout(deadlineTimerRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, showCriteria, completed, batch]);

  function handleAutoResolve(info) {
    // 时间到：自动通过（玩家不点击 = 不做判断）
    // 真威胁未拦截 → 默认计为"威胁漏报"，但不算主动误报
    // 设计：未点击 = 视作已经过去，给 0 威慑变化（让玩家继续）
    moveToNext();
  }

  function moveToNext() {
    setCurrentInfo(null);
    const delay = randomBetween(spawnInterval.min, spawnInterval.max);
    setTimeout(() => {
      setCurrentIdx((i) => i + 1);
    }, delay);
  }

  function handleClick(mode) {
    if (!currentInfo || completed) return;
    // 用极性表判断本轮规则下它是不是真威胁
    const isThreat = isActualThreat(currentInfo.info, criteria);
    if (mode === 'threat') {
      if (isThreat) {
        // 正确：威慑++
        setDeterrence((d) => Math.min(100, d + chapter3Config.deterrence.correctHitBonus));
        setErrCount((e) => e);
        setSweepUp(Date.now());
        chapter3Sfx.fragmentPick(currentIdx);
      } else {
        reportError();
      }
    } else if (mode === 'pass') {
      if (!isThreat) {
        setSweepUp(Date.now());
        chapter3Sfx.fragmentPick(currentIdx);
      } else {
        reportError();
      }
    }
    moveToNext();
  }

  // 键盘快捷键：showCriteria 时只听空格；游戏进行时听 Q / P / Space(暂停)
  useEffect(() => {
    function onKey(e) {
      if (completed) return;
      const k = e.key.toLowerCase();
      if (showCriteria) {
        // 阶段一：按 空格 才进入判断
        if (k === ' ' || k === 'space' || e.code === 'Space') {
          e.preventDefault();
          setShowCriteria(false);
        }
        return;
      }
      // 游戏中：空格暂停显示 3 个判断标准
      if (k === ' ' || k === 'space' || e.code === 'Space') {
        if (currentInfo && !pausedRef.current) {
          e.preventDefault();
          pausedRef.current = true;
          setShowPausedCriteria(true);
          setTimeout(() => {
            setShowPausedCriteria(false);
            pausedRef.current = false;
          }, 1800);
        }
        return;
      }
      if (k === 'q') handleClick('threat');
      else if (k === 'p') handleClick('pass');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInfo, completed, showCriteria]);

  function reportError() {
    setErrCount((e) => {
      const next = e + 1;
      if (next === 1) {
        // 第一次错误：-30%
        setDeterrence((d) => Math.max(0, d + chapter3Config.deterrence.firstErrorPenalty));
      } else if (next >= 2) {
        // 第二次错误 = 失败
        if (!completedRef.current) {
          completedRef.current = true;
          setCompleted(true);
          chapter3Sfx.stopCollapseHum();
          if (ambientStopRef.current) ambientStopRef.current();
          setTimeout(() => {
            onComplete && onComplete(
              {
                deterrence,
                errors: next,
                total: batch.length,
                failure: true,
              },
              { reason: '判 断 失 误 累 积' }
            );
          }, 1200);
        }
      }
      return next;
    });
    chapter3Sfx.equipmentBreak();
    if (navigator.vibrate) navigator.vibrate(120);
  }

  /* ============== 渲染 ============== */

  if (showCriteria) {
    return (
      <div className="scene active ch3-scene" id="chapter3">
        <StarsField />
        <div className="ch3-criteria-overlay">
          <div className="ch3-criteria-title">{CHAPTER_META[3].title}</div>
          <div className="ch3-criteria-subtitle">{CHAPTER_META[3].subtitle}</div>
          <div className="ch3-criteria-intro">本 轮 规 则</div>
          <div className="ch3-criteria-list">
            {criteria.map((c, i) => (
              <div key={c.key} className="ch3-criterion" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="ch3-criterion-head">
                  <span className="ch3-criterion-num">标 准 {['一', '二', '三'][i]}</span>
                  <span className="ch3-criterion-text">{c.title}</span>
                </div>
                <div className="ch3-criterion-grid">
                  <div className="ch3-side ch3-side-fake">
                    <div className="ch3-side-tag">假 危 险</div>
                    <MiniShape criterion={c} which="fake" />
                    <div className="ch3-side-rule">＝ {describeFake(c)}</div>
                  </div>
                  <div className="ch3-side ch3-side-threat">
                    <div className="ch3-side-tag">真 危 险</div>
                    <MiniShape criterion={c} which="threat" />
                    <div className="ch3-side-rule">＝ {describeThreat(c)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="ch3-criteria-warn">三 条 标 准 全部 满 足 真 危 险 → 拦 截 · 否 则 放 行</div>
          <div className="ch3-start-prompt">
            <span className="ch3-space-key">空 格</span>
            <span className="ch3-start-text">开 始 判 断</span>
          </div>
        </div>
        <style>{ch3CriteriaStyles}</style>
      </div>
    );
  }

  return (
    <div className="scene active ch3-scene" id="chapter3">
      <StarsField />

      {/* 真威胁预警闪 */}
      {flashRed && Date.now() - flashRed < chapter3Config.warningFlashMs && (
        <div className="ch3-flash-red" />
      )}

      {/* 成功反馈闪 */}
      {sweepUp && Date.now() - sweepUp < 200 && (
        <div className="ch3-flash-cyan" />
      )}

      {/* HUD */}
      <div className="ch3-hud">
        <div className="ch3-title">{CHAPTER_META[3].title}</div>
        <div className="ch3-deterrence-bar">
          <div className="ch3-deterrence-label">威 慑 值</div>
          <div className="ch3-deterrence-track">
            <div
              className="ch3-deterrence-fill"
              style={{ width: `${deterrence}%`, background: deterrence < 30 ? COLORS.rust : COLORS.cyan }}
            />
          </div>
          <div className="ch3-deterrence-value">{deterrence}</div>
        </div>
        <div className="ch3-progress">
          {currentIdx} / {batch.length}
        </div>
        <div className="ch3-errors">
          失 误: <span className={errCount >= 1 ? 'err' : 'ok'}>{errCount}</span> / 2
        </div>
        <button className="ch3-help" onClick={() => setShowHelp(true)} aria-label="规则说明">?</button>
      </div>

      {/* 规则弹窗 */}
      {showHelp && <RuleModal chapter="3" onClose={() => setShowHelp(false)} />}

      {/* 信息流显示区 */}
      <div className="ch3-info-center">
        {currentInfo && (
          <div className="ch3-info-stage">
            <svg viewBox="-50 -50 100 100" width="180" height="180" className="ch3-info-svg">
              <InfoSwatch info={currentInfo.info} />
            </svg>
            <div className="ch3-info-progress-track">
              <div
                className="ch3-info-progress-fill"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}
        {!currentInfo && !completed && (
          <div className="ch3-info-waiting">
            <div className="ch3-info-waiting-pulse" />
            <div className="ch3-info-waiting-text">扫 描 中</div>
          </div>
        )}
      </div>

      {/* 暂停显示 3 个判断标准（空格触发，1.8s 后自动关闭） */}
      {showPausedCriteria && (
        <div className="ch3-paused-overlay">
          <div className="ch3-paused-title">当 前 判 断 标 准</div>
          <div className="ch3-paused-criteria">
            {criteria.map((c, i) => (
              <div key={c.key} className="ch3-paused-criterion">
                <div className="ch3-paused-head">
                  <span className="ch3-paused-num">标 准 {['一', '二', '三'][i]}</span>
                  <span className="ch3-paused-text">{c.title}</span>
                </div>
                <div className="ch3-paused-grid">
                  <div className="ch3-paused-side ch3-side-fake">
                    <span className="ch3-side-tag">假 危 险</span>
                    <MiniShape criterion={c} which="fake" />
                    <span className="ch3-paused-rule">＝ {describeFake(c)}</span>
                  </div>
                  <div className="ch3-paused-side ch3-side-threat">
                    <span className="ch3-side-tag">真 危 险</span>
                    <MiniShape criterion={c} which="threat" />
                    <span className="ch3-paused-rule">＝ {describeThreat(c)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="ch3-paused-hint">空 格 · 1.8 秒 后 自 动 关 闭</div>
        </div>
      )}

      {/* 控制区 */}
      <div className="ch3-controls">
        <button
          className="ch3-btn ch3-btn-threat"
          onClick={() => handleClick('threat')}
          disabled={!currentInfo || completed}
        >
          <div className="ch3-btn-label">拦 截</div>
          <div className="ch3-btn-key">Q · 判定为威胁</div>
        </button>
        <button
          className="ch3-btn ch3-btn-pass"
          onClick={() => handleClick('pass')}
          disabled={!currentInfo || completed}
        >
          <div className="ch3-btn-label">放 行</div>
          <div className="ch3-btn-key">P · 判定为普通</div>
        </button>
      </div>

      <div className="ch3-hint">
        Q 拦 截 · P 放 行 · 真 威 胁 包 含 任 一 标 准
      </div>

      <style>{ch3MainStyles}</style>
    </div>
  );
}

/* ============== 样式 ============== */
const ch3CriteriaStyles = `
.ch3-scene {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ch3-criteria-overlay {
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  z-index: 10;
  animation: ch3-fade-in 0.5s ease;
  max-height: 100vh;
  overflow-y: auto;
  padding: 24px;
}

@keyframes ch3-fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.ch3-criteria-title {
  font-size: 28px;
  letter-spacing: 0.4em;
  color: var(--bone, #e8e6df);
  margin-bottom: 8px;
}

.ch3-criteria-subtitle {
  font-size: 12px;
  letter-spacing: 0.3em;
  color: var(--cyan-fade, #2a5d6a);
  margin-bottom: 32px;
}

.ch3-criteria-intro {
  font-size: 11px;
  letter-spacing: 0.4em;
  color: var(--rust-warn, #d9455f);
  margin-bottom: 24px;
}

/* ====== 三张判断标准卡：上下堆叠，每张更宽 ====== */
.ch3-criteria-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  justify-content: center;
  margin-bottom: 32px;
  width: min(560px, 92vw);
}

.ch3-criterion {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 22px;
  border: 1px solid var(--cyan-fade, #2a5d6a);
  background: rgba(10, 13, 20, 0.55);
  opacity: 0;
  animation: ch3-criterion-in 0.5s ease forwards;
}

.ch3-criterion-head {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--shadow, #555);
}

.ch3-criterion-num {
  font-size: 10px;
  color: var(--rust-warn, #d9455f);
  letter-spacing: 0.3em;
  flex-shrink: 0;
}

.ch3-criterion-text {
  font-family: 'Cormorant Garamond', 'Songti SC', serif;
  font-size: 18px;
  letter-spacing: 0.35em;
  color: var(--bone, #e8e6df);
}

/* ====== 每张卡内部的 2 列：左假右真 ====== */
.ch3-criterion-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.ch3-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 8px;
  border: 1px solid var(--shadow, #555);
  background: rgba(5, 6, 10, 0.5);
}

.ch3-side-fake { border-color: var(--cyan-fade, #2a5d6a); }
.ch3-side-threat { border-color: var(--rust-warn, #d9455f); }

.ch3-side-tag {
  font-size: 10px;
  letter-spacing: 0.3em;
  padding: 3px 12px;
  font-weight: bold;
}
.ch3-side-fake .ch3-side-tag {
  color: var(--cyan-signal, #7fd4e8);
  background: rgba(127, 212, 232, 0.08);
  border: 1px solid var(--cyan-fade, #2a5d6a);
}
.ch3-side-threat .ch3-side-tag {
  color: var(--rust-warn, #d9455f);
  background: rgba(217, 69, 95, 0.12);
  border: 1px solid var(--rust-warn, #d9455f);
}

.ch3-mini-shape {
  display: block;
}

.ch3-side-rule {
  font-size: 12px;
  letter-spacing: 0.2em;
  font-weight: bold;
  text-align: center;
}
.ch3-side-fake .ch3-side-rule { color: var(--cyan-signal, #7fd4e8); }
.ch3-side-threat .ch3-side-rule { color: var(--rust-warn, #d9455f); }

.ch3-criteria-warn {
  font-size: 11px;
  letter-spacing: 0.3em;
  color: var(--shadow, #555);
  margin-top: 16px;
  text-align: center;
}

.ch3-start-prompt {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  animation: ch3-start-blink 1.4s ease infinite;
}

@keyframes ch3-start-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

.ch3-space-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 24px;
  border: 1px solid var(--cyan-signal, #7fd4e8);
  background: rgba(127, 212, 232, 0.08);
  color: var(--cyan-signal, #7fd4e8);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.4em;
  min-width: 120px;
}

.ch3-start-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.4em;
  color: var(--bone, #e8e6df);
}

@keyframes ch3-criterion-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

const ch3MainStyles = `
.ch3-scene {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ch3-flash-red {
  position: absolute;
  inset: 0;
  background: rgba(217, 69, 95, 0.45);
  z-index: 50;
  pointer-events: none;
  animation: ch3-flash-fade 0.5s ease forwards;
}

.ch3-flash-cyan {
  position: absolute;
  inset: 0;
  background: rgba(127, 212, 232, 0.2);
  z-index: 50;
  pointer-events: none;
  animation: ch3-flash-fade 0.2s ease forwards;
}

@keyframes ch3-flash-fade {
  from { opacity: 1; }
  to { opacity: 0; }
}

.ch3-hud {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  z-index: 10;
  min-width: 320px;
}

.ch3-title {
  font-size: 16px;
  letter-spacing: 0.4em;
  color: var(--bone, #e8e6df);
  margin-bottom: 16px;
}

.ch3-deterrence-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.ch3-deterrence-label {
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--shadow, #555);
}

.ch3-deterrence-track {
  width: 200px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--shadow, #555);
}

.ch3-deterrence-fill {
  height: 100%;
  transition: width 0.3s ease, background 0.3s ease;
}

.ch3-deterrence-value {
  font-size: 14px;
  color: var(--bone, #e8e6df);
  min-width: 30px;
}

.ch3-progress {
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--cyan-fade, #2a5d6a);
  margin-top: 8px;
}

.ch3-errors {
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--bone, #e8e6df);
  margin-top: 6px;
}

.ch3-errors .err { color: var(--rust-warn, #d9455f); font-weight: bold; }
.ch3-errors .ok { color: var(--cyan, #7fd4e8); }

.ch3-info-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  z-index: 5;
}

.ch3-info-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  animation: ch3-info-in 0.3s ease;
}

@keyframes ch3-info-in {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}

.ch3-info-svg {
  filter: drop-shadow(0 0 8px rgba(127, 212, 232, 0.5));
}

.ch3-info-progress-track {
  width: 160px;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
}

.ch3-info-progress-fill {
  height: 100%;
  background: var(--rust-warn, #d9455f);
  transition: width 0.05s linear;
}

.ch3-info-waiting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.ch3-info-waiting-pulse {
  width: 60px;
  height: 60px;
  border: 1px solid var(--cyan, #7fd4e8);
  border-radius: 50%;
  animation: ch3-waiting-pulse 1.5s ease infinite;
}

@keyframes ch3-waiting-pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.2); opacity: 1; }
}

.ch3-info-waiting-text {
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--cyan, #7fd4e8);
  font-family: 'JetBrains Mono', monospace;
}

.ch3-controls {
  display: flex;
  gap: 60px;
  margin-top: 40px;
  z-index: 10;
}

.ch3-btn {
  background: transparent;
  border: 1px solid var(--shadow, #555);
  padding: 18px 36px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  transition: all 0.2s ease;
  min-width: 180px;
}

.ch3-btn:hover:not(:disabled) {
  border-color: var(--cyan, #7fd4e8);
  background: rgba(127, 212, 232, 0.1);
}

.ch3-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.ch3-btn-threat { border-color: var(--rust-warn, #d9455f); }
.ch3-btn-threat:hover:not(:disabled) { border-color: var(--rust-warn, #d9455f); background: rgba(217, 69, 95, 0.15); }
.ch3-btn-threat .ch3-btn-label { color: var(--rust-warn, #d9455f); }

.ch3-btn-pass { border-color: var(--cyan, #7fd4e8); }
.ch3-btn-pass .ch3-btn-label { color: var(--cyan, #7fd4e8); }

.ch3-btn-label {
  font-size: 18px;
  letter-spacing: 0.4em;
  margin-bottom: 6px;
}

.ch3-btn-key {
  font-size: 9px;
  letter-spacing: 0.2em;
  color: var(--shadow, #555);
}

.ch3-hint {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--shadow, #555);
}

/* ===== 空格键暂停显示判断标准 ===== */
.ch3-paused-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 6, 10, 0.88);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: ch3-paused-in 0.2s ease;
  padding: 24px;
  overflow-y: auto;
}
@keyframes ch3-paused-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.ch3-paused-title {
  font-family: 'Cormorant Garamond', 'Songti SC', serif;
  font-size: 20px;
  letter-spacing: 0.4em;
  color: var(--cyan-signal, #7fd4e8);
  margin-bottom: 24px;
}

.ch3-paused-criteria {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
  width: min(560px, 92vw);
}

.ch3-paused-criterion {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 18px;
  border: 1px solid var(--cyan-fade, #2a5d6a);
  background: rgba(10, 13, 20, 0.6);
}

.ch3-paused-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--shadow, #555);
}

.ch3-paused-num {
  font-size: 10px;
  color: var(--rust-warn, #d9455f);
  letter-spacing: 0.3em;
  flex-shrink: 0;
}
.ch3-paused-text {
  font-family: 'Cormorant Garamond', 'Songti SC', serif;
  font-size: 15px;
  letter-spacing: 0.3em;
  color: var(--bone, #e8e6df);
}

.ch3-paused-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ch3-paused-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 6px;
  border: 1px solid var(--shadow, #555);
}
.ch3-paused-side.ch3-side-fake { border-color: var(--cyan-fade, #2a5d6a); }
.ch3-paused-side.ch3-side-threat { border-color: var(--rust-warn, #d9455f); }

.ch3-paused-rule {
  font-size: 11px;
  letter-spacing: 0.2em;
  font-weight: bold;
  text-align: center;
}

.ch3-paused-hint {
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--shadow, #555);
  margin-top: 8px;
}

.ch3-help {
  position: absolute;
  top: 40px;
  right: 30px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--cyan-fade, #2a5d6a);
  background: transparent;
  color: var(--cyan-fade, #2a5d6a);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  z-index: 11;
  transition: all 0.2s ease;
}
.ch3-help:hover {
  border-color: var(--cyan-signal, #7fd4e8);
  color: var(--cyan-signal, #7fd4e8);
  background: rgba(127, 212, 232, 0.1);
}
`;
