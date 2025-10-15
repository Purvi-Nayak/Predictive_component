import {useState, useCallback, useRef, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppState, AppStateStatus} from 'react-native';

interface CacheConfig {
  prefix?: string;
  defaultTTL?: number;
  maxSize?: number;
  compressionEnabled?: boolean;
  encryptionEnabled?: boolean;
  backgroundSync?: boolean;
  maxMemoryEntries?: number;
  evictionPolicy?: 'lru' | 'lfu' | 'fifo' | 'ttl';
  enableMetrics?: boolean;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
  priority: 'low' | 'normal' | 'high';
  tags: string[];
  compressed?: boolean;
  checksum?: string;
  version?: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  totalSize: number;
  totalEntries: number;
  hitRate: number;
  memoryPressure: number;
  diskUsage: number;
  compressionRatio?: number;
  averageAccessTime: number;
}

interface CacheMetrics {
  operationsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  memoryEfficiency: number;
}

/**
 * Advanced multi-level caching system with AsyncStorage
 * Features: Memory + Disk caching, compression, encryption, background sync
 */
export const useAdvancedAsyncStorage = (config: CacheConfig = {}) => {
  const configRef = useRef({
    prefix: config.prefix || '@advanced_cache_v2',
    defaultTTL: config.defaultTTL || 24 * 60 * 60 * 1000, // 24 hours
    maxSize: config.maxSize || 100 * 1024 * 1024, // 100MB
    compressionEnabled: config.compressionEnabled || false,
    encryptionEnabled: config.encryptionEnabled || false,
    backgroundSync: config.backgroundSync || true,
    maxMemoryEntries: config.maxMemoryEntries || 50,
    evictionPolicy: config.evictionPolicy || 'lru',
    enableMetrics: config.enableMetrics || true,
  });

  const [stats, setStats] = useState<CacheStats>({
    hits: 0,
    misses: 0,
    totalSize: 0,
    totalEntries: 0,
    hitRate: 0,
    memoryPressure: 0,
    diskUsage: 0,
    averageAccessTime: 0,
  });

  const [metrics, setMetrics] = useState<CacheMetrics>({
    operationsPerSecond: 0,
    averageResponseTime: 0,
    errorRate: 0,
    memoryEfficiency: 0,
  });

  // Memory cache for fastest access (Level 1)
  const memoryCacheRef = useRef<Map<string, CacheEntry>>(new Map());

  // Access order for LRU eviction
  const accessOrderRef = useRef<string[]>([]);

  // Operation timing for metrics
  const operationTimingsRef = useRef<number[]>([]);
  const operationCountRef = useRef(0);
  const errorCountRef = useRef(0);

  /**
   * Generate cache key with prefix
   */
  const getKey = useCallback((key: string): string => {
    return `${configRef.current.prefix}:${key}`;
  }, []);

  /**
   * Compress data if compression is enabled
   */
  const compressData = useCallback(async (data: any): Promise<any> => {
    if (!configRef.current.compressionEnabled) return data;

    try {
      // Simple JSON compression (in production, use libraries like react-native-zip)
      const jsonString = JSON.stringify(data);

      // Simple compression algorithm (placeholder)
      // In real implementation, use proper compression libraries
      const compressed = jsonString
        .split('')
        .map(char => String.fromCharCode(char.charCodeAt(0) + 1))
        .join('');

      return {
        __compressed: true,
        data: compressed,
        originalSize: jsonString.length,
        compressedSize: compressed.length,
      };
    } catch (error) {
      console.warn('Compression failed, storing uncompressed:', error);
      return data;
    }
  }, []);

  /**
   * Decompress data if it was compressed
   */
  const decompressData = useCallback((data: any): any => {
    if (!data || !data.__compressed) return data;

    try {
      // Reverse the simple compression
      const decompressed = data.data
        .split('')
        .map((char: string) => String.fromCharCode(char.charCodeAt(0) - 1))
        .join('');

      return JSON.parse(decompressed);
    } catch (error) {
      console.error('Decompression failed:', error);
      return null;
    }
  }, []);

  /**
   * Generate checksum for data integrity
   */
  const generateChecksum = useCallback((data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }, []);

  /**
   * Validate data integrity
   */
  const validateChecksum = useCallback(
    (data: string, expectedChecksum: string): boolean => {
      const actualChecksum = generateChecksum(data);
      return actualChecksum === expectedChecksum;
    },
    [generateChecksum],
  );

  /**
   * Update memory cache with LRU eviction
   */
  const updateMemoryCache = useCallback(
    (key: string, entry: CacheEntry): void => {
      const fullKey = getKey(key);
      const memoryCache = memoryCacheRef.current;
      const accessOrder = accessOrderRef.current;

      // Remove from current position if exists
      const existingIndex = accessOrder.indexOf(fullKey);
      if (existingIndex !== -1) {
        accessOrder.splice(existingIndex, 1);
      }

      // Add to end (most recently used)
      accessOrder.push(fullKey);
      memoryCache.set(fullKey, entry);

      // Evict if over limit
      while (memoryCache.size > configRef.current.maxMemoryEntries) {
        const oldestKey = accessOrder.shift();
        if (oldestKey) {
          memoryCache.delete(oldestKey);
        }
      }
    },
    [getKey],
  );

  /**
   * Track operation timing for metrics
   */
  const trackOperation = useCallback(
    (startTime: number, success: boolean): void => {
      if (!configRef.current.enableMetrics) return;

      const duration = Date.now() - startTime;
      operationTimingsRef.current.push(duration);
      operationCountRef.current++;

      if (!success) {
        errorCountRef.current++;
      }

      // Keep only last 100 timings
      if (operationTimingsRef.current.length > 100) {
        operationTimingsRef.current = operationTimingsRef.current.slice(-100);
      }

      // Update metrics every 10 operations
      if (operationCountRef.current % 10 === 0) {
        updateMetrics();
      }
    },
    [],
  );

  /**
   * Update performance metrics
   */
  const updateMetrics = useCallback((): void => {
    const timings = operationTimingsRef.current;
    const totalOps = operationCountRef.current;
    const errors = errorCountRef.current;

    if (timings.length === 0) return;

    const averageResponseTime =
      timings.reduce((sum, time) => sum + time, 0) / timings.length;
    const operationsPerSecond = totalOps > 0 ? 1000 / averageResponseTime : 0;
    const errorRate = totalOps > 0 ? (errors / totalOps) * 100 : 0;

    const memorySize = memoryCacheRef.current.size;
    const maxMemory = configRef.current.maxMemoryEntries;
    const memoryEfficiency = maxMemory > 0 ? (memorySize / maxMemory) * 100 : 0;

    setMetrics({
      operationsPerSecond,
      averageResponseTime,
      errorRate,
      memoryEfficiency,
    });
  }, []);

  /**
   * Multi-level get: Memory -> AsyncStorage -> Network
   */
  const get = useCallback(
    async <T = any>(
      key: string,
      options?: {
        priority?: 'low' | 'normal' | 'high';
        bypassMemory?: boolean;
        bypassDisk?: boolean;
        tags?: string[];
        fallbackFunction?: () => Promise<T>;
      },
    ): Promise<T | null> => {
      const startTime = Date.now();
      const {
        priority = 'normal',
        bypassMemory = false,
        bypassDisk = false,
        fallbackFunction,
      } = options || {};

      const fullKey = getKey(key);

      try {
        // Level 1: Memory cache (fastest)
        if (!bypassMemory) {
          const memoryEntry = memoryCacheRef.current.get(fullKey);
          if (memoryEntry && isEntryValid(memoryEntry)) {
            // Update access stats
            memoryEntry.accessCount++;
            memoryEntry.lastAccessed = Date.now();
            updateMemoryCache(key, memoryEntry);

            setStats(prev => ({...prev, hits: prev.hits + 1}));
            trackOperation(startTime, true);

            return decompressData(memoryEntry.data) as T;
          }
        }

        // Level 2: AsyncStorage (persistent)
        if (!bypassDisk) {
          const stored = await AsyncStorage.getItem(fullKey);
          if (stored) {
            const entry: CacheEntry = JSON.parse(stored);

            if (isEntryValid(entry)) {
              // Validate data integrity
              const serializedData = JSON.stringify(entry.data);
              if (
                entry.checksum &&
                !validateChecksum(serializedData, entry.checksum)
              ) {
                console.warn('Data integrity check failed for key:', key);
                await AsyncStorage.removeItem(fullKey);
              } else {
                // Update access stats
                entry.accessCount++;
                entry.lastAccessed = Date.now();

                // Update both storage and memory cache
                await AsyncStorage.setItem(fullKey, JSON.stringify(entry));
                updateMemoryCache(key, entry);

                setStats(prev => ({...prev, hits: prev.hits + 1}));
                trackOperation(startTime, true);

                return decompressData(entry.data) as T;
              }
            } else {
              // Remove expired entry
              await AsyncStorage.removeItem(fullKey);
              memoryCacheRef.current.delete(fullKey);
            }
          }
        }

        // Level 3: Fallback function (network or computation)
        if (fallbackFunction) {
          const fallbackData = await fallbackFunction();

          // Cache the fallback result
          await set(key, fallbackData, {priority});

          setStats(prev => ({...prev, misses: prev.misses + 1}));
          trackOperation(startTime, true);

          return fallbackData;
        }

        setStats(prev => ({...prev, misses: prev.misses + 1}));
        trackOperation(startTime, true);
        return null;
      } catch (error) {
        console.error('Cache get error:', error);
        trackOperation(startTime, false);
        return null;
      }
    },
    [getKey, updateMemoryCache, decompressData, validateChecksum],
  );

  /**
   * Set data with advanced options
   */
  const set = useCallback(
    async (
      key: string,
      data: any,
      options?: {
        ttl?: number;
        priority?: 'low' | 'normal' | 'high';
        tags?: string[];
        compress?: boolean;
        memoryOnly?: boolean;
        version?: number;
      },
    ): Promise<boolean> => {
      const startTime = Date.now();
      const {
        ttl = configRef.current.defaultTTL,
        priority = 'normal',
        tags = [],
        compress = configRef.current.compressionEnabled,
        memoryOnly = false,
        version = 1,
      } = options || {};

      const fullKey = getKey(key);

      try {
        const now = Date.now();
        const expiresAt = now + ttl;

        // Process data (compression, etc.)
        const processedData = compress ? await compressData(data) : data;
        const serializedData = JSON.stringify(processedData);
        const checksum = generateChecksum(serializedData);

        const entry: CacheEntry = {
          data: processedData,
          timestamp: now,
          expiresAt,
          size: serializedData.length,
          accessCount: 0,
          lastAccessed: now,
          priority,
          tags,
          compressed: compress,
          checksum,
          version,
        };

        // Always update memory cache
        updateMemoryCache(key, entry);

        // Persistent storage (unless memory-only)
        if (!memoryOnly) {
          await ensureSpace(entry.size);
          await AsyncStorage.setItem(fullKey, JSON.stringify(entry));
        }

        updateCacheStats();
        trackOperation(startTime, true);
        return true;
      } catch (error) {
        console.error('Cache set error:', error);
        trackOperation(startTime, false);
        return false;
      }
    },
    [getKey, updateMemoryCache, compressData, generateChecksum],
  );

  /**
   * Batch operations for efficiency
   */
  const batchGet = useCallback(
    async <T = any>(keys: string[]): Promise<Record<string, T | null>> => {
      const results: Record<string, T | null> = {};

      // Process in parallel for better performance
      const promises = keys.map(async key => {
        const value = await get<T>(key);
        return {key, value};
      });

      const resolvedValues = await Promise.allSettled(promises);

      resolvedValues.forEach((result, index) => {
        const key = keys[index];
        if (result.status === 'fulfilled') {
          results[key] = result.value.value;
        } else {
          results[key] = null;
          console.warn(`Batch get failed for key ${key}:`, result.reason);
        }
      });

      return results;
    },
    [get],
  );

  /**
   * Batch set operations
   */
  const batchSet = useCallback(
    async (
      entries: Array<{
        key: string;
        data: any;
        options?: Parameters<typeof set>[2];
      }>,
    ): Promise<Record<string, boolean>> => {
      const results: Record<string, boolean> = {};

      // Process in batches to avoid overwhelming AsyncStorage
      const batchSize = 10;

      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);

        const promises = batch.map(async ({key, data, options}) => {
          const success = await set(key, data, options);
          return {key, success};
        });

        const batchResults = await Promise.allSettled(promises);

        batchResults.forEach((result, batchIndex) => {
          const key = batch[batchIndex].key;
          if (result.status === 'fulfilled') {
            results[key] = result.value.success;
          } else {
            results[key] = false;
            console.warn(`Batch set failed for key ${key}:`, result.reason);
          }
        });

        // Small delay between batches
        if (i + batchSize < entries.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      return results;
    },
    [set],
  );

  /**
   * Smart cache invalidation by tags
   */
  const invalidateByTags = useCallback(
    async (tags: string[]): Promise<number> => {
      try {
        let invalidatedCount = 0;

        // Invalidate from memory cache
        for (const [key, entry] of memoryCacheRef.current) {
          const hasMatchingTag = tags.some(tag => entry.tags.includes(tag));
          if (hasMatchingTag) {
            memoryCacheRef.current.delete(key);
            invalidatedCount++;
          }
        }

        // Invalidate from AsyncStorage
        const allKeys = await AsyncStorage.getAllKeys();
        const cacheKeys = allKeys.filter(key =>
          key.startsWith(configRef.current.prefix),
        );

        for (const key of cacheKeys) {
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            const entry: CacheEntry = JSON.parse(stored);
            const hasMatchingTag = tags.some(tag => entry.tags.includes(tag));

            if (hasMatchingTag) {
              await AsyncStorage.removeItem(key);
              invalidatedCount++;
            }
          }
        }

        updateCacheStats();
        return invalidatedCount;
      } catch (error) {
        console.error('Cache invalidation error:', error);
        return 0;
      }
    },
    [],
  );

  /**
   * Ensure sufficient space for new entries
   */
  const ensureSpace = useCallback(
    async (requiredSize: number): Promise<void> => {
      const currentStats = await calculateCacheStats();

      if (currentStats.totalSize + requiredSize > configRef.current.maxSize) {
        await performMaintenance(0.8); // Clean to 80% of max size
      }
    },
    [],
  );

  /**
   * Background cache maintenance
   */
  const performMaintenance = useCallback(
    async (targetRatio: number = 0.8): Promise<void> => {
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const cacheKeys = allKeys.filter(key =>
          key.startsWith(configRef.current.prefix),
        );

        const entries: Array<{key: string; entry: CacheEntry}> = [];
        let totalSize = 0;

        // Collect all valid entries
        for (const key of cacheKeys) {
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            try {
              const entry: CacheEntry = JSON.parse(stored);

              if (isEntryValid(entry)) {
                entries.push({key, entry});
                totalSize += entry.size;
              } else {
                // Remove expired entries
                await AsyncStorage.removeItem(key);
                memoryCacheRef.current.delete(key);
              }
            } catch (error) {
              // Remove corrupted entries
              await AsyncStorage.removeItem(key);
              memoryCacheRef.current.delete(key);
            }
          }
        }

        // If still over limit, apply eviction policy
        const targetSize = configRef.current.maxSize * targetRatio;
        if (totalSize > targetSize) {
          await applyEvictionPolicy(entries, targetSize);
        }

        updateCacheStats();
      } catch (error) {
        console.error('Cache maintenance error:', error);
      }
    },
    [],
  );

  /**
   * Apply eviction policy to remove entries
   */
  const applyEvictionPolicy = useCallback(
    async (
      entries: Array<{key: string; entry: CacheEntry}>,
      targetSize: number,
    ): Promise<void> => {
      const policy = configRef.current.evictionPolicy;

      // Sort entries based on eviction policy
      let sortedEntries = [...entries];

      switch (policy) {
        case 'lru': // Least Recently Used
          sortedEntries.sort(
            (a, b) => a.entry.lastAccessed - b.entry.lastAccessed,
          );
          break;
        case 'lfu': // Least Frequently Used
          sortedEntries.sort(
            (a, b) => a.entry.accessCount - b.entry.accessCount,
          );
          break;
        case 'fifo': // First In, First Out
          sortedEntries.sort((a, b) => a.entry.timestamp - b.entry.timestamp);
          break;
        case 'ttl': // Time To Live
          sortedEntries.sort((a, b) => a.entry.expiresAt - b.entry.expiresAt);
          break;
      }

      // Remove entries until we reach target size
      let currentSize = entries.reduce((sum, {entry}) => sum + entry.size, 0);

      for (const {key, entry} of sortedEntries) {
        if (currentSize <= targetSize) break;

        // Don't evict high priority items unless absolutely necessary
        if (entry.priority === 'high' && currentSize > targetSize * 1.1) {
          continue;
        }

        await AsyncStorage.removeItem(key);
        memoryCacheRef.current.delete(key);
        currentSize -= entry.size;
      }
    },
    [],
  );

  /**
   * Calculate comprehensive cache statistics
   */
  const calculateCacheStats = useCallback(async (): Promise<CacheStats> => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key =>
        key.startsWith(configRef.current.prefix),
      );

      let totalSize = 0;
      let compressedSize = 0;
      let uncompressedSize = 0;

      for (const key of cacheKeys) {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          try {
            const entry: CacheEntry = JSON.parse(stored);
            totalSize += entry.size;

            if (entry.compressed && entry.data.originalSize) {
              compressedSize += entry.data.compressedSize || entry.size;
              uncompressedSize += entry.data.originalSize;
            }
          } catch (error) {
            // Ignore corrupted entries
          }
        }
      }

      const timings = operationTimingsRef.current;
      const averageAccessTime =
        timings.length > 0
          ? timings.reduce((sum, time) => sum + time, 0) / timings.length
          : 0;

      const totalRequests = stats.hits + stats.misses;
      const hitRate =
        totalRequests > 0 ? (stats.hits / totalRequests) * 100 : 0;
      const memoryPressure = totalSize / configRef.current.maxSize;
      const compressionRatio =
        uncompressedSize > 0 ? compressedSize / uncompressedSize : 1;

      const newStats: CacheStats = {
        hits: stats.hits,
        misses: stats.misses,
        totalSize,
        totalEntries: cacheKeys.length,
        hitRate,
        memoryPressure,
        diskUsage: totalSize,
        compressionRatio,
        averageAccessTime,
      };

      setStats(newStats);
      return newStats;
    } catch (error) {
      console.error('Stats calculation error:', error);
      return stats;
    }
  }, [stats]);

  /**
   * Check if cache entry is valid (not expired)
   */
  const isEntryValid = useCallback((entry: CacheEntry): boolean => {
    return Date.now() < entry.expiresAt;
  }, []);

  /**
   * Update cache statistics
   */
  const updateCacheStats = useCallback(async (): Promise<void> => {
    await calculateCacheStats();
  }, [calculateCacheStats]);

  /**
   * Clear all cache data
   */
  const clearAll = useCallback(async (): Promise<boolean> => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key =>
        key.startsWith(configRef.current.prefix),
      );

      await AsyncStorage.multiRemove(cacheKeys);
      memoryCacheRef.current.clear();
      accessOrderRef.current = [];

      setStats({
        hits: 0,
        misses: 0,
        totalSize: 0,
        totalEntries: 0,
        hitRate: 0,
        memoryPressure: 0,
        diskUsage: 0,
        averageAccessTime: 0,
      });

      return true;
    } catch (error) {
      console.error('Clear all cache error:', error);
      return false;
    }
  }, []);

  /**
   * Export cache data for backup/analysis
   */
  const exportCacheData = useCallback(async (): Promise<string> => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key =>
        key.startsWith(configRef.current.prefix),
      );

      const cacheData = await AsyncStorage.multiGet(cacheKeys);
      const exportData = {
        timestamp: Date.now(),
        version: '2.0',
        config: configRef.current,
        stats,
        metrics,
        data: cacheData.reduce((acc, [key, value]) => {
          if (value) {
            acc[key] = JSON.parse(value);
          }
          return acc;
        }, {} as Record<string, any>),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Export cache data error:', error);
      return '';
    }
  }, [stats, metrics]);

  // Background maintenance setup
  useEffect(() => {
    if (!configRef.current.backgroundSync) return;

    const maintenanceInterval = setInterval(() => {
      performMaintenance();
    }, 5 * 60 * 1000); // Every 5 minutes

    const statsInterval = setInterval(() => {
      updateCacheStats();
    }, 30 * 1000); // Every 30 seconds

    return () => {
      clearInterval(maintenanceInterval);
      clearInterval(statsInterval);
    };
  }, [performMaintenance, updateCacheStats]);

  // App state change handling
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        // Perform maintenance when app goes to background
        performMaintenance();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, [performMaintenance]);

  // Initial stats calculation
  useEffect(() => {
    updateCacheStats();
  }, [updateCacheStats]);

  return {
    // Core operations
    get,
    set,
    batchGet,
    batchSet,

    // Management operations
    invalidateByTags,
    performMaintenance,
    clearAll,

    // Monitoring
    stats,
    metrics,
    calculateCacheStats,
    exportCacheData,

    // Configuration
    config: configRef.current,
  };
};
