import { useEffect, useMemo, useRef, useState } from 'react';
import { StarsField } from '../StarsField.jsx';
import { chapter2Sfx, stopAllChapterAudio } from '../../audio/presets.js';
import { DIFFICULTY_DEFS, COLORS, CHAPTER_META } from '../../constants.js';
import { chapter2Config } from '../../data/chapter2Config.js';
import { RuleModal } from '../RuleModal.jsx';

const { viewBox, shipStart, escapePoint, gravityBodies, gravityInfluenceRadius } = chapter2Config;

/* ============== 工具函数 ============== */
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function getHunterState(hunter, now) {
  // 移动扫描带：矩形沿 pathStart ↔ pathEnd 来回滑动（ping-pong）
  const cycleTime = now % hunter.scanPeriodMs;
  const isScanning = cycleTime < hunter.scanActiveMs;
  if (!isScanning) {
    return {
      ...hunter,
      isScanning: false,
      progress: 0,
      cx: 0,
      cy: 0,
    };
  }
  // cos 振荡：0 → 1 → 0 （一个完整来回）
  const phase = cycleTime / hunter.scanActiveMs;
  const progress = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
  const cx = hunter.pathStart.x + (hunter.pathEnd.x - hunter.pathStart.x) * progress;
  const cy = hunter.pathStart.y + (hunter.pathEnd.y - hunter.pathStart.y) * progress;
  return {
    ...hunter,
    isScanning: true,
    progress,
    cx,
    cy,
    halfThickness: hunter.scanThickness / 2,
    halfLength: hunter.scanLength / 2,
  };
}

/** 检测飞船是否在矩形扫描带内（基于矩形中心 + 半宽半高） */
function isInScanBand(ship, state) {
  if (!state.isScanning) return false;
  const dx = Math.abs(ship.x - state.cx);
  const dy = Math.abs(ship.y - state.cy);
  return dx <= state.halfLength && dy <= state.halfThickness;
}

/** 随机生成一条扫描带配置 */
function randomHunterConfig(id, base) {
  // 方向：横向 50% / 纵向 50%
  const isHorizontal = Math.random() > 0.5;
  // 起点终点方向（左/右 或 上/下）随机
  const reverseAxis = Math.random() > 0.5;

  // 扫描带"长度"（沿移动方向的厚度）—— 局部宽度，不覆盖整个地图
  const scanLength = isHorizontal
    ? 200 + Math.floor(Math.random() * 120)   // 横向：200-320px
    : 160 + Math.floor(Math.random() * 100);  // 纵向：160-260px

  let pathStart, pathEnd;
  if (isHorizontal) {
    // 横向：Y 中心 150-450 之间随机，X 从 100 扫到 700（地图内）
    const y = 150 + Math.random() * 300;
    pathStart = reverseAxis ? { x: 100, y } : { x: 700, y };
    pathEnd   = reverseAxis ? { x: 700, y } : { x: 100, y };
  } else {
    // 纵向：X 中心 150-650 之间随机，Y 从 100 扫到 500（地图内）
    const x = 150 + Math.random() * 500;
    pathStart = reverseAxis ? { x, y: 100 } : { x, y: 500 };
    pathEnd   = reverseAxis ? { x, y: 500 } : { x, y: 100 };
  }

  return {
    ...base,
    id,
    direction: isHorizontal ? 'horizontal' : 'vertical',
    pathStart,
    pathEnd,
    scanLength,
  };
}

