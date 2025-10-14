import {useCallback, useState, useRef} from 'react';
import {Image} from 'react-native';
import FastImage from 'react-native-fast-image';

export interface ImagePreloadResult {
  preloadedCount: number;
  failedCount: number;
  isPreloading: boolean;
  errors: string[];
}

export const useImagePreloader = () => {
  const [result, setResult] = useState<ImagePreloadResult>({
    preloadedCount: 0,
    failedCount: 0,
    isPreloading: false,
    errors: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Preload remote images using FastImage
  const preloadRemoteImages = useCallback(
    async (
      imageUrls: string[],
      priority: 'low' | 'normal' | 'high' = 'normal',
    ): Promise<ImagePreloadResult> => {
      if (imageUrls.length === 0) return result;

      setResult(prev => ({...prev, isPreloading: true, errors: []}));

      try {
        const fastImageSources = imageUrls.map(uri => ({
          uri,
          priority: FastImage.priority[priority],
        }));

        await FastImage.preload(fastImageSources);

        setResult({
          preloadedCount: imageUrls.length,
          failedCount: 0,
          isPreloading: false,
          errors: [],
        });
        return {
          preloadedCount: imageUrls.length,
          failedCount: 0,
          isPreloading: false,
          errors: [],
        };
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        setResult({
          preloadedCount: 0,
          failedCount: imageUrls.length,
          isPreloading: false,
          errors: [errorMsg],
        });

        return {
          preloadedCount: 0,
          failedCount: imageUrls.length,
          isPreloading: false,
          errors: [errorMsg],
        };
      }
    },
    [result],
  );

  // Preload images using React Native's built-in Image.prefetch
  const prefetchImages = useCallback(
    async (imageUrls: string[]): Promise<ImagePreloadResult> => {
      if (imageUrls.length === 0) return result;

      // Cancel previous operation if running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setResult(prev => ({...prev, isPreloading: true, errors: []}));

      let preloadedCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      try {
        const promises = imageUrls.map(async url => {
          try {
            await Image.prefetch(url);
            preloadedCount++;
            return {success: true, url};
          } catch (error) {
            failedCount++;
            const errorMsg = `Failed to prefetch ${url}: ${error}`;
            errors.push(errorMsg);
            return {success: false, url, error: errorMsg};
          }
        });

        await Promise.allSettled(promises);

        const finalResult = {
          preloadedCount,
          failedCount,
          isPreloading: false,
          errors,
        };

        setResult(finalResult);
        return finalResult;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        const finalResult = {
          preloadedCount: 0,
          failedCount: imageUrls.length,
          isPreloading: false,
          errors: [errorMsg],
        };

        setResult(finalResult);
        return finalResult;
      }
    },
    [result],
  );

  // Clear FastImage cache
  const clearImageCache = useCallback(async () => {
    try {
      await FastImage.clearMemoryCache();
      await FastImage.clearDiskCache();
      console.log('Image cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear image cache:', error);
    }
  }, []);

  // Cancel ongoing preload operations
  const cancelPreload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setResult(prev => ({...prev, isPreloading: false}));
  }, []);

  return {
    preloadRemoteImages,
    prefetchImages,
    clearImageCache,
    cancelPreload,
    result,
  };
};
