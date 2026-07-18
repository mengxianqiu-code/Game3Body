import { useState } from 'react';
import { StarsField } from './StarsField.jsx';

/**
 * 设置页
 * - 色觉障碍模式 / 单声道 / 字幕 / 静音 / 重置存档
 */
export function Settings({ settings, muted, onToggle, onToggleMute, onReset, onClose }) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="scene active settings-scene in" id="settings">
      <StarsField />

      <div className="settings-title">设 置</div>
      <div className="settings-subtitle">SETTINGS</div>

      <div className="settings-list">
        <SettingRow
          label="色 觉 障 碍 模 式"
          desc="替 换 颜 色 编 码 为 形 状 / 纹 理"
          checked={settings.colorBlindMode}
          onChange={() => onToggle('colorBlindMode')}
        />
        <SettingRow
          label="单 声 道 音 频"
          desc="耳 机 单 声 道 输 出"
          checked={settings.monoAudio}
          onChange={() => onToggle('monoAudio')}
        />
        <SettingRow
          label="字 幕 提 示"
          desc="音 效 触 发 时 屏 幕 底 部 闪 文 字"
          checked={settings.showSubtitles}
          onChange={() => onToggle('showSubtitles')}
        />
        <SettingRow
          label="全 局 静 音"
          desc="关 闭 所 有 音 效（按 M 键 切 换）"
          checked={muted}
          onChange={onToggleMute}
        />
      </div>

      <div className="settings-divider" />

      <div className="settings-danger">
        <div className="settings-danger-title">存 档 操 作</div>
        {!confirmReset ? (
          <button
            className="settings-reset-btn"
            onClick={() => setConfirmReset(true)}
          >
            重 置 存 档
          </button>
        ) : (
          <div className="settings-confirm">
            <span className="settings-confirm-text">确 定 清 空 所 有 存 档 ？</span>
            <button
              className="settings-confirm-yes"
              onClick={() => {
                onReset();
                setConfirmReset(false);
              }}
            >
              确 定
            </button>
            <button
              className="settings-confirm-no"
              onClick={() => setConfirmReset(false)}
            >
              取 消
            </button>
          </div>
        )}
      </div>

      <button className="settings-close" onClick={onClose}>
        ← 返 回 主 菜 单
      </button>

      <style>{settingsStyles}</style>
    </div>
  );
}

function SettingRow({ label, desc, checked, onChange }) {
  return (
    <label className="settings-row">
      <div className="settings-row-text">
        <div className="settings-row-label">{label}</div>
        <div className="settings-row-desc">{desc}</div>
      </div>
      <button
        type="button"
        className={`settings-toggle ${checked ? 'on' : 'off'}`}
        onClick={onChange}
        aria-pressed={checked}
      >
        <span className="settings-toggle-knob" />
      </button>
    </label>
  );
}

const settingsStyles = `
.settings-scene {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  font-family: 'JetBrains Mono', monospace;
  background: rgba(5, 6, 10, 0.92);
}

.settings-title {
  font-family: 'Cormorant Garamond', 'Songti SC', serif;
  font-size: 36px;
  letter-spacing: 0.5em;
  color: var(--bone, #e8e6df);
  margin-bottom: 4px;
}
.settings-subtitle {
  font-size: 10px;
  letter-spacing: 0.5em;
  color: var(--cyan-fade, #2a5d6a);
  margin-bottom: 36px;
}

.settings-list {
  width: min(560px, 92vw);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border: 1px solid var(--dim, #2a2f3a);
  background: rgba(10, 13, 20, 0.6);
  cursor: pointer;
  transition: border-color 0.2s ease;
}
.settings-row:hover { border-color: var(--cyan-fade, #2a5d6a); }

.settings-row-text { flex: 1; }
.settings-row-label {
  font-size: 13px;
  letter-spacing: 0.3em;
  color: var(--bone, #e8e6df);
  margin-bottom: 4px;
}
.settings-row-desc {
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--shadow, #555);
}

.settings-toggle {
  width: 44px;
  height: 22px;
  border-radius: 12px;
  border: 1px solid var(--cyan-fade, #2a5d6a);
  background: transparent;
  position: relative;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
}
.settings-toggle.on {
  background: rgba(127, 212, 232, 0.25);
  border-color: var(--cyan-signal, #7fd4e8);
}
.settings-toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--shadow, #555);
  transition: all 0.2s ease;
}
.settings-toggle.on .settings-toggle-knob {
  left: 24px;
  background: var(--cyan-signal, #7fd4e8);
  box-shadow: 0 0 8px var(--cyan-signal, #7fd4e8);
}

.settings-divider {
  width: min(560px, 92vw);
  height: 1px;
  background: var(--dim, #2a2f3a);
  margin: 32px 0 24px;
}

.settings-danger {
  width: min(560px, 92vw);
  text-align: center;
}
.settings-danger-title {
  font-size: 10px;
  letter-spacing: 0.4em;
  color: var(--rust-warn, #d9455f);
  margin-bottom: 12px;
}
.settings-reset-btn {
  background: transparent;
  border: 1px solid var(--rust-warn, #d9455f);
  color: var(--rust-warn, #d9455f);
  padding: 10px 32px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.3em;
  cursor: pointer;
  transition: all 0.2s ease;
}
.settings-reset-btn:hover {
  background: rgba(217, 69, 95, 0.15);
}

.settings-confirm {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}
.settings-confirm-text {
  font-size: 12px;
  color: var(--rust-warn, #d9455f);
  margin-right: 8px;
}
.settings-confirm-yes {
  background: var(--rust-warn, #d9455f);
  border: 1px solid var(--rust-warn, #d9455f);
  color: var(--ink-void, #05060a);
  padding: 8px 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  cursor: pointer;
}
.settings-confirm-no {
  background: transparent;
  border: 1px solid var(--cyan-fade, #2a5d6a);
  color: var(--bone, #e8e6df);
  padding: 8px 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  cursor: pointer;
}

.settings-close {
  position: absolute;
  top: 30px;
  left: 30px;
  background: transparent;
  border: 1px solid var(--cyan-fade, #2a5d6a);
  color: var(--cyan-fade, #2a5d6a);
  padding: 8px 18px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.3em;
  cursor: pointer;
  transition: all 0.2s ease;
}
.settings-close:hover {
  border-color: var(--cyan-signal, #7fd4e8);
  color: var(--cyan-signal, #7fd4e8);
}
`;