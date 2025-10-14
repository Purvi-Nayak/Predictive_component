import {performanceMonitor} from './performanceMonitor';
import {getPreloadManager} from './preloadManager';

export class DemoUtils {
  // Generate a comprehensive performance report
  static generatePerformanceReport(): string {
    const manager = getPreloadManager();
    const perfReport = performanceMonitor.getDetailedReport();

    let report = '🎯 PREDICTIVE PRELOADING DEMO REPORT\n';
    report += '=====================================\n\n';

    if (manager) {
      const stats = manager.getStats();

      report += '📊 Preload Manager Statistics:\n';
      report += `  Image Preloader - Loaded: ${stats.imagePreloader.preloadedCount}, Failed: ${stats.imagePreloader.failedCount}\n`;
      report += `  Component Loader - Loaded: ${stats.componentLoader.loadedCount}, Failed: ${stats.componentLoader.failedCount}\n`;
      report += `  Cache Hit Rate: ${stats.cache.hitRate.toFixed(1)}%\n`;
      report += `  Queue Length: ${stats.queueLength}\n`;
      report += `  Navigation History: ${stats.navigationHistory.join(
        ' → ',
      )}\n\n`;
    }

    report += perfReport;

    return report;
  }

  // Simulate heavy load for testing
  static async simulateHeavyLoad(): Promise<void> {
    const manager = getPreloadManager();
    if (!manager) return;

    console.log('🔥 Starting heavy load simulation...');

    // Simulate multiple screen navigations
    const screens = ['Home', 'Profile', 'Products', 'Gallery', 'Home'];

    for (const screen of screens) {
      manager.onNavigate(screen);
      await manager.preloadForScreen(screen);

      // Simulate user staying on screen
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Heavy load simulation completed');
  }

  // Test cache performance
  static async testCachePerformance(): Promise<{
    hits: number;
    misses: number;
    avgTime: number;
  }> {
    const manager = getPreloadManager();
    if (!manager) return {hits: 0, misses: 0, avgTime: 0};

    const testUrls = [
      'https://jsonplaceholder.typicode.com/posts/1',
      'https://jsonplaceholder.typicode.com/posts/2',
      'https://jsonplaceholder.typicode.com/posts/3',
    ];

    let hits = 0;
    let misses = 0;
    const times: number[] = [];

    // First pass - should be cache misses
    for (const url of testUrls) {
      const startTime = Date.now();
      try {
        const response = await fetch(url);
        await response.json();
        times.push(Date.now() - startTime);
        misses++;
      } catch (error) {
        console.error('Cache test error:', error);
      }
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Second pass - should be cache hits (if implemented)
    for (const url of testUrls) {
      const startTime = Date.now();
      try {
        const response = await fetch(url);
        await response.json();
        times.push(Date.now() - startTime);
        hits++;
      } catch (error) {
        console.error('Cache test error:', error);
      }
    }

    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;

    return {hits, misses, avgTime};
  }

  // Memory stress test
  static async memoryStressTest(): Promise<void> {
    console.log('🧠 Starting memory stress test...');

    const manager = getPreloadManager();
    if (!manager) return;

    // Take initial memory snapshot
    performanceMonitor.takeMemorySnapshot();

    // Simulate loading many assets
    const mockImageUrls = Array.from(
      {length: 50},
      (_, i) => `https://picsum.photos/200/200?random=${i}`,
    );

    try {
      await manager.preloadImages(mockImageUrls, 'low');

      // Take final memory snapshot
      performanceMonitor.takeMemorySnapshot();

      console.log('✅ Memory stress test completed');
    } catch (error) {
      console.error('❌ Memory stress test failed:', error);
    }
  }

  // Benchmark different strategies
  static async benchmarkStrategies(): Promise<Record<string, number>> {
    const strategies = ['eager', 'lazy', 'smart'] as const;
    const results: Record<string, number> = {};

    for (const strategy of strategies) {
      console.log(`📊 Benchmarking ${strategy} strategy...`);

      const startTime = Date.now();

      // Simulate strategy execution
      await new Promise(resolve => {
        setTimeout(
          resolve,
          strategy === 'eager' ? 2000 : strategy === 'lazy' ? 500 : 1000,
        );
      });

      results[strategy] = Date.now() - startTime;
    }

    return results;
  }

  // Export performance data for analysis
  static exportPerformanceData(): string {
    const manager = getPreloadManager();
    const perfData = performanceMonitor.exportMetrics();

    const exportData = {
      timestamp: new Date().toISOString(),
      preloadManager: manager ? manager.getStats() : null,
      performanceMetrics: JSON.parse(perfData),
      deviceInfo: {
        platform: 'android', // Since we're Android-only
        timestamp: Date.now(),
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Clear all caches and reset
  static async resetSystem(): Promise<void> {
    console.log('🧹 Resetting predictive preloading system...');

    const manager = getPreloadManager();
    if (manager) {
      await manager.clearAllCaches();
    }

    performanceMonitor.clearMetrics();

    console.log('✅ System reset completed');
  }

  // Get real-time system status
  static getSystemStatus(): {
    isHealthy: boolean;
    cacheSize: number;
    memoryUsage: number;
    errors: string[];
  } {
    const manager = getPreloadManager();
    const realtimeData = performanceMonitor.getRealTimeData();

    const errors: string[] = [];
    let isHealthy = true;

    if (manager) {
      const stats = manager.getStats();

      // Check for high error rates
      if (
        stats.imagePreloader.failedCount >
        stats.imagePreloader.preloadedCount * 0.5
      ) {
        errors.push('High image preload failure rate');
        isHealthy = false;
      }

      if (stats.cache.hitRate < 50) {
        errors.push('Low cache hit rate');
        isHealthy = false;
      }
    }

    // Check memory usage
    const memoryUsage =
      realtimeData.recentMemory.length > 0
        ? realtimeData.recentMemory[realtimeData.recentMemory.length - 1].usage
        : 0;

    if (memoryUsage > 200) {
      // 200MB threshold
      errors.push('High memory usage detected');
      isHealthy = false;
    }

    return {
      isHealthy,
      cacheSize: manager ? manager.getStats().cache.totalItems : 0,
      memoryUsage,
      errors,
    };
  }
}
