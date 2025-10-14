import {useImagePreloader} from '../hooks/useImagePreloader';
import {useAssetCache} from '../hooks/useAssetCache';
import {useComponentLoader} from '../hooks/useComponentLoader';
import {PreloadGroups, RemoteImages, ApiEndpoints} from '../assets';

export interface PreloadStrategy {
  images: 'eager' | 'lazy' | 'predictive';
  components: 'eager' | 'lazy' | 'predictive';
  data: 'eager' | 'lazy' | 'predictive';
}

export interface PreloadManagerConfig {
  strategy: PreloadStrategy;
  maxConcurrentImages: number;
  maxConcurrentComponents: number;
  imagePriority: 'low' | 'normal' | 'high';
  enablePerformanceMonitoring: boolean;
}

export class PreloadManager {
  private config: PreloadManagerConfig;
  private imagePreloader: ReturnType<typeof useImagePreloader>;
  private assetCache: ReturnType<typeof useAssetCache>;
  private componentLoader: ReturnType<typeof useComponentLoader>;
  private navigationHistory: string[] = [];
  private preloadQueue: Array<{
    type: 'image' | 'component' | 'data';
    payload: any;
    priority: 'low' | 'normal' | 'high';
  }> = [];
  private criticalAssetsPreloaded: boolean = false;
  private preloadedScreens: Set<string> = new Set();

  constructor(
    config: Partial<PreloadManagerConfig> = {},
    hooks: {
      imagePreloader: ReturnType<typeof useImagePreloader>;
      assetCache: ReturnType<typeof useAssetCache>;
      componentLoader: ReturnType<typeof useComponentLoader>;
    },
  ) {
    this.config = {
      strategy: {
        images: 'predictive',
        components: 'lazy',
        data: 'predictive',
      },
      maxConcurrentImages: 3,
      maxConcurrentComponents: 2,
      imagePriority: 'normal',
      enablePerformanceMonitoring: true,
      ...config,
    };

    this.imagePreloader = hooks.imagePreloader;
    this.assetCache = hooks.assetCache;
    this.componentLoader = hooks.componentLoader;
  }

  // Preload assets for a specific screen
  async preloadForScreen(screenName: string): Promise<void> {
    if (this.preloadedScreens.has(screenName)) {
      return; // Already preloaded, skip silently
    }

    console.log(`🚀 Preloading assets for screen: ${screenName}`);
    this.preloadedScreens.add(screenName);

    const group = PreloadGroups[screenName as keyof typeof PreloadGroups];
    if (!group) {
      console.warn(`No preload group found for screen: ${screenName}`);
      return;
    }

    const startTime = Date.now();

    try {
      // Preload images
      if (group.images && group.images.length > 0) {
        await this.preloadImages(group.images, this.config.imagePriority);
      }

      // Preload API data
      if (group.apis && group.apis.length > 0) {
        await this.preloadApiData(group.apis, screenName);
      }

      const endTime = Date.now();
      console.log(
        `✅ Preloading completed for ${screenName} in ${endTime - startTime}ms`,
      );
    } catch (error) {
      console.error(`❌ Preloading failed for ${screenName}:`, error);
      // Remove from preloaded set if failed, so it can be retried
      this.preloadedScreens.delete(screenName);
    }
  }

  // Preload images with strategy
  async preloadImages(
    imageUrls: string[],
    priority: 'low' | 'normal' | 'high' = 'normal',
  ): Promise<void> {
    switch (this.config.strategy.images) {
      case 'eager':
        await this.imagePreloader.preloadRemoteImages(imageUrls, priority);
        break;
      case 'lazy':
        // Add to queue for later processing
        this.preloadQueue.push({
          type: 'image',
          payload: {imageUrls, priority},
          priority,
        });
        break;
      case 'predictive':
        // Use intelligent preloading based on user behavior
        await this.predictiveImagePreload(imageUrls, priority);
        break;
    }
  }

