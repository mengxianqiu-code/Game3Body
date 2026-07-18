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