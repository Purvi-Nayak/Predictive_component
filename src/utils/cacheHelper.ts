import {useRef, useCallback} from 'react';
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

interface CacheConfig {
  prefix?: string;
  defaultTTL?: number;
  maxSize?: number;
}

/**
 * Cache Helper Hook - Functional component alternative to CacheHelper class
 * Provides caching functionality with TTL, LRU eviction, and statistics
 *
 * Usage:
 * const cache = useCacheHelper({ prefix: '@my_cache', defaultTTL: 3600000 });
 * await cache.set('key', data);
 * const cachedData = await cache.get('key');
 */
export const useCacheHelper = (config: CacheConfig = {}) => {
  const configRef = useRef({
    prefix: config.prefix || '@cache',
    defaultTTL: config.defaultTTL || 24 * 60 * 60 * 1000, // 24 hours
    maxSize: config.maxSize || 50 * 1024 * 1024, // 50MB
  });

  const statsRef = useRef({
    hits: 0,
    misses: 0,
  });

  const getKey = useCallback((key: string): string => {
    return `${configRef.current.prefix}:${key}`;
  }, []);

  // Store data in cache with metadata
  const set = useCallback(
    async (key: string, data: any, ttl?: number): Promise<boolean> => {
      try {
        const now = Date.now();
        const expiresAt = ttl ? now + ttl : now + configRef.current.defaultTTL;
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
        await ensureSpace(entry.size);

        await AsyncStorage.setItem(getKey(key), JSON.stringify(entry));
        return true;
      } catch (error) {
        console.error('Cache set error:', error);
        return false;
      }
    },
    [getKey],
  );

  // Get data from cache
  const get = useCallback(
    async <T = any>(key: string): Promise<T | null> => {
      try {
        const cached = await AsyncStorage.getItem(getKey(key));

        if (!cached) {
          statsRef.current.misses++;
          return null;
        }

        const entry: CacheEntry = JSON.parse(cached);
        const now = Date.now();

        // Check if expired
        if (entry.expiresAt && now > entry.expiresAt) {
          await remove(key);
          statsRef.current.misses++;
          return null;
        }

        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = now;
        await AsyncStorage.setItem(getKey(key), JSON.stringify(entry));

        statsRef.current.hits++;
        return entry.data as T;
      } catch (error) {
        console.error('Cache get error:', error);
        statsRef.current.misses++;
        return null;
      }
    },
    [getKey],
  );

  // Check if key exists and is not expired
  const has = useCallback(
    async (key: string): Promise<boolean> => {
      try {
        const cached = await AsyncStorage.getItem(getKey(key));

        if (!cached) return false;

        const entry: CacheEntry = JSON.parse(cached);
        const now = Date.now();

        if (entry.expiresAt && now > entry.expiresAt) {
          await remove(key);
          return false;
        }

        return true;
      } catch (error) {
        console.error('Cache has error:', error);
        return false;
      }
    },
    [getKey],
  );

  // Remove specific cache entry
  const remove = useCallback(
    async (key: string): Promise<boolean> => {
      try {
        await AsyncStorage.removeItem(getKey(key));
        return true;
      } catch (error) {
        console.error('Cache remove error:', error);
        return false;
      }
    },
    [getKey],
  );

  // Get cache statistics
  const getStats = useCallback(async (): Promise<CacheStats> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        key.startsWith(configRef.current.prefix),
      );

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

      const totalRequests = statsRef.current.hits + statsRef.current.misses;
      const hitRate =
        totalRequests > 0 ? (statsRef.current.hits / totalRequests) * 100 : 0;
      const missRate =
        totalRequests > 0 ? (statsRef.current.misses / totalRequests) * 100 : 0;

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
  }, []);

  // Clear expired entries
  const clearExpired = useCallback(async (): Promise<number> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        key.startsWith(configRef.current.prefix),
      );
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
  }, []);

  // Clear all cache entries
  const clear = useCallback(async (): Promise<boolean> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        key.startsWith(configRef.current.prefix),
      );
      await AsyncStorage.multiRemove(cacheKeys);
      statsRef.current.hits = 0;
      statsRef.current.misses = 0;
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }, []);

  // Ensure we have enough space for new entry
  const ensureSpace = useCallback(
    async (requiredSize: number): Promise<void> => {
      const stats = await getStats();

      if (stats.totalSize + requiredSize <= configRef.current.maxSize) {
        return; // Enough space available
      }

      // Need to free up space - remove least recently used entries
      console.log('Cache size limit reached, cleaning up...');

      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        key.startsWith(configRef.current.prefix),
      );

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
      entriesWithKeys.sort(
        (a, b) => a.entry.lastAccessed - b.entry.lastAccessed,
      );

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
    },
    [getStats],
  );

  return {
    set,
    get,
    has,
    remove,
    getStats,
    clearExpired,
    clear,
    // Additional utility methods
    getMultiple: useCallback(
      async <T = any>(keys: string[]): Promise<Record<string, T | null>> => {
        const result: Record<string, T | null> = {};
        for (const key of keys) {
          result[key] = await get<T>(key);
        }
        return result;
      },
      [get],
    ),

    setMultiple: useCallback(
      async (
        entries: Array<{key: string; data: any; ttl?: number}>,
      ): Promise<boolean> => {
        try {
          for (const entry of entries) {
            await set(entry.key, entry.data, entry.ttl);
          }
          return true;
        } catch (error) {
          console.error('Cache setMultiple error:', error);
          return false;
        }
      },
      [set],
    ),
  };
};

// Legacy class component for backward compatibility
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

      await this.ensureSpace(entry.size);
      await AsyncStorage.setItem(this.getKey(key), JSON.stringify(entry));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(this.getKey(key));

      if (!cached) {
        this.misses++;
        return null;
      }

      const entry: CacheEntry = JSON.parse(cached);
      const now = Date.now();

      if (entry.expiresAt && now > entry.expiresAt) {
        await this.remove(key);
        this.misses++;
        return null;
      }

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

  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Cache remove error:', error);
      return false;
    }
  }

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

  private async ensureSpace(requiredSize: number): Promise<void> {
    const stats = await this.getStats();
    if (stats.totalSize + requiredSize <= this.maxSize) {
      return;
    }

    console.log('Cache size limit reached, cleaning up...');
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
    const entriesWithKeys: Array<{key: string; entry: CacheEntry}> = [];

    for (const key of cacheKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          const entry: CacheEntry = JSON.parse(value);
          entriesWithKeys.push({key, entry});
        } catch (error) {
          await AsyncStorage.removeItem(key);
        }
      }
    }

    entriesWithKeys.sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);

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
}

// Singleton instances for different cache types
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
