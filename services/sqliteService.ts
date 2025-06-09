import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: number;
}

export class SQLiteService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize() {
    if (Platform.OS === 'web') {
      // For web, we'll use IndexedDB through a simple wrapper
      await this.initializeWebDB();
    } else {
      // For mobile, use SQLite
      await this.initializeSQLite();
    }
  }

  private async initializeSQLite() {
    try {
      this.db = await SQLite.openDatabaseAsync('egarden.db');
      await this.createTables();
    } catch (error) {
      console.error('Failed to initialize SQLite:', error);
    }
  }

  private async initializeWebDB() {
    // For web compatibility, we'll use localStorage as a simple fallback
    // In a production app, you might want to use IndexedDB directly
    console.log('Using localStorage for web compatibility');
  }

  private async createTables() {
    if (!this.db) return;

    const tables = [
      `CREATE TABLE IF NOT EXISTS plants (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        image TEXT,
        commonName TEXT NOT NULL,
        scientificName TEXT,
        plantType TEXT,
        plantingDate INTEGER,
        wateringFrequency INTEGER,
        healthStatus TEXT,
        userNotes TEXT,
        dateAdded INTEGER,
        lastWatered INTEGER,
        lastFertilized INTEGER,
        careInstructions TEXT,
        data TEXT,
        createdAt INTEGER,
        updatedAt INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        plantId TEXT,
        type TEXT,
        title TEXT,
        description TEXT,
        frequency INTEGER,
        nextDue INTEGER,
        isActive INTEGER,
        dateCreated INTEGER,
        data TEXT,
        createdAt INTEGER,
        updatedAt INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS user_settings (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        key TEXT,
        value TEXT,
        createdAt INTEGER,
        updatedAt INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        action TEXT,
        collection TEXT,
        data TEXT,
        timestamp INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS community_posts (
        id TEXT PRIMARY KEY,
        authorId TEXT,
        title TEXT,
        content TEXT,
        category TEXT,
        data TEXT,
        createdAt INTEGER,
        updatedAt INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS market_listings (
        id TEXT PRIMARY KEY,
        sellerId TEXT,
        title TEXT,
        description TEXT,
        category TEXT,
        price REAL,
        data TEXT,
        createdAt INTEGER,
        updatedAt INTEGER
      )`
    ];

    for (const table of tables) {
      await this.db.execAsync(table);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_plants_userId ON plants(userId)',
      'CREATE INDEX IF NOT EXISTS idx_reminders_userId ON reminders(userId)',
      'CREATE INDEX IF NOT EXISTS idx_reminders_plantId ON reminders(plantId)',
      'CREATE INDEX IF NOT EXISTS idx_user_settings_userId ON user_settings(userId)',
      'CREATE INDEX IF NOT EXISTS idx_community_posts_authorId ON community_posts(authorId)',
      'CREATE INDEX IF NOT EXISTS idx_market_listings_sellerId ON market_listings(sellerId)',
    ];

    for (const index of indexes) {
      await this.db.execAsync(index);
    }
  }

  // Generic CRUD operations
  async insert(table: string, data: any): Promise<void> {
    if (Platform.OS === 'web') {
      return this.webInsert(table, data);
    }

    if (!this.db) throw new Error('Database not initialized');

    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => {
      const value = data[col];
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      if (value instanceof Date) {
        return value.getTime();
      }
      return value;
    });

    const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    await this.db.runAsync(sql, values);
  }

  async getById(table: string, id: string): Promise<any> {
    if (Platform.OS === 'web') {
      return this.webGetById(table, id);
    }

    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    return result ? this.parseResult(result) : null;
  }

  async getAll(table: string): Promise<any[]> {
    if (Platform.OS === 'web') {
      return this.webGetAll(table);
    }

    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`SELECT * FROM ${table} ORDER BY createdAt DESC`);
    return results.map(result => this.parseResult(result));
  }

  async getByUserId(table: string, userId: string): Promise<any[]> {
    if (Platform.OS === 'web') {
      return this.webGetByUserId(table, userId);
    }

    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`SELECT * FROM ${table} WHERE userId = ? ORDER BY createdAt DESC`, [userId]);
    return results.map(result => this.parseResult(result));
  }

  async update(table: string, id: string, data: any): Promise<void> {
    if (Platform.OS === 'web') {
      return this.webUpdate(table, id, data);
    }

    if (!this.db) throw new Error('Database not initialized');

    const columns = Object.keys(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const values = columns.map(col => {
      const value = data[col];
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      if (value instanceof Date) {
        return value.getTime();
      }
      return value;
    });

    const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    await this.db.runAsync(sql, [...values, id]);
  }

  async delete(table: string, id: string): Promise<void> {
    if (Platform.OS === 'web') {
      return this.webDelete(table, id);
    }

    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [id]);
  }

  async insertOrUpdate(table: string, data: any): Promise<void> {
    const existing = await this.getById(table, data.id);
    if (existing) {
      await this.update(table, data.id, data);
    } else {
      await this.insert(table, data);
    }
  }

  // Sync queue operations
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (Platform.OS === 'web') {
      const queue = localStorage.getItem('egarden_sync_queue');
      return queue ? JSON.parse(queue) : [];
    }

    if (!this.db) return [];

    const results = await this.db.getAllAsync('SELECT * FROM sync_queue ORDER BY timestamp ASC');
    return results.map(result => ({
      id: (result as any).id as string,
      action: (result as any).action as any,
      collection: (result as any).collection as string,
      data: JSON.parse((result as any).data as string),
      timestamp: (result as any).timestamp as number,
    }));
  }

  async saveSyncQueue(queue: SyncQueueItem[]): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem('egarden_sync_queue', JSON.stringify(queue));
      return;
    }

    if (!this.db) return;

    // Clear existing queue
    await this.db.runAsync('DELETE FROM sync_queue');

    // Insert new queue items
    for (const item of queue) {
      await this.db.runAsync(
        'INSERT INTO sync_queue (id, action, collection, data, timestamp) VALUES (?, ?, ?, ?, ?)',
        [item.id, item.action, item.collection, JSON.stringify(item.data), item.timestamp]
      );
    }
  }

  // Search operations
  async search(table: string, query: string, fields: string[]): Promise<any[]> {
    if (Platform.OS === 'web') {
      const allItems = await this.webGetAll(table);
      return allItems.filter(item => 
        fields.some(field => 
          item[field] && item[field].toLowerCase().includes(query.toLowerCase())
        )
      );
    }

    if (!this.db) return [];

    const whereClause = fields.map(field => `${field} LIKE ?`).join(' OR ');
    const searchParams = fields.map(() => `%${query}%`);
    
    const results = await this.db.getAllAsync(
      `SELECT * FROM ${table} WHERE ${whereClause} ORDER BY createdAt DESC`,
      searchParams
    );
    
    return results.map(result => this.parseResult(result));
  }

  // Utility methods
  private parseResult(result: any): any {
    const parsed = { ...result };
    
    // Convert timestamps back to dates
    if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt);
    if (parsed.updatedAt) parsed.updatedAt = new Date(parsed.updatedAt);
    if (parsed.dateAdded) parsed.dateAdded = new Date(parsed.dateAdded);
    if (parsed.plantingDate) parsed.plantingDate = new Date(parsed.plantingDate);
    if (parsed.lastWatered) parsed.lastWatered = new Date(parsed.lastWatered);
    if (parsed.lastFertilized) parsed.lastFertilized = new Date(parsed.lastFertilized);
    if (parsed.nextDue) parsed.nextDue = new Date(parsed.nextDue);
    if (parsed.dateCreated) parsed.dateCreated = new Date(parsed.dateCreated);

    // Parse JSON data if exists
    if (parsed.data) {
      try {
        const jsonData = JSON.parse(parsed.data);
        Object.assign(parsed, jsonData);
        delete parsed.data;
      } catch (error) {
        console.warn('Failed to parse JSON data:', error);
      }
    }

    return parsed;
  }

  async clearAllData(): Promise<void> {
    if (Platform.OS === 'web') {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('egarden_'));
      keys.forEach(key => localStorage.removeItem(key));
      return;
    }

    if (!this.db) return;

    const tables = ['plants', 'reminders', 'user_settings', 'sync_queue', 'community_posts', 'market_listings'];
    for (const table of tables) {
      await this.db.runAsync(`DELETE FROM ${table}`);
    }
  }

  // Web storage fallback methods
  private async webInsert(table: string, data: any): Promise<void> {
    const key = `egarden_${table}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const index = existing.findIndex((item: any) => item.id === data.id);
    
    if (index >= 0) {
      existing[index] = data;
    } else {
      existing.push(data);
    }
    
    localStorage.setItem(key, JSON.stringify(existing));
  }

  private async webGetById(table: string, id: string): Promise<any> {
    const key = `egarden_${table}`;
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    return items.find((item: any) => item.id === id) || null;
  }

  private async webGetAll(table: string): Promise<any[]> {
    const key = `egarden_${table}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  private async webGetByUserId(table: string, userId: string): Promise<any[]> {
    const items = await this.webGetAll(table);
    return items.filter((item: any) => item.userId === userId);
  }

  private async webUpdate(table: string, id: string, data: any): Promise<void> {
    const key = `egarden_${table}`;
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    const index = items.findIndex((item: any) => item.id === id);
    
    if (index >= 0) {
      items[index] = { ...items[index], ...data };
      localStorage.setItem(key, JSON.stringify(items));
    }
  }

  private async webDelete(table: string, id: string): Promise<void> {
    const key = `egarden_${table}`;
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = items.filter((item: any) => item.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  }
}