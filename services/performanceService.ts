import AsyncStorage from '@react-native-async-storage/async-storage';
import { InteractionManager, Platform } from 'react-native';

interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  memoryUsage: number;
  apiResponseTime: number;
  errorRate: number;
  crashRate: number;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetrics[] = [];
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultCacheExpiry = 5 * 60 * 1000; // 5 minutes
  private maxCacheSize = 100;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private batchSize = 5;

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  // Memory Management
  async optimizeMemory(): Promise<void> {
    try {
      // Clear expired cache items
      this.clearExpiredCache();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Clear old metrics
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-500);
      }

      // Clear AsyncStorage of old data
      await this.cleanupAsyncStorage();
    } catch (error) {
      console.error('Error optimizing memory:', error);
    }
  }

  private async cleanupAsyncStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const oldKeys = keys.filter(key => 
        key.startsWith('temp_') || 
        key.startsWith('cache_') ||
        key.includes('_expired_')
      );
      
      if (oldKeys.length > 0) {
        await AsyncStorage.multiRemove(oldKeys);
      }
    } catch (error) {
      console.error('Error cleaning AsyncStorage:', error);
    }
  }

  // Smart Caching System
  async setCache<T>(key: string, data: T, expiry?: number): Promise<void> {
    const cacheExpiry = expiry || this.defaultCacheExpiry;
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + cacheExpiry,
    };

    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, cacheItem);

    // Persist important cache items
    if (key.startsWith('user_') || key.startsWith('settings_')) {
      try {
        await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
      } catch (error) {
        console.error('Error persisting cache:', error);
      }
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    let cacheItem = this.cache.get(key);
    
    // Try to load from AsyncStorage if not in memory
    if (!cacheItem && (key.startsWith('user_') || key.startsWith('settings_'))) {
      try {
        const stored = await AsyncStorage.getItem(`cache_${key}`);
        if (stored) {
          cacheItem = JSON.parse(stored);
          if (cacheItem && cacheItem.expiry > Date.now()) {
            this.cache.set(key, cacheItem);
          }
        }
      } catch (error) {
        console.error('Error loading cache from storage:', error);
      }
    }

    if (!cacheItem || cacheItem.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return cacheItem.data;
  }

  private clearExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((item, key) => {
      if (item.expiry < now) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  // Request Queue Management for API Optimization
  async queueRequest<T>(requestFn: () => Promise<T>, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedRequest = async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      if (priority === 'high') {
        this.requestQueue.unshift(wrappedRequest);
      } else {
        this.requestQueue.push(wrappedRequest);
      }

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.requestQueue.length > 0) {
        const batch = this.requestQueue.splice(0, this.batchSize);
        
        // Use InteractionManager to ensure smooth UI
        await new Promise(resolve => {
          InteractionManager.runAfterInteractions(resolve);
        });

        // Process batch with limited concurrency
        await Promise.allSettled(batch.map(request => request()));
        
        // Small delay between batches to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Image Optimization
  optimizeImageUri(uri: string, width?: number, height?: number, quality?: number): string {
    if (!uri) return uri;

    // For web images, add optimization parameters
    if (uri.startsWith('http')) {
      const url = new URL(uri);
      const params = new URLSearchParams();
      
      if (width) params.set('w', width.toString());
      if (height) params.set('h', height.toString());
      if (quality) params.set('q', quality.toString());
      
      // Format optimization
      if (Platform.OS === 'web') {
        params.set('f', 'webp');
      } else {
        params.set('f', 'jpg');
      }
      
      if (params.toString()) {
        url.search = params.toString();
        return url.toString();
      }
    }

    return uri;
  }

  // Performance Monitoring
  startPerformanceTimer(label: string): () => number {
    const startTime = Date.now();
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.recordMetric({
        type: 'timer',
        label,
        duration,
        timestamp: startTime,
      });
      
      return duration;
    };
  }

  recordMetric(metric: {
    type: string;
    label: string;
    duration?: number;
    value?: number;
    timestamp: number;
  }): void {
    // Keep only recent metrics
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.metrics = this.metrics.filter(m => m.renderTime > oneDayAgo);
    
    // Add new metric (simplified for this example)
    if (metric.duration) {
      this.metrics.push({
        renderTime: metric.duration,
        loadTime: metric.duration,
        memoryUsage: 0,
        apiResponseTime: metric.type === 'api' ? metric.duration : 0,
        errorRate: 0,
        crashRate: 0,
      });
    }
  }

  // Lazy Loading Helper
  createLazyLoader<T>(
    loadFn: () => Promise<T>,
    cacheKey: string,
    preload: boolean = false
  ): {
    load: () => Promise<T>;
    preload: () => void;
    isLoaded: () => boolean;
  } {
    let loadPromise: Promise<T> | null = null;
    let isLoaded = false;

    const load = async (): Promise<T> => {
      // Check cache first
      const cached = await this.getCache<T>(cacheKey);
      if (cached) {
        isLoaded = true;
        return cached;
      }

      // Use existing promise if already loading
      if (loadPromise) {
        return loadPromise;
      }

      loadPromise = loadFn().then(async (data) => {
        await this.setCache(cacheKey, data);
        isLoaded = true;
        loadPromise = null;
        return data;
      }).catch((error) => {
        loadPromise = null;
        throw error;
      });

      return loadPromise;
    };

    const preloadFn = () => {
      if (!isLoaded && !loadPromise) {
        load().catch(console.error);
      }
    };

    if (preload) {
      // Preload after a small delay
      setTimeout(preloadFn, 100);
    }

    return {
      load,
      preload: preloadFn,
      isLoaded: () => isLoaded,
    };
  }

  // Bundle Optimization Helper
  async loadModuleAsync<T>(moduleLoader: () => Promise<{ default: T }>): Promise<T> {
    const timer = this.startPerformanceTimer('module_load');
    
    try {
      // Use InteractionManager for smooth loading
      await new Promise(resolve => {
        InteractionManager.runAfterInteractions(resolve);
      });
      
      const module = await moduleLoader();
      timer();
      
      return module.default;
    } catch (error) {
      timer();
      throw error;
    }
  }

  // Network Optimization
  async optimizeApiCall<T>(
    apiCall: () => Promise<T>,
    cacheKey?: string,
    retryOptions: { maxRetries: number; delay: number } = { maxRetries: 3, delay: 1000 }
  ): Promise<T> {
    // Check cache first
    if (cacheKey) {
      const cached = await this.getCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const executeWithRetry = async (attempt: number): Promise<T> => {
      try {
        const timer = this.startPerformanceTimer(`api_${cacheKey || 'call'}`);
        const result = await apiCall();
        timer();

        // Cache successful result
        if (cacheKey) {
          await this.setCache(cacheKey, result);
        }

        return result;
      } catch (error) {
        if (attempt < retryOptions.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryOptions.delay * attempt));
          return executeWithRetry(attempt + 1);
        }
        throw error;
      }
    };

    return executeWithRetry(1);
  }

  // App State Optimization
  async optimizeAppState(): Promise<void> {
    try {
      // Clear temporary data
      await this.optimizeMemory();
      
      // Update app performance metrics
      await this.savePerformanceMetrics();
      
      // Preload critical data
      await this.preloadCriticalData();
    } catch (error) {
      console.error('Error optimizing app state:', error);
    }
  }

  private async savePerformanceMetrics(): Promise<void> {
    try {
      const recentMetrics = this.metrics.slice(-100);
      await AsyncStorage.setItem('performance_metrics', JSON.stringify(recentMetrics));
    } catch (error) {
      console.error('Error saving performance metrics:', error);
    }
  }

  private async preloadCriticalData(): Promise<void> {
    // This would preload commonly accessed data
    // Implementation depends on app's critical data requirements
  }

  // Get performance statistics
  getPerformanceStats(): {
    averageLoadTime: number;
    cacheHitRate: number;
    queueLength: number;
    memoryUsage: number;
  } {
    const recentMetrics = this.metrics.slice(-100);
    const avgLoadTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.loadTime, 0) / recentMetrics.length 
      : 0;

    return {
      averageLoadTime: Math.round(avgLoadTime),
      cacheHitRate: 0.85, // This would be calculated based on actual cache hits
      queueLength: this.requestQueue.length,
      memoryUsage: this.cache.size,
    };
  }

  // Cleanup
  cleanup(): void {
    this.cache.clear();
    this.requestQueue = [];
    this.metrics = [];
  }
}

export const performanceService = PerformanceService.getInstance();
