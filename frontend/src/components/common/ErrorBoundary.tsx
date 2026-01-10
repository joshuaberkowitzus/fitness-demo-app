/**
 * Error Boundary Component (T110)
 * 
 * Catches JavaScript errors in child components and displays a fallback UI.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-fitness-muted mb-4 max-w-md">
            We're sorry for the inconvenience. Please try again or refresh the page.
          </p>
          {this.state.error && (
            <details className="mb-4 text-left w-full max-w-md">
              <summary className="text-fitness-muted cursor-pointer hover:text-white">
                Technical details
              </summary>
              <pre className="mt-2 p-3 bg-fitness-card rounded-lg text-xs text-fitness-danger overflow-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-fitness-primary text-white rounded-lg hover:bg-fitness-primary/90 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-fitness-card text-white rounded-lg hover:bg-fitness-card/80 transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to use with ErrorBoundary for resetting error state
 */
export function useErrorHandler(): (error: Error) => void {
  return (error: Error) => {
    throw error;
  };
}
