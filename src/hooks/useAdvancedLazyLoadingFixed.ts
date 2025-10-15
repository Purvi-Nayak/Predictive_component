import {useState, useCallback, useRef} from 'react';

interface LazyLoadOptions {
  priority?: 'low' | 'normal' | 'high';
  retryAttempts?: number;
  debounceTime?: number;
}

interface LazyLoadState {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  progress: number;
  retryCount: number;
}

/**
 * Simplified lazy loading hook without infinite render loops
 */
export const useAdvancedLazyLoading = (
  loadFunction: () => Promise<any>,
  dependencies: any[] = [],
  options: LazyLoadOptions = {},
) => {
  const {priority = 'normal', retryAttempts = 3, debounceTime = 300} = options;

  const [state, setState] = useState<LazyLoadState>({
    isLoading: false,
    isLoaded: false,
    error: null,
    progress: 0,
    retryCount: 0,
  });

  const loadPromiseRef = useRef<Promise<any> | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const executeLoad = useCallback(async () => {
    if (loadPromiseRef.current) {
      return loadPromiseRef.current;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: 0,
    }));

    try {
      setState(prev => ({...prev, progress: 20}));

      loadPromiseRef.current = loadFunction();
      setState(prev => ({...prev, progress: 50}));

      const result = await loadPromiseRef.current;
      setState(prev => ({...prev, progress: 80}));

      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoaded: true,
        progress: 100,
        retryCount: 0,
      }));

      return result;
    } catch (error) {
      const newRetryCount = state.retryCount + 1;

      if (newRetryCount <= retryAttempts) {
        setState(prev => ({
          ...prev,
          retryCount: newRetryCount,
          isLoading: false,
        }));

        // Simple retry delay
        await new Promise(resolve => setTimeout(resolve, 1000 * newRetryCount));

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
  }, [loadFunction, retryAttempts, state.retryCount]);

  const load = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeLoad();
    }, debounceTime);
  }, [executeLoad, debounceTime]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isLoaded: false,
      error: null,
      progress: 0,
      retryCount: 0,
    });
    loadPromiseRef.current = null;
  }, []);

  return {
    ...state,
    load,
    reset,
    shouldRetry: state.error && state.retryCount < retryAttempts,
  };
};

/**
 * Simplified batch loading hook
 */
export const useBatchLazyLoading = (
  items: Array<{
    id: string;
    loadFunction: () => Promise<any>;
    priority?: 'low' | 'normal' | 'high';
  }>,
  options: {batchSize?: number} = {},
) => {
  const {batchSize = 3} = options;

  const [itemStates, setItemStates] = useState<Record<string, LazyLoadState>>(
    () => {
      const initial: Record<string, LazyLoadState> = {};
      items.forEach(item => {
        initial[item.id] = {
          isLoading: false,
          isLoaded: false,
          error: null,
          progress: 0,
          retryCount: 0,
        };
      });
      return initial;
    },
  );

  const [isProcessing, setIsProcessing] = useState(false);

  const loadItem = useCallback(
    async (id: string) => {
      const item = items.find(i => i.id === id);
      if (!item) return;

      setItemStates(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          isLoading: true,
          error: null,
        },
      }));

      try {
        const result = await item.loadFunction();

        setItemStates(prev => ({
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
        setItemStates(prev => ({
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
    [items],
  );

  const processBatch = useCallback(async () => {
    setIsProcessing(true);

    try {
      // Process items in batches
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);

        await Promise.allSettled(batch.map(item => loadItem(item.id)));
      }
    } finally {
      setIsProcessing(false);
    }
  }, [items, batchSize, loadItem]);

  const getItemState = useCallback(
    (id: string) => {
      return (
        itemStates[id] || {
          isLoading: false,
          isLoaded: false,
          error: null,
          progress: 0,
          retryCount: 0,
        }
      );
    },
    [itemStates],
  );

  const loadedItems = Object.values(itemStates).filter(
    state => state.isLoaded,
  ).length;
  const failedItems = Object.values(itemStates).filter(
    state => state.error,
  ).length;

  return {
    isProcessing,
    loadedItems,
    failedItems,
    totalItems: items.length,
    loadItem,
    processBatch,
    getItemState,
  };
};
