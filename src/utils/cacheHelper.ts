import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt?: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  oldestEntry: number;
  newestEntry: number;
}

export class CacheHelper {
  private readonly prefix: string;
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(
    prefix: string = '@cache',
    defaultTTL: number = 24 * 60 * 60 * 1000, // 24 hours
    maxSize: number = 50 * 1024 * 1024, // 50MB
  ) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  // Store data in cache with metadata
  async set(key: string, data: any, ttl?: number): Promise<boolean> {
    try {
      const now = Date.now();
      const expiresAt = ttl ? now + ttl : now + this.defaultTTL;
      const serializedData = JSON.stringify(data);

      const entry: CacheEntry = {
        data,
        timestamp: now,
        expiresAt,
        size: serializedData.length,
        accessCount: 0,
        lastAccessed: now,
      };

      // Check if we need to free up space
      await this.ensureSpace(entry.size);

      await AsyncStorage.setItem(this.getKey(key), JSON.stringify(entry));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Get data from cache
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(this.getKey(key));

      if (!cached) {
        this.misses++;
        return null;
      }

      const entry: CacheEntry = JSON.parse(cached);
      const now = Date.now();

      // Check if expired
      if (entry.expiresAt && now > entry.expiresAt) {
        await this.remove(key);
        this.misses++;
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = now;
      await AsyncStorage.setItem(this.getKey(key), JSON.stringify(entry));

      this.hits++;
      return entry.data as T;
    } catch (error) {
      console.error('Cache get error:', error);
      this.misses++;
      return null;
    }
  }

  // Check if key exists and is not expired
  async has(key: string): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(this.getKey(key));

      if (!cached) return false;

      const entry: CacheEntry = JSON.parse(cached);
      const now = Date.now();

      if (entry.expiresAt && now > entry.expiresAt) {
        await this.remove(key);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Cache has error:', error);
      return false;
    }
  }

