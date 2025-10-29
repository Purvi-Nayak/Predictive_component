import {useState, useCallback, useRef} from 'react';

interface CacheOptions {
  prefix?: string;
  compressionEnabled?: boolean;
  backgroundSync?: boolean;
  enableMetrics?: boolean;
  maxSize?: number;
}

interface CacheStats {
  hitRate: number;
  totalSize: number;
  memoryPressure: number;
}

/**
 * Simplified AsyncStorage cache hook without infinite loops
 */
export const useAdvancedAsyncStorage = (options: CacheOptions = {}) => {
  const {
    prefix = '@cache',
    compressionEnabled = false,
    maxSize = 100 * 1024 * 1024, // 50MB
  } = options;

  const cacheRef = useRef<Map<string, any>>(new Map());
  const [stats, setStats] = useState<CacheStats>({
    hitRate: 0,
    totalSize: 0,
    memoryPressure: 0,
  });

  const get = useCallback(
    async (
      key: string,
      fallbackOptions?: {
        fallbackFunction?: () => Promise<any>;
        priority?: 'low' | 'normal' | 'high';
        tags?: string[];
      },
    ) => {
      const fullKey = `${prefix}_${key}`;

      // Check memory cache first
      if (cacheRef.current.has(fullKey)) {
        const cached = cacheRef.current.get(fullKey);

        // Update stats
        setStats(prev => ({
          ...prev,
          hitRate: prev.hitRate * 0.9 + 0.1,
        }));

        return cached;
      }

      // If fallback function provided, use it
      if (fallbackOptions?.fallbackFunction) {
        try {
          const result = await fallbackOptions.fallbackFunction();

          // Cache the result
          cacheRef.current.set(fullKey, result);

          return result;
        } catch (error) {
          console.warn('Fallback function failed:', error);
          return null;
        }
      }
      return null;
    },
    [prefix],
  );

  const set = useCallback(
    async (
      key: string,
      value: any,
      options?: {
        ttl?: number;
        priority?: 'low' | 'normal' | 'high';
        tags?: string[];
        compress?: boolean;
      },
    ) => {
      const fullKey = `${prefix}_${key}`;

      // Simple memory storage for demo
      cacheRef.current.set(fullKey, value);

      // Update stats
      const newSize = JSON.stringify(value).length;
      setStats(prev => ({
        ...prev,
        totalSize: prev.totalSize + newSize,
        memoryPressure: Math.min(1, prev.totalSize / maxSize),
      }));

      return true;
    },
    [prefix, maxSize],
  );

  const invalidateByTags = useCallback(async (tags: string[]) => {
    // Simple implementation - clear all for demo
    cacheRef.current.clear();
    setStats({
      hitRate: 0,
      totalSize: 0,
      memoryPressure: 0,
    });
  }, []);

  const batchGet = useCallback(
    async (keys: string[]) => {
      const results: Record<string, any> = {};

      for (const key of keys) {
        results[key] = await get(key);
      }

      return results;
    },
    [get],
  );

  const batchSet = useCallback(
    async (entries: Array<{key: string; value: any}>) => {
      for (const {key, value} of entries) {
        await set(key, value);
      }
    },
    [set],
  );

  const clearAll = useCallback(async () => {
    // Clear memory cache
    cacheRef.current.clear();

    // Reset stats
    setStats({
      hitRate: 0,
      totalSize: 0,
      memoryPressure: 0,
    });

    console.log('🗑️ All cache data cleared successfully');
    return true;
  }, []);

  return {
    get,
    set,
    clearAll,
    batchGet,
    batchSet,
    invalidateByTags,
    stats,
  };
};
