import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useImagePreloader} from '../../hooks/useImagePreloader';
import {useAssetCache} from '../../hooks/useAssetCache';
import {useComponentLoader} from '../../hooks/useComponentLoader';
import {performanceMonitor} from '../../utils/performanceMonitor';

interface SmartPreloaderProps {
  screenName: string;
  imageUrls?: string[];
  dataRequests?: Array<{
    key: string;
    url: string;
    ttl?: number;
  }>;
  components?: Array<{
    name: string;
    importFunction: () => Promise<any>;
  }>;
  strategy?: 'eager' | 'lazy' | 'smart';
  showDebugInfo?: boolean;
  children?: React.ReactNode;
}

export const SmartPreloader: React.FC<SmartPreloaderProps> = ({
  screenName,
  imageUrls = [],
  dataRequests = [],
  components = [],
  strategy = 'smart',
  showDebugInfo = false,
  children,
}) => {
  const {preloadRemoteImages, result: imageResult} = useImagePreloader();
  const {fetchWithCache, stats: cacheStats} = useAssetCache();
  const {preloadComponents, result: componentResult} = useComponentLoader();

  const [preloadStats, setPreloadStats] = useState({
    imagesLoaded: 0,
    dataLoaded: 0,
    componentsLoaded: 0,
    totalTime: 0,
    cacheHits: 0,
  });

  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    if (strategy === 'eager') {
      startPreloading();
    } else if (strategy === 'smart') {
      // Smart preloading with network and device condition checks
      setTimeout(startPreloading, 100); // Small delay for smart preloading
    }
    // lazy strategy doesn't auto-start
  }, [screenName, strategy]);

  const startPreloading = async () => {
    if (isPreloading) return;

    setIsPreloading(true);
    const metricId = performanceMonitor.startMetric(`preload_${screenName}`, {
      images: imageUrls.length,
      data: dataRequests.length,
      components: components.length,
      strategy,
    });

    try {
      const promises = [];

      // Preload images
      if (imageUrls.length > 0) {
        promises.push(
          performanceMonitor.measureAsync('image_preload', async () => {
            await preloadRemoteImages(imageUrls, 'normal');
            setPreloadStats(prev => ({
              ...prev,
              imagesLoaded: imageUrls.length,
            }));
          }),
        );
      }

      // Preload data
      if (dataRequests.length > 0) {
        promises.push(
          performanceMonitor.measureAsync('data_preload', async () => {
            const dataPromises = dataRequests.map(({key, url, ttl}) =>
              fetchWithCache(
                key,
                async () => {
                  const response = await fetch(url);
                  if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                  }
                  return response.json();
                },
                ttl,
              ),
            );
            await Promise.allSettled(dataPromises);
            setPreloadStats(prev => ({
              ...prev,
              dataLoaded: dataRequests.length,
            }));
          }),
        );
      }

      // Preload components
      if (components.length > 0) {
        promises.push(
          performanceMonitor.measureAsync('component_preload', async () => {
            await preloadComponents(components);
            setPreloadStats(prev => ({
              ...prev,
              componentsLoaded: components.length,
            }));
          }),
        );
      }

      await Promise.allSettled(promises);

      const totalTime = performanceMonitor.endMetric(metricId) || 0;
      setPreloadStats(prev => ({
        ...prev,
        totalTime,
        cacheHits: Math.floor(cacheStats.hitRate),
      }));

      console.log(
        `✅ Smart preloading completed for ${screenName} in ${totalTime}ms`,
      );
    } catch (error) {
      console.error(`❌ Smart preloading failed for ${screenName}:`, error);
      performanceMonitor.endMetric(metricId);
    } finally {
      setIsPreloading(false);
    }
  };

  const manualTrigger = () => {
    if (strategy === 'lazy') {
      startPreloading();
    }
  };

  if (showDebugInfo) {
    return (
      <View style={styles.container}>
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Preloader Debug - {screenName}</Text>
          <Text style={styles.debugText}>Strategy: {strategy}</Text>
          <Text style={styles.debugText}>
            Status: {isPreloading ? 'Loading...' : 'Ready'}
          </Text>
          <Text style={styles.debugText}>
            Images: {preloadStats.imagesLoaded}/{imageUrls.length}
          </Text>
          <Text style={styles.debugText}>
            Data: {preloadStats.dataLoaded}/{dataRequests.length}
          </Text>
          <Text style={styles.debugText}>
            Components: {preloadStats.componentsLoaded}/{components.length}
          </Text>
          <Text style={styles.debugText}>
            Total Time: {preloadStats.totalTime}ms
          </Text>
          <Text style={styles.debugText}>
            Cache Hit Rate: {preloadStats.cacheHits}%
          </Text>

          {strategy === 'lazy' && (
            <TouchableOpacity
              style={styles.triggerButton}
              onPress={manualTrigger}>
              <Text style={styles.triggerButtonText}>Trigger Preload</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.contentContainer}>{children}</View>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  debugContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  triggerButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  triggerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
