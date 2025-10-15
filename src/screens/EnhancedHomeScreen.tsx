import React// Enhanced hooks (using the fixed versions)
import {
  useAdvancedLazyLoading,
  useBatchLazyLoading,
} from '../hooks/useAdvancedLazyLoadingFixed';
import {useAdvancedAsyncStorage} from '../hooks/useAdvancedAsyncStorageFixed';
import {useIntelligentPreloading} from '../hooks/useIntelligentPreloadingFixed';
import {usePerformanceMonitor} from '../utils/performanceMonitor';nse, useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import FastImage from 'react-native-fast-image';

// Enhanced hooks
import {
  useAdvancedLazyLoading,
  useBatchLazyLoading,
} from '../hooks/useAdvancedLazyLoadingFixed';
import {useAdvancedAsyncStorage} from '../hooks/useAdvancedAsyncStorageFixed';
import {useIntelligentPreloading} from '../hooks/useIntelligentPreloadingFixed';
import {usePerformanceMonitor} from '../utils/performanceMonitor';

// Existing components
import {SmartPreloader} from '../components/preloaders';
import {RemoteImages, ApiEndpoints} from '../assets';

// Enhanced Screen Component Example
const EnhancedHomeScreen: React.FC = ({navigation}: any) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enhanced caching
  const cache = useAdvancedAsyncStorage({
    prefix: '@enhanced_home',
    compressionEnabled: true,
    backgroundSync: true,
    enableMetrics: true,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  // Intelligent preloading
  const intelligentPreloader = useIntelligentPreloading({
    enableBehaviorTracking: true,
    enableNetworkAdaptation: true,
    enablePerformanceAdaptation: true,
    preloadAggression: 'balanced',
  });

  // Performance monitoring
  const {startMetric, endMetric, measureAsync} = usePerformanceMonitor();

  // Lazy load posts with advanced features
  const postsLoader = useAdvancedLazyLoading(
    async () => {
      // Try cache first
      const cached = await cache.get('posts_data');
      if (cached) return cached;

      // Fetch from API
      const response = await fetch(`${ApiEndpoints.posts}?_limit=5`);
      if (!response.ok) throw new Error('Failed to fetch posts');

      const data = await response.json();

      // Cache with tags for easy invalidation
      await cache.set('posts_data', data, {
        ttl: 15 * 60 * 1000, // 15 minutes
        tags: ['posts', 'home_data'],
        priority: 'high',
        compress: true,
      });

      return data;
    },
    [], // dependencies
    {
      priority: 'high',
      networkAware: true,
      performanceAware: true,
      retryAttempts: 3,
      cacheStrategy: 'hybrid',
    },
  );

  // Batch lazy loading for multiple data sources
  const batchLoader = useBatchLazyLoading([
    {
      id: 'photos',
      loadFunction: async () => {
        const cached = await cache.get('photos_data');
        if (cached) return cached;

        const response = await fetch(`${ApiEndpoints.photos}?_limit=6`);
        const data = await response.json();

        await cache.set('photos_data', data, {
          ttl: 30 * 60 * 1000, // 30 minutes
          tags: ['photos', 'home_data'],
          priority: 'normal',
        });

        return data;
      },
      priority: 'normal',
    },
    {
      id: 'user_profile',
      loadFunction: async () => {
        const cached = await cache.get('user_profile');
        if (cached) return cached;

        const response = await fetch(ApiEndpoints.userProfile);
        const data = await response.json();

        await cache.set('user_profile', data, {
          ttl: 60 * 60 * 1000, // 1 hour
          tags: ['user', 'profile'],
          priority: 'high',
        });

        return data;
      },
      priority: 'high',
    },
  ]);

  // Image preloading with intelligent prioritization
  const preloadImages = useCallback(async () => {
    const imageUrls = [
      RemoteImages.banner,
      RemoteImages.product1,
      RemoteImages.product2,
      RemoteImages.gallery1,
    ];

    // Prioritize images based on user behavior
    const insights = intelligentPreloader.getPredictionInsights();
    const userLikesProducts = insights.behaviorPattern.screenSequences.some(
      seq => seq.includes('Products'),
    );

    const prioritizedImages = userLikesProducts
      ? [
          RemoteImages.product1,
          RemoteImages.product2,
          RemoteImages.banner,
          RemoteImages.gallery1,
        ]
      : imageUrls;

    try {
      await FastImage.preload(
        prioritizedImages.slice(0, 3).map(uri => ({
          uri,
          priority: FastImage.priority.high,
        })),
      );
      console.log('✅ Images preloaded successfully');
    } catch (error) {
      console.warn('Image preloading failed:', error);
    }
  }, [intelligentPreloader]);

  // Enhanced refresh functionality
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      // Invalidate cached data
      await cache.invalidateByTags(['home_data']);

      // Reset loaders
      postsLoader.reset();

      // Reload data
      await Promise.all([postsLoader.load(), batchLoader.processBatch()]);

      // Preload images
      await preloadImages();
    } catch (error) {
      Alert.alert('Refresh Failed', error.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [cache, postsLoader, batchLoader, preloadImages]);

  // Navigation with behavior tracking
  const navigateToScreen = useCallback(
    (screenName: string) => {
      // Track navigation behavior
      intelligentPreloader.trackNavigation(screenName, 'Home');

      // Performance measurement
      measureAsync(`navigation_${screenName}`, async () => {
        navigation.navigate(screenName);
      });
    },
    [intelligentPreloader, measureAsync, navigation],
  );

  // Track user interactions
  const handleInteraction = useCallback(
    (x: number, y: number, type: string) => {
      intelligentPreloader.trackInteraction('Home', x, y, type);
    },
    [intelligentPreloader],
  );

  // Initialize screen
  useEffect(() => {
    const initializeScreen = async () => {
      const metricId = startMetric('home_screen_init', 'component_mount');

      try {
        // Track navigation
        intelligentPreloader.trackNavigation('Home');

        // Load initial data
        await Promise.all([postsLoader.load(), batchLoader.processBatch()]);

        // Preload images
        await preloadImages();

        // Update posts state
        if (postsLoader.isLoaded) {
          // This would need to be handled differently in real implementation
          // as the loader doesn't directly expose the data
        }
      } finally {
        await endMetric(metricId);
      }
    };

    initializeScreen();
  }, []);

  // Update states based on loader results
  useEffect(() => {
    const photosState = batchLoader.getItemState('photos');
    if (photosState.isLoaded) {
      // In real implementation, you'd get the actual data from the loader
      // This is simplified for demo purposes
    }
  }, [batchLoader]);

  return (
    <SmartPreloader
      screenName="Home"
      imageUrls={[
        RemoteImages.banner,
        RemoteImages.product1,
        RemoteImages.product2,
      ]}
      dataRequests={[
        {key: 'home_posts', url: ApiEndpoints.posts, ttl: 15 * 60 * 1000},
        {key: 'home_photos', url: ApiEndpoints.photos, ttl: 30 * 60 * 1000},
      ]}
      strategy="smart"
      showDebugInfo={__DEV__}>
      <ScrollView
        style={{flex: 1, backgroundColor: '#fff'}}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        onScroll={event => {
          const {contentOffset, contentSize, layoutMeasurement} =
            event.nativeEvent;
          const scrollDepth =
            contentOffset.y / (contentSize.height - layoutMeasurement.height);
          const scrollSpeed = Math.abs(
            contentOffset.y - (event.nativeEvent as any).previousOffset || 0,
          );

          intelligentPreloader.trackScroll(
            'Home',
            scrollDepth,
            scrollSpeed,
            contentOffset.y > ((event.nativeEvent as any).previousOffset || 0)
              ? 'down'
              : 'up',
          );
        }}>
        {/* Header */}
        <View style={{padding: 20}}>
          <Text style={{fontSize: 24, fontWeight: 'bold'}}>Enhanced Home</Text>
          <Text style={{fontSize: 16, color: '#666', marginTop: 4}}>
            Intelligent Predictive Preloading Demo
          </Text>
        </View>

        {/* Banner with lazy loading */}
        <TouchableOpacity
          style={{
            height: 200,
            marginHorizontal: 20,
            marginBottom: 20,
            borderRadius: 12,
            overflow: 'hidden',
          }}
          onPress={event => {
            const {locationX, locationY} = event.nativeEvent;
            handleInteraction(locationX, locationY, 'banner_tap');
          }}>
          <FastImage
            source={{
              uri: RemoteImages.banner,
              priority: FastImage.priority.high,
            }}
            style={{width: '100%', height: '100%'}}
            resizeMode={FastImage.resizeMode.cover}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: 20,
            }}>
            <Text style={{color: 'white', fontSize: 18, fontWeight: 'bold'}}>
              Welcome to Enhanced Preloading
            </Text>
          </View>
        </TouchableOpacity>

        {/* Navigation Cards with behavior tracking */}
        <View style={{paddingHorizontal: 20, marginBottom: 20}}>
          <Text style={{fontSize: 20, fontWeight: 'bold', marginBottom: 15}}>
            Explore Screens
          </Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
            }}>
            {[
              {name: 'Profile', image: RemoteImages.userProfile},
              {name: 'Products', image: RemoteImages.product1},
              {name: 'Gallery', image: RemoteImages.gallery1},
            ].map(screen => (
              <TouchableOpacity
                key={screen.name}
                style={{
                  width: '30%',
                  alignItems: 'center',
                  marginBottom: 15,
                  padding: 15,
                  backgroundColor: '#f8f9fa',
                  borderRadius: 12,
                }}
                onPress={event => {
                  const {locationX, locationY} = event.nativeEvent;
                  handleInteraction(
                    locationX,
                    locationY,
                    `${screen.name.toLowerCase()}_card_tap`,
                  );
                  navigateToScreen(screen.name);
                }}>
                <FastImage
                  source={{uri: screen.image}}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    marginBottom: 8,
                  }}
                  resizeMode={FastImage.resizeMode.cover}
                />
                <Text style={{fontSize: 14, fontWeight: '600'}}>
                  {screen.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Posts Section with Advanced Lazy Loading */}
        <View style={{paddingHorizontal: 20, marginBottom: 20}}>
          <Text style={{fontSize: 20, fontWeight: 'bold', marginBottom: 15}}>
            Recent Posts
          </Text>

          {postsLoader.isLoading && (
            <View style={{alignItems: 'center', padding: 20}}>
              <ActivityIndicator size="large" />
              <Text style={{marginTop: 10, color: '#666'}}>
                Loading posts... {Math.round(postsLoader.progress)}%
              </Text>
            </View>
          )}

          {postsLoader.error && (
            <View
              style={{padding: 20, backgroundColor: '#fee', borderRadius: 8}}>
              <Text style={{color: '#c00', marginBottom: 10}}>
                Failed to load posts: {postsLoader.error.message}
              </Text>
              {postsLoader.shouldRetry && (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#007AFF',
                    padding: 10,
                    borderRadius: 6,
                    alignItems: 'center',
                  }}
                  onPress={postsLoader.load}>
                  <Text style={{color: 'white', fontWeight: '600'}}>
                    Retry ({postsLoader.retryCount}/{3})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!postsLoader.isLoaded &&
            !postsLoader.isLoading &&
            !postsLoader.error && (
              <TouchableOpacity
                style={{
                  padding: 20,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={postsLoader.load}>
                <Text style={{color: '#666'}}>Tap to load posts</Text>
              </TouchableOpacity>
            )}
        </View>

        {/* Photos Section with Batch Loading */}
        <View style={{paddingHorizontal: 20, marginBottom: 20}}>
          <Text style={{fontSize: 20, fontWeight: 'bold', marginBottom: 15}}>
            Photo Gallery
          </Text>

          {batchLoader.isProcessing && (
            <View style={{alignItems: 'center', padding: 20}}>
              <ActivityIndicator size="large" />
              <Text style={{marginTop: 10, color: '#666'}}>
                Loading {batchLoader.loadedItems}/{batchLoader.totalItems}{' '}
                items...
              </Text>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* Photos would be rendered here based on batch loader state */}
            {Array.from({length: 6}).map((_, index) => (
              <View
                key={index}
                style={{
                  width: 120,
                  height: 80,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 8,
                  marginRight: 15,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text style={{color: '#666', fontSize: 12}}>
                  Photo {index + 1}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Performance Metrics (Debug) */}
        {__DEV__ && (
          <View
            style={{
              padding: 20,
              backgroundColor: '#f8f9fa',
              margin: 20,
              borderRadius: 8,
            }}>
            <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 10}}>
              Performance Metrics
            </Text>
            <Text style={{fontSize: 12, color: '#666', marginBottom: 5}}>
              Cache Hit Rate: {(cache.stats.hitRate * 100).toFixed(1)}%
            </Text>
            <Text style={{fontSize: 12, color: '#666', marginBottom: 5}}>
              Total Cache Size: {(cache.stats.totalSize / 1024).toFixed(1)} KB
            </Text>
            <Text style={{fontSize: 12, color: '#666', marginBottom: 5}}>
              Memory Pressure: {(cache.stats.memoryPressure * 100).toFixed(1)}%
            </Text>
            <Text style={{fontSize: 12, color: '#666'}}>
              Prediction Confidence:{' '}
              {(
                intelligentPreloader.predictionModel.confidenceScores.Home || 0
              ).toFixed(2)}
            </Text>
          </View>
        )}
      </ScrollView>
    </SmartPreloader>
  );
};

export default EnhancedHomeScreen;
