/* eslint-disable */
import {
  playTone, playSweep, playNoise, playHeartbeat,
  playPing, playDrone, startDroneLoop, startNoiseLoop,
  playWarp, stopLoop, stopAllLoops,
} from './synth.js';

export const globalSfx = {
  click() {
    playTone({ freq: 1200, duration: 0.06, type: 'sine', gain: 0.12, attack: 0.001, release: 0.06 });
  },
  transition() {
    playSweep({ freqStart: 120, freqEnd: 480, duration: 0.9, type: 'sine', gain: 0.18 });
    setTimeout(() => playTone({ freq: 480, duration: 0.6, type: 'sine', gain: 0.12 }), 850);
  },
  menuEnter() {
    playTone({ freq: 220, duration: 0.8, type: 'sine', gain: 0.1 });
    setTimeout(() => playTone({ freq: 330, duration: 0.8, type: 'sine', gain: 0.1 }), 200);
    setTimeout(() => playTone({ freq: 440, duration: 1.2, type: 'sine', gain: 0.1 }), 400);
  },
  /** 资源警告：低频锯齿短脉冲 */
  resourceWarn() {
    playTone({ freq: 110, duration: 0.18, type: 'sawtooth', gain: 0.25, attack: 0.005, release: 0.15 });
  },
  /** 装备故障：刺耳的高频啸叫 */
  equipmentBreak() {
    playSweep({ freqStart: 2000, freqEnd: 400, duration: 0.5, type: 'square', gain: 0.18 });
  },
  /** 玩家受伤：低频钝击 */
  hullHit() {
    playTone({ freq: 60, duration: 0.3, type: 'sawtooth', gain: 0.35, attack: 0.001, release: 0.3 });
    playTone({ freq: 90, duration: 0.2, type: 'sine', gain: 0.25, attack: 0.001, release: 0.2 });
  },
  /** 飞船死亡：低频崩溃 */
  shipDeath() {
    playSweep({ freqStart: 220, freqEnd: 30, duration: 1.8, type: 'sawtooth', gain: 0.4, exponential: true });
    playTone({ freq: 40, duration: 2.0, type: 'sine', gain: 0.3, attack: 0.1, release: 1.5 });
  },
  /** AI 状态切换：上升扫描音 */
  aiDetect() {
    playSweep({ freqStart: 800, freqEnd: 1200, duration: 0.3, type: 'sine', gain: 0.15 });
  },
  aiAlert() {
    playTone({ freq: 660, duration: 0.2, type: 'square', gain: 0.15 });
    setTimeout(() => playTone({ freq: 880, duration: 0.2, type: 'square', gain: 0.15 }), 150);
  },
  aiRetreat() {
    playSweep({ freqStart: 600, freqEnd: 200, duration: 0.6, type: 'sawtooth', gain: 0.12 });
  },
  /** 数据获取 */
  dataPickup() {
    playPing({ freq: 1320, gain: 0.18, decay: 0.8 });
  },
  /** 维修完成 */
  repair() {
    playPing({ freq: 523.25, gain: 0.18, decay: 0.6 });
    setTimeout(() => playPing({ freq: 659.25, gain: 0.15, decay: 0.5 }), 120);
  },
};

