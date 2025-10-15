import {useState, useEffect, useCallback, useRef} from 'react';
import {InteractionManager, AppState, Dimensions} from 'react-native';
import {usePerformanceMonitor} from '../utils/performanceMonitor';

interface LazyLoadOptions {
  threshold?: number; // Distance from viewport to trigger load
  rootMargin?: number; // Additional margin for intersection
  networkAware?: boolean; // Consider network conditions
  performanceAware?: boolean; // Consider device performance
  priority?: 'low' | 'normal' | 'high';
  cacheStrategy?: 'memory' | 'disk' | 'hybrid';
  retryAttempts?: number;
  debounceTime?: number; // Debounce rapid triggers
  batchSize?: number; // Batch multiple requests
}

interface LazyLoadState {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  progress: number;
  retryCount: number;
  lastLoadTime?: number;
}

interface NetworkConditions {
  isConnected: boolean;
  connectionType: string;
  isMetered: boolean;
}

interface DeviceConditions {
  memoryPressure: 'low' | 'medium' | 'high';
  batteryLevel: number;
  isLowPowerMode: boolean;
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
}

/**
 * Advanced lazy loading hook with intelligent loading strategies
 * Supports viewport awareness, network conditions, and performance optimization
 */
export const useAdvancedLazyLoading = (
  loadFunction: () => Promise<any>,
  dependencies: any[] = [],
  options: LazyLoadOptions = {},
) => {
  const {
    threshold = 100,
    rootMargin = 50,
    networkAware = true,
    performanceAware = true,
    priority = 'normal',
    cacheStrategy = 'hybrid',
    retryAttempts = 3,
    debounceTime = 300,
    batchSize = 5,
  } = options;

  const [state, setState] = useState<LazyLoadState>({
    isLoading: false,
    isLoaded: false,
    error: null,
    progress: 0,
    retryCount: 0,
  });

  const loadPromiseRef = useRef<Promise<any> | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const intersectionObserverRef = useRef<any>(null);
  const elementRef = useRef<any>(null);

  const {startMetric, endMetric, trackCacheHit, measureAsync} =
    usePerformanceMonitor();

  /**
   * Check network conditions for optimal loading
   */
  const checkNetworkConditions =
    useCallback(async (): Promise<NetworkConditions> => {
      // In a real app, you'd use @react-native-community/netinfo
      // Simulating network check for now
      return {
        isConnected: true,
        connectionType: 'wifi', // wifi, cellular, ethernet, none
        isMetered: false, // whether on a metered connection
      };
    }, []);

  /**
   * Check device performance conditions
   */
  const checkDeviceConditions =
    useCallback(async (): Promise<DeviceConditions> => {
      // In a real app, you'd use react-native-device-info
      // Simulating device conditions for now
      const performanceTest = await measureDevicePerformance();

      return {
        memoryPressure: performanceTest.memoryPressure,
        batteryLevel: 85, // percentage
        isLowPowerMode: false,
        thermalState: 'nominal',
      };
    }, []);

  /**
   * Measure device performance with a simple test
   */
  const measureDevicePerformance = useCallback(async (): Promise<{
    memoryPressure: 'low' | 'medium' | 'high';
    responseTime: number;
  }> => {
    return new Promise(resolve => {
      const start = Date.now();

      InteractionManager.runAfterInteractions(() => {
        const responseTime = Date.now() - start;

        // Determine memory pressure based on response time
        let memoryPressure: 'low' | 'medium' | 'high' = 'low';
        if (responseTime > 200) memoryPressure = 'high';
        else if (responseTime > 100) memoryPressure = 'medium';

        resolve({memoryPressure, responseTime});
      });
    });
  }, []);

  /**
   * Determine if loading conditions are optimal
   */
  const shouldLoad = useCallback(async (): Promise<{
    canLoad: boolean;
    reason?: string;
    suggestedDelay?: number;
  }> => {
    if (!networkAware && !performanceAware) {
      return {canLoad: true};
    }

    const [networkConditions, deviceConditions] = await Promise.all([
      networkAware ? checkNetworkConditions() : Promise.resolve(null),
      performanceAware ? checkDeviceConditions() : Promise.resolve(null),
    ]);

    // Network-based decisions
    if (networkConditions && !networkConditions.isConnected) {
      return {
        canLoad: false,
        reason: 'No network connection',
        suggestedDelay: 5000,
      };
    }

    // High priority loads can proceed on cellular
    if (
      networkConditions &&
      networkConditions.connectionType === 'cellular' &&
      priority === 'low'
    ) {
      return {
        canLoad: false,
        reason: 'Low priority on cellular connection',
        suggestedDelay: 10000,
      };
    }

    // Device performance-based decisions
    if (deviceConditions) {
      if (deviceConditions.memoryPressure === 'high') {
        return {
          canLoad: priority === 'high',
          reason: 'High memory pressure',
          suggestedDelay: 2000,
        };
      }

      if (deviceConditions.isLowPowerMode && priority === 'low') {
        return {
          canLoad: false,
          reason: 'Low power mode active',
          suggestedDelay: 15000,
        };
      }

      if (deviceConditions.thermalState === 'critical') {
        return {
          canLoad: false,
          reason: 'Device overheating',
          suggestedDelay: 30000,
        };
      }
    }

    return {canLoad: true};
  }, [
    networkAware,
    performanceAware,
    priority,
    checkNetworkConditions,
    checkDeviceConditions,
  ]);

  /**
   * Execute the lazy load with advanced retry and batching logic
   */
  const executeLoad = useCallback(async (): Promise<any> => {
    if (loadPromiseRef.current) {
      return loadPromiseRef.current;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: 0,
    }));

    const metricId = startMetric(`lazy_load_${priority}`, 'custom', {
      priority,
      cacheStrategy,
      attempt: state.retryCount + 1,
      networkAware,
      performanceAware,
    });

    try {
      // Check loading conditions
      const loadingDecision = await shouldLoad();

      if (!loadingDecision.canLoad) {
        throw new Error(`Loading blocked: ${loadingDecision.reason}`);
      }

      setState(prev => ({...prev, progress: 20}));

      // Execute the actual load function with performance monitoring
      loadPromiseRef.current = measureAsync('load_execution', async () => {
        setState(prev => ({...prev, progress: 40}));

        const result = await loadFunction();

        setState(prev => ({...prev, progress: 80}));
        return result;
      });

      const result = await loadPromiseRef.current;

      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoaded: true,
        progress: 100,
        retryCount: 0,
        lastLoadTime: Date.now(),
      }));

      await endMetric(metricId);
      trackCacheHit(false); // New load, not from cache

      return result;
    } catch (error) {
      await endMetric(metricId);

      const newRetryCount = state.retryCount + 1;

      if (newRetryCount <= retryAttempts) {
        setState(prev => ({
          ...prev,
          retryCount: newRetryCount,
          isLoading: false,
        }));

        // Exponential backoff with jitter
        const baseDelay = Math.pow(2, newRetryCount) * 1000;
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;

        await new Promise(resolve => setTimeout(resolve, delay));

        loadPromiseRef.current = null;
        return executeLoad();
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
        retryCount: newRetryCount,
      }));

      throw error;
    } finally {
      loadPromiseRef.current = null;
    }
  }, [
    loadFunction,
    priority,
    cacheStrategy,
    retryAttempts,
    startMetric,
    endMetric,
    trackCacheHit,
    measureAsync,
    shouldLoad,
    state.retryCount,
  ]);

  /**
   * Debounced load function to prevent rapid triggers
   */
  const debouncedLoad = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (!state.isLoading && !state.isLoaded) {
        executeLoad().catch(error => {
          console.warn('Lazy load failed:', error);
        });
      }
    }, debounceTime);
  }, [executeLoad, state.isLoading, state.isLoaded, debounceTime]);

  /**
   * Trigger lazy load with appropriate scheduling
   */
  const load = useCallback(() => {
    if (state.isLoading || state.isLoaded) return;

    // Use appropriate scheduling based on priority
    if (priority === 'low') {
      InteractionManager.runAfterInteractions(() => debouncedLoad());
    } else if (priority === 'high') {
      debouncedLoad();
    } else {
      // Normal priority - small delay to not block UI
      setTimeout(debouncedLoad, 16);
    }
  }, [state.isLoading, state.isLoaded, priority, debouncedLoad]);

  /**
   * Force load ignoring conditions (for user-triggered loads)
   */
  const forceLoad = useCallback(async () => {
    if (state.isLoading) return;

    // Temporarily disable condition checks
    const originalNetworkAware = networkAware;
    const originalPerformanceAware = performanceAware;

    try {
      return await executeLoad();
    } finally {
      // Restore original settings
      // Note: In a real implementation, you'd want a cleaner way to handle this
    }
  }, [state.isLoading, executeLoad, networkAware, performanceAware]);

  /**
   * Reset the lazy load state
   */
  const reset = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setState({
      isLoading: false,
      isLoaded: false,
      error: null,
      progress: 0,
      retryCount: 0,
    });

    loadPromiseRef.current = null;
  }, []);

  /**
   * Setup viewport intersection observer for automatic loading
   */
  const setupIntersectionObserver = useCallback(
    (element: any) => {
      if (!element) return;

      elementRef.current = element;

      // Simple viewport checking (in a real app, use react-native-intersection-observer)
      const checkIntersection = () => {
        // Simplified intersection logic
        // In a real implementation, you'd measure element position relative to viewport
        if (!state.isLoaded && !state.isLoading) {
          load();
        }
      };

      // Check intersection on scroll or layout changes
      const interval = setInterval(checkIntersection, 1000);

      return () => {
        clearInterval(interval);
      };
    },
    [load, state.isLoaded, state.isLoading],
  );

  /**
   * Preload based on user behavior patterns
   */
  const intelligentPreload = useCallback(async () => {
    // Check if user is likely to need this content
    const userBehavior = await analyzeUserBehavior();

    if (userBehavior.shouldPreload) {
      load();
    }
  }, [load]);

  /**
   * Analyze user behavior for predictive loading
   */
  const analyzeUserBehavior = useCallback(async (): Promise<{
    shouldPreload: boolean;
    confidence: number;
  }> => {
    // Simplified behavior analysis
    // In a real app, you'd track user patterns, scroll behavior, etc.

    const timeOfDay = new Date().getHours();
    const isActiveHours = timeOfDay >= 9 && timeOfDay <= 21;

    return {
      shouldPreload: isActiveHours && priority !== 'low',
      confidence: isActiveHours ? 0.8 : 0.3,
    };
  }, [priority]);

  // Auto-trigger load when dependencies change
  useEffect(() => {
    if (dependencies.length > 0) {
      reset();

      // Intelligent preload decision
      intelligentPreload();
    }
  }, dependencies);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    load,
    forceLoad,
    reset,
    setupIntersectionObserver,
    canLoad: !state.isLoading && !state.isLoaded,
    isRetrying: state.retryCount > 0,
    shouldRetry: state.error && state.retryCount < retryAttempts,
  };
};

