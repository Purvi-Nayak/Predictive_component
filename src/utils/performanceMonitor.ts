interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface NavigationMetric {
  from: string;
  to: string;
  timestamp: number;
  duration: number;
  preloadTime?: number;
}

interface ResourceMetric {
  type: 'image' | 'api' | 'component';
  url: string;
  size?: number;
  loadTime: number;
  cached: boolean;
  timestamp: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private navigationMetrics: NavigationMetric[] = [];
  private resourceMetrics: ResourceMetric[] = [];
  private memorySnapshots: Array<{timestamp: number; usage: number}> = [];
  private readonly maxMetrics: number = 1000;

  // Start measuring a performance metric
  startMetric(name: string, metadata?: Record<string, any>): string {
    const metricId = `${name}_${Date.now()}_${Math.random()}`;
    const startTime = Date.now();

    this.metrics.push({
      name: metricId,
      startTime,
      metadata,
    });

    return metricId;
  }

  // End measuring a performance metric
  endMetric(metricId: string): number | null {
    const metric = this.metrics.find(m => m.name === metricId);

    if (!metric) {
      console.warn(`Metric not found: ${metricId}`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    this.cleanupOldMetrics();

    return duration;
  }

  // Measure a function execution time
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
  ): Promise<{result: T; duration: number}> {
    const metricId = this.startMetric(name, metadata);

    try {
      const result = await fn();
      const duration = this.endMetric(metricId) || 0;

      return {result, duration};
    } catch (error) {
      this.endMetric(metricId);
      throw error;
    }
  }

  // Measure synchronous function execution time
  measure<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>,
  ): {result: T; duration: number} {
    const startTime = Date.now();

    try {
      const result = fn();
      const duration = Date.now() - startTime;

      this.metrics.push({
        name,
        startTime,
        endTime: startTime + duration,
        duration,
        metadata,
      });

      this.cleanupOldMetrics();

      return {result, duration};
    } catch (error) {
      const duration = Date.now() - startTime;

      this.metrics.push({
        name,
        startTime,
        endTime: startTime + duration,
        duration,
        metadata: {
          ...metadata,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      this.cleanupOldMetrics();
      throw error;
    }
  }

  // Track navigation performance
  trackNavigation(
    from: string,
    to: string,
    duration: number,
    preloadTime?: number,
  ): void {
    this.navigationMetrics.push({
      from,
      to,
      timestamp: Date.now(),
      duration,
      preloadTime,
    });

    // Keep only recent navigation metrics
    if (this.navigationMetrics.length > 100) {
      this.navigationMetrics = this.navigationMetrics.slice(-100);
    }
  }

  // Track resource loading performance
  trackResourceLoad(
    type: 'image' | 'api' | 'component',
    url: string,
    loadTime: number,
    cached: boolean,
    size?: number,
  ): void {
    this.resourceMetrics.push({
      type,
      url,
      size,
      loadTime,
      cached,
      timestamp: Date.now(),
    });

    // Keep only recent resource metrics
    if (this.resourceMetrics.length > 500) {
      this.resourceMetrics = this.resourceMetrics.slice(-500);
    }
  }

  // Take a memory usage snapshot
  takeMemorySnapshot(): void {
    // In a real implementation, you'd use native modules to get actual memory usage
    // For now, we'll simulate it
    const simulatedMemoryUsage = Math.random() * 100 + 50; // 50-150 MB

    this.memorySnapshots.push({
      timestamp: Date.now(),
      usage: simulatedMemoryUsage,
    });

    // Keep only recent snapshots
    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots = this.memorySnapshots.slice(-100);
    }
  }

  // Get performance statistics
  getStats(): {
    averageMetrics: Record<
      string,
      {average: number; count: number; min: number; max: number}
    >;
    navigationStats: {
      averageNavigationTime: number;
      slowestNavigations: NavigationMetric[];
      preloadEfficiency: number;
    };
    resourceStats: {
      cacheHitRate: number;
      averageLoadTimes: Record<string, number>;
      slowestResources: ResourceMetric[];
    };
    memoryStats: {
      average: number;
      peak: number;
      current: number;
    };
  } {
    // Calculate average metrics
    const metricGroups: Record<string, number[]> = {};

    this.metrics.forEach(metric => {
      if (metric.duration !== undefined) {
        const baseName = metric.name.split('_')[0];
        if (!metricGroups[baseName]) {
          metricGroups[baseName] = [];
        }
        metricGroups[baseName].push(metric.duration);
      }
    });

    const averageMetrics: Record<
      string,
      {average: number; count: number; min: number; max: number}
    > = {};

    Object.entries(metricGroups).forEach(([name, durations]) => {
      averageMetrics[name] = {
        average: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        count: durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
      };
    });

    // Navigation statistics
    const navigationTimes = this.navigationMetrics.map(n => n.duration);
    const averageNavigationTime =
      navigationTimes.length > 0
        ? navigationTimes.reduce((sum, t) => sum + t, 0) /
          navigationTimes.length
        : 0;

    const slowestNavigations = this.navigationMetrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    const preloadedNavigations = this.navigationMetrics.filter(
      n => n.preloadTime !== undefined,
    );
    const preloadEfficiency =
      preloadedNavigations.length > 0
        ? preloadedNavigations.reduce(
            (sum, n) => sum + (n.preloadTime || 0),
            0,
          ) / preloadedNavigations.length
        : 0;

    // Resource statistics
    const cachedResources = this.resourceMetrics.filter(r => r.cached).length;
    const cacheHitRate =
      this.resourceMetrics.length > 0
        ? (cachedResources / this.resourceMetrics.length) * 100
        : 0;

    const resourceLoadTimes: Record<string, number[]> = {};
    this.resourceMetrics.forEach(resource => {
      if (!resourceLoadTimes[resource.type]) {
        resourceLoadTimes[resource.type] = [];
      }
      resourceLoadTimes[resource.type].push(resource.loadTime);
    });

    const averageLoadTimes: Record<string, number> = {};
    Object.entries(resourceLoadTimes).forEach(([type, times]) => {
      averageLoadTimes[type] =
        times.reduce((sum, t) => sum + t, 0) / times.length;
    });

    const slowestResources = this.resourceMetrics
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, 10);

    // Memory statistics
    const memoryUsages = this.memorySnapshots.map(s => s.usage);
    const memoryStats = {
      average:
        memoryUsages.length > 0
          ? memoryUsages.reduce((sum, u) => sum + u, 0) / memoryUsages.length
          : 0,
      peak: memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0,
      current:
        memoryUsages.length > 0 ? memoryUsages[memoryUsages.length - 1] : 0,
    };

    return {
      averageMetrics,
      navigationStats: {
        averageNavigationTime,
        slowestNavigations,
        preloadEfficiency,
      },
      resourceStats: {
        cacheHitRate,
        averageLoadTimes,
        slowestResources,
      },
      memoryStats,
    };
  }

  // Get detailed performance report
  getDetailedReport(): string {
    const stats = this.getStats();

    let report = '📊 Performance Monitor Report\n';
    report += '================================\n\n';

    // Metrics summary
    report += '🔍 Metrics Summary:\n';
    Object.entries(stats.averageMetrics).forEach(([name, data]) => {
      report += `  ${name}: avg ${data.average.toFixed(2)}ms (${
        data.count
      } samples, min: ${data.min}ms, max: ${data.max}ms)\n`;
    });

    // Navigation performance
    report += '\n🧭 Navigation Performance:\n';
    report += `  Average navigation time: ${stats.navigationStats.averageNavigationTime.toFixed(
      2,
    )}ms\n`;
    report += `  Preload efficiency: ${stats.navigationStats.preloadEfficiency.toFixed(
      2,
    )}ms\n`;

    if (stats.navigationStats.slowestNavigations.length > 0) {
      report += '  Slowest navigations:\n';
      stats.navigationStats.slowestNavigations.forEach(nav => {
        report += `    ${nav.from} → ${nav.to}: ${nav.duration}ms\n`;
      });
    }

    // Resource performance
    report += '\n📦 Resource Performance:\n';
    report += `  Cache hit rate: ${stats.resourceStats.cacheHitRate.toFixed(
      1,
    )}%\n`;

    Object.entries(stats.resourceStats.averageLoadTimes).forEach(
      ([type, time]) => {
        report += `  Average ${type} load time: ${time.toFixed(2)}ms\n`;
      },
    );

    // Memory usage
    report += '\n💾 Memory Usage:\n';
    report += `  Average: ${stats.memoryStats.average.toFixed(1)}MB\n`;
    report += `  Peak: ${stats.memoryStats.peak.toFixed(1)}MB\n`;
    report += `  Current: ${stats.memoryStats.current.toFixed(1)}MB\n`;

    return report;
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
    this.navigationMetrics = [];
    this.resourceMetrics = [];
    this.memorySnapshots = [];
  }

  // Get real-time performance data for monitoring
  getRealTimeData() {
    const recentMetrics = this.metrics.slice(-10);
    const recentNavigation = this.navigationMetrics.slice(-5);
    const recentResources = this.resourceMetrics.slice(-20);
    const recentMemory = this.memorySnapshots.slice(-10);

    return {
      recentMetrics,
      recentNavigation,
      recentResources,
      recentMemory,
      timestamp: Date.now(),
    };
  }

  // Cleanup old metrics to prevent memory leaks
  private cleanupOldMetrics(): void {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // Export metrics to JSON for analysis
  exportMetrics(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        navigationMetrics: this.navigationMetrics,
        resourceMetrics: this.resourceMetrics,
        memorySnapshots: this.memorySnapshots,
        exportedAt: Date.now(),
      },
      null,
      2,
    );
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
