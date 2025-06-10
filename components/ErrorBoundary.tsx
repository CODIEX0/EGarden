import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { monitoringService } from '@/services/monitoringService';
import { Colors } from '@/constants/Colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    monitoringService.logError(error, errorInfo, 'critical');

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="warning" size={64} color={Colors.error} />
            
            <Text style={styles.title}>Something went wrong</Text>
            
            <Text style={styles.message}>
              We're sorry, but something unexpected happened. The error has been logged and we'll work to fix it.
            </Text>

            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Ionicons name="refresh" size={20} color={Colors.white} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.detailsButton} onPress={this.toggleDetails}>
              <Text style={styles.detailsButtonText}>
                {this.state.showDetails ? 'Hide Details' : 'Show Details'}
              </Text>
              <Ionicons 
                name={this.state.showDetails ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={Colors.textSecondary} 
              />
            </TouchableOpacity>

            {this.state.showDetails && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>
                  {this.state.error?.name}: {this.state.error?.message}
                </Text>
                
                {this.state.error?.stack && (
                  <>
                    <Text style={styles.errorTitle}>Stack Trace:</Text>
                    <Text style={styles.errorText}>{this.state.error.stack}</Text>
                  </>
                )}
                
                {this.state.errorInfo?.componentStack && (
                  <>
                    <Text style={styles.errorTitle}>Component Stack:</Text>
                    <Text style={styles.errorText}>{this.state.errorInfo.componentStack}</Text>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailsButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginRight: 4,
  },
  errorDetails: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 5,
    marginTop: 10,
  },
  errorText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for handling async errors
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: any) => {
    monitoringService.logError(error, context, 'medium');
    
    // In development, log to console
    if (__DEV__) {
      console.error('Async error handled:', error, context);
    }
  }, []);

  return handleError;
}
