import {useCallback, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

export interface CacheConfig {
  defaultTTL?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
  enableCompression?: boolean;
}

export interface CacheStats {
  totalItems: number;
  totalSize: number; // Approximate size in bytes
  hitRate: number;
  missRate: number;
}

export const useAssetCache = (config: CacheConfig = {}) => {
  const {
    defaultTTL = 24 * 60 * 60 * 1000, // 24 hours
    maxSize = 100,
    enableCompression = false,
  } = config;

  const [stats, setStats] = useState<CacheStats>({
    totalItems: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
  });

  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);

  // Generate cache key with prefix
  const getCacheKey = useCallback((key: string) => {
    return `@asset_cache:${key}`;
  }, []);

  // Store data in cache
  const setCache = useCallback(
    async <T>(key: string, data: T, ttl?: number): Promise<boolean> => {
      try {
        const cacheKey = getCacheKey(key);
        const now = Date.now();
        const expiresAt = ttl ? now + ttl : now + defaultTTL;

        const cacheItem: CacheItem<T> = {
          data,
          timestamp: now,
          expiresAt,
        };

        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem));

        // Update stats
        await updateCacheStats();

        return true;
      } catch (error) {
        console.error('Failed to set cache:', error);
        return false;
      }
    },
    [getCacheKey, defaultTTL],
  );

  // Get data from cache
  const getCache = useCallback(
    async <T>(key: string): Promise<T | null> => {
      try {
        const cacheKey = getCacheKey(key);
        const cached = await AsyncStorage.getItem(cacheKey);

        if (!cached) {
          setMisses(prev => prev + 1);
          return null;
        }

        const cacheItem: CacheItem<T> = JSON.parse(cached);
        const now = Date.now();

        // Check if expired
        if (cacheItem.expiresAt && now > cacheItem.expiresAt) {
          await AsyncStorage.removeItem(cacheKey);
          setMisses(prev => prev + 1);
          return null;
        }

        setHits(prev => prev + 1);
        return cacheItem.data;
      } catch (error) {
        console.error('Failed to get cache:', error);
        setMisses(prev => prev + 1);
        return null;
      }
    },
    [getCacheKey],
  );

  // Check if key exists in cache and is not expired
  const hasCache = useCallback(
    async (key: string): Promise<boolean> => {
      try {
        const cacheKey = getCacheKey(key);
        const cached = await AsyncStorage.getItem(cacheKey);

        if (!cached) return false;

        const cacheItem: CacheItem = JSON.parse(cached);
        const now = Date.now();

        if (cacheItem.expiresAt && now > cacheItem.expiresAt) {
          await AsyncStorage.removeItem(cacheKey);
          return false;
        }

        return true;
      } catch (error) {
        console.error('Failed to check cache:', error);
        return false;
      }
    },
    [getCacheKey],
  );

  // Remove specific cache item
  const removeCache = useCallback(
    async (key: string): Promise<boolean> => {
      try {
        const cacheKey = getCacheKey(key);
        await AsyncStorage.removeItem(cacheKey);
        await updateCacheStats();
        return true;
      } catch (error) {
        console.error('Failed to remove cache:', error);
        return false;
      }
    },
    [getCacheKey],
  );

  // Clear all cache items
  const clearCache = useCallback(async (): Promise<boolean> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@asset_cache:'));
      await AsyncStorage.multiRemove(cacheKeys);
      await updateCacheStats();
      setHits(0);
      setMisses(0);
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }, []);

  // Update cache statistics
  const updateCacheStats = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@asset_cache:'));

      let totalSize = 0;
      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }

      const total = hits + misses;
      const newStats: CacheStats = {
        totalItems: cacheKeys.length,
        totalSize,
        hitRate: total > 0 ? (hits / total) * 100 : 0,
        missRate: total > 0 ? (misses / total) * 100 : 0,
      };

      setStats(newStats);
    } catch (error) {
      console.error('Failed to update cache stats:', error);
    }
  }, [hits, misses]);

  // Fetch data with caching
  const fetchWithCache = useCallback(
    async <T>(
      key: string,
      fetchFunction: () => Promise<T>,
      ttl?: number,
    ): Promise<T | null> => {
      try {
        // Try to get from cache first
        const cached = await getCache<T>(key);
        if (cached !== null) {
          return cached;
        }

        // If not in cache, fetch the data
        const data = await fetchFunction();

        // Store in cache
        await setCache(key, data, ttl);

        return data;
      } catch (error) {
        console.error('Failed to fetch with cache:', error);
        return null;
      }
    },
    [getCache, setCache],
  );

  // Clean up expired items
  const cleanupExpired = useCallback(async (): Promise<number> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@asset_cache:'));
      let removedCount = 0;
      const now = Date.now();

      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const cacheItem: CacheItem = JSON.parse(cached);
          if (cacheItem.expiresAt && now > cacheItem.expiresAt) {
            await AsyncStorage.removeItem(key);
            removedCount++;
          }
        }
      }

      await updateCacheStats();
      return removedCount;
    } catch (error) {
      console.error('Failed to cleanup expired items:', error);
      return 0;
    }
  }, [updateCacheStats]);

  // Initialize stats on mount
  useEffect(() => {
    updateCacheStats();
  }, [updateCacheStats]);

  return {
    setCache,
    getCache,
    hasCache,
    removeCache,
    clearCache,
    fetchWithCache,
    cleanupExpired,
    stats,
  };
};
