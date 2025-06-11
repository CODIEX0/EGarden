import { Platform } from 'react-native';
import { database } from '@/config/firebase';
import { ref, set, get, push, remove, update, onValue, off, serverTimestamp } from 'firebase/database';
import { SQLiteService } from './sqliteService';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: number;
}

class DatabaseService {
  private sqliteService: SQLiteService;
  private isOnline: boolean = true;
  private syncQueue: SyncQueueItem[] = [];
  private listeners: Map<string, any> = new Map();

  constructor() {
    this.sqliteService = new SQLiteService();
    this.initializeNetworkListener();
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    await this.sqliteService.initialize();
    await this.loadSyncQueue();
  }

  private initializeNetworkListener() {
    if (Platform.OS !== 'web') {
      NetInfo.addEventListener((state: NetInfoState) => {
        const wasOffline = !this.isOnline;
        this.isOnline = state.isConnected ?? false; // Use null-coalescing to handle `null`
  
        if (wasOffline && this.isOnline) {
          this.processSyncQueue();
        }
      });
    }
  }

  // Generic CRUD operations with offline support
  async create(collection: string, data: any, id?: string): Promise<string> {
    const itemId = id || this.generateId();
    const timestamp = Date.now();
    const itemData = { ...data, id: itemId, createdAt: timestamp, updatedAt: timestamp };

    try {
      // Always save to local SQLite first
      await this.sqliteService.insert(collection, itemData);

      if (this.isOnline) {
        // Try to sync to Firebase immediately
        const dbRef = ref(database, `${collection}/${itemId}`);
        await set(dbRef, { ...itemData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      } else {
        // Add to sync queue for later
        await this.addToSyncQueue('create', collection, itemData);
      }

      return itemId;
    } catch (error) {
      console.error('Create operation failed:', error);
      // If Firebase fails but SQLite succeeds, add to sync queue
      if (this.isOnline) {
        await this.addToSyncQueue('create', collection, itemData);
      }
      return itemId;
    }
  }

  async read(collection: string, id?: string): Promise<any> {
    try {
      if (this.isOnline && id) {
        // Try Firebase first for single item
        const dbRef = ref(database, `${collection}/${id}`);
        const snapshot = await get(dbRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          // Update local cache
          await this.sqliteService.insertOrUpdate(collection, data);
          return data;
        }
      }

      // Fallback to SQLite
      if (id) {
        return await this.sqliteService.getById(collection, id);
      } else {
        return await this.sqliteService.getAll(collection);
      }
    } catch (error) {
      console.error('Read operation failed:', error);
      // Always fallback to SQLite
      if (id) {
        return await this.sqliteService.getById(collection, id);
      } else {
        return await this.sqliteService.getAll(collection);
      }
    }
  }

  async update(collection: string, id: string, data: any): Promise<void> {
    const timestamp = Date.now();
    const updateData = { ...data, updatedAt: timestamp };

    try {
      // Update SQLite first
      await this.sqliteService.update(collection, id, updateData);

      if (this.isOnline) {
        // Try to sync to Firebase
        const dbRef = ref(database, `${collection}/${id}`);
        await update(dbRef, { ...updateData, updatedAt: serverTimestamp() });
      } else {
        // Add to sync queue
        await this.addToSyncQueue('update', collection, { id, ...updateData });
      }
    } catch (error) {
      console.error('Update operation failed:', error);
      if (this.isOnline) {
        await this.addToSyncQueue('update', collection, { id, ...updateData });
      }
    }
  }

  async delete(collection: string, id: string): Promise<void> {
    try {
      // Delete from SQLite first
      await this.sqliteService.delete(collection, id);

      if (this.isOnline) {
        // Try to delete from Firebase
        const dbRef = ref(database, `${collection}/${id}`);
        await remove(dbRef);
      } else {
        // Add to sync queue
        await this.addToSyncQueue('delete', collection, { id });
      }
    } catch (error) {
      console.error('Delete operation failed:', error);
      if (this.isOnline) {
        await this.addToSyncQueue('delete', collection, { id });
      }
    }
  }

  // Real-time listeners
  subscribe(collection: string, callback: (data: any) => void, id?: string): () => void {
    const path = id ? `${collection}/${id}` : collection;
    const dbRef = ref(database, path);
    
    const unsubscribe = () => {
      off(dbRef);
      this.listeners.delete(path);
    };

    if (this.isOnline) {
      onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Update local cache
          if (id) {
            this.sqliteService.insertOrUpdate(collection, data);
          } else {
            // Handle collection updates
            Object.values(data).forEach((item: any) => {
              this.sqliteService.insertOrUpdate(collection, item);
            });
          }
        }
        callback(data);
      });

      this.listeners.set(path, unsubscribe);
    } else {
      // Return local data when offline
      this.read(collection, id).then(callback);
    }

