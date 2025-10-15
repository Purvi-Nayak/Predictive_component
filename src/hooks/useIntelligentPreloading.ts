import {useState, useCallback, useRef} from 'react';

interface IntelligentPreloadingOptions {
  enableBehaviorTracking?: boolean;
  enableNetworkAdaptation?: boolean;
  enablePerformanceAdaptation?: boolean;
  preloadAggression?: 'conservative' | 'balanced' | 'aggressive';
}

interface BehaviorPattern {
  timeSpentPerScreen: Record<string, number[]>;
  screenSequences: string[][];
  interactionHotspots: Record<
    string,
    Array<{x: number; y: number; count: number}>
  >;
  timeOfDayUsage: Record<number, number>;
}

interface PredictionModel {
  confidenceScores: Record<string, number>;
  nextScreenProbabilities: Record<string, Record<string, number>>;
}

/**
 * Simplified intelligent preloading hook without infinite loops
 */
export const useIntelligentPreloading = (
  options: IntelligentPreloadingOptions = {},
) => {
  const {enableBehaviorTracking = true, preloadAggression = 'balanced'} =
    options;

  const [behaviorPattern, setBehaviorPattern] = useState<BehaviorPattern>({
    timeSpentPerScreen: {},
    screenSequences: [],
    interactionHotspots: {},
    timeOfDayUsage: {},
  });

  const [predictionModel, setPredictionModel] = useState<PredictionModel>({
    confidenceScores: {},
    nextScreenProbabilities: {},
  });

  const screenStartTimeRef = useRef<number>(Date.now());
  const navigationHistoryRef = useRef<string[]>([]);

  const trackNavigation = useCallback(
    (screenName: string, previousScreen?: string) => {
      if (!enableBehaviorTracking) return;

      const now = Date.now();
      const timeSpent = now - screenStartTimeRef.current;

      if (previousScreen) {
        setBehaviorPattern(prev => ({
          ...prev,
          timeSpentPerScreen: {
            ...prev.timeSpentPerScreen,
            [previousScreen]: [
              ...(prev.timeSpentPerScreen[previousScreen] || []).slice(-9), // Keep last 10
              timeSpent,
            ],
          },
        }));
      }

      // Update navigation history
      navigationHistoryRef.current.push(screenName);
      if (navigationHistoryRef.current.length > 10) {
        navigationHistoryRef.current = navigationHistoryRef.current.slice(-10);
      }

      // Update screen sequences
      if (navigationHistoryRef.current.length >= 2) {
        const sequence = navigationHistoryRef.current.slice(-2);
        setBehaviorPattern(prev => ({
          ...prev,
          screenSequences: [...prev.screenSequences.slice(-49), sequence], // Keep last 50
        }));
      }

      screenStartTimeRef.current = now;
    },
    [enableBehaviorTracking],
  );

  const trackInteraction = useCallback(
    (screenName: string, x: number, y: number, type: string) => {
      if (!enableBehaviorTracking) return;

      setBehaviorPattern(prev => {
        const hotspots = prev.interactionHotspots[screenName] || [];
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
            [screenName]: hotspots.slice(-20), // Keep last 20 hotspots
          },
        };
      });
    },
    [enableBehaviorTracking],
  );

  const trackScroll = useCallback(
    (
      screenName: string,
      scrollDepth: number,
      scrollSpeed: number,
      direction: 'up' | 'down',
    ) => {
      // Simple scroll tracking without causing re-renders
      // In a real app, you'd implement more sophisticated scroll analytics
    },
    [],
  );

  const getPredictionInsights = useCallback(() => {
    return {
      behaviorPattern,
      predictionModel,
    };
  }, [behaviorPattern, predictionModel]);

  // Simplified prediction analysis
  const analyzeBehaviorPatterns = useCallback(() => {
    const sequences = behaviorPattern.screenSequences;
    const transitions: Record<string, Record<string, number>> = {};

    sequences.forEach(([from, to]) => {
      if (!transitions[from]) transitions[from] = {};
      transitions[from][to] = (transitions[from][to] || 0) + 1;
    });

    // Convert to probabilities
    const probabilities: Record<string, Record<string, number>> = {};
    Object.keys(transitions).forEach(from => {
      const total = Object.values(transitions[from]).reduce(
        (sum, count) => sum + count,
        0,
      );
      probabilities[from] = {};
      Object.keys(transitions[from]).forEach(to => {
        probabilities[from][to] = transitions[from][to] / total;
      });
    });

    setPredictionModel(prev => ({
      ...prev,
      nextScreenProbabilities: probabilities,
    }));
  }, [behaviorPattern.screenSequences]);

  return {
    trackNavigation,
    trackInteraction,
    trackScroll,
    getPredictionInsights,
    analyzeBehaviorPatterns,
    predictionModel,
  };
};