/* ============== 主组件 ============== */
export function Chapter2Forest({ difficulty = 'normal', onComplete }) {
  const maxWarnings = chapter2Config.maxWarnings[difficulty] || 3;

  // 每次进游戏随机生成 2 条扫描带（方向、路径、起点终点都随机）
  const hunters = useMemo(() => {
    const baseDefs = chapter2Config.hunters;
    return baseDefs.map((b) => randomHunterConfig(b.id, b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 飞船状态（用 ref 避免每帧 setState 触发渲染）
  const shipRef = useRef({
    x: shipStart.x,
    y: shipStart.y,
    vx: 0,
    vy: 0,
    facing: 0,         // 当前朝向（弧度）
    engineGlow: 0,      // 引擎推力动画 0-1
  });

  // 按键状态
  const keysRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const [warnings, setWarnings] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [flashRed, setFlashRed] = useState(0);
  const [, setTick] = useState(0); // 触发重渲染
  const [showHelp, setShowHelp] = useState(false);

  const animFrameRef = useRef(null);
  const lastFrameRef = useRef(performance.now());
  const startTimeRef = useRef(performance.now());
  const scanStartedAtRef = useRef(performance.now());
  const ambientStopRef = useRef(null);
  const engineSoundStopRef = useRef(null);
  const wasInScannerRef = useRef({ h1: false, h2: false });

  /* ---------- 启动环境音 ---------- */
  useEffect(() => {
    ambientStopRef.current = chapter2Sfx.startAmbient();
    return () => {
      if (ambientStopRef.current) ambientStopRef.current();
      if (engineSoundStopRef.current) engineSoundStopRef.current();
      chapter2Sfx.stopAmbient();
      stopAllChapterAudio();
    };
  }, []);

  /* ---------- 按键监听 ---------- */
  useEffect(() => {
    function onKeyDown(e) {
      if (completed) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'w'].includes(k)) { keysRef.current.up = true; e.preventDefault(); }
      else if (['arrowdown', 's'].includes(k)) { keysRef.current.down = true; e.preventDefault(); }
      else if (['arrowleft', 'a'].includes(k)) { keysRef.current.left = true; e.preventDefault(); }
      else if (['arrowright', 'd'].includes(k)) { keysRef.current.right = true; e.preventDefault(); }
    }
    function onKeyUp(e) {
      const k = e.key.toLowerCase();
      if (['arrowup', 'w'].includes(k)) keysRef.current.up = false;
      else if (['arrowdown', 's'].includes(k)) keysRef.current.down = false;
      else if (['arrowleft', 'a'].includes(k)) keysRef.current.left = false;
      else if (['arrowright', 'd'].includes(k)) keysRef.current.right = false;
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [completed]);

  /* ---------- 触摸方向键（手机端） ---------- */
  // 提供给 D-pad 使用的按下 / 抬起接口。
  // 内部用一组 activeTouchId 跟踪每一根手指，避免一根手指反复触发同一方向。
  const activeTouchDirRef = useRef({ up: null, down: null, left: null, right: null });

  function handleDpadDown(dir, pointerId) {
    if (completed) return;
    keysRef.current[dir] = true;
    activeTouchDirRef.current[dir] = pointerId;
  }
  function handleDpadUp(dir, pointerId) {
    // 只有触发"按下"的那根手指抬起时才松开（防误触）
    if (activeTouchDirRef.current[dir] === pointerId) {
      keysRef.current[dir] = false;
      activeTouchDirRef.current[dir] = null;
    }
  }
  function releaseAllDpad() {
    keysRef.current.up = false;
    keysRef.current.down = false;
    keysRef.current.left = false;
    keysRef.current.right = false;
    activeTouchDirRef.current = { up: null, down: null, left: null, right: null };
  }

  // 组件卸载 / 章节完成 → 释放全部方向键（避免飞船在结局页"漂移"）
  useEffect(() => {
    return () => releaseAllDpad();
  }, []);

  /* ---------- 主动画循环 ---------- */
  useEffect(() => {
    if (completed) return;
    let rafId;
    const tick = (now) => {
      const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000); // 上限 50ms
      lastFrameRef.current = now;
      updateShip(dt);
      checkScanner(now);
      checkEscape();
      // 每帧触发一次轻量重渲染（用于引擎动画 + 扫描圈）
      setTick((t) => (t + 1) % 1000);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    animFrameRef.current = rafId;
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, warnings]);

  function updateShip(dt) {
    const ship = shipRef.current;
    const keys = keysRef.current;
    const thrust = 380;       // px/s² 推力
    const maxSpeed = 320;     // px/s 最大速度
    const friction = 0.985;   // 每帧摩擦（60fps）
    const turnSpeed = 4.5;    // rad/s 转向速度

    // 1. 根据按键计算期望朝向
    let targetFacing = null;
    if (keys.up && keys.left) targetFacing = -Math.PI * 0.75;       // 左上
    else if (keys.up && keys.right) targetFacing = -Math.PI * 0.25;  // 右上
    else if (keys.down && keys.left) targetFacing = Math.PI * 0.75;  // 左下
    else if (keys.down && keys.right) targetFacing = Math.PI * 0.25; // 右下
    else if (keys.up) targetFacing = -Math.PI / 2;  // 上
    else if (keys.down) targetFacing = Math.PI / 2;  // 下
    else if (keys.left) targetFacing = Math.PI;       // 左
    else if (keys.right) targetFacing = 0;            // 右

    if (targetFacing !== null) {
      // 平滑转向
      let diff = targetFacing - ship.facing;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      ship.facing += clamp(diff, -turnSpeed * dt, turnSpeed * dt);
    }

    // 2. 应用推力（仅在按键时）
    let ax = 0, ay = 0;
    if (keys.up) ay -= 1;
    if (keys.down) ay += 1;
    if (keys.left) ax -= 1;
    if (keys.right) ax += 1;
    const inputMag = Math.hypot(ax, ay);
    if (inputMag > 0) {
      ax /= inputMag;
      ay /= inputMag;
      ship.vx += ax * thrust * dt;
      ship.vy += ay * thrust * dt;
      ship.engineGlow = Math.min(1, ship.engineGlow + dt * 4);
    } else {
      ship.engineGlow = Math.max(0, ship.engineGlow - dt * 3);
    }

    // 3. 引力场加速（指向行星中心 = 吸引）
    gravityBodies.forEach((p) => {
      const d = dist(ship, p);
      if (d < p.radius + gravityInfluenceRadius && d > p.radius) {
        const strength = 1 - (d - p.radius) / gravityInfluenceRadius; // 0-1
        // 从飞船指向行星（吸引方向）
        const dx = (p.x - ship.x) / d;
        const dy = (p.y - ship.y) / d;
        const gravAccel = 220 * strength;
        ship.vx += dx * gravAccel * dt;
        ship.vy += dy * gravAccel * dt;
      }
    });

    // 4. 摩擦衰减
    ship.vx *= Math.pow(friction, dt * 60);
    ship.vy *= Math.pow(friction, dt * 60);

    // 5. 限速
    const speed = Math.hypot(ship.vx, ship.vy);
    if (speed > maxSpeed) {
      ship.vx = (ship.vx / speed) * maxSpeed;
      ship.vy = (ship.vy / speed) * maxSpeed;
    }

    // 6. 移动
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    // 7. 边界限制
    ship.x = clamp(ship.x, 20, viewBox.width - 20);
    ship.y = clamp(ship.y, 20, viewBox.height - 20);

    // 8. 引擎音
    if (ship.engineGlow > 0.5 && !engineSoundStopRef.current) {
      engineSoundStopRef.current = chapter2Sfx.startEngine();
    } else if (ship.engineGlow <= 0.5 && engineSoundStopRef.current) {
      engineSoundStopRef.current();
      engineSoundStopRef.current = null;
    }
  }

  function checkScanner(now) {
    if (completed) return;
    const ship = shipRef.current;
    const elapsed = now - scanStartedAtRef.current;

    // 警告逻辑：飞船在扫描带内 → 每个扫描周期最多触发一次警告
    hunters.forEach((h) => {
      const hs = getHunterState(h, elapsed);
      const inScan = isInScanBand(ship, hs);
      const warnedKey = `${h.id}-warned`;
      if (inScan) {
        if (!wasInScannerRef.current[warnedKey]) {
          wasInScannerRef.current[warnedKey] = true;
          triggerWarning(h);
        }
      } else {
        wasInScannerRef.current[warnedKey] = false;
      }
    });
  }

  function triggerWarning(hunter) {
    setWarnings((w) => {
      if (w >= maxWarnings) return w;
      const next = w + 1;
      setFlashRed(Date.now());
      chapter2Sfx.warning();
      if (navigator.vibrate) navigator.vibrate(80);
      if (next >= maxWarnings) {
        // 失败
        if (ambientStopRef.current) ambientStopRef.current();
        chapter2Sfx.fuelLow();
        const score = {
          timeUsed: Math.floor((performance.now() - startTimeRef.current) / 1000),
          warnings: next,
        };
        setTimeout(() => onComplete && onComplete(score, { reason: '被 扫 描 捕 获' }), 800);
      }
      return next;
    });
  }

  function checkEscape() {
    if (completed) return;
    const ship = shipRef.current;
    if (dist(ship, escapePoint) < 22) {
      setCompleted(true);
      chapter2Sfx.escape();
      if (ambientStopRef.current) ambientStopRef.current();
      if (engineSoundStopRef.current) engineSoundStopRef.current();
      const score = {
        timeUsed: Math.floor((performance.now() - startTimeRef.current) / 1000),
        warnings,
      };
      setTimeout(() => onComplete && onComplete(score), 1500);
    }
  }

  /* ---------- 渲染 ---------- */
  const now = performance.now() - scanStartedAtRef.current;
  const huntersState = hunters.map((h) => getHunterState(h, now));
  const ship = shipRef.current;

  return (
    <div className="scene active ch2-scene" id="chapter2">
      <StarsField />
      {flashRed && Date.now() - flashRed < 300 && (
        <div className="ch2-flash-red" />
      )}

      {/* HUD */}
      <div className="ch2-hud">
        <div className="ch2-title">{CHAPTER_META[2].title}</div>
        <div className="ch2-subtitle">{CHAPTER_META[2].subtitle}</div>
        <div className="ch2-warnings">
          {Array.from({ length: maxWarnings }).map((_, i) => (
            <span key={i} className={`ch2-warn ${i < warnings ? 'on' : 'off'}`}>◆</span>
          ))}
          <span className="ch2-warn-label">容 错</span>
        </div>
        <button className="ch2-help" onClick={() => setShowHelp(true)} aria-label="规则说明">?</button>
      </div>

      {/* 星图（纯展示，无点击响应） */}
      {showHelp && <RuleModal chapter="2" onClose={() => setShowHelp(false)} />}
      <div className="ch2-starmap-wrap">
        <svg
          className="ch2-starmap"
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 行星引力等势线 */}
          {gravityBodies.map((p, i) => (
            <g key={`grav-${i}`}>
              {[1, 0.7, 0.4].map((r, ri) => (
                <circle
                  key={ri}
                  cx={p.x}
                  cy={p.y}
                  r={p.radius + gravityInfluenceRadius * r}
                  fill="none"
                  stroke={COLORS.gold}
                  strokeWidth="0.5"
                  strokeDasharray="3 3"
                  opacity="0.3"
                />
              ))}
            </g>
          ))}

          {/* 行星 */}
          {gravityBodies.map((p, i) => (
            <g key={`planet-${i}`}>
              <circle cx={p.x} cy={p.y} r={p.radius} fill={p.color} opacity="0.85" />
              <circle cx={p.x} cy={p.y} r={p.radius} fill="none" stroke={COLORS.gold} strokeWidth="1.5" opacity="0.6" />
            </g>
          ))}

          {/* 移动扫描带（横/纵方向随机，路径随机） */}
          {huntersState.map((h) => (
            <g key={h.id} className={`ch2-hunter ${h.isScanning ? 'scanning' : ''}`}>
              {h.isScanning ? (
                <>
                  {/* 起点红点（扫描带从此处开始） */}
                  <circle cx={h.pathStart.x} cy={h.pathStart.y} r="6" fill={h.color} opacity="0.85">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
                    <animate attributeName="r" values="5;8;5" dur="1s" repeatCount="indefinite" />
                  </circle>
                  {/* 终点红点 */}
                  <circle cx={h.pathEnd.x} cy={h.pathEnd.y} r="6" fill={h.color} opacity="0.85">
                    <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
                    <animate attributeName="r" values="5;8;5" dur="1s" repeatCount="indefinite" />
                  </circle>
                  {/* 起点 → 终点 路径虚线（暗色，提示路径） */}
                  <line
                    x1={h.pathStart.x}
                    y1={h.pathStart.y}
                    x2={h.pathEnd.x}
                    y2={h.pathEnd.y}
                    stroke={h.color}
                    strokeWidth="0.4"
                    strokeDasharray="2 4"
                    opacity="0.3"
                  />
                  {/* 扫描带主体（矩形 + 流动虚线） */}
                  <rect
                    x={h.cx - h.halfLength}
                    y={h.cy - h.halfThickness}
                    width={h.scanLength}
                    height={h.scanThickness}
                    fill={`${h.color}26`}
                    stroke={h.color}
                    strokeWidth="1.5"
                    strokeDasharray="10 6"
                    rx="2"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-32"
                      dur="0.6s"
                      repeatCount="indefinite"
                    />
                  </rect>
                  {/* 扫描带中心线 */}
                  <line
                    x1={h.cx - h.halfLength}
                    y1={h.cy}
                    x2={h.cx + h.halfLength}
                    y2={h.cy}
                    stroke={h.color}
                    strokeWidth="0.5"
                    opacity="0.5"
                    strokeDasharray="4 4"
                  />
                  {/* 扫描带两端红色警示 */}
                  <rect
                    x={h.cx - h.halfLength}
                    y={h.cy - h.halfThickness}
                    width="6"
                    height={h.scanThickness}
                    fill={h.color}
                    opacity="0.6"
                  />
                  <rect
                    x={h.cx + h.halfLength - 6}
                    y={h.cy - h.halfThickness}
                    width="6"
                    height={h.scanThickness}
                    fill={h.color}
                    opacity="0.6"
                  />
                </>
              ) : (
                /* 冷却中：扫描路径变淡绿，提示"安全通过" */
                <>
                  <circle cx={h.pathStart.x} cy={h.pathStart.y} r="4" fill="rgba(168, 232, 200, 0.6)" />
                  <circle cx={h.pathEnd.x} cy={h.pathEnd.y} r="4" fill="rgba(168, 232, 200, 0.6)" />
                  <line
                    x1={h.pathStart.x}
                    y1={h.pathStart.y}
                    x2={h.pathEnd.x}
                    y2={h.pathEnd.y}
                    stroke="rgba(168, 232, 200, 0.25)"
                    strokeWidth="0.4"
                    strokeDasharray="3 6"
                  />
                </>
              )}
            </g>
          ))}

          {/* 逃逸点 */}
          <g className="ch2-escape">
            <circle cx={escapePoint.x} cy={escapePoint.y} r="22" fill="none" stroke={COLORS.cyan} strokeWidth="1" strokeDasharray="3 3" opacity="0.6">
              <animate attributeName="r" values="20;28;20" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={escapePoint.x} cy={escapePoint.y} r="10" fill={COLORS.cyan} opacity="0.5" />
            <text x={escapePoint.x} y={escapePoint.y + 4} textAnchor="middle" fill={COLORS.cyan} fontSize="10" letterSpacing="0.2em">逃逸</text>
          </g>

          {/* 起点标记 */}
          <g className="ch2-start">
            <circle cx={shipStart.x} cy={shipStart.y} r="6" fill="none" stroke={COLORS.shadow} strokeWidth="1" opacity="0.5" />
          </g>

          {/* 飞船 + 引擎尾焰 */}
          <g
            className="ch2-ship"
            transform={`translate(${ship.x}, ${ship.y}) rotate(${ship.facing * 180 / Math.PI})`}
          >
            {/* 引擎尾焰（仅在推进时显示） */}
            {ship.engineGlow > 0.1 && (
              <polygon
                points="-10,4 -22,0 -10,-4"
                fill={COLORS.cyan}
                opacity={ship.engineGlow * 0.85}
                style={{ filter: `blur(${2 - ship.engineGlow * 1.5}px)` }}
              >
                <animate attributeName="opacity" values={`${ship.engineGlow * 0.6};${ship.engineGlow};${ship.engineGlow * 0.6}`} dur="0.15s" repeatCount="indefinite" />
              </polygon>
            )}
            {/* 飞船主体（箭头形） */}
            <polygon points="14,0 -8,7 -4,0 -8,-7" fill={COLORS.cyan} opacity="0.9" />
            <polygon points="14,0 -8,7 -4,0 -8,-7" fill="none" stroke={COLORS.cyan} strokeWidth="1" />
          </g>
        </svg>
      </div>

      {/* 键位提示 */}
      <div className="ch2-keyhint">
        <div className="ch2-keyhint-row">
          <span className="key key-w">W</span>
        </div>
        <div className="ch2-keyhint-row">
          <span className="key key-a">A</span>
          <span className="key key-s">S</span>
          <span className="key key-d">D</span>
        </div>
        <div className="ch2-keyhint-text">或 方 向 键 操 纵 · 引 力 场 内 加 速 · 避 开 扫 描 · 抵 达 逃 逸 点</div>
      </div>

      {/* 触摸方向键（仅触屏可见） */}
      <Dpad
        onDown={handleDpadDown}
        onUp={handleDpadUp}
      />

      <style>{chapter2Styles}</style>
    </div>
  );
}

/* ============== 触摸方向键 D-pad ============== */
// 用 Pointer Events 同时支持触摸 + 鼠标（桌面调试 / 触屏合一）。
// 使用 unique pointerId 追踪每一根手指，避免一根手指反复触发。
function Dpad({ onDown, onUp }) {
  // 用 ref 跟踪按钮按下状态（用于渲染时高亮）
  const [active, setActive] = useState({ up: false, down: false, left: false, right: false });

  function makeHandlers(dir) {
    return {
      onPointerDown: (e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onDown(dir, e.pointerId);
        setActive((s) => ({ ...s, [dir]: true }));
        if (navigator.vibrate) navigator.vibrate(10);
      },
      onPointerUp: (e) => {
        onUp(dir, e.pointerId);
        setActive((s) => ({ ...s, [dir]: false }));
      },
      onPointerCancel: (e) => {
        onUp(dir, e.pointerId);
        setActive((s) => ({ ...s, [dir]: false }));
      },
      onPointerLeave: (e) => {
        // 手指拖出按钮也要松开（但用 captured pointer 时基本不会触发，留作兜底）
        if (e.buttons === 0) {
          onUp(dir, e.pointerId);
          setActive((s) => ({ ...s, [dir]: false }));
        }
      },
    };
  }

  const dirs = ['up', 'left', 'down', 'right'];

  return (
    <div className="ch2-dpad" aria-label="方向控制">
      {dirs.map((dir) => {
        const handlers = makeHandlers(dir);
        const arrow = { up: '▲', down: '▼', left: '◀', right: '▶' }[dir];
        return (
          <button
            key={dir}
            type="button"
            className={`ch2-dpad-btn ch2-dpad-${dir} ${active[dir] ? 'active' : ''}`}
            aria-label={`方向-${dir}`}
            {...handlers}
          >
            {arrow}
          </button>
        );
      })}
    </div>
  );
}

const chapter2Styles = `
.ch2-scene {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ch2-flash-red {
  position: absolute;
  inset: 0;
  background: rgba(217, 69, 95, 0.4);
  z-index: 50;
  pointer-events: none;
  animation: ch2-flash-fade 0.3s ease forwards;
}

@keyframes ch2-flash-fade {
  from { opacity: 1; }
  to { opacity: 0; }
}

.ch2-hud {
  position: absolute;
  top: max(30px, env(safe-area-inset-top, 0px) + 12px);
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
  font-family: 'JetBrains Mono', monospace;
}

.ch2-title {
  font-size: 16px;
  letter-spacing: 0.4em;
  color: var(--bone, #e8e6df);
  margin-bottom: 4px;
}

.ch2-subtitle {
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--cyan-fade, #2a5d6a);
  margin-bottom: 12px;
}

.ch2-warnings {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  font-size: 12px;
}

.ch2-warn.on { color: var(--cyan-signal, #7fd4e8); }
.ch2-warn.off { color: var(--dim, #2a2f3a); }

.ch2-warn-label {
  margin-left: 12px;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: var(--shadow, #555);
}

.ch2-starmap-wrap {
  width: min(95vw, 900px);
  height: min(70vh, 600px);
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ch2-starmap {
  width: 100%;
  height: 100%;
  cursor: default;
}

.ch2-ship {
  filter: drop-shadow(0 0 6px var(--cyan-signal, #7fd4e8));
}

.ch2-keyhint {
  position: absolute;
  bottom: max(30px, env(safe-area-inset-bottom, 0px) + 12px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
}

.ch2-keyhint-row {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 4px;
}

.ch2-keyhint-row:first-child {
  margin-bottom: 4px;
}

.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--cyan-signal, #7fd4e8);
  color: var(--cyan-signal, #7fd4e8);
  font-size: 13px;
  font-weight: bold;
  background: rgba(127, 212, 232, 0.05);
}

.ch2-keyhint-text {
  font-size: 9px;
  letter-spacing: 0.3em;
  color: var(--shadow, #555);
  margin-top: 8px;
}

.ch2-hunter.scanning circle {
  animation: ch2-scan-pulse 0.8s ease infinite alternate;
}

@keyframes ch2-scan-pulse {
  from { opacity: 0.6; }
  to { opacity: 1; }
}

.ch2-help {
  position: absolute;
  top: max(40px, env(safe-area-inset-top, 0px) + 16px);
  right: max(30px, env(safe-area-inset-right, 0px) + 12px);
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
.ch2-help:hover {
  border-color: var(--cyan-signal, #7fd4e8);
  color: var(--cyan-signal, #7fd4e8);
  background: rgba(127, 212, 232, 0.1);
}

/* ===== 触摸方向键 D-pad ===== */
/* 默认隐藏（避免桌面误显示）；触屏 / 鼠标无键盘的设备才显示 */
.ch2-dpad {
  display: none;
  position: absolute;
  bottom: max(24px, env(safe-area-inset-bottom, 0px) + 16px);
  left: 24px;
  width: 156px;
  height: 156px;
  z-index: 12;
  grid-template-areas:
    '.    up    .'
    'left .     right'
    '.    down  .';
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 4px;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;  /* 阻止浏览器把触摸当成滚动 */
}
.ch2-dpad-up    { grid-area: up; }
.ch2-dpad-left  { grid-area: left; }
.ch2-dpad-right { grid-area: right; }
.ch2-dpad-down  { grid-area: down; }

.ch2-dpad-btn {
  width: 100%;
  height: 100%;
  min-height: 44px;     /* 触控目标最小尺寸 */
  border: 1px solid rgba(127, 212, 232, 0.35);
  border-radius: 6px;
  background: rgba(127, 212, 232, 0.08);
  color: var(--cyan-signal, #7fd4e8);
  font-size: 20px;
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.08s ease, transform 0.08s ease;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
}
.ch2-dpad-btn.active {
  background: rgba(127, 212, 232, 0.32);
  border-color: var(--cyan-signal, #7fd4e8);
  transform: scale(0.94);
  box-shadow: 0 0 12px rgba(127, 212, 232, 0.4);
}
.ch2-dpad-btn:active {
  background: rgba(127, 212, 232, 0.32);
}

/* 触屏设备：显示 D-pad */
@media (hover: none) and (pointer: coarse) {
  .ch2-dpad {
    display: grid;
  }
}

/* 小屏：进一步压缩 D-pad，让星图有空间 */
@media (max-width: 600px) {
  .ch2-dpad {
    bottom: max(12px, env(safe-area-inset-bottom, 0px) + 8px);
    left: 12px;
    width: 132px;
    height: 132px;
  }
  .ch2-dpad-btn {
    font-size: 18px;
  }
}
`;