export const chapter1Sfx = {
  /** 《三体：星际逃亡》第1关专用：
   *  距离 → 音调映射（5 档：嗡/嗡-/中/哔-/哔）
   *  maxDistance = 22（曼哈顿距离，10×15 网格的最大可能值）
   */
  tuningNoise(diff = 22) {
    const d = Math.min(diff, 22);
    // 距离越近 → 频率越高、Q 值越低（更纯净）
    // 距离越远 → 频率越低、Q 值越高（更噪杂）
    const filterFreq = 200 + (22 - d) * 90;
    const filterQ = 1 + d * 0.3;
    const gain = 0.04 + (22 - d) * 0.006;
    playNoise({
      duration: 0.55,
      filterType: 'bandpass',
      filterFreq,
      filterQ,
      gain,
      attack: 0.02,
      release: 0.15,
      source: d > 12 ? 'white' : 'pink',
    });
  },
  /** 信号源附近反馈：高频哔声 */
  signalNear() {
    playTone({ freq: 880, duration: 0.12, type: 'sine', gain: 0.15 });
    setTimeout(() => playTone({ freq: 1320, duration: 0.18, type: 'sine', gain: 0.12 }), 80);
  },
  /** 找到信号源 */
  signalFound() {
    playTone({ freq: 1320, duration: 0.15, type: 'square', gain: 0.2 });
    setTimeout(() => playTone({ freq: 1760, duration: 0.2, type: 'square', gain: 0.18 }), 120);
    setTimeout(() => playTone({ freq: 2640, duration: 0.3, type: 'sine', gain: 0.15 }), 250);
  },
  /** 踩雷：低频钝击 */
  mineHit() {
    playTone({ freq: 80, duration: 0.3, type: 'sawtooth', gain: 0.3, attack: 0.001, release: 0.3 });
    playSweep({ freqStart: 400, freqEnd: 100, duration: 0.4, type: 'sawtooth', gain: 0.2 });
  },
  /** 三次容错耗尽：崩溃音 */
  gameOver() {
    playSweep({ freqStart: 220, freqEnd: 30, duration: 1.5, type: 'sawtooth', gain: 0.35, exponential: true });
  },
  /** 信号扫描循环音（背景） */
  startScanLoop() {
    return startNoiseLoop({ filterFreq: 400, filterQ: 2, gain: 0.03, key: 'ch1-scan' });
  },
  stopScanLoop() {
    stopLoop('ch1-scan');
  },
  /* Legacy 方法保留（兼容旧引用） */
  signalStrong() {
    playSweep({ freqStart: 300, freqEnd: 600, duration: 0.25, type: 'sine', gain: 0.15 });
  },
  signalLocked() {
    playTone({ freq: 880, duration: 0.12, type: 'square', gain: 0.18, attack: 0.001, release: 0.08 });
    setTimeout(() => playTone({ freq: 1320, duration: 0.18, type: 'square', gain: 0.18, attack: 0.001, release: 0.15 }), 90);
  },
  decoding() {
    playDrone({ freqs: [55, 82.5], gain: 0.1, duration: 2.0 });
    [220, 277, 330].forEach((f, i) => {
      setTimeout(() => playPing({ freq: f, gain: 0.15, decay: 1.4 }), 200 + i * 220);
    });
  },
  eggReveal() {
    playPing({ freq: 261.63, gain: 0.25, decay: 2.5 });
    setTimeout(() => playPing({ freq: 392.00, gain: 0.18, decay: 2.2 }), 60);
    setTimeout(() => playPing({ freq: 523.25, gain: 0.15, decay: 2.0 }), 120);
    playTone({ freq: 65.41, duration: 2.4, type: 'sine', gain: 0.18, attack: 0.4, release: 0.8 });
  },
  decoySignal() {
    playTone({ freq: 200, duration: 0.4, type: 'triangle', gain: 0.18, attack: 0.05, release: 0.3 });
  },
};

export const chapter2Sfx = {
  /** 飞船移动：短脉冲 */
  step() {
    playTone({ freq: 180, duration: 0.08, type: 'sine', gain: 0.18, attack: 0.001, release: 0.08 });
  },
  /** 引力弹弓：上升扫描 + 回落 */
  gravitySwing() {
    playSweep({ freqStart: 120, freqEnd: 520, duration: 0.7, type: 'sawtooth', gain: 0.12 });
    setTimeout(() => playSweep({ freqStart: 520, freqEnd: 280, duration: 0.5, type: 'sawtooth', gain: 0.1 }), 700);
  },
  /** 被扫描到：心跳 + 高频警告 */
  warning() {
    playHeartbeat({ gain: 0.55 });
    playTone({ freq: 1800, duration: 0.05, type: 'square', gain: 0.1, attack: 0.001, release: 0.04 });
  },
  /** 侦测按钮 */
  detect() {
    playSweep({ freqStart: 800, freqEnd: 1600, duration: 0.45, type: 'sine', gain: 0.18 });
    setTimeout(() => playSweep({ freqStart: 1600, freqEnd: 800, duration: 0.45, type: 'sine', gain: 0.18 }), 450);
  },
  /** 抵达逃逸点：和弦钟声 */
  escape() {
    [261.63, 329.63, 392.00].forEach((f, i) => {
      setTimeout(() => playPing({ freq: f, gain: 0.22, decay: 2.0 }), i * 80);
    });
  },
  /** 环境低鸣 */
  startAmbient() {
    return startNoiseLoop({ filterFreq: 600, filterQ: 4, gain: 0.04, key: 'ch2-ambient' });
  },
  stopAmbient() {
    stopLoop('ch2-ambient');
  },
  /** 引擎持续音（推进时启动） */
  startEngine() {
    return startDroneLoop({ freqs: [55, 82.5, 110], gain: 0.08, key: 'ch2-engine' });
  },
  stopEngine() {
    stopLoop('ch2-engine');
  },
  fuelLow() {
    playTone({ freq: 80, duration: 0.15, type: 'sawtooth', gain: 0.2 });
  },
  swarmSpawn() {
    playSweep({ freqStart: 200, freqEnd: 1000, duration: 0.4, type: 'square', gain: 0.18 });
  },
  pathChosen(id) {
    playPing({ freq: id === 'left' ? 440 : id === 'center' ? 523 : 349, gain: 0.2, decay: 0.6 });
  },
};