  // Preload API data
  async preloadApiData(apiUrls: string[], context: string): Promise<void> {
    const promises = apiUrls.map(async url => {
      const cacheKey = `api:${context}:${url}`;

      return this.assetCache.fetchWithCache(
        cacheKey,
        async () => {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
          }
          return response.json();
        },
        60 * 60 * 1000, // 1 hour TTL
      );
    });

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error(`❌ API preloading failed for context ${context}:`, error);
    }
  }

  // Intelligent image preloading based on patterns
  private async predictiveImagePreload(
    imageUrls: string[],
    priority: 'low' | 'normal' | 'high',
  ): Promise<void> {
    // Check network conditions
    const isWifi = await this.isOnWifi();
    const batteryLevel = await this.getBatteryLevel();

    // Adjust strategy based on conditions
    if (!isWifi || batteryLevel < 20) {
      // Only preload critical images
      const criticalImages = imageUrls.slice(0, Math.min(2, imageUrls.length));
      await this.imagePreloader.preloadRemoteImages(criticalImages, 'low');
    } else {
      // Full preloading
      await this.imagePreloader.preloadRemoteImages(imageUrls, priority);
    }
  }

  // Process queued preload items during idle time
  async processQueue(): Promise<void> {
    if (this.preloadQueue.length === 0) return;

    // Sort by priority
    this.preloadQueue.sort((a, b) => {
      const priorityOrder = {high: 3, normal: 2, low: 1};
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Process items
    const processPromises = this.preloadQueue.splice(0, 5).map(async item => {
      try {
        switch (item.type) {
          case 'image':
            await this.imagePreloader.preloadRemoteImages(
              item.payload.imageUrls,
              item.payload.priority,
            );
            break;
          case 'component':
            await this.componentLoader.preloadComponent(
              item.payload.name,
              item.payload.importFunction,
            );
            break;
        }
      } catch (error) {
        console.error('Failed to process queue item:', error);
      }
    });

    await Promise.allSettled(processPromises);
  }

  // Track navigation for predictive preloading
  onNavigate(screenName: string): void {
    this.navigationHistory.push(screenName);

    // Keep only recent history (last 10 navigations)
    if (this.navigationHistory.length > 10) {
      this.navigationHistory = this.navigationHistory.slice(-10);
    }

    // Trigger predictive preloading for likely next screens
    this.componentLoader.smartPreload(screenName, this.navigationHistory);
  }

  // Get preload statistics
  getStats() {
    return {
      imagePreloader: this.imagePreloader.result,
      componentLoader: this.componentLoader.result,
      cache: this.assetCache.stats,
      queueLength: this.preloadQueue.length,
      navigationHistory: this.navigationHistory,
    };
  }

  // Clear all caches
  async clearAllCaches(): Promise<void> {
    console.log('🧹 Clearing all caches...');
    await Promise.all([
      this.imagePreloader.clearImageCache(),
      this.assetCache.clearCache(),
    ]);
    this.preloadQueue = [];
    this.navigationHistory = [];
    this.preloadedScreens.clear();
    this.criticalAssetsPreloaded = false;
    console.log('✅ All caches cleared');
  }

  // Helper methods for network and device conditions
  private async isOnWifi(): Promise<boolean> {
    // In a real app, you'd use @react-native-community/netinfo
    // For now, return true as default
    return true;
  }

  private async getBatteryLevel(): Promise<number> {
    // In a real app, you'd use react-native-device-info
    // For now, return 80 as default
    return 80;
  }

  // Preload critical assets immediately on app start
  async preloadCriticalAssets(): Promise<void> {
    if (this.criticalAssetsPreloaded) {
      return; // Already preloaded, skip silently
    }

    console.log('🎯 Preloading critical assets...');
    this.criticalAssetsPreloaded = true;

    const criticalImages = [RemoteImages.userProfile, RemoteImages.banner];
    const criticalApis = [ApiEndpoints.userProfile];

    await Promise.all([
      this.preloadImages(criticalImages, 'high'),
      this.preloadApiData(criticalApis, 'critical'),
    ]);

    console.log('✅ Critical assets preloaded');
  }
}

// Singleton instance
let preloadManagerInstance: PreloadManager | null = null;

export const createPreloadManager = (
  config: Partial<PreloadManagerConfig> = {},
  hooks: {
    imagePreloader: ReturnType<typeof useImagePreloader>;
    assetCache: ReturnType<typeof useAssetCache>;
    componentLoader: ReturnType<typeof useComponentLoader>;
  },
): PreloadManager => {
  if (!preloadManagerInstance) {
    preloadManagerInstance = new PreloadManager(config, hooks);
  }
  return preloadManagerInstance;
};

export const getPreloadManager = (): PreloadManager | null => {
  return preloadManagerInstance;
};
