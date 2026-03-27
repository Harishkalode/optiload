import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    // Keep logging in-browser for debugging while preventing a white screen.
    console.error('Frontend runtime error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#080D13', color: '#F1F5F9', fontFamily: 'Inter, sans-serif', padding: 24 }}>
          <div style={{ maxWidth: 680, width: '100%', border: '1px solid #1E2A38', borderRadius: 12, padding: 20, background: '#0D1117' }}>
            <h2 style={{ margin: 0, marginBottom: 10 }}>OptiLoad UI recovered from an error</h2>
            <p style={{ margin: 0, opacity: 0.85 }}>The app hit a runtime issue, so this fallback is shown instead of a blank screen.</p>
            {this.state.message ? <pre style={{ marginTop: 12, whiteSpace: 'pre-wrap', color: '#93C5FD' }}>{this.state.message}</pre> : null}
            <button onClick={() => window.location.reload()} style={{ marginTop: 12, background: '#2563EB', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 8, cursor: 'pointer' }}>
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
