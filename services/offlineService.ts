import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { performanceService } from './performanceService';
import { monitoringService } from './monitoringService';

interface QueuedAction {
  id: string;
  timestamp: Date;
  action: string;
  data: any;
  endpoint?: string;
  method?: string;
  retries: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high';
}

interface OfflineData {
  key: string;
  data: any;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
}

export class OfflineService {
  private static instance: OfflineService;
  private isOnline: boolean = true;
  private actionQueue: QueuedAction[] = [];
  private offlineData: Map<string, OfflineData> = new Map();
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private syncInProgress: boolean = false;
  private maxQueueSize = 1000;
  private defaultTTL = 24 * 60 * 60 * 1000; // 24 hours

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Load persisted queue and data
      await this.loadPersistedData();
      
      // Set up network monitoring
      this.setupNetworkMonitoring();
      
      // Clean up expired data
      this.cleanupExpiredData();
      
      console.log('Offline service initialized');
    } catch (error) {
      console.error('Failed to initialize offline service:', error);
      monitoringService.logError(error as Error, { context: 'offline_service_init' });
    }
  }

  // Network Status Management
  private setupNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // Notify listeners of network status change
      this.listeners.forEach(listener => listener(this.isOnline));
      
      // If we just came back online, sync queued actions
      if (!wasOnline && this.isOnline) {
        this.syncQueuedActions();
      }
      
      monitoringService.logUserAction('network_status_change', 'system', {
        isOnline: this.isOnline,
        connectionType: state.type,
      });
    });
  }

  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  onNetworkStatusChange(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Action Queue Management
  async queueAction(
    action: string,
    data: any,
    options: {
      endpoint?: string;
      method?: string;
      priority?: 'low' | 'normal' | 'high';
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    try {
      const queuedAction: QueuedAction = {
        id: this.generateId(),
        timestamp: new Date(),
        action,
        data,
        endpoint: options.endpoint,
        method: options.method || 'POST',
        retries: 0,
        maxRetries: options.maxRetries || 3,
        priority: options.priority || 'normal',
      };

      // Add to queue based on priority
      if (options.priority === 'high') {
        this.actionQueue.unshift(queuedAction);
      } else {
        this.actionQueue.push(queuedAction);
      }

      // Maintain queue size limit
      if (this.actionQueue.length > this.maxQueueSize) {
        const removed = this.actionQueue.splice(0, this.actionQueue.length - this.maxQueueSize);
        console.warn(`Removed ${removed.length} actions from queue due to size limit`);
      }

      // Persist queue
      await this.persistActionQueue();

      // Try to sync immediately if online
      if (this.isOnline) {
        this.syncQueuedActions();
      }

      return queuedAction.id;
    } catch (error) {
      console.error('Failed to queue action:', error);
      throw error;
    }
  }

  private async syncQueuedActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.actionQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    const timer = performanceService.startPerformanceTimer('offline_sync');

    try {
      const actionsToSync = [...this.actionQueue];
      const syncResults = await Promise.allSettled(
        actionsToSync.map(action => this.syncAction(action))
      );

      let successCount = 0;
      let failureCount = 0;

      syncResults.forEach((result, index) => {
        const action = actionsToSync[index];
        
        if (result.status === 'fulfilled') {
          // Remove successful action from queue
          this.actionQueue = this.actionQueue.filter(a => a.id !== action.id);
          successCount++;
        } else {
          // Increment retry count for failed action
          const queuedAction = this.actionQueue.find(a => a.id === action.id);
          if (queuedAction) {
            queuedAction.retries++;
            
            // Remove if max retries reached
            if (queuedAction.retries >= queuedAction.maxRetries) {
              this.actionQueue = this.actionQueue.filter(a => a.id !== action.id);
              console.warn(`Action ${action.id} removed after ${queuedAction.retries} retries`);
            }
          }
          failureCount++;
        }
      });

      // Persist updated queue
      await this.persistActionQueue();

      timer();
      console.log(`Sync completed: ${successCount} success, ${failureCount} failures`);

    } catch (error) {
      console.error('Failed to sync queued actions:', error);
      monitoringService.logError(error as Error, { context: 'offline_sync' });
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncAction(action: QueuedAction): Promise<void> {
    // This would integrate with your actual API service
    // For demo purposes, we'll simulate the sync
    
    if (action.endpoint) {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      
      // Simulate occasional failures for testing
      if (Math.random() < 0.1) {
        throw new Error(`Sync failed for action ${action.id}`);
      }
    }
    
    console.log(`Successfully synced action: ${action.action}`);
  }

  // Offline Data Storage
  async storeOfflineData(
    key: string,
    data: any,
    ttl: number = this.defaultTTL
  ): Promise<void> {
    try {
      const offlineData: OfflineData = {
        key,
        data,
        timestamp: new Date(),
        ttl,
      };

      this.offlineData.set(key, offlineData);
      await this.persistOfflineData();
      
    } catch (error) {
      console.error('Failed to store offline data:', error);
      throw error;
    }
  }

  async getOfflineData<T>(key: string): Promise<T | null> {
    try {
      const data = this.offlineData.get(key);
      
      if (!data) {
        return null;
      }

      // Check if data has expired
      if (Date.now() - data.timestamp.getTime() > data.ttl) {
        this.offlineData.delete(key);
        await this.persistOfflineData();
        return null;
      }

      return data.data as T;
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  }

  async removeOfflineData(key: string): Promise<void> {
    try {
      this.offlineData.delete(key);
      await this.persistOfflineData();
    } catch (error) {
      console.error('Failed to remove offline data:', error);
      throw error;
    }
  }

  // Smart Caching with Offline Support
  async getCachedOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: {
      ttl?: number;
      forceRefresh?: boolean;
      fallbackToCache?: boolean;
    } = {}
  ): Promise<T> {
    const { ttl = this.defaultTTL, forceRefresh = false, fallbackToCache = true } = options;

    try {
      // Try to get cached data first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = await this.getOfflineData<T>(key);
        if (cachedData !== null) {
          return cachedData;
        }
      }

      // If online, try to fetch fresh data
      if (this.isOnline) {
        try {
          const freshData = await fetchFn();
          await this.storeOfflineData(key, freshData, ttl);
          return freshData;
        } catch (fetchError) {
          // If fetch fails but we have cached data and fallback is enabled
          if (fallbackToCache) {
            const cachedData = await this.getOfflineData<T>(key);
            if (cachedData !== null) {
              console.warn('Using cached data due to fetch error:', fetchError);
              return cachedData;
            }
          }
          throw fetchError;
        }
      } else {
        // Offline: try to get cached data
        const cachedData = await this.getOfflineData<T>(key);
        if (cachedData !== null) {
          return cachedData;
        }
        
        throw new Error('No cached data available while offline');
      }
    } catch (error) {
      console.error(`Failed to get cached or fetch data for key ${key}:`, error);
      throw error;
    }
  }

  // Data Persistence
  private async persistActionQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_queue', JSON.stringify(this.actionQueue));
    } catch (error) {
      console.error('Failed to persist action queue:', error);
    }
  }

  private async persistOfflineData(): Promise<void> {
    try {
      const dataArray = Array.from(this.offlineData.entries()).map(([key, data]) => ({
        key,
        ...data,
        timestamp: data.timestamp.toISOString(),
      }));
      
      await AsyncStorage.setItem('offline_data', JSON.stringify(dataArray));
    } catch (error) {
      console.error('Failed to persist offline data:', error);
    }
  }

  private async loadPersistedData(): Promise<void> {
    try {
      const [queueData, offlineData] = await Promise.all([
        AsyncStorage.getItem('offline_queue'),
        AsyncStorage.getItem('offline_data'),
      ]);

      if (queueData) {
        this.actionQueue = JSON.parse(queueData).map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp),
        }));
      }

      if (offlineData) {
        const dataArray = JSON.parse(offlineData);
        dataArray.forEach((item: any) => {
          this.offlineData.set(item.key, {
            key: item.key,
            data: item.data,
            timestamp: new Date(item.timestamp),
            ttl: item.ttl,
          });
        });
      }

    } catch (error) {
      console.error('Failed to load persisted offline data:', error);
    }
  }

  // Cleanup and Maintenance
  private cleanupExpiredData(): void {
    const now = Date.now();
    
    // Clean up expired offline data
    for (const [key, data] of this.offlineData.entries()) {
      if (now - data.timestamp.getTime() > data.ttl) {
        this.offlineData.delete(key);
      }
    }

    // Clean up old failed actions (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.actionQueue = this.actionQueue.filter(
      action => action.timestamp > sevenDaysAgo
    );

    // Schedule periodic cleanup
    setTimeout(() => this.cleanupExpiredData(), 60 * 60 * 1000); // Every hour
  }

  // Statistics and Monitoring
  getOfflineStats(): {
    queueLength: number;
    cacheSize: number;
    isOnline: boolean;
    syncInProgress: boolean;
  } {
    return {
      queueLength: this.actionQueue.length,
      cacheSize: this.offlineData.size,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
    };
  }

  // Force sync (for manual retry)
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.syncQueuedActions();
    } else {
      throw new Error('Cannot sync while offline');
    }
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    try {
      this.actionQueue = [];
      this.offlineData.clear();
      
      await Promise.all([
        AsyncStorage.removeItem('offline_queue'),
        AsyncStorage.removeItem('offline_data'),
      ]);
      
      console.log('All offline data cleared');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}

export const offlineService = OfflineService.getInstance();