    return unsubscribe;
  }

  // Sync queue management
  private async addToSyncQueue(action: 'create' | 'update' | 'delete', collection: string, data: any) {
    const queueItem: SyncQueueItem = {
      id: this.generateId(),
      action,
      collection,
      data,
      timestamp: Date.now(),
    };

    this.syncQueue.push(queueItem);
    await this.saveSyncQueue();
  }

  private async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of queue) {
      try {
        switch (item.action) {
          case 'create':
            const dbRef = ref(database, `${item.collection}/${item.data.id}`);
            await set(dbRef, { ...item.data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
            break;
          case 'update':
            const updateRef = ref(database, `${item.collection}/${item.data.id}`);
            await update(updateRef, { ...item.data, updatedAt: serverTimestamp() });
            break;
          case 'delete':
            const deleteRef = ref(database, `${item.collection}/${item.data.id}`);
            await remove(deleteRef);
            break;
        }
      } catch (error) {
        console.error('Sync failed for item:', item, error);
        // Re-add failed items to queue
        this.syncQueue.push(item);
      }
    }

    await this.saveSyncQueue();
  }

  private async loadSyncQueue() {
    try {
      const queue = await this.sqliteService.getSyncQueue();
      this.syncQueue = queue || [];
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private async saveSyncQueue() {
    try {
      await this.sqliteService.saveSyncQueue(this.syncQueue);
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Plant-specific methods
  async getPlantsByUser(userId: string): Promise<any[]> {
    try {
      if (this.isOnline) {
        const dbRef = ref(database, 'plants');
        const snapshot = await get(dbRef);
        
        if (snapshot.exists()) {
          const plants = Object.values(snapshot.val()).filter((plant: any) => plant.userId === userId);
          // Cache locally
          for (const plant of plants) {
            await this.sqliteService.insertOrUpdate('plants', plant);
          }
          return plants;
        }
      }

      // Fallback to local data
      return await this.sqliteService.getByUserId('plants', userId);
    } catch (error) {
      console.error('Failed to get plants:', error);
      return await this.sqliteService.getByUserId('plants', userId);
    }
  }

  async getRemindersForUser(userId: string): Promise<any[]> {
    try {
      if (this.isOnline) {
        const dbRef = ref(database, 'reminders');
        const snapshot = await get(dbRef);
        
        if (snapshot.exists()) {
          const reminders = Object.values(snapshot.val()).filter((reminder: any) => reminder.userId === userId);
          // Cache locally
          for (const reminder of reminders) {
            await this.sqliteService.insertOrUpdate('reminders', reminder);
          }
          return reminders;
        }
      }

      return await this.sqliteService.getByUserId('reminders', userId);
    } catch (error) {
      console.error('Failed to get reminders:', error);
      return await this.sqliteService.getByUserId('reminders', userId);
    }
  }

  // Batch operations
  async batchWrite(operations: Array<{ action: 'create' | 'update' | 'delete', collection: string, id?: string, data?: any }>) {
    const results = [];
    
    for (const op of operations) {
      try {
        switch (op.action) {
          case 'create':
            const id = await this.create(op.collection, op.data, op.id);
            results.push({ success: true, id });
            break;
          case 'update':
            await this.update(op.collection, op.id!, op.data);
            results.push({ success: true, id: op.id });
            break;
          case 'delete':
            await this.delete(op.collection, op.id!);
            results.push({ success: true, id: op.id });
            break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ success: false, error: errorMessage, id: op.id });
      }
    }
    
    return results;
  }

  // Data export/import for backup
  async exportUserData(userId: string): Promise<any> {
    const plants = await this.sqliteService.getByUserId('plants', userId);
    const reminders = await this.sqliteService.getByUserId('reminders', userId);
    const settings = await this.sqliteService.getByUserId('user_settings', userId);
    
    return {
      plants,
      reminders,
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  async importUserData(userId: string, data: any): Promise<void> {
    const operations = [];
    
    // Import plants
    if (data.plants) {
      for (const plant of data.plants) {
        operations.push({ action: 'create', collection: 'plants', data: { ...plant, userId } });
      }
    }
    
    // Import reminders
    if (data.reminders) {
      for (const reminder of data.reminders) {
        operations.push({ action: 'create', collection: 'reminders', data: { ...reminder, userId } });
      }
    }
    
    await this.batchWrite(operations as any);
  }

  // Connection status
  getConnectionStatus(): boolean {
    return this.isOnline;
  }

  // Force sync
  async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.processSyncQueue();
    }
  }

  // Clear local cache
  async clearLocalCache(): Promise<void> {
    await this.sqliteService.clearAllData();
    this.syncQueue = [];
    await this.saveSyncQueue();
  }

  // Convenience methods for backward compatibility
  async getAll(collection: string): Promise<any[]> {
    return await this.read(collection);
  }

  async getById(collection: string, id: string): Promise<any> {
    return await this.read(collection, id);
  }

  async getDocument(path: string): Promise<any> {
    const parts = path.split('/');
    if (parts.length === 2) {
      return await this.getById(parts[0], parts[1]);
    }
    return null;
  }
}

export const databaseService = new DatabaseService();