import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

interface CacheItem {
  uri: string;
  timestamp: number;
  size: number;
}

class ImageCacheService {
  private cache: Map<string, CacheItem> = new Map();
  private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private cacheDir: string = '';

  async initialize() {
    if (Platform.OS !== 'web') {
      this.cacheDir = `${FileSystem.cacheDirectory}images/`;
      await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      await this.loadCacheIndex();
      await this.cleanupExpiredCache();
    }
  }

  async getCachedImage(uri: string): Promise<string> {
    if (Platform.OS === 'web') {
      return uri; // No caching on web, return original URI
    }

    const cacheKey = await this.generateCacheKey(uri);
    const cachedItem = this.cache.get(cacheKey);

    if (cachedItem && this.isCacheValid(cachedItem)) {
      const exists = await FileSystem.getInfoAsync(cachedItem.uri);
      if (exists.exists) {
        return cachedItem.uri;
      }
    }

    // Download and cache the image
    return await this.downloadAndCache(uri, cacheKey);
  }

  private async generateCacheKey(uri: string): Promise<string> {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.MD5,
      uri
    );
    return hash;
  }

  private async downloadAndCache(uri: string, cacheKey: string): Promise<string> {
    try {
      const fileExtension = this.getFileExtension(uri);
      const localUri = `${this.cacheDir}${cacheKey}${fileExtension}`;

      const downloadResult = await FileSystem.downloadAsync(uri, localUri);
      
      if (downloadResult.status === 200) {
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        const cacheItem: CacheItem = {
          uri: localUri,
          timestamp: Date.now(),
          size: fileInfo.size || 0,
        };

        this.cache.set(cacheKey, cacheItem);
        await this.saveCacheIndex();
        await this.ensureCacheSize();

        return localUri;
      }
    } catch (error) {
      console.warn('Failed to cache image:', error);
    }

    return uri; // Return original URI if caching fails
  }

  private getFileExtension(uri: string): string {
    const match = uri.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i);
    return match ? `.${match[1].toLowerCase()}` : '.jpg';
  }

  private isCacheValid(item: CacheItem): boolean {
    return Date.now() - item.timestamp < this.CACHE_DURATION;
  }

  private async ensureCacheSize() {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, item) => sum + item.size, 0);

    if (totalSize > this.MAX_CACHE_SIZE) {
      await this.cleanupOldestCache();
    }
  }

  private async cleanupOldestCache() {
    const sortedItems = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    const itemsToRemove = sortedItems.slice(0, Math.ceil(sortedItems.length * 0.3));

    for (const [key, item] of itemsToRemove) {
      try {
        await FileSystem.deleteAsync(item.uri, { idempotent: true });
        this.cache.delete(key);
      } catch (error) {
        console.warn('Failed to delete cached file:', error);
      }
    }

    await this.saveCacheIndex();
  }

  private async cleanupExpiredCache() {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (!this.isCacheValid(item)) {
        expiredKeys.push(key);
        try {
          await FileSystem.deleteAsync(item.uri, { idempotent: true });
        } catch (error) {
          console.warn('Failed to delete expired cache:', error);
        }
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      await this.saveCacheIndex();
    }
  }

  private async loadCacheIndex() {
    try {
      const indexPath = `${this.cacheDir}index.json`;
      const exists = await FileSystem.getInfoAsync(indexPath);
      
      if (exists.exists) {
        const indexContent = await FileSystem.readAsStringAsync(indexPath);
        const indexData = JSON.parse(indexContent);
        
        for (const [key, item] of Object.entries(indexData)) {
          this.cache.set(key, item as CacheItem);
        }
      }
    } catch (error) {
      console.warn('Failed to load cache index:', error);
    }
  }

  private async saveCacheIndex() {
    try {
      const indexPath = `${this.cacheDir}index.json`;
      const indexData = Object.fromEntries(this.cache);
      await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(indexData));
    } catch (error) {
      console.warn('Failed to save cache index:', error);
    }
  }

  async clearCache() {
    try {
      if (Platform.OS !== 'web') {
        await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }
      this.cache.clear();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  getCacheStats() {
    const totalItems = this.cache.size;
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, item) => sum + item.size, 0);

    return {
      totalItems,
      totalSize,
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      maxSizeMB: this.MAX_CACHE_SIZE / (1024 * 1024),
    };
  }
}

export const imageCacheService = new ImageCacheService();
