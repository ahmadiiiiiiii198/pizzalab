import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`AdminErrorBoundary caught an error in ${this.props.componentName || 'admin component'}:`, error, errorInfo);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 text-red-500">
                <AlertTriangle className="h-full w-full" />
              </div>
              <CardTitle className="text-red-800">
                Admin Panel Error
              </CardTitle>
              <CardDescription className="text-red-600">
                {this.props.componentName 
                  ? `Error in ${this.props.componentName}` 
                  : 'An error occurred in the admin panel'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
                <p className="text-red-700 text-sm mb-2">
                  <strong>Message:</strong> {this.state.error?.message || 'Unknown error occurred'}
                </p>
                {this.state.error?.name && (
                  <p className="text-red-700 text-sm mb-2">
                    <strong>Type:</strong> {this.state.error.name}
                  </p>
                )}
                <p className="text-red-600 text-xs">
                  <strong>Component:</strong> {this.props.componentName || 'Unknown component'}
                </p>
              </div>

              {this.state.error && (
                <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <summary className="cursor-pointer text-gray-700 font-medium">
                    Technical Details (Click to expand)
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Homepage
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500">
                If this error persists, please check the browser console for more details.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
