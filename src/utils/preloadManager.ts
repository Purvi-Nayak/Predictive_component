import React, {useRef, useCallback} from 'react';
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

/**
 * Modern functional preload manager using hooks
 */
export const usePreloadManager = (
  config: Partial<PreloadManagerConfig> = {},
) => {
  const configRef = useRef<PreloadManagerConfig>({
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
  });

  const navigationHistoryRef = useRef<string[]>([]);
  const preloadQueueRef = useRef<
    Array<{
      type: 'image' | 'component' | 'data';
      payload: any;
      priority: 'low' | 'normal' | 'high';
    }>
  >([]);
  const criticalAssetsPreloadedRef = useRef<boolean>(false);
  const preloadedScreensRef = useRef<Set<string>>(new Set());

  // Hook dependencies
  const imagePreloader = useImagePreloader();
  const assetCache = useAssetCache();
  const componentLoader = useComponentLoader();

  // Preload assets for a specific screen
  const preloadForScreen = useCallback(
    async (screenName: string): Promise<void> => {
      if (preloadedScreensRef.current.has(screenName)) {
        return; // Already preloaded, skip silently
      }

      console.log(`🚀 Preloading assets for screen: ${screenName}`);
      preloadedScreensRef.current.add(screenName);

      const group = PreloadGroups[screenName as keyof typeof PreloadGroups];
      if (!group) {
        console.warn(`No preload group found for screen: ${screenName}`);
        return;
      }

      const startTime = Date.now();

      try {
        // Preload images
        if (group.images && group.images.length > 0) {
          await preloadImages(group.images, configRef.current.imagePriority);
        }

        // Preload API data
        if (group.apis && group.apis.length > 0) {
          await preloadApiData(group.apis, screenName);
        }

        const endTime = Date.now();
        console.log(
          `✅ Preloading completed for ${screenName} in ${
            endTime - startTime
          }ms`,
        );
      } catch (error) {
        console.error(`❌ Preloading failed for ${screenName}:`, error);
        // Remove from preloaded set if failed, so it can be retried
        preloadedScreensRef.current.delete(screenName);
      }
    },
    [],
  );

  // Preload images with strategy
  const preloadImages = useCallback(
    async (
      imageUrls: string[],
      priority: 'low' | 'normal' | 'high' = 'normal',
    ): Promise<void> => {
      switch (configRef.current.strategy.images) {
        case 'eager':
          await imagePreloader.preloadRemoteImages(imageUrls, priority);
          break;
        case 'lazy':
          // Add to queue for later processing
          preloadQueueRef.current.push({
            type: 'image',
            payload: {imageUrls, priority},
            priority,
          });
          break;
        case 'predictive':
          // Use intelligent preloading based on user behavior
          await predictiveImagePreload(imageUrls, priority);
          break;
      }
    },
    [imagePreloader],
  );

  // Preload API data
  const preloadApiData = useCallback(
    async (apiUrls: string[], context: string): Promise<void> => {
      const promises = apiUrls.map(async url => {
        const cacheKey = `api:${context}:${url}`;

        return assetCache.fetchWithCache(
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
        console.error(
          `❌ API preloading failed for context ${context}:`,
          error,
        );
      }
    },
    [assetCache],
  );

  // Intelligent image preloading based on patterns
  const predictiveImagePreload = useCallback(
    async (
      imageUrls: string[],
      priority: 'low' | 'normal' | 'high',
    ): Promise<void> => {
      // Check network conditions
      const isWifi = await isOnWifi();
      const batteryLevel = await getBatteryLevel();

      // Adjust strategy based on conditions
      if (!isWifi || batteryLevel < 20) {
        // Only preload critical images
        const criticalImages = imageUrls.slice(
          0,
          Math.min(2, imageUrls.length),
        );
        await imagePreloader.preloadRemoteImages(criticalImages, 'low');
      } else {
        // Full preloading
        await imagePreloader.preloadRemoteImages(imageUrls, priority);
      }
    },
    [imagePreloader],
  );

  // Process queued preload items during idle time
  const processQueue = useCallback(async (): Promise<void> => {
    if (preloadQueueRef.current.length === 0) return;

    // Sort by priority
    preloadQueueRef.current.sort((a: any, b: any) => {
      const priorityOrder: Record<string, number> = {
        high: 3,
        normal: 2,
        low: 1,
      };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Process items
    const processPromises = preloadQueueRef.current
      .splice(0, 5)
      .map(async (item: any) => {
        try {
          switch (item.type) {
            case 'image':
              await imagePreloader.preloadRemoteImages(
                item.payload.imageUrls,
                item.payload.priority,
              );
              break;
            case 'component':
              await componentLoader.preloadComponent(
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
  }, [imagePreloader, componentLoader]);

  // Track navigation for predictive preloading
  const onNavigate = useCallback(
    (screenName: string): void => {
      navigationHistoryRef.current.push(screenName);

      // Keep only recent history (last 10 navigations)
      if (navigationHistoryRef.current.length > 10) {
        navigationHistoryRef.current = navigationHistoryRef.current.slice(-10);
      }

      // Trigger predictive preloading for likely next screens
      componentLoader.smartPreload(screenName, navigationHistoryRef.current);
    },
    [componentLoader],
  );

  // Get preload statistics
  const getStats = useCallback(() => {
    return {
      imagePreloader: imagePreloader.result,
      componentLoader: componentLoader.result,
      cache: assetCache.stats,
      queueLength: preloadQueueRef.current.length,
      navigationHistory: navigationHistoryRef.current,
    };
  }, [imagePreloader, componentLoader, assetCache]);

  // Clear all caches
  const clearAllCaches = useCallback(async (): Promise<void> => {
    console.log('🧹 Clearing all caches...');
    await Promise.all([
      imagePreloader.clearImageCache(),
      assetCache.clearCache(),
    ]);
    preloadQueueRef.current = [];
    navigationHistoryRef.current = [];
    preloadedScreensRef.current.clear();
    criticalAssetsPreloadedRef.current = false;
    console.log('✅ All caches cleared');
  }, [imagePreloader, assetCache]);

  // Helper methods for network and device conditions
  const isOnWifi = useCallback(async (): Promise<boolean> => {
    // In a real app, you'd use @react-native-community/netinfo
    // For now, return true as default
    return true;
  }, []);

  const getBatteryLevel = useCallback(async (): Promise<number> => {
    // In a real app, you'd use react-native-device-info
    // For now, return 80 as default
    return 80;
  }, []);

  // Preload critical assets immediately on app start
  const preloadCriticalAssets = useCallback(async (): Promise<void> => {
    if (criticalAssetsPreloadedRef.current) {
      return; // Already preloaded, skip silently
    }

    console.log('🎯 Preloading critical assets...');
    criticalAssetsPreloadedRef.current = true;

    const criticalImages = [RemoteImages.userProfile, RemoteImages.banner];
    const criticalApis = [ApiEndpoints.userProfile];

    await Promise.all([
      preloadImages(criticalImages, 'high'),
      preloadApiData(criticalApis, 'critical'),
    ]);

    console.log('✅ Critical assets preloaded');
  }, [preloadImages, preloadApiData]);

  return {
    preloadForScreen,
    preloadImages,
    preloadApiData,
    processQueue,
    onNavigate,
    getStats,
    clearAllCaches,
    preloadCriticalAssets,
  };
};

/**
 * Factory function to create preload manager instance with functional approach
 * This replaces the class-based implementation with pure functional pattern
 */
export const createPreloadManager = (
  config: Partial<PreloadManagerConfig> = {},
) => {
  // Create a functional preload manager instance
  const createInstance = () => {
    const configRef = {
      strategy: {
        images: 'predictive' as const,
        components: 'lazy' as const,
        data: 'predictive' as const,
      },
      maxConcurrentImages: 3,
      maxConcurrentComponents: 2,
      imagePriority: 'normal' as const,
      enablePerformanceMonitoring: true,
      ...config,
    };

    let navigationHistory: string[] = [];
    let preloadQueue: Array<{
      type: 'image' | 'component' | 'data';
      payload: any;
      priority: 'low' | 'normal' | 'high';
    }> = [];
    let criticalAssetsPreloaded = false;
    let preloadedScreens = new Set<string>();

    // Helper methods for network and device conditions
    const isOnWifi = async (): Promise<boolean> => {
      // In a real app, you'd use @react-native-community/netinfo
      return true;
    };

    const getBatteryLevel = async (): Promise<number> => {
      // In a real app, you'd use react-native-device-info
      return 80;
    };

    // Core preloading functions using arrow functions
    const preloadImages = async (
      imageUrls: string[],
      priority: 'low' | 'normal' | 'high' = 'normal',
      imagePreloader: ReturnType<typeof useImagePreloader>,
    ): Promise<void> => {
      switch (configRef.strategy.images) {
        case 'eager':
          await imagePreloader.preloadRemoteImages(imageUrls, priority);
          break;
        case 'lazy':
          preloadQueue.push({
            type: 'image',
            payload: {imageUrls, priority},
            priority,
          });
          break;
        case 'predictive':
          await predictiveImagePreload(imageUrls, priority, imagePreloader);
          break;
      }
    };

    const predictiveImagePreload = async (
      imageUrls: string[],
      priority: 'low' | 'normal' | 'high',
      imagePreloader: ReturnType<typeof useImagePreloader>,
    ): Promise<void> => {
      const isWifiConnected = await isOnWifi();
      const batteryLevel = await getBatteryLevel();

      if (!isWifiConnected || batteryLevel < 20) {
        const criticalImages = imageUrls.slice(
          0,
          Math.min(2, imageUrls.length),
        );
        await imagePreloader.preloadRemoteImages(criticalImages, 'low');
      } else {
        await imagePreloader.preloadRemoteImages(imageUrls, priority);
      }
    };

    const preloadApiData = async (
      apiUrls: string[],
      context: string,
      assetCache: ReturnType<typeof useAssetCache>,
    ): Promise<void> => {
      const promises = apiUrls.map(async url => {
        const cacheKey = `api:${context}:${url}`;
        return assetCache.fetchWithCache(
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
        console.error(
          `❌ API preloading failed for context ${context}:`,
          error,
        );
      }
    };

    const preloadForScreen = async (
      screenName: string,
      hooks: {
        imagePreloader: ReturnType<typeof useImagePreloader>;
        assetCache: ReturnType<typeof useAssetCache>;
        componentLoader: ReturnType<typeof useComponentLoader>;
      },
    ): Promise<void> => {
      if (preloadedScreens.has(screenName)) {
        return;
      }

      console.log(`🚀 Preloading assets for screen: ${screenName}`);
      preloadedScreens.add(screenName);

      const group = PreloadGroups[screenName as keyof typeof PreloadGroups];
      if (!group) {
        console.warn(`No preload group found for screen: ${screenName}`);
        return;
      }

      const startTime = Date.now();

      try {
        if (group.images && group.images.length > 0) {
          await preloadImages(
            group.images,
            configRef.imagePriority,
            hooks.imagePreloader,
          );
        }

        if (group.apis && group.apis.length > 0) {
          await preloadApiData(group.apis, screenName, hooks.assetCache);
        }

        const endTime = Date.now();
        console.log(
          `✅ Preloading completed for ${screenName} in ${
            endTime - startTime
          }ms`,
        );
      } catch (error) {
        console.error(`❌ Preloading failed for ${screenName}:`, error);
        preloadedScreens.delete(screenName);
      }
    };

    const processQueue = async (hooks: {
      imagePreloader: ReturnType<typeof useImagePreloader>;
      componentLoader: ReturnType<typeof useComponentLoader>;
    }): Promise<void> => {
      if (preloadQueue.length === 0) return;

      preloadQueue.sort((a, b) => {
        const priorityOrder: Record<string, number> = {
          high: 3,
          normal: 2,
          low: 1,
        };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      const processPromises = preloadQueue.splice(0, 5).map(async item => {
        try {
          switch (item.type) {
            case 'image':
              await hooks.imagePreloader.preloadRemoteImages(
                item.payload.imageUrls,
                item.payload.priority,
              );
              break;
            case 'component':
              await hooks.componentLoader.preloadComponent(
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
    };

    const onNavigate = (
      screenName: string,
      componentLoader: ReturnType<typeof useComponentLoader>,
    ): void => {
      navigationHistory.push(screenName);
      if (navigationHistory.length > 10) {
        navigationHistory = navigationHistory.slice(-10);
      }
      componentLoader.smartPreload(screenName, navigationHistory);
    };

    const getStats = (hooks: {
      imagePreloader: ReturnType<typeof useImagePreloader>;
      componentLoader: ReturnType<typeof useComponentLoader>;
      assetCache: ReturnType<typeof useAssetCache>;
    }) => ({
      imagePreloader: hooks.imagePreloader.result,
      componentLoader: hooks.componentLoader.result,
      cache: hooks.assetCache.stats,
      queueLength: preloadQueue.length,
      navigationHistory,
    });

    const clearAllCaches = async (hooks: {
      imagePreloader: ReturnType<typeof useImagePreloader>;
      assetCache: ReturnType<typeof useAssetCache>;
    }): Promise<void> => {
      console.log('🧹 Clearing all caches...');
      await Promise.all([
        hooks.imagePreloader.clearImageCache(),
        hooks.assetCache.clearCache(),
      ]);
      preloadQueue = [];
      navigationHistory = [];
      preloadedScreens.clear();
      criticalAssetsPreloaded = false;
      console.log('✅ All caches cleared');
    };

    const preloadCriticalAssets = async (hooks: {
      imagePreloader: ReturnType<typeof useImagePreloader>;
      assetCache: ReturnType<typeof useAssetCache>;
    }): Promise<void> => {
      if (criticalAssetsPreloaded) {
        return;
      }

      console.log('🎯 Preloading critical assets...');
      criticalAssetsPreloaded = true;

      const criticalImages = [RemoteImages.userProfile, RemoteImages.banner];
      const criticalApis = [ApiEndpoints.userProfile];

      await Promise.all([
        preloadImages(criticalImages, 'high', hooks.imagePreloader),
        preloadApiData(criticalApis, 'critical', hooks.assetCache),
      ]);

      console.log('✅ Critical assets preloaded');
    };

    return {
      preloadForScreen,
      preloadImages,
      preloadApiData,
      processQueue,
      onNavigate,
      getStats,
      clearAllCaches,
      preloadCriticalAssets,
      config: configRef,
    };
  };

  return createInstance();
};

// Singleton functional instance
let preloadManagerInstance: ReturnType<typeof createPreloadManager> | null =
  null;

export const getPreloadManager = (): ReturnType<
  typeof createPreloadManager
> | null => {
  return preloadManagerInstance;
};

export const initializePreloadManager = (
  config: Partial<PreloadManagerConfig> = {},
) => {
  if (!preloadManagerInstance) {
    preloadManagerInstance = createPreloadManager(config);
  }
  return preloadManagerInstance;
};

// Export functional version as default for modern usage
export default usePreloadManager;
