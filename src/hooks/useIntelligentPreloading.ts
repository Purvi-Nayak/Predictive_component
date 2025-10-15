import {useState, useEffect, useCallback, useRef} from 'react';
import {AppState, Dimensions, Platform} from 'react-native';
import {
  useAdvancedLazyLoading,
  useBatchLazyLoading,
} from './useAdvancedLazyLoading';
import {useAdvancedAsyncStorage} from './useAdvancedAsyncStorage';
import {usePerformanceMonitor} from '../utils/performanceMonitor';

interface PredictiveConfig {
  enableBehaviorTracking?: boolean;
  enableNetworkAdaptation?: boolean;
  enablePerformanceAdaptation?: boolean;
  maxPredictionDepth?: number;
  confidenceThreshold?: number;
  adaptationInterval?: number;
  preloadAggression?: 'conservative' | 'balanced' | 'aggressive';
}

interface UserBehaviorPattern {
  screenSequences: string[][];
  timeSpentPerScreen: Record<string, number[]>;
  interactionHotspots: Record<string, {x: number; y: number; count: number}[]>;
  scrollPatterns: Record<
    string,
    {depth: number; speed: number; direction: 'up' | 'down'}[]
  >;
  timeOfDayUsage: Record<number, number>; // hour -> usage count
  deviceOrientationPreference: Record<string, 'portrait' | 'landscape'>;
}

interface PredictionModel {
  nextScreenProbabilities: Record<string, Record<string, number>>;
  contentProbabilities: Record<string, Record<string, number>>;
  timingPredictions: Record<string, number>;
  confidenceScores: Record<string, number>;
}

interface NetworkConditions {
  type: 'wifi' | 'cellular' | 'ethernet' | 'none';
  isConnected: boolean;
  strength: 'weak' | 'moderate' | 'strong';
  speed: number; // Mbps
  latency: number; // ms
  isMetered: boolean;
}

interface DeviceCapabilities {
  memoryLevel: 'low' | 'medium' | 'high';
  processingPower: 'low' | 'medium' | 'high';
  batteryLevel: number;
  isLowPowerMode: boolean;
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
  storageAvailable: number;
}

/**
 * Intelligent predictive preloading system
 * Combines all 4 preloading strategies with machine learning-like behavior analysis
 */
