import React, { ReactNode, ReactElement } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactElement;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches errors in child components and displays a fallback UI
 * Prevents entire app from crashing due to component errors
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development
    console.error("Error Boundary caught an error:", error);
    console.error("Error Info:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="max-w-md w-full px-4 py-8 space-y-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Something went wrong
                </h1>
                <p className="text-muted-foreground mb-4">
                  An unexpected error occurred. Please try refreshing the page.
                </p>
                {process.env.NODE_ENV === "development" && (
                  <details className="mt-4 text-left bg-muted p-3 rounded text-sm text-muted-foreground">
                    <summary className="cursor-pointer font-semibold mb-2">
                      Error details (development only)
                    </summary>
                    <pre className="overflow-auto max-h-40 whitespace-pre-wrap break-words">
                      {this.state.error?.message}
                      {"\n\n"}
                      {this.state.error?.stack}
                    </pre>
                  </details>
                )}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
