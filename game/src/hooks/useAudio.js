/* eslint-disable */
/**
 * 静音快捷键：M 切换；暴露给组件的 hook 不变
 * 程序化合成为主，文件音频为可选覆盖（如未来想用真人采样）
 */
import { useCallback, useEffect } from 'react';
import {
  playTone, playSweep, playNoise, playHeartbeat,
  playPing, playDrone, startDroneLoop, startNoiseLoop,
  playWarp, stopLoop, stopAllLoops,
  setMuted, getMuted,
} from '../audio/synth.js';
import {
  globalSfx, chapter1Sfx, chapter2Sfx, chapter3Sfx,
  stopAllChapterAudio,
} from '../audio/presets.js';

/**
 * 暴露给组件的统一 API（保持向后兼容上一版签名）
 * 现在以程序化合成为主，文件资源作为可选覆盖：
 *   playOnce(src, ...) - 如果 src 是 http(s) 开头，则尝试播放文件；否则视为语义事件名
 */
export function useAudio() {
  // 首次挂载时绑定 M 键静音
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'm' || e.key === 'M') {
        setMuted(!getMuted());
        playTone({ freq: getMuted() ? 880 : 220, duration: 0.06, type: 'sine', gain: 0.1 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const playOnce = useCallback((src, opts = {}) => {
    // 文件资产：保留作为可选覆盖
    if (typeof src === 'string' && /^https?:\/\//.test(src)) {
      try {
        const a = new Audio(src);
        a.volume = opts.volume ?? 0.6;
        const p = a.play();
        if (p && p.catch) p.catch(() => {});
      } catch (_) {}
      return;
    }
    // 否则视为语义 key（向后兼容旧接口）
    const map = { ...globalSfx, ...chapter1Sfx, ...chapter2Sfx, ...chapter3Sfx };
    const fn = map[src];
    if (fn) fn(opts);
  }, []);

  const playLoop = useCallback((src, opts = {}) => {
    const map = { ...chapter1Sfx, ...chapter2Sfx, ...chapter3Sfx };
    const fn = map[src];
    if (fn && typeof fn === 'function') return fn(opts);
    return () => {};
  }, []);

  const stopLoop = useCallback((key) => {
    const map = { ...chapter1Sfx, ...chapter2Sfx, ...chapter3Sfx };
    const stopFn = map[`stop${key.charAt(0).toUpperCase() + key.slice(1)}`];
    if (typeof stopFn === 'function') stopFn();
  }, []);

  return { playOnce, playLoop, stopLoop, stopAll: stopAllChapterAudio };
}