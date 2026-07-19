import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import './styles/global.css';

function hideSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  splash.classList.add('fade');
  setTimeout(() => splash.remove(), 500);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App onReady={hideSplash} />
    </ErrorBoundary>
  </React.StrictMode>
);

requestAnimationFrame(() => requestAnimationFrame(hideSplash));

// PWA: 注册 Service Worker（离线缓存 / 可安装）
if ('serviceWorker' in navigator) {
  // 等首屏渲染完再注册，避免阻塞首屏
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // 后续版本更新提示（如需 UI 提示，可在此处扩展）
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      })
      .catch((err) => {
        // 注册失败不应阻塞游戏，仅记录
        console.warn('[PWA] Service worker registration failed:', err);
      });
  });
}