import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface ErrorLog {
  id: string;
  timestamp: Date;
  error: Error;
  stack?: string;
  context?: any;
  userId?: string;
  deviceInfo: any;
  appVersion: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PerformanceMetric {
  id: string;
  timestamp: Date;
  type: 'navigation' | 'api' | 'render' | 'memory';
  duration?: number;
  value?: number;
  context?: any;
}

interface UserAction {
  id: string;
  timestamp: Date;
  action: string;
  screen: string;
  userId?: string;
  properties?: any;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private errorLogs: ErrorLog[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private userActions: UserAction[] = [];
  private maxStoredItems = 100;
  private isInitialized = false;

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load persisted logs
      await this.loadPersistedData();
      
      // Set up global error handler
      this.setupGlobalErrorHandler();
      
      // Set up performance monitoring
      this.setupPerformanceMonitoring();
      
      this.isInitialized = true;
      console.log('Monitoring service initialized');
    } catch (error) {
      console.error('Failed to initialize monitoring service:', error);
    }
  }

  // Error Logging
  async logError(
    error: Error,
    context?: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    userId?: string
  ): Promise<void> {
    try {
      const errorLog: ErrorLog = {
        id: this.generateId(),
        timestamp: new Date(),
        error,
        stack: error.stack,
        context,
        userId,
        deviceInfo: this.getDeviceInfo(),
        appVersion: this.getAppVersion(),
        severity,
      };

      this.errorLogs.push(errorLog);
      
      // Keep only recent logs
      if (this.errorLogs.length > this.maxStoredItems) {
        this.errorLogs = this.errorLogs.slice(-this.maxStoredItems);
      }

      // Persist critical errors immediately
      if (severity === 'critical') {
        await this.persistErrorLogs();
      }

      // Log to console in development
      if (__DEV__) {
        console.error(`[${severity.toUpperCase()}] Error logged:`, error, context);
      }

      // Send to external service (if configured)
      await this.sendToExternalService('error', errorLog);

    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  // Performance Monitoring
  logPerformanceMetric(
    type: 'navigation' | 'api' | 'render' | 'memory',
    value: number,
    context?: any
  ): void {
    try {
      const metric: PerformanceMetric = {
        id: this.generateId(),
        timestamp: new Date(),
        type,
        duration: type !== 'memory' ? value : undefined,
        value: type === 'memory' ? value : undefined,
        context,
      };

      this.performanceMetrics.push(metric);
      
      if (this.performanceMetrics.length > this.maxStoredItems) {
        this.performanceMetrics = this.performanceMetrics.slice(-this.maxStoredItems);
      }

      // Warn about poor performance
      if (type === 'navigation' && value > 2000) {
        console.warn(`Slow navigation detected: ${value}ms`);
      } else if (type === 'api' && value > 5000) {
        console.warn(`Slow API call detected: ${value}ms`);
      }

    } catch (error) {
      console.error('Failed to log performance metric:', error);
    }
  }

  // User Action Tracking
  logUserAction(
    action: string,
    screen: string,
    properties?: any,
    userId?: string
  ): void {
    try {
      const userAction: UserAction = {
        id: this.generateId(),
        timestamp: new Date(),
        action,
        screen,
        userId,
        properties,
      };

      this.userActions.push(userAction);
      
      if (this.userActions.length > this.maxStoredItems) {
        this.userActions = this.userActions.slice(-this.maxStoredItems);
      }

    } catch (error) {
      console.error('Failed to log user action:', error);
    }
  }

  // Performance Timing Helper
  startTimer(label: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.logPerformanceMetric('render', duration, { label });
      return duration;
    };
  }

  // API Performance Tracking
  async trackApiCall<T>(
    apiCall: () => Promise<T>,
    endpoint: string,
    method: string = 'GET'
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      
      this.logPerformanceMetric('api', duration, {
        endpoint,
        method,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logPerformanceMetric('api', duration, {
        endpoint,
        method,
        success: false,
      });
      
      await this.logError(error as Error, { endpoint, method }, 'medium');
      throw error;
    }
  }

  // Memory Monitoring
  logMemoryUsage(): void {
    try {
      if (Platform.OS === 'web' && (performance as any).memory) {
        const memory = (performance as any).memory;
        this.logPerformanceMetric('memory', memory.usedJSHeapSize, {
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    } catch (error) {
      console.error('Failed to log memory usage:', error);
    }
  }

  // Crash Detection
  private setupGlobalErrorHandler(): void {
    // React Native global error handler
    const originalHandler = global.ErrorUtils?.getGlobalHandler();
    
    global.ErrorUtils?.setGlobalHandler(async (error: Error, isFatal: boolean) => {
      await this.logError(error, { isFatal }, isFatal ? 'critical' : 'high');
      
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });

    // Promise rejection handler
    if (typeof global !== 'undefined') {
      global.addEventListener?.('unhandledrejection', async (event) => {
        await this.logError(
          new Error(event.reason || 'Unhandled Promise Rejection'),
          { reason: event.reason },
          'high'
        );
      });
    }
  }

  private setupPerformanceMonitoring(): void {
    // Monitor memory usage periodically
    setInterval(() => {
      this.logMemoryUsage();
    }, 30000); // Every 30 seconds
  }

  // Data Persistence
  private async persistErrorLogs(): Promise<void> {
    try {
      await AsyncStorage.setItem('monitoring_errors', JSON.stringify(this.errorLogs));
    } catch (error) {
      console.error('Failed to persist error logs:', error);
    }
  }

  private async persistPerformanceMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem('monitoring_performance', JSON.stringify(this.performanceMetrics));
    } catch (error) {
      console.error('Failed to persist performance metrics:', error);
    }
  }

  private async persistUserActions(): Promise<void> {
    try {
      await AsyncStorage.setItem('monitoring_actions', JSON.stringify(this.userActions));
    } catch (error) {
      console.error('Failed to persist user actions:', error);
    }
  }

  private async loadPersistedData(): Promise<void> {
    try {
      const [errors, performance, actions] = await Promise.all([
        AsyncStorage.getItem('monitoring_errors'),
        AsyncStorage.getItem('monitoring_performance'),
        AsyncStorage.getItem('monitoring_actions'),
      ]);

      if (errors) {
        this.errorLogs = JSON.parse(errors).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }

      if (performance) {
        this.performanceMetrics = JSON.parse(performance).map((metric: any) => ({
          ...metric,
          timestamp: new Date(metric.timestamp),
        }));
      }

      if (actions) {
        this.userActions = JSON.parse(actions).map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp),
        }));
      }

    } catch (error) {
      console.error('Failed to load persisted monitoring data:', error);
    }
  }

  // Data Export and Analysis
  async exportMonitoringData(): Promise<{
    errors: ErrorLog[];
    performance: PerformanceMetric[];
    actions: UserAction[];
    summary: any;
  }> {
    const summary = {
      errorCount: this.errorLogs.length,
      criticalErrors: this.errorLogs.filter(e => e.severity === 'critical').length,
      averageApiResponseTime: this.calculateAverageApiTime(),
      memoryUsage: this.getLatestMemoryUsage(),
      mostCommonErrors: this.getMostCommonErrors(),
      userEngagement: this.calculateUserEngagement(),
    };

    return {
      errors: this.errorLogs,
      performance: this.performanceMetrics,
      actions: this.userActions,
      summary,
    };
  }

  // Analytics Helpers
  private calculateAverageApiTime(): number {
    const apiMetrics = this.performanceMetrics.filter(m => m.type === 'api');
    if (apiMetrics.length === 0) return 0;
    
    const totalTime = apiMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return Math.round(totalTime / apiMetrics.length);
  }

  private getLatestMemoryUsage(): number {
    const memoryMetrics = this.performanceMetrics
      .filter(m => m.type === 'memory')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return memoryMetrics.length > 0 ? memoryMetrics[0].value || 0 : 0;
  }

  private getMostCommonErrors(): Array<{ error: string; count: number }> {
    const errorCounts = new Map<string, number>();
    
    this.errorLogs.forEach(log => {
      const key = log.error.message || log.error.name || 'Unknown Error';
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    });

    return Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private calculateUserEngagement(): {
    sessionsToday: number;
    averageSessionLength: number;
    mostUsedFeatures: Array<{ feature: string; usage: number }>;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayActions = this.userActions.filter(a => a.timestamp >= today);
    const featureCounts = new Map<string, number>();

    todayActions.forEach(action => {
      featureCounts.set(action.action, (featureCounts.get(action.action) || 0) + 1);
    });

    const mostUsedFeatures = Array.from(featureCounts.entries())
      .map(([feature, usage]) => ({ feature, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);

    return {
      sessionsToday: todayActions.length,
      averageSessionLength: 0, // Would need session tracking for this
      mostUsedFeatures,
    };
  }

  // External Service Integration
  private async sendToExternalService(type: string, data: any): Promise<void> {
    // This would integrate with services like Sentry, LogRocket, etc.
    // For now, we'll just log to console in development
    if (__DEV__) {
      console.log(`[Monitoring] ${type}:`, data);
    }
  }

  // Health Check
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: any;
  }> {
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check error rate
    const recentErrors = this.errorLogs.filter(
      e => Date.now() - e.timestamp.getTime() < 24 * 60 * 60 * 1000
    );
    
    if (recentErrors.length > 50) {
      issues.push('High error rate detected');
      status = 'warning';
    }

    const criticalErrors = recentErrors.filter(e => e.severity === 'critical');
    if (criticalErrors.length > 0) {
      issues.push(`${criticalErrors.length} critical errors in last 24h`);
      status = 'critical';
    }

    // Check performance
    const avgApiTime = this.calculateAverageApiTime();
    if (avgApiTime > 3000) {
      issues.push('Slow API response times detected');
      if (status === 'healthy') status = 'warning';
    }

    // Check memory usage
    const memoryUsage = this.getLatestMemoryUsage();
    if (memoryUsage > 100 * 1024 * 1024) { // 100MB
      issues.push('High memory usage detected');
      if (status === 'healthy') status = 'warning';
    }

    return {
      status,
      issues,
      metrics: {
        errorCount: recentErrors.length,
        criticalErrorCount: criticalErrors.length,
        averageApiTime: avgApiTime,
        memoryUsage: memoryUsage,
      },
    };
  }

  // Cleanup
  async cleanup(): Promise<void> {
    try {
      // Persist final data
      await Promise.all([
        this.persistErrorLogs(),
        this.persistPerformanceMetrics(),
        this.persistUserActions(),
      ]);

      // Clear memory
      this.errorLogs = [];
      this.performanceMetrics = [];
      this.userActions = [];

    } catch (error) {
      console.error('Failed to cleanup monitoring service:', error);
    }
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  private getDeviceInfo(): any {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      userAgent: Platform.OS === 'web' ? navigator.userAgent : undefined,
    };
  }

  private getAppVersion(): string {
    // This would typically come from app config
    return '1.0.0';
  }
}

export const monitoringService = MonitoringService.getInstance();
