import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      
      try {
        // Check if it's a Firestore error JSON
        if (this.state.error?.message.startsWith('{')) {
          const errData = JSON.parse(this.state.error.message);
          if (errData.error === "Missing or insufficient permissions.") {
            errorMessage = "You don't have permission to perform this action. Please make sure you are logged in.";
          }
        }
      } catch (e) {
        // Fallback to default message
      }

      return (
        <div className="min-h-screen bg-ng-dark flex items-center justify-center p-4">
          <div className="forum-container max-w-md w-full rounded-lg overflow-hidden shadow-2xl">
            <div className="glossy-blue p-4 flex items-center gap-3">
              <AlertCircle className="text-white w-6 h-6" />
              <h2 className="text-white font-bold uppercase tracking-widest">System Error</h2>
            </div>
            <div className="p-8 bg-ng-dark/95 flex flex-col items-center text-center gap-6">
              <p className="text-gray-400 text-sm leading-relaxed">
                {errorMessage}
              </p>
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-6 py-3 glossy-blue text-white font-bold uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