export const chapter3Sfx = {
  startCollapseHum() {
    return startDroneLoop({ freqs: [41.20, 61.74, 82.41], gain: 0.16, key: 'ch3-hum' });
  },
  stopCollapseHum() {
    stopLoop('ch3-hum');
  },
  fragmentPick(index = 0) {
    const freqs = [659.25, 783.99, 880.00, 1046.50];
    const f = freqs[index % freqs.length];
    playPing({ freq: f, gain: 0.28, decay: 1.6 });
    playTone({ freq: f * 2, duration: 0.25, type: 'sine', gain: 0.08, attack: 0.001, release: 0.2 });
  },
  fragmentChime() {
    playTone({ freq: 1760, duration: 0.08, type: 'sine', gain: 0.12, attack: 0.001, release: 0.06 });
  },
  warpCharge() {
    playSweep({ freqStart: 80, freqEnd: 320, duration: 0.6, type: 'sawtooth', gain: 0.18 });
    setTimeout(() => playSweep({ freqStart: 320, freqEnd: 80, duration: 0.4, type: 'sawtooth', gain: 0.14 }), 600);
  },
  warp() {
    playWarp({ duration: 2.0, gain: 0.45 });
    [261.63, 329.63, 392.00, 523.25].forEach((f, i) => {
      setTimeout(() => playPing({ freq: f, gain: 0.18, decay: 1.8 }), i * 60);
    });
  },
  poeticEnding() {
    [261.63, 311.13, 392.00].forEach((f, i) => {
      setTimeout(() => playPing({ freq: f, gain: 0.15, decay: 2.6 }), i * 400);
    });
    playTone({ freq: 65.41, duration: 3.5, type: 'sine', gain: 0.15, attack: 0.5, release: 1.5 });
  },
};

export const chapter4Sfx = {
  /** 启动二维化低频背景 */
  startCollapseHum() {
    return startDroneLoop({ freqs: [41.20, 61.74, 82.41], gain: 0.16, key: 'ch4-hum' });
  },
  stopCollapseHum() {
    stopLoop('ch4-hum');
  },
  /** 激活成功：钟声 */
  ringLocked(index = 0) {
    const freqs = [659.25, 783.99, 880.00, 1046.50, 1174.66];
    const f = freqs[index % freqs.length];
    playPing({ freq: f, gain: 0.28, decay: 1.6 });
    playTone({ freq: f * 2, duration: 0.25, type: 'sine', gain: 0.08, attack: 0.001, release: 0.2 });
  },
  /** 激活失败：低频钝击 */
  ringMiss() {
    playTone({ freq: 120, duration: 0.3, type: 'sawtooth', gain: 0.25 });
  },
  /** 跃迁成功 */
  warp() {
    playWarp({ duration: 2.0, gain: 0.45 });
    [261.63, 329.63, 392.00, 523.25].forEach((f, i) => {
      setTimeout(() => playPing({ freq: f, gain: 0.18, decay: 1.8 }), i * 60);
    });
  },
  /** 进度条警告 */
  progressWarn() {
    playTone({ freq: 100, duration: 0.1, type: 'square', gain: 0.15 });
  },
};

export function stopAllChapterAudio() {
  stopAllLoops();
}