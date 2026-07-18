/* eslint-disable */
/**
 * 三体 · 低语 —— 程序化音效引擎（Web Audio API）
 *
 * 设计哲学：
 * - 0 字节资源：所有声音由 OscillatorNode / AudioBuffer(噪声) 实时合成
 * - 状态即参数：差值、距离、坍缩进度直接映射到频率/增益/滤波
 * - 仪式感 > 真实感：选择合成器而非采样，呼应"电子观测台"美学
 *
 * 约束：
 * - AudioContext 必须在用户首次交互后创建（浏览器自动播放策略）
 * - 所有播放函数都是 fire-and-forget，不阻塞 UI
 */

let ctx = null;
let masterGain = null;
let noiseBuffer = null;
let activeLoops = new Map(); // key -> { stop(): void }

function ensureContext() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(ctx.destination);
    noiseBuffer = makeNoiseBuffer(ctx, 2, 'white');
  } catch (e) {
    console.warn('[audio] Web Audio unavailable', e);
  }
  return ctx;
}

export function setMasterVolume(v) {
  ensureContext();
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v));
}

export function getMuted() {
  return !masterGain || masterGain.gain.value === 0;
}

export function setMuted(m) {
  ensureContext();
  if (masterGain) masterGain.gain.value = m ? 0 : 0.7;
}

/* ====================== 基础声源 ====================== */

function makeNoiseBuffer(ac, seconds = 2, type = 'white') {
  const length = ac.sampleRate * seconds;
  const buf = ac.createBuffer(1, length, ac.sampleRate);
  const data = buf.getChannelData(0);
  if (type === 'white') {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  return buf;
}

function envGain(ac, { attack = 0.01, decay = 0.1, sustain = 0.6, release = 0.2, peak = 1, duration }) {
  const g = ac.createGain();
  const t = ac.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  if (duration != null) {
    const sustainEnd = t + attack + decay;
    const releaseStart = Math.max(sustainEnd, t + duration - release);
    g.gain.linearRampToValueAtTime(peak * sustain, sustainEnd);
    g.gain.setValueAtTime(peak * sustain, releaseStart);
    g.gain.linearRampToValueAtTime(0.0001, releaseStart + release);
  } else {
    g.gain.linearRampToValueAtTime(peak * sustain, t + attack + decay);
    g.gain.linearRampToValueAtTime(0.0001, t + attack + decay + release);
  }
  return g;
}

/* ====================== 高级构建块 ====================== */

/** 单音（正弦/三角/方波/锯齿，带 ADSR） */
export function playTone({
  freq = 440,
  duration = 0.3,
  type = 'sine',
  gain = 0.4,
  attack = 0.01,
  release = 0.2,
  detune = 0,
  destination,
} = {}) {
  const ac = ensureContext();
  if (!ac) return;
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  const g = envGain(ac, { attack, decay: 0.02, sustain: 0.7, release, peak: gain, duration });
  osc.connect(g);
  g.connect(destination || masterGain);
  osc.start();
  osc.stop(ac.currentTime + duration + release + 0.05);
}

/** 频扫（频率在时长内线性插值） */
export function playSweep({
  freqStart = 200,
  freqEnd = 800,
  duration = 0.6,
  type = 'sine',
  gain = 0.35,
  attack = 0.02,
  release = 0.2,
  exponential = false,
} = {}) {
  const ac = ensureContext();
  if (!ac) return;
  const osc = ac.createOscillator();
  osc.type = type;
  const t = ac.currentTime;
  osc.frequency.setValueAtTime(freqStart, t);
  if (exponential) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 0.01), t + duration);
  } else {
    osc.frequency.linearRampToValueAtTime(freqEnd, t + duration);
  }
  const g = envGain(ac, { attack, decay: 0.05, sustain: 0.7, release, peak: gain, duration });
  osc.connect(g);
  g.connect(masterGain);
  osc.start();
  osc.stop(t + duration + release + 0.05);
}

/** 噪声（带通滤波，模拟电台静电 / 引擎噪声） */
export function playNoise({
  duration = 0.5,
  filterType = 'bandpass',
  filterFreq = 1000,
  filterQ = 1,
  gain = 0.2,
  attack = 0.05,
  release = 0.1,
  source = 'white',
} = {}) {
  const ac = ensureContext();
  if (!ac) return;
  if (source === 'pink' && (!noiseBuffer || noiseBuffer._type !== 'pink')) {
    noiseBuffer = makeNoiseBuffer(ac, 2, 'pink');
  }
  const buf = noiseBuffer && noiseBuffer._type === (source || 'white') ? noiseBuffer : noiseBuffer;
  const src = ac.createBufferSource();
  src.buffer = buf || makeNoiseBuffer(ac, 2, source || 'white');
  src.loop = true;
  const filt = ac.createBiquadFilter();
  filt.type = filterType;
  filt.frequency.value = filterFreq;
  filt.Q.value = filterQ;
  const g = envGain(ac, { attack, decay: 0.05, sustain: 0.7, release, peak: gain, duration });
  src.connect(filt); filt.connect(g); g.connect(masterGain);
  src.start();
  src.stop(ac.currentTime + duration + release + 0.05);
}

/** 心跳：两次低频正弦脉冲 */
export function playHeartbeat({ gain = 0.5 } = {}) {
  const ac = ensureContext();
  if (!ac) return;
  const t0 = ac.currentTime;
  // 两次脉冲：lub-dub，间隔 ~0.18s
  [0, 0.18].forEach((offset, i) => {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t0 + offset);
    osc.frequency.exponentialRampToValueAtTime(40, t0 + offset + 0.15);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t0 + offset);
    g.gain.linearRampToValueAtTime(gain * (i === 0 ? 1 : 0.6), t0 + offset + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + 0.2);
    osc.connect(g); g.connect(masterGain);
    osc.start(t0 + offset);
    osc.stop(t0 + offset + 0.25);
  });
}