export const useIntelligentPreloading = (config: PredictiveConfig = {}) => {
  const {
    enableBehaviorTracking = true,
    enableNetworkAdaptation = true,
    enablePerformanceAdaptation = true,
    maxPredictionDepth = 3,
    confidenceThreshold = 0.6,
    adaptationInterval = 30000, // 30 seconds
    preloadAggression = 'balanced',
  } = config;

  const [isActive, setIsActive] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<string>('');
  const [behaviorPattern, setBehaviorPattern] = useState<UserBehaviorPattern>({
    screenSequences: [],
    timeSpentPerScreen: {},
    interactionHotspots: {},
    scrollPatterns: {},
    timeOfDayUsage: {},
    deviceOrientationPreference: {},
  });

  const [predictionModel, setPredictionModel] = useState<PredictionModel>({
    nextScreenProbabilities: {},
    contentProbabilities: {},
    timingPredictions: {},
    confidenceScores: {},
  });

  const [networkConditions, setNetworkConditions] = useState<NetworkConditions>(
    {
      type: 'wifi',
      isConnected: true,
      strength: 'strong',
      speed: 100,
      latency: 20,
      isMetered: false,
    },
  );

  const [deviceCapabilities, setDeviceCapabilities] =
    useState<DeviceCapabilities>({
      memoryLevel: 'medium',
      processingPower: 'medium',
      batteryLevel: 100,
      isLowPowerMode: false,
      thermalState: 'nominal',
      storageAvailable: 1000,
    });

  const cache = useAdvancedAsyncStorage({
    prefix: '@predictive_cache',
    backgroundSync: true,
    compressionEnabled: true,
    enableMetrics: true,
  });

  const {startMetric, endMetric, measureAsync} = usePerformanceMonitor();

  // Refs for tracking
  const screenStartTimeRef = useRef<number>(Date.now());
  const navigationHistoryRef = useRef<string[]>([]);
  const interactionLogRef = useRef<any[]>([]);
  const scrollLogRef = useRef<any[]>([]);

  /**
   * Track user navigation patterns
   */
  const trackNavigation = useCallback(
    (screenName: string, previousScreen?: string) => {
      const now = Date.now();
      const timeSpent = now - screenStartTimeRef.current;

      if (enableBehaviorTracking) {
        // Record time spent on previous screen
        if (previousScreen) {
          setBehaviorPattern(prev => ({
            ...prev,
            timeSpentPerScreen: {
              ...prev.timeSpentPerScreen,
              [previousScreen]: [
                ...(prev.timeSpentPerScreen[previousScreen] || []),
                timeSpent,
              ],
            },
          }));
        }

        // Update navigation history
        navigationHistoryRef.current.push(screenName);

        // Keep only last 10 screens
        if (navigationHistoryRef.current.length > 10) {
          navigationHistoryRef.current =
            navigationHistoryRef.current.slice(-10);
        }

        // Update screen sequences for pattern recognition
        if (navigationHistoryRef.current.length >= 2) {
          const sequence = navigationHistoryRef.current.slice(-2);
          setBehaviorPattern(prev => ({
            ...prev,
            screenSequences: [...prev.screenSequences, sequence].slice(-100), // Keep last 100 sequences
          }));
        }

        // Track time of day usage
        const hour = new Date().getHours();
        setBehaviorPattern(prev => ({
          ...prev,
          timeOfDayUsage: {
            ...prev.timeOfDayUsage,
            [hour]: (prev.timeOfDayUsage[hour] || 0) + 1,
          },
        }));
      }

      setCurrentScreen(screenName);
      screenStartTimeRef.current = now;

      // Trigger predictive preloading
      predictAndPreload(screenName);
    },
    [enableBehaviorTracking],
  );

  /**
   * Track user interactions for hotspot analysis
   */
  const trackInteraction = useCallback(
    (screenName: string, x: number, y: number, type: string) => {
      if (!enableBehaviorTracking) return;

      interactionLogRef.current.push({
        screen: screenName,
        x,
        y,
        type,
        timestamp: Date.now(),
      });

      // Update hotspots
      setBehaviorPattern(prev => {
        const hotspots = prev.interactionHotspots[screenName] || [];

        // Find nearby hotspot (within 50px)
        const existingHotspot = hotspots.find(
          h => Math.abs(h.x - x) < 50 && Math.abs(h.y - y) < 50,
        );

        if (existingHotspot) {
          existingHotspot.count++;
        } else {
          hotspots.push({x, y, count: 1});
        }

        return {
          ...prev,
          interactionHotspots: {
            ...prev.interactionHotspots,
            [screenName]: hotspots.slice(-20), // Keep max 20 hotspots per screen
          },
        };
      });
    },
    [enableBehaviorTracking],
  );

  /**
   * Track scroll patterns
   */
  const trackScroll = useCallback(
    (
      screenName: string,
      depth: number,
      speed: number,
      direction: 'up' | 'down',
    ) => {
      if (!enableBehaviorTracking) return;

      scrollLogRef.current.push({
        screen: screenName,
        depth,
        speed,
        direction,
        timestamp: Date.now(),
      });

      setBehaviorPattern(prev => ({
        ...prev,
        scrollPatterns: {
          ...prev.scrollPatterns,
          [screenName]: [
            ...(prev.scrollPatterns[screenName] || []),
            {depth, speed, direction},
          ].slice(-50),
        },
      }));
    },
    [enableBehaviorTracking],
  );

  /**
   * Analyze behavior patterns and build prediction model
   */
  const analyzeBehaviorPatterns = useCallback(() => {
    const {screenSequences, timeSpentPerScreen} = behaviorPattern;

    // Build next screen probability matrix
    const nextScreenProbs: Record<string, Record<string, number>> = {};

    screenSequences.forEach(([from, to]) => {
      if (!nextScreenProbs[from]) nextScreenProbs[from] = {};
      nextScreenProbs[from][to] = (nextScreenProbs[from][to] || 0) + 1;
    });

    // Normalize probabilities
    Object.keys(nextScreenProbs).forEach(from => {
      const total = Object.values(nextScreenProbs[from]).reduce(
        (sum, count) => sum + count,
        0,
      );
      Object.keys(nextScreenProbs[from]).forEach(to => {
        nextScreenProbs[from][to] = nextScreenProbs[from][to] / total;
      });
    });

    // Calculate timing predictions
    const timingPreds: Record<string, number> = {};
    Object.keys(timeSpentPerScreen).forEach(screen => {
      const times = timeSpentPerScreen[screen];
      if (times.length > 0) {
        timingPreds[screen] =
          times.reduce((sum, time) => sum + time, 0) / times.length;
      }
    });

    // Calculate confidence scores based on data amount
    const confidenceScores: Record<string, number> = {};
    Object.keys(nextScreenProbs).forEach(screen => {
      const dataPoints = screenSequences.filter(
        ([from]) => from === screen,
      ).length;
      confidenceScores[screen] = Math.min(dataPoints / 10, 1); // Max confidence at 10+ data points
    });

    setPredictionModel({
      nextScreenProbabilities: nextScreenProbs,
      contentProbabilities: {}, // Could be enhanced with content interaction data
      timingPredictions: timingPreds,
      confidenceScores,
    });
  }, [behaviorPattern]);

  /**
   * Get current network conditions
   */
  const assessNetworkConditions =
    useCallback(async (): Promise<NetworkConditions> => {
      // In a real app, use @react-native-community/netinfo
      // Simulated network assessment
      const speedTest = await measureAsync('network_speed_test', async () => {
        const start = Date.now();

        // Simple ping test
        try {
          const response = await fetch('https://httpbin.org/delay/0', {
            method: 'HEAD',
            timeout: 5000,
          });
          const latency = Date.now() - start;

          return {
            latency,
            success: response.ok,
          };
        } catch (error) {
          return {
            latency: 9999,
            success: false,
          };
        }
      });

      const conditions: NetworkConditions = {
        type: 'wifi', // Would get from NetInfo
        isConnected: speedTest.success,
        strength:
          speedTest.latency < 100
            ? 'strong'
            : speedTest.latency < 300
            ? 'moderate'
            : 'weak',
        speed: speedTest.latency < 100 ? 100 : speedTest.latency < 300 ? 25 : 5, // Estimated
        latency: speedTest.latency,
        isMetered: false, // Would get from NetInfo
      };

      setNetworkConditions(conditions);
      return conditions;
    }, [measureAsync]);

  /**
   * Assess device capabilities
   */
  const assessDeviceCapabilities =
    useCallback(async (): Promise<DeviceCapabilities> => {
      // In a real app, use react-native-device-info
      const memoryTest = await measureAsync('memory_test', async () => {
        // Simple memory pressure test
        const arrays = [];
        const start = Date.now();

        try {
          for (let i = 0; i < 100; i++) {
            arrays.push(new Array(1000).fill(Math.random()));
          }
          return Date.now() - start;
        } catch (error) {
          return 9999;
        }
      });

      const capabilities: DeviceCapabilities = {
        memoryLevel:
          memoryTest < 100 ? 'high' : memoryTest < 300 ? 'medium' : 'low',
        processingPower:
          memoryTest < 50 ? 'high' : memoryTest < 200 ? 'medium' : 'low',
        batteryLevel: 85, // Would get from device-info
        isLowPowerMode: false, // Would get from device-info
        thermalState: 'nominal', // Would get from device-info
        storageAvailable: 1000, // Would get from device-info
      };

      setDeviceCapabilities(capabilities);
      return capabilities;
    }, [measureAsync]);

  /**
   * Determine preloading strategy based on conditions
   */
  const determinePreloadStrategy = useCallback(
    (
      networkConds: NetworkConditions,
      deviceCaps: DeviceCapabilities,
      confidence: number,
    ): {
      shouldPreload: boolean;
      priority: 'low' | 'normal' | 'high';
      maxItems: number;
      strategy: 'conservative' | 'balanced' | 'aggressive';
    } => {
      // Base decision on user-configured aggression
      let baseStrategy = preloadAggression;
      let shouldPreload = true;
      let priority: 'low' | 'normal' | 'high' = 'normal';
      let maxItems = 5;

      // Network-based adjustments
      if (enableNetworkAdaptation) {
        if (!networkConds.isConnected) {
          shouldPreload = false;
        } else if (networkConds.type === 'cellular' && networkConds.isMetered) {
          baseStrategy = 'conservative';
          maxItems = Math.min(maxItems, 2);
          priority = 'low';
        } else if (networkConds.strength === 'weak') {
          maxItems = Math.min(maxItems, 3);
          priority = 'low';
        }
      }

      // Device capability adjustments
      if (enablePerformanceAdaptation) {
        if (deviceCaps.isLowPowerMode || deviceCaps.batteryLevel < 20) {
          baseStrategy = 'conservative';
          maxItems = Math.min(maxItems, 1);
          priority = 'low';
        } else if (
          deviceCaps.memoryLevel === 'low' ||
          deviceCaps.processingPower === 'low'
        ) {
          maxItems = Math.min(maxItems, 3);
        } else if (deviceCaps.thermalState === 'critical') {
          shouldPreload = false;
        }
      }

      // Confidence-based adjustments
      if (confidence < confidenceThreshold) {
        maxItems = Math.min(maxItems, 2);
        priority = 'low';
      }

      // Apply aggression multipliers
      switch (baseStrategy) {
        case 'conservative':
          maxItems = Math.ceil(maxItems * 0.5);
          break;
        case 'balanced':
          // Keep as is
          break;
        case 'aggressive':
          maxItems = Math.ceil(maxItems * 1.5);
          priority = priority === 'low' ? 'normal' : 'high';
          break;
      }

      return {
        shouldPreload,
        priority,
        maxItems: Math.max(1, maxItems),
        strategy: baseStrategy,
      };
    },
    [
      preloadAggression,
      enableNetworkAdaptation,
      enablePerformanceAdaptation,
      confidenceThreshold,
    ],
  );

  /**
   * Predict and preload next likely content
   */
  const predictAndPreload = useCallback(
    async (currentScreenName: string) => {
      if (!isActive) return;

      const metricId = startMetric('predictive_preload', 'custom', {
        screen: currentScreenName,
        aggression: preloadAggression,
      });

      try {
        // Get current conditions
        const [networkConds, deviceCaps] = await Promise.all([
          assessNetworkConditions(),
          assessDeviceCapabilities(),
        ]);

        // Get predictions for current screen
        const screenProbabilities =
          predictionModel.nextScreenProbabilities[currentScreenName] || {};
        const confidence =
          predictionModel.confidenceScores[currentScreenName] || 0;

        // Determine strategy
        const strategy = determinePreloadStrategy(
          networkConds,
          deviceCaps,
          confidence,
        );

        if (!strategy.shouldPreload) {
          console.log('🚫 Preloading skipped due to conditions');
          await endMetric(metricId);
          return;
        }

        // Get top predicted screens
        const predictions = Object.entries(screenProbabilities)
          .sort(([, a], [, b]) => b - a)
          .slice(0, strategy.maxItems)
          .filter(([, prob]) => prob > confidenceThreshold);

        console.log(
          `🔮 Predicting next screens for ${currentScreenName}:`,
          predictions,
        );

        // Preload predicted content
        const preloadPromises = predictions.map(
          async ([screenName, probability]) => {
            try {
              await preloadScreenContent(
                screenName,
                strategy.priority,
                probability,
              );
            } catch (error) {
              console.warn(`Failed to preload ${screenName}:`, error);
            }
          },
        );

        await Promise.allSettled(preloadPromises);
        await endMetric(metricId);
      } catch (error) {
        console.error('Predictive preloading failed:', error);
        await endMetric(metricId);
      }
    },
    [
      isActive,
      predictionModel,
      assessNetworkConditions,
      assessDeviceCapabilities,
      determinePreloadStrategy,
      preloadAggression,
      confidenceThreshold,
      startMetric,
      endMetric,
    ],
  );

  /**
   * Preload content for a specific screen
   */
  const preloadScreenContent = useCallback(
    async (
      screenName: string,
      priority: 'low' | 'normal' | 'high',
      confidence: number,
    ) => {
      // This would interface with your existing preload groups
      // For now, simulating with cache operations

      const cacheKey = `preload_${screenName}`;
      const cached = await cache.get(cacheKey);

      if (!cached) {
        // Simulate preloading screen assets
        const mockData = {
          screenName,
          timestamp: Date.now(),
          confidence,
          priority,
          assets: {
            images: [`image1_${screenName}`, `image2_${screenName}`],
            data: [`data1_${screenName}`, `data2_${screenName}`],
            components: [`component1_${screenName}`],
          },
        };

        await cache.set(cacheKey, mockData, {
          priority,
          ttl: 30 * 60 * 1000, // 30 minutes
          tags: ['preload', screenName],
        });

        console.log(
          `✅ Preloaded content for ${screenName} (confidence: ${confidence.toFixed(
            2,
          )})`,
        );
      }
    },
    [cache],
  );

  /**
   * Get preloaded content for a screen
   */
  const getPreloadedContent = useCallback(
    async (screenName: string) => {
      const cacheKey = `preload_${screenName}`;
      return await cache.get(cacheKey);
    },
    [cache],
  );

  /**
   * Force update of behavior analysis
   */
  const updatePredictions = useCallback(() => {
    analyzeBehaviorPatterns();
  }, [analyzeBehaviorPatterns]);

  /**
   * Clear all prediction data
   */
  const clearPredictionData = useCallback(async () => {
    setBehaviorPattern({
      screenSequences: [],
      timeSpentPerScreen: {},
      interactionHotspots: {},
      scrollPatterns: {},
      timeOfDayUsage: {},
      deviceOrientationPreference: {},
    });

    setPredictionModel({
      nextScreenProbabilities: {},
      contentProbabilities: {},
      timingPredictions: {},
      confidenceScores: {},
    });

    await cache.invalidateByTags(['preload']);

    navigationHistoryRef.current = [];
    interactionLogRef.current = [];
    scrollLogRef.current = [];
  }, [cache]);

  /**
   * Get prediction insights for debugging
   */
  const getPredictionInsights = useCallback(() => {
    return {
      behaviorPattern,
      predictionModel,
      networkConditions,
      deviceCapabilities,
      navigationHistory: navigationHistoryRef.current,
      totalInteractions: interactionLogRef.current.length,
      totalScrollEvents: scrollLogRef.current.length,
      cacheStats: cache.stats,
    };
  }, [
    behaviorPattern,
    predictionModel,
    networkConditions,
    deviceCapabilities,
    cache.stats,
  ]);

  // Periodic analysis updates
  useEffect(() => {
    if (!enableBehaviorTracking) return;

    const interval = setInterval(() => {
      analyzeBehaviorPatterns();
    }, adaptationInterval);

    return () => clearInterval(interval);
  }, [enableBehaviorTracking, adaptationInterval, analyzeBehaviorPatterns]);

  // Periodic condition assessment
  useEffect(() => {
    const interval = setInterval(() => {
      if (enableNetworkAdaptation) {
        assessNetworkConditions();
      }
      if (enablePerformanceAdaptation) {
        assessDeviceCapabilities();
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [
    enableNetworkAdaptation,
    enablePerformanceAdaptation,
    assessNetworkConditions,
    assessDeviceCapabilities,
  ]);

  // App state handling
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      setIsActive(nextAppState === 'active');

      if (nextAppState === 'background') {
        // Save behavior data when app goes to background
        cache.set('behavior_pattern', behaviorPattern, {
          ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
          tags: ['behavior'],
        });
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, [behaviorPattern, cache]);

  // Load saved behavior data on init
  useEffect(() => {
    const loadSavedBehavior = async () => {
      const saved = await cache.get('behavior_pattern');
      if (saved) {
        setBehaviorPattern(saved);
      }
    };

    loadSavedBehavior();
  }, [cache]);

  return {
    // Tracking functions
    trackNavigation,
    trackInteraction,
    trackScroll,

    // Prediction functions
    predictAndPreload,
    getPreloadedContent,
    updatePredictions,

    // Management functions
    clearPredictionData,
    getPredictionInsights,

    // State
    isActive,
    currentScreen,
    behaviorPattern,
    predictionModel,
    networkConditions,
    deviceCapabilities,

    // Configuration
    config: {
      enableBehaviorTracking,
      enableNetworkAdaptation,
      enablePerformanceAdaptation,
      maxPredictionDepth,
      confidenceThreshold,
      adaptationInterval,
      preloadAggression,
    },
  };
};