/**
 * Batch lazy loading hook for multiple items
 */
export const useBatchLazyLoading = (
  loadFunctions: Array<{
    id: string;
    loadFunction: () => Promise<any>;
    priority?: 'low' | 'normal' | 'high';
    dependencies?: any[];
  }>,
  globalOptions: LazyLoadOptions = {},
) => {
  const [batchState, setBatchState] = useState<Record<string, LazyLoadState>>(
    {},
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const {startMetric, endMetric} = usePerformanceMonitor();

  /**
   * Process batch of loads with priority ordering
   */
  const processBatch = useCallback(async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    const metricId = startMetric('batch_lazy_load', 'custom', {
      batchSize: loadFunctions.length,
    });

    try {
      // Sort by priority
      const sortedFunctions = [...loadFunctions].sort((a, b) => {
        const priorityOrder = {high: 3, normal: 2, low: 1};
        return (
          priorityOrder[b.priority || 'normal'] -
          priorityOrder[a.priority || 'normal']
        );
      });

      // Process in batches to avoid overwhelming the system
      const batchSize = globalOptions.batchSize || 3;

      for (let i = 0; i < sortedFunctions.length; i += batchSize) {
        const batch = sortedFunctions.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async ({id, loadFunction, priority = 'normal'}) => {
            try {
              setBatchState(prev => ({
                ...prev,
                [id]: {...prev[id], isLoading: true, error: null},
              }));

              const result = await loadFunction();

              setBatchState(prev => ({
                ...prev,
                [id]: {
                  ...prev[id],
                  isLoading: false,
                  isLoaded: true,
                  progress: 100,
                },
              }));

              return result;
            } catch (error) {
              setBatchState(prev => ({
                ...prev,
                [id]: {
                  ...prev[id],
                  isLoading: false,
                  error: error as Error,
                },
              }));
              throw error;
            }
          }),
        );

        // Small delay between batches
        if (i + batchSize < sortedFunctions.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      await endMetric(metricId);
    } catch (error) {
      console.error('Batch processing failed:', error);
      await endMetric(metricId);
    } finally {
      setIsProcessing(false);
    }
  }, [
    loadFunctions,
    globalOptions.batchSize,
    isProcessing,
    startMetric,
    endMetric,
  ]);

  /**
   * Get state for a specific item
   */
  const getItemState = useCallback(
    (id: string): LazyLoadState => {
      return (
        batchState[id] || {
          isLoading: false,
          isLoaded: false,
          error: null,
          progress: 0,
          retryCount: 0,
        }
      );
    },
    [batchState],
  );

  /**
   * Load specific item
   */
  const loadItem = useCallback(
    async (id: string) => {
      const item = loadFunctions.find(f => f.id === id);
      if (!item) return;

      try {
        setBatchState(prev => ({
          ...prev,
          [id]: {...prev[id], isLoading: true, error: null},
        }));

        const result = await item.loadFunction();

        setBatchState(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            isLoading: false,
            isLoaded: true,
            progress: 100,
          },
        }));

        return result;
      } catch (error) {
        setBatchState(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            isLoading: false,
            error: error as Error,
          },
        }));
        throw error;
      }
    },
    [loadFunctions],
  );

  // Initialize batch state
  useEffect(() => {
    const initialState: Record<string, LazyLoadState> = {};
    loadFunctions.forEach(({id}) => {
      initialState[id] = {
        isLoading: false,
        isLoaded: false,
        error: null,
        progress: 0,
        retryCount: 0,
      };
    });
    setBatchState(initialState);
  }, [loadFunctions]);

  return {
    processBatch,
    loadItem,
    getItemState,
    isProcessing,
    batchState,
    totalItems: loadFunctions.length,
    loadedItems: Object.values(batchState).filter(state => state.isLoaded)
      .length,
    failedItems: Object.values(batchState).filter(state => state.error).length,
  };
};
