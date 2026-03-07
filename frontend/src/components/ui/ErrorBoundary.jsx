import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a1a',
          color: '#f1f5f9',
          fontFamily: 'Inter, sans-serif',
          padding: '2rem',
        }}>
          <div style={{
            maxWidth: 480,
            textAlign: 'center',
            background: 'rgba(17,17,39,.8)',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 12,
            padding: '2.5rem 2rem',
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Algo salió mal</h2>
            <p style={{ color: '#94a3b8', marginBottom: '1.25rem', fontSize: '.9rem', lineHeight: 1.5 }}>
              {this.state.error?.message || 'Error desconocido'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '.65rem 1.5rem',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '.875rem',
              }}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
