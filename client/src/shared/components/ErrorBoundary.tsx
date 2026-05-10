/**
 * Module Error Boundary — Wraps every lazy-loaded module
 *
 * Catches rendering errors and displays a fallback UI with retry.
 * Every lazy route MUST be wrapped in this — no exceptions.
 */
import React, { Component, type ReactNode } from 'react';

interface Props {
  moduleName: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ModuleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to monitoring service (future enhancement)
    console.error(`[${this.props.moduleName}] Error:`, error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="card p-8 max-w-md w-full text-center animate-fade-in">
            {/* Error icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h2 className="text-lg font-semibold text-neutral-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-neutral-500 mb-1">
              The <span className="font-medium">{this.props.moduleName}</span> module encountered an
              error.
            </p>
            <p className="text-xs text-neutral-400 mb-6 font-mono">
              {this.state.error?.message || 'Unknown error'}
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="btn-primary"
                id={`retry-${this.props.moduleName.toLowerCase()}`}
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="btn-secondary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
