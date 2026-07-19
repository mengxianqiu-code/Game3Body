import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 'max(24px, env(safe-area-inset-top, 0px)) max(24px, env(safe-area-inset-right, 0px)) max(24px, env(safe-area-inset-bottom, 0px)) max(24px, env(safe-area-inset-left, 0px))',
          color: 'var(--bone)',
          fontFamily: 'Inter, sans-serif',
          background: 'var(--ink-void)',
          textAlign: 'center', zIndex: 9999,
        }}>
          <div style={{ fontSize: 12, letterSpacing: '0.4em', color: 'var(--rust-warn)', marginBottom: 16 }}>
            RUNTIME ERROR
          </div>
          <pre style={{ fontSize: 11, maxWidth: 600, whiteSpace: 'pre-wrap', opacity: 0.7 }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{
              marginTop: 24, padding: '12px 24px',
              border: '0.5px solid var(--cyan-fade)', color: 'var(--cyan-signal)',
              minHeight: 44, minWidth: 120, fontSize: 12, letterSpacing: '0.3em',
            }}
          >重 启</button>
        </div>
      );
    }
    return this.props.children;
  }
}