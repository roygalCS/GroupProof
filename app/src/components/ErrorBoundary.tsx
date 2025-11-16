import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="app">
          <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="card">
              <h2 style={{ color: '#ef4444' }}>Something went wrong</h2>
              <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
              </div>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                style={{ marginTop: '1rem' }}
              >
                Go Back Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

