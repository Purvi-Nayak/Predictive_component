import {useRef, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PerformanceMetric {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  type: 'navigation' | 'image_load' | 'component_mount' | 'api_call' | 'custom';
  metadata?: Record<string, any>;
}

interface NavigationMetric {
  from: string;
  to: string;
  timestamp: number;
  duration: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
}

// Global state for performance monitoring
const globalPerformanceState = {
  metrics: new Map<string, PerformanceMetric>(),
  navigationHistory: [] as NavigationMetric[],
  cacheStats: {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    hitRate: 0,
  } as CacheStats,
  isDebugMode: __DEV__,
};

/**
 * Performance monitoring hook for tracking app performance metrics
 * Provides utilities for measuring navigation, cache performance, and custom metrics
 */
export const usePerformanceMonitor = () => {
  const stateRef = useRef(globalPerformanceState);

  /**
   * Start tracking a performance metric
   * @param name Metric name/identifier
   * @param type Type of metric being tracked
   * @param metadata Additional data to store with the metric
   * @returns Metric ID for ending the measurement
   */
  const startMetric = useCallback(
    (
      name: string,
      type: PerformanceMetric['type'] = 'custom',
      metadata?: Record<string, any>,
    ): string => {
      const id = `${name}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const metric: PerformanceMetric = {
        id,
        name,
        startTime: Date.now(),
        type,
        metadata,
      };

      stateRef.current.metrics.set(id, metric);

      if (__DEV__) {
        // Only log in development and reduce frequency
        // console.log(`📊 Started tracking: ${name} (${type})`);
      }

      return id;
    },
    [],
  );

  /**
   * End tracking a performance metric
   * @param id Metric ID returned from startMetric
   */
  const endMetric = useCallback(
    async (id: string): Promise<PerformanceMetric | null> => {
      const metric = stateRef.current.metrics.get(id);
      if (!metric) {
        console.warn(`Performance metric with ID ${id} not found`);
        return null;
      }

      const endTime = Date.now();
      const duration = endTime - metric.startTime;

      const completedMetric: PerformanceMetric = {
        ...metric,
        endTime,
        duration,
      };

      stateRef.current.metrics.set(id, completedMetric);

      if (stateRef.current.isDebugMode) {
        console.log(`✅ Completed: ${metric.name} - ${duration}ms`);
      }

      // Store metric persistently for analysis
      await storeMetric(completedMetric);

      return completedMetric;
    },
    [],
  );

  /**
   * Track navigation performance
   * @param from Source screen
   * @param to Destination screen
   * @param duration Navigation duration in ms
   */
  const trackNavigation = useCallback(
    (from: string, to: string, duration: number): void => {
      const navigationMetric: NavigationMetric = {
        from,
        to,
        timestamp: Date.now(),
        duration,
      };

      stateRef.current.navigationHistory.push(navigationMetric);

      if (stateRef.current.isDebugMode) {
        console.log(`🧭 Navigation: ${from} → ${to} (${duration}ms)`);
      }

      // Keep only last 50 navigation records
      if (stateRef.current.navigationHistory.length > 50) {
        stateRef.current.navigationHistory =
          stateRef.current.navigationHistory.slice(-50);
      }
    },
    [],
  );

  /**
   * Track cache hit/miss statistics
   * @param isHit Whether the cache request was a hit or miss
   */
  const trackCacheHit = useCallback((isHit: boolean): void => {
    stateRef.current.cacheStats.totalRequests++;

    if (isHit) {
      stateRef.current.cacheStats.hits++;
    } else {
      stateRef.current.cacheStats.misses++;
    }

    stateRef.current.cacheStats.hitRate =
      stateRef.current.cacheStats.hits /
      stateRef.current.cacheStats.totalRequests;

    if (stateRef.current.isDebugMode) {
      console.log(
        `💾 Cache ${isHit ? 'HIT' : 'MISS'} - Hit rate: ${(
          stateRef.current.cacheStats.hitRate * 100
        ).toFixed(1)}%`,
      );
    }
  }, []);

  /**
   * Get performance statistics
   */
  const getStats = useCallback(() => {
    const completedMetrics = Array.from(
      stateRef.current.metrics.values(),
    ).filter(m => m.duration !== undefined);

    const averageMetricsByType: Record<string, number> = {};
    const metricsByType: Record<string, number[]> = {};

    completedMetrics.forEach(metric => {
      if (!metricsByType[metric.type]) {
        metricsByType[metric.type] = [];
      }
      metricsByType[metric.type].push(metric.duration!);
    });

    Object.keys(metricsByType).forEach(type => {
      const durations = metricsByType[type];
      averageMetricsByType[type] =
        durations.reduce((sum, duration) => sum + duration, 0) /
        durations.length;
    });

    return {
      metrics: completedMetrics,
      navigation: [...stateRef.current.navigationHistory],
      cache: {...stateRef.current.cacheStats},
      averageMetricsByType,
    };
  }, []);

  /**
   * Clear all performance data
   */
  const clearStats = useCallback((): void => {
    stateRef.current.metrics.clear();
    stateRef.current.navigationHistory = [];
    stateRef.current.cacheStats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      hitRate: 0,
    };

    if (stateRef.current.isDebugMode) {
      console.log('🧹 Performance stats cleared');
    }
  }, []);

  /**
   * Enable/disable debug mode
   */
  const setDebugMode = useCallback((enabled: boolean): void => {
    stateRef.current.isDebugMode = enabled;
  }, []);

  /**
   * Get current debug mode status
   */
  const isDebugEnabled = useCallback((): boolean => {
    return stateRef.current.isDebugMode;
  }, []);

  /**
   * Load stored metrics from AsyncStorage
   */
  const loadStoredMetrics = useCallback(async (): Promise<
    PerformanceMetric[]
  > => {
    try {
      const storedMetrics = await AsyncStorage.getItem('performance_metrics');
      return storedMetrics ? JSON.parse(storedMetrics) : [];
    } catch (error) {
      console.error('Failed to load stored metrics:', error);
      return [];
    }
  }, []);

  /**
   * Measure async operation performance
   * @param name Operation name
   * @param operation Async operation to measure
   */
  const measureAsync = useCallback(
    async <T>(name: string, operation: () => Promise<T>): Promise<T> => {
      const metricId = startMetric(name, 'custom');
      try {
        const result = await operation();
        await endMetric(metricId);
        return result;
      } catch (error) {
        await endMetric(metricId);
        throw error;
      }
    },
    [startMetric, endMetric],
  );

  /**
   * Take memory snapshot (placeholder for React Native)
   */
  const takeMemorySnapshot = useCallback((): void => {
    if (stateRef.current.isDebugMode) {
    }
  }, []);

  /**
   * Get detailed performance report
   */
  const getDetailedReport = useCallback((): string => {
    const stats = getStats();
    let report = '📊 PERFORMANCE REPORT\n';
    report += '==================\n\n';

    report += `🔄 Navigation Metrics:\n`;
    stats.navigation.forEach(nav => {
      report += `  ${nav.from} → ${nav.to}: ${nav.duration}ms\n`;
    });

    report += `\n💾 Cache Statistics:\n`;
    report += `  Hits: ${stats.cache.hits}\n`;
    report += `  Misses: ${stats.cache.misses}\n`;
    report += `  Hit Rate: ${(stats.cache.hitRate * 100).toFixed(1)}%\n`;

    report += `\n⏱️ Average Metrics by Type:\n`;
    Object.entries(stats.averageMetricsByType).forEach(([type, avg]) => {
      report += `  ${type}: ${avg.toFixed(2)}ms\n`;
    });

    return report;
  }, [getStats]);

  /**
   * Export metrics as JSON string
   */
  const exportMetrics = useCallback((): string => {
    const stats = getStats();
    return JSON.stringify(stats, null, 2);
  }, [getStats]);

  /**
   * Get real-time performance data
   */
  const getRealTimeData = useCallback(() => {
    return {
      recentMemory: [{usage: 0, timestamp: Date.now()}], // Placeholder
      activeMetrics: Array.from(stateRef.current.metrics.values()).filter(
        m => !m.duration,
      ),
      systemHealth: 'good' as const,
    };
  }, []);

  /**
   * Clear all metrics
   */
  const clearMetrics = useCallback((): void => {
    clearStats();
  }, [clearStats]);

  return {
    startMetric,
    endMetric,
    trackNavigation,
    trackCacheHit,
    getStats,
    clearStats,
    setDebugMode,
    isDebugEnabled,
    loadStoredMetrics,
    measureAsync,
    takeMemorySnapshot,
    getDetailedReport,
    exportMetrics,
    getRealTimeData,
    clearMetrics,
  };
};

/**
 * Store metric persistently for later analysis
 */
const storeMetric = async (metric: PerformanceMetric): Promise<void> => {
  try {
    const existingMetrics = await AsyncStorage.getItem('performance_metrics');
    const metrics: PerformanceMetric[] = existingMetrics
      ? JSON.parse(existingMetrics)
      : [];

    metrics.push(metric);

    // Keep only last 100 metrics to prevent storage bloat
    const trimmedMetrics = metrics.slice(-100);

    await AsyncStorage.setItem(
      'performance_metrics',
      JSON.stringify(trimmedMetrics),
    );
  } catch (error) {
    console.error('Failed to store performance metric:', error);
  }
};

// Legacy singleton instance for backward compatibility
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private navigationHistory: NavigationMetric[] = [];
  private cacheStats: CacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    hitRate: 0,
  };
  private isDebugMode: boolean = __DEV__;

  startMetric(
    name: string,
    type: PerformanceMetric['type'] = 'custom',
    metadata?: Record<string, any>,
  ): string {
    const id = `${name}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const metric: PerformanceMetric = {
      id,
      name,
      startTime: Date.now(),
      type,
      metadata,
    };

    this.metrics.set(id, metric);

    if (this.isDebugMode && Math.random() > 0.9) {
      // Only log 10% of the time to reduce spam
      // console.log(`📊 Started tracking: ${name} (${type})`);
    }

    return id;
  }

  async endMetric(id: string): Promise<PerformanceMetric | null> {
    const metric = this.metrics.get(id);
    if (!metric) {
      console.warn(`Performance metric with ID ${id} not found`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    const completedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration,
    };

    this.metrics.set(id, completedMetric);

    if (this.isDebugMode) {
      console.log(`✅ Completed: ${metric.name} - ${duration}ms`);
    }

    await storeMetric(completedMetric);
    return completedMetric;
  }

  trackNavigation(from: string, to: string, duration: number): void {
    const navigationMetric: NavigationMetric = {
      from,
      to,
      timestamp: Date.now(),
      duration,
    };

    this.navigationHistory.push(navigationMetric);

    if (this.isDebugMode) {
      console.log(`🧭 Navigation: ${from} → ${to} (${duration}ms)`);
    }

    if (this.navigationHistory.length > 50) {
      this.navigationHistory = this.navigationHistory.slice(-50);
    }
  }

  trackCacheHit(isHit: boolean): void {
    this.cacheStats.totalRequests++;

    if (isHit) {
      this.cacheStats.hits++;
    } else {
      this.cacheStats.misses++;
    }

    this.cacheStats.hitRate =
      this.cacheStats.hits / this.cacheStats.totalRequests;

    if (this.isDebugMode) {
      console.log(
        `💾 Cache ${isHit ? 'HIT' : 'MISS'} - Hit rate: ${(
          this.cacheStats.hitRate * 100
        ).toFixed(1)}%`,
      );
    }
  }

  getStats() {
    const completedMetrics = Array.from(this.metrics.values()).filter(
      m => m.duration !== undefined,
    );

    const averageMetricsByType: Record<string, number> = {};
    const metricsByType: Record<string, number[]> = {};

    completedMetrics.forEach(metric => {
      if (!metricsByType[metric.type]) {
        metricsByType[metric.type] = [];
      }
      metricsByType[metric.type].push(metric.duration!);
    });

    Object.keys(metricsByType).forEach(type => {
      const durations = metricsByType[type];
      averageMetricsByType[type] =
        durations.reduce((sum, duration) => sum + duration, 0) /
        durations.length;
    });

    return {
      metrics: completedMetrics,
      navigation: [...this.navigationHistory],
      cache: {...this.cacheStats},
      averageMetricsByType,
    };
  }

  clearStats(): void {
    this.metrics.clear();
    this.navigationHistory = [];
    this.cacheStats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      hitRate: 0,
    };

    if (this.isDebugMode) {
      console.log('🧹 Performance stats cleared');
    }
  }

  setDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled;
  }

  isDebugEnabled(): boolean {
    return this.isDebugMode;
  }

  async loadStoredMetrics(): Promise<PerformanceMetric[]> {
    try {
      const storedMetrics = await AsyncStorage.getItem('performance_metrics');
      return storedMetrics ? JSON.parse(storedMetrics) : [];
    } catch (error) {
      console.error('Failed to load stored metrics:', error);
      return [];
    }
  }

  async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const metricId = this.startMetric(name, 'custom');
    try {
      const result = await operation();
      await this.endMetric(metricId);
      return result;
    } catch (error) {
      await this.endMetric(metricId);
      throw error;
    }
  }

  takeMemorySnapshot(): void {
    if (this.isDebugMode) {
    }
  }

  getDetailedReport(): string {
    const stats = this.getStats();
    let report = '📊 PERFORMANCE REPORT\n';
    report += '==================\n\n';

    report += `🔄 Navigation Metrics:\n`;
    stats.navigation.forEach(nav => {
      report += `  ${nav.from} → ${nav.to}: ${nav.duration}ms\n`;
    });

    report += `\n💾 Cache Statistics:\n`;
    report += `  Hits: ${stats.cache.hits}\n`;
    report += `  Misses: ${stats.cache.misses}\n`;
    report += `  Hit Rate: ${(stats.cache.hitRate * 100).toFixed(1)}%\n`;

    report += `\n⏱️ Average Metrics by Type:\n`;
    Object.entries(stats.averageMetricsByType).forEach(([type, avg]) => {
      report += `  ${type}: ${avg.toFixed(2)}ms\n`;
    });

    return report;
  }

  exportMetrics(): string {
    const stats = this.getStats();
    return JSON.stringify(stats, null, 2);
  }

  getRealTimeData() {
    return {
      recentMemory: [{usage: 0, timestamp: Date.now()}], // Placeholder
      activeMetrics: Array.from(this.metrics.values()).filter(m => !m.duration),
      systemHealth: 'good' as const,
    };
  }

  clearMetrics(): void {
    this.clearStats();
  }
}

// Export singleton instance for backward compatibility
export const performanceMonitor = new PerformanceMonitor();
