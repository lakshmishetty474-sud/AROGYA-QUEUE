import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled runtime error in Arogya Queue:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    try {
      localStorage.removeItem('arogya_currentUser');
    } catch (e) {}
    window.location.href = '/auth';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6 shadow-xl">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            System Notice
          </h1>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            A temporary display issue occurred while rendering the portal. You can refresh or return to the login screen.
          </p>
          {this.state.error && (
            <div className="w-full max-w-lg p-3.5 mb-6 text-left text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-rose-400 overflow-x-auto">
              {this.state.error.toString()}
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => window.location.reload()}
              icon={RefreshCw}
            >
              Reload Page
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={this.handleReset}
            >
              Reset Session & Go to Login
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
