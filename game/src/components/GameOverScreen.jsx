import { useEffect, useState } from 'react';
import { StarsField } from './StarsField.jsx';
import { stopAllChapterAudio, chapter3Sfx } from '../audio/presets.js';

const FAILURE_LINES = {
  '船 体 解 体': '你的飞船化作一团散射的金属雨。',
  '燃 料 耗 尽': '飞船漂入永恒的黑暗。',
  '时 间 耗 尽': '你错过了宇宙给你的一次机会。',
  '空 间 完 全 坍 缩': '三维的存在被压成了一张纸。',
  '信 号 被 淹 没': '那个来自远方的低语被噪音吞没。',
  '容 错 耗 尽': '三体舰队已逼近，你暴露了所有坐标。',
  '被 二 向 化': '你错过了最后的校准窗口。',
};

export function GameOverScreen({ reason, onRestart }) {
  const [show, setShow] = useState(false);
  const line = FAILURE_LINES[reason] || '';

  useEffect(() => {
    stopAllChapterAudio();
    chapter3Sfx.poeticEnding();
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="scene active" id="game-over">
      <StarsField />
      <div className={`go-text ${show ? 'in' : ''}`}>{reason || '失 败'}</div>
      <div className={`go-reason ${show ? 'in' : ''}`}>{line}</div>
      <button
        className={`go-restart ${show ? 'in' : ''}`}
        onClick={onRestart}
        type="button"
      >
        再 来 一 次
      </button>

      <style>{gameOverStyles}</style>
    </div>
  );
}

/* ============== 局部样式 ============== */
const gameOverStyles = `
#game-over {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding-top: max(16px, env(safe-area-inset-top, 0px));
  padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
}

.go-text {
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  font-size: 36px;
  letter-spacing: 0.5em;
  color: var(--rust-warn, #d9455f);
  margin-bottom: 20px;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.go-text.in {
  opacity: 1;
}

.go-reason {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 13px;
  letter-spacing: 0.25em;
  color: var(--bone, #e8e6df);
  opacity: 0;
  margin-bottom: 50px;
  text-align: center;
  max-width: 480px;
  line-height: 2;
  transition: opacity 0.6s ease 0.3s;
}

.go-reason.in {
  opacity: 0.7;
}

.go-restart {
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  font-size: 12px;
  letter-spacing: 0.4em;
  color: var(--cyan-signal, #7fd4e8);
  background: transparent;
  border: 1px solid var(--cyan-signal, #7fd4e8);
  padding: 14px 36px;
  cursor: pointer;
  position: relative;
  opacity: 0;
  transition: opacity 0.6s ease 0.6s, background 0.2s ease, color 0.2s ease, transform 0.15s ease;
  outline: none;
}

.go-restart.in {
  opacity: 1;
}

.go-restart:hover {
  background: var(--cyan-signal, #7fd4e8);
  color: var(--ink-void, #05060a);
}

.go-restart:active {
  transform: scale(0.96);
}

.go-restart::before,
.go-restart::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border: 1px solid var(--cyan-signal, #7fd4e8);
  transition: all 0.2s ease;
}

.go-restart::before {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
}

.go-restart::after {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
}

.go-restart:hover::before,
.go-restart:hover::after {
  width: 12px;
  height: 12px;
}
`;