/** 钟声：高频正弦 + 指数衰减 */
export function playPing({ freq = 880, gain = 0.3, decay = 1.2 } = {}) {
  const ac = ensureContext();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  // 叠加一个二次谐波，让声音更"钟"一些
  const osc2 = ac.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = freq * 2.01;
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(gain * 0.3, t);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + decay * 0.6);
  osc.connect(g); g.connect(masterGain);
  osc2.connect(g2); g2.connect(masterGain);
  osc.start(); osc2.start();
  osc.stop(t + decay + 0.05);
  osc2.stop(t + decay * 0.6 + 0.05);
}

/** 低鸣：多频正弦叠加（"三体"3 个频率的轻微失谐） */
export function playDrone({ freqs = [55, 82.5, 110], gain = 0.18, duration = 4 } = {}) {
  const ac = ensureContext();
  if (!ac) return;
  const t = ac.currentTime;
  const oscs = freqs.map((f) => {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    // 缓慢漂移（lfo），制造活感
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.1 + Math.random() * 0.15;
    const lfoGain = ac.createGain();
    lfoGain.gain.value = f * 0.005;
    lfo.connect(lfoGain); lfoGain.connect(o.frequency);
    return [o, lfo];
  });
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 1.2);
  g.gain.setValueAtTime(gain, t + duration - 0.5);
  g.gain.linearRampToValueAtTime(0.0001, t + duration);
  oscs.forEach(([o, lfo]) => { o.connect(g); lfo.start(); o.start(); });
  g.connect(masterGain);
  setTimeout(() => oscs.forEach(([o, lfo]) => { try { o.stop(); lfo.stop(); } catch(_){} }), duration * 1000 + 100);
}

/** 持续低鸣（loop，返回 stop 函数） */
export function startDroneLoop({ freqs = [55, 82.5, 110], gain = 0.18, key = 'drone' } = {}) {
  const ac = ensureContext();
  if (!ac) return () => {};
  stopLoop(key);
  const t = ac.currentTime;
  const oscs = freqs.map((f) => {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.1 + Math.random() * 0.15;
    const lfoGain = ac.createGain();
    lfoGain.gain.value = f * 0.005;
    lfo.connect(lfoGain); lfoGain.connect(o.frequency);
    return [o, lfo];
  });
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 1.5);
  oscs.forEach(([o, lfo]) => { o.connect(g); lfo.start(); o.start(); });
  g.connect(masterGain);
  const stop = () => {
    const now = ac.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(0.0001, now + 0.4);
    setTimeout(() => oscs.forEach(([o, lfo]) => { try { o.stop(); lfo.stop(); } catch(_){} }), 500);
    activeLoops.delete(key);
  };
  activeLoops.set(key, { stop });
  return stop;
}

/** 持续噪声（loop，返回 stop） */
export function startNoiseLoop({ filterFreq = 800, filterQ = 2, gain = 0.1, key = 'noise' } = {}) {
  const ac = ensureContext();
  if (!ac) return () => {};
  stopLoop(key);
  const src = ac.createBufferSource();
  src.buffer = makeNoiseBuffer(ac, 2, 'pink');
  src.loop = true;
  const filt = ac.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = filterFreq;
  filt.Q.value = filterQ;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, ac.currentTime);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + 0.8);
  src.connect(filt); filt.connect(g); g.connect(masterGain);
  src.start();
  const stop = () => {
    const now = ac.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(0.0001, now + 0.4);
    setTimeout(() => { try { src.stop(); } catch(_){} }, 500);
    activeLoops.delete(key);
  };
  activeLoops.set(key, { stop });
  return stop;
}

/** 裹挟/跃迁：低频上升扫描 + 噪声扫频 */
export function playWarp({ duration = 2.0, gain = 0.5 } = {}) {
  const ac = ensureContext();
  if (!ac) return;
  const t = ac.currentTime;
  // Sub-bass sweep
  const sub = ac.createOscillator();
  sub.type = 'sawtooth';
  sub.frequency.setValueAtTime(40, t);
  sub.frequency.exponentialRampToValueAtTime(800, t + duration);
  const subG = ac.createGain();
  subG.gain.setValueAtTime(0, t);
  subG.gain.linearRampToValueAtTime(gain, t + 0.3);
  subG.gain.linearRampToValueAtTime(0.0001, t + duration);
  // Noise sweep (通过滤波器扫频)
  const ns = ac.createBufferSource();
  ns.buffer = makeNoiseBuffer(ac, duration + 0.5, 'white');
  const f = ac.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 8;
  f.frequency.setValueAtTime(200, t);
  f.frequency.exponentialRampToValueAtTime(4000, t + duration);
  const nG = ac.createGain();
  nG.gain.setValueAtTime(0, t);
  nG.gain.linearRampToValueAtTime(gain * 0.4, t + 0.2);
  nG.gain.linearRampToValueAtTime(0.0001, t + duration);
  sub.connect(subG); subG.connect(masterGain);
  ns.connect(f); f.connect(nG); nG.connect(masterGain);
  sub.start(); ns.start();
  sub.stop(t + duration + 0.1);
  ns.stop(t + duration + 0.1);
}

/* ====================== 循环管理 ====================== */

export function stopLoop(key) {
  const loop = activeLoops.get(key);
  if (loop) loop.stop();
}

export function stopAllLoops() {
  activeLoops.forEach((loop) => loop.stop());
  activeLoops.clear();
}