  // Remove specific cache entry
  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Cache remove error:', error);
      return false;
    }
  }

  // Get multiple cache entries
  async getMultiple<T = any>(
    keys: string[],
  ): Promise<Record<string, T | null>> {
    try {
      const cacheKeys = keys.map(key => this.getKey(key));
      const results = await AsyncStorage.multiGet(cacheKeys);

      const output: Record<string, T | null> = {};
      const now = Date.now();

      for (let i = 0; i < results.length; i++) {
        const [cacheKey, value] = results[i];
        const originalKey = keys[i];

        if (value) {
          try {
            const entry: CacheEntry = JSON.parse(value);

            // Check if expired
            if (entry.expiresAt && now > entry.expiresAt) {
              await this.remove(originalKey);
              output[originalKey] = null;
              this.misses++;
            } else {
              // Update access statistics
              entry.accessCount++;
              entry.lastAccessed = now;
              await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));

              output[originalKey] = entry.data as T;
              this.hits++;
            }
          } catch (parseError) {
            output[originalKey] = null;
            this.misses++;
          }
        } else {
          output[originalKey] = null;
          this.misses++;
        }
      }

      return output;
    } catch (error) {
      console.error('Cache getMultiple error:', error);
      return keys.reduce((acc, key) => {
        acc[key] = null;
        this.misses++;
        return acc;
      }, {} as Record<string, T | null>);
    }
  }

  // Set multiple cache entries
  async setMultiple(
    entries: Array<{key: string; data: any; ttl?: number}>,
  ): Promise<boolean> {
    try {
      const now = Date.now();
      const cacheEntries: Array<[string, string]> = [];

      for (const {key, data, ttl} of entries) {
        const expiresAt = ttl ? now + ttl : now + this.defaultTTL;
        const serializedData = JSON.stringify(data);

        const entry: CacheEntry = {
          data,
          timestamp: now,
          expiresAt,
          size: serializedData.length,
          accessCount: 0,
          lastAccessed: now,
        };

        cacheEntries.push([this.getKey(key), JSON.stringify(entry)]);
      }

      await AsyncStorage.multiSet(cacheEntries);
      return true;
    } catch (error) {
      console.error('Cache setMultiple error:', error);
      return false;
    }
  }

  // Get cache statistics
  async getStats(): Promise<CacheStats> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));

      if (cacheKeys.length === 0) {
        return {
          totalEntries: 0,
          totalSize: 0,
          hitRate: 0,
          missRate: 0,
          oldestEntry: 0,
          newestEntry: 0,
        };
      }

      const entries = await AsyncStorage.multiGet(cacheKeys);
      let totalSize = 0;
      let oldestEntry = Date.now();
      let newestEntry = 0;

      for (const [, value] of entries) {
        if (value) {
          try {
            const entry: CacheEntry = JSON.parse(value);
            totalSize += entry.size;
            if (entry.timestamp < oldestEntry) oldestEntry = entry.timestamp;
            if (entry.timestamp > newestEntry) newestEntry = entry.timestamp;
          } catch (error) {
            // Skip invalid entries
          }
        }
      }

      const totalRequests = this.hits + this.misses;
      const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;
      const missRate =
        totalRequests > 0 ? (this.misses / totalRequests) * 100 : 0;

      return {
        totalEntries: cacheKeys.length,
        totalSize,
        hitRate,
        missRate,
        oldestEntry,
        newestEntry,
      };
    } catch (error) {
      console.error('Cache getStats error:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        missRate: 0,
        oldestEntry: 0,
        newestEntry: 0,
      };
    }
  }

  // Clear expired entries
  async clearExpired(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      const now = Date.now();
      let clearedCount = 0;

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            const entry: CacheEntry = JSON.parse(value);
            if (entry.expiresAt && now > entry.expiresAt) {
              await AsyncStorage.removeItem(key);
              clearedCount++;
            }
          } catch (error) {
            // Remove invalid entries
            await AsyncStorage.removeItem(key);
            clearedCount++;
          }
        }
      }

      return clearedCount;
    } catch (error) {
      console.error('Cache clearExpired error:', error);
      return 0;
    }
  }

  // Clear all cache entries
  async clear(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      await AsyncStorage.multiRemove(cacheKeys);
      this.hits = 0;
      this.misses = 0;
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Ensure we have enough space for new entry
  private async ensureSpace(requiredSize: number): Promise<void> {
    const stats = await this.getStats();

    if (stats.totalSize + requiredSize <= this.maxSize) {
      return; // Enough space available
    }

    // Need to free up space - remove least recently used entries
    console.log('Cache size limit reached, cleaning up...');

    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(this.prefix));

    // Get all entries with their access info
    const entriesWithKeys: Array<{key: string; entry: CacheEntry}> = [];

    for (const key of cacheKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          const entry: CacheEntry = JSON.parse(value);
          entriesWithKeys.push({key, entry});
        } catch (error) {
          // Remove invalid entries
          await AsyncStorage.removeItem(key);
        }
      }
    }

    // Sort by last accessed (LRU)
    entriesWithKeys.sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);

    // Remove entries until we have enough space
    let freedSpace = 0;
    let i = 0;

    while (freedSpace < requiredSize && i < entriesWithKeys.length) {
      const {key, entry} = entriesWithKeys[i];
      await AsyncStorage.removeItem(key);
      freedSpace += entry.size;
      i++;
    }

    console.log(`Freed ${freedSpace} bytes by removing ${i} cache entries`);
  }

  // Get cache entry metadata without updating access stats
  async getMetadata(key: string): Promise<Omit<CacheEntry, 'data'> | null> {
    try {
      const cached = await AsyncStorage.getItem(this.getKey(key));

      if (!cached) return null;

      const entry: CacheEntry = JSON.parse(cached);
      const {data, ...metadata} = entry;

      return metadata;
    } catch (error) {
      console.error('Cache getMetadata error:', error);
      return null;
    }
  }
}

// Create singleton instances for different cache types
export const imageCache = new CacheHelper(
  '@image_cache',
  7 * 24 * 60 * 60 * 1000,
); // 7 days
export const apiCache = new CacheHelper('@api_cache', 60 * 60 * 1000); // 1 hour
export const componentCache = new CacheHelper(
  '@component_cache',
  24 * 60 * 60 * 1000,
); // 24 hours
export const userDataCache = new CacheHelper(
  '@user_data_cache',
  30 * 60 * 1000,
); // 30 minutes
