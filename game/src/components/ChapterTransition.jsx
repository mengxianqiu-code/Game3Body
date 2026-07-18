import { useEffect, useState } from 'react';
import { StarsField } from './StarsField.jsx';
import { CHAPTER_META } from '../constants.js';

/**
 * 每个章节过渡的专属引言
 * key 格式：`${from}-${to}`，to=null 表示进入结局
 */
const QUOTES = {
  '1-2': '第一道信号消失在第二片森林之前。',
  '2-3': '当空间开始塌陷，寂静便有了重量。',
  '3-4': '二 向 箔 降 临 · 万 物 归 零',
  '4-null': '你 携 带 四 段 记 忆 · 离 开 三 维',
};

const PHASE_DURATION = 3000; // 总时长 3 秒

export function ChapterTransition({ from, to, onDone }) {
  const key = `${from}-${to}`;
  const quote = QUOTES[key] || '—';
  const nextMeta = to != null ? CHAPTER_META[to] : { title: '结 局', subtitle: '星 海 之 外' };

  const [show, setShow] = useState(false);          // 整体渐入
  const [showTitle, setShowTitle] = useState(false); // 章节副标题
  const [scanX, setScanX] = useState(0);            // 扫描线 X 位置
  const [fadeOut, setFadeOut] = useState(false);   // 渐出

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 50);
    const t2 = setTimeout(() => setShowTitle(true), 800);
    // 扫描线 0 → 100% 在 0-1.5s 之间
    let raf;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / 1500);
      setScanX(p * 100);
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    // 渐出
    const t3 = setTimeout(() => setFadeOut(true), PHASE_DURATION - 600);
    // 完成回调
    const t4 = setTimeout(() => onDone && onDone(), PHASE_DURATION);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [onDone]);

  return (
    <div
      className={`scene active transition-scene ${show ? 'in' : ''} ${fadeOut ? 'out' : ''}`}
      id="transition"
    >
      <StarsField />

      {/* 扫描线 */}
      <div className="transition-scan" style={{ left: `${scanX}%` }} />

      {/* 章节编号 */}
      <div className="transition-chapter-num">
        第 {to != null ? to : '终'} 章
      </div>

      {/* 章节标题 + 副标题 */}
      <div className={`transition-title-block ${showTitle ? 'in' : ''}`}>
        <div className="transition-title">{nextMeta.title}</div>
        <div className="transition-subtitle">{nextMeta.subtitle}</div>
      </div>

      {/* 过渡引言 */}
      <div className={`transition-quote ${showTitle ? 'in' : ''}`}>
        {quote}
      </div>

      {/* 装饰横线 */}
      <div className={`transition-line ${show ? 'in' : ''}`} />

      <style>{transitionStyles}</style>
    </div>
  );
}

const transitionStyles = `
.transition-scene {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(5, 6, 10, 0);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.transition-scene.in {
  opacity: 1;
  background: rgba(5, 6, 10, 0.85);
}

.transition-scene.out {
  opacity: 0;
}

/* 扫描线：从左扫到右 */
.transition-scan {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(127, 212, 232, 0.5) 30%,
    rgba(127, 212, 232, 0.9) 50%,
    rgba(127, 212, 232, 0.5) 70%,
    transparent 100%
  );
  box-shadow: 0 0 20px rgba(127, 212, 232, 0.6);
  transition: opacity 0.4s ease;
  z-index: 5;
}

.transition-scene.out .transition-scan {
  opacity: 0;
}

.transition-chapter-num {
  position: absolute;
  top: 18%;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.5em;
  color: var(--cyan-fade, #2a5d6a);
  opacity: 0;
  animation: fadeInChapterNum 0.6s ease forwards;
  animation-delay: 0.3s;
}

@keyframes fadeInChapterNum {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.transition-title-block {
  text-align: center;
  margin-bottom: 40px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.transition-title-block.in {
  opacity: 1;
  transform: translateY(0);
}

.transition-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 48px;
  letter-spacing: 0.4em;
  color: var(--bone, #e8e6df);
  margin-bottom: 12px;
  text-shadow: 0 0 30px rgba(127, 212, 232, 0.3);
}

.transition-subtitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.4em;
  color: var(--cyan-fade, #2a5d6a);
}

.transition-quote {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  letter-spacing: 0.4em;
  color: var(--shadow, #555);
  text-align: center;
  max-width: 600px;
  line-height: 1.8;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 1s ease, transform 1s ease;
  transition-delay: 0.3s;
}

.transition-quote.in {
  opacity: 1;
  transform: translateY(0);
}

.transition-line {
  position: absolute;
  bottom: 25%;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 200px;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(127, 212, 232, 0.6),
    transparent
  );
  transform-origin: center;
  transition: transform 1.2s ease;
}

.transition-line.in {
  transform: translateX(-50%) scaleX(1);
}
`;