import React, {Suspense, useEffect, useState, useCallback} from 'react';
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

// Enhanced hooks (cleaned up versions)
import {useAdvancedAsyncStorage} from '../hooks/useAdvancedAsyncStorage';
import {useIntelligentPreloading} from '../hooks/useIntelligentPreloading';
import {usePerformanceMonitor} from '../utils/performanceMonitor';

// Existing components
import {SmartPreloader} from '../components/preloaders';
import {RemoteImages, ApiEndpoints} from '../assets';

// Simple Enhanced Screen Component for Demo
const EnhancedHomeScreen: React.FC = ({navigation}: any) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadTime, setLoadTime] = useState<number>(0);
  const [cacheStatus, setCacheStatus] = useState<
    'cache' | 'network' | 'loading'
  >('loading');
  const [loadCount, setLoadCount] = useState<number>(0);
  const [performanceHistory, setPerformanceHistory] = useState<
    {time: number; source: string}[]
  >([]);

  // Enhanced caching (simplified)
  const cache = useAdvancedAsyncStorage({
    prefix: '@enhanced_home',
    compressionEnabled: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Intelligent preloading (simplified)
  const intelligentPreloader = useIntelligentPreloading({
    enableBehaviorTracking: true,
    preloadAggression: 'balanced',
  });

  // Performance monitoring
  const {startMetric, endMetric} = usePerformanceMonitor();

  // Load data with caching and performance tracking
  const loadData = useCallback(async () => {
    const startTime = Date.now();
    const metricId = startMetric('enhanced_data_load', 'api_call');
    setCacheStatus('loading');

    try {
      // Try cache first
      const cachedPosts = await cache.get('posts_data');
      const cachedPhotos = await cache.get('photos_data');

      if (cachedPosts && cachedPhotos) {
        // CACHE HIT - Super fast!
        setPosts(cachedPosts);
        setPhotos(cachedPhotos);
        const finalTime = Date.now() - startTime;
        setLoadTime(finalTime);
        setCacheStatus('cache');
        setLoadCount(prev => prev + 1);
        setPerformanceHistory(prev => [
          ...prev.slice(-4),
          {time: finalTime, source: 'Cache'},
        ]);
        await endMetric(metricId);
        return;
      }

      // NETWORK REQUEST - Real performance, no artificial delay
      setCacheStatus('network');

      const [postsResponse, photosResponse] = await Promise.all([
        fetch('https://jsonplaceholder.typicode.com/posts?_limit=5'),
        fetch('https://jsonplaceholder.typicode.com/photos?_limit=6'),
      ]);

      const postsData = await postsResponse.json();
      const photosData = await photosResponse.json();

      // Cache the data for next time
      await Promise.all([
        cache.set('posts_data', postsData, {
          ttl: 15 * 60 * 1000, // 15 minutes
          tags: ['posts', 'home_data'],
        }),
        cache.set('photos_data', photosData, {
          ttl: 30 * 60 * 1000, // 30 minutes
          tags: ['photos', 'home_data'],
        }),
      ]);

      setPosts(postsData);
      setPhotos(photosData);
      const finalTime = Date.now() - startTime;
      setLoadTime(finalTime);
      setLoadCount(prev => prev + 1);
      setPerformanceHistory(prev => [
        ...prev.slice(-4),
        {time: finalTime, source: 'Network'},
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      await endMetric(metricId);
    }
  }, [cache, startMetric, endMetric]);

  // Preload images intelligently
  const preloadImages = useCallback(async () => {
    const imageUrls = [
      RemoteImages.banner,
      RemoteImages.product1,
      RemoteImages.product2,
      RemoteImages.gallery1,
    ];

    try {
      await FastImage.preload(
        imageUrls.slice(0, 3).map(uri => ({
          uri,
          priority: FastImage.priority.high,
        })),
      );
      // Reduced logging: only log success occasionally
      if (Math.random() > 0.8) {
        console.log('✅ Images preloaded successfully');
      }
    } catch (error) {
      console.warn('Image preloading failed:', error);
    }
  }, []);

  // Enhanced refresh functionality with demo controls
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    await preloadImages();
    setIsRefreshing(false);
  }, [loadData, preloadImages]);

  // Demo function to clear cache and show network vs cache difference
  const clearCacheDemo = useCallback(async () => {
    Alert.alert(
      'Clear Cache Demo',
      'This will clear the cache so the next load comes from network (slower). Try refreshing after this!',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            await cache.invalidateByTags(['home_data']);
            Alert.alert(
              'Cache Cleared!',
              'Now refresh to see network loading time vs cache loading time difference!',
            );
          },
        },
      ],
    );
  }, [cache]);

  // Navigation with behavior tracking
  const navigateToScreen = useCallback(
    (screenName: string) => {
      // Track navigation behavior
      intelligentPreloader.trackNavigation(screenName, 'EnhancedHome');
      navigation.navigate(screenName);
    },
    [intelligentPreloader, navigation],
  );

  // Initialize screen (fixed dependencies to prevent infinite loops)
  useEffect(() => {
    const initializeScreen = async () => {
      // Track navigation (only once)
      intelligentPreloader.trackNavigation('EnhancedHome');

      // Load data and preload images
      await Promise.all([loadData(), preloadImages()]);
    };

    initializeScreen();
  }, []); // Empty dependency array - only run once on mount

  return (
    <SmartPreloader
      screenName="EnhancedHome"
      // imageUrls={[
      //   RemoteImages.banner,
      //   RemoteImages.product1,
      //   RemoteImages.product2,
      // ]}
      // dataRequests={[
      //   {key: 'enhanced_posts', url: ApiEndpoints.posts, ttl: 15 * 60 * 1000},
      //   {key: 'enhanced_photos', url: ApiEndpoints.photos, ttl: 30 * 60 * 1000},
      // ]}
    >
      <ScrollView
        style={{flex: 1, backgroundColor: '#fff'}}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }>
        {/* Header */}
        <View style={{padding: 20}}>
          <Text style={{fontSize: 24, fontWeight: 'bold', color: '#007AFF'}}>
            Advanced Preloading Demo
          </Text>
          <Text style={{fontSize: 16, color: '#666', marginTop: 4}}>
            Predictive Component & Asset Preloading
          </Text>

          {/* Back Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#f0f0f0',
              padding: 10,
              borderRadius: 8,
              marginTop: 10,
              alignItems: 'center',
            }}
            onPress={() => navigation.navigate('Home')}>
            <Text style={{color: '#007AFF', fontWeight: '600'}}>
              ← Back to Regular Home
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo Features with Performance Comparison */}
        <View style={{paddingHorizontal: 20, marginBottom: 20}}>
          <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
            🚀 Enhanced Features Active:
          </Text>

          {/* Performance Status */}
          <View
            style={{
              backgroundColor:
                cacheStatus === 'cache'
                  ? '#e8f5e8'
                  : cacheStatus === 'network'
                  ? '#fff3cd'
                  : '#f8f9fa',
              padding: 15,
              borderRadius: 8,
              marginBottom: 10,
            }}>
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: '#ddd',
                paddingTop: 10,
              }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color:
                    cacheStatus === 'cache'
                      ? '#28a745'
                      : cacheStatus === 'network'
                      ? '#ffc107'
                      : '#007AFF',
                }}>
                Load #{loadCount}: {loadTime}ms{' '}
                {cacheStatus === 'cache'
                  ? '(⚡ CACHED - Super Fast!)'
                  : cacheStatus === 'network'
                  ? '(🌐 NETWORK - Normal Speed)'
                  : '(⏳ Loading...)'}
              </Text>

              {performanceHistory.length > 1 && (
                <View
                  style={{
                    marginTop: 10,
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    padding: 10,
                    borderRadius: 5,
                  }}>
                  <Text
                    style={{fontSize: 12, fontWeight: 'bold', marginBottom: 5}}>
                    Performance History:
                  </Text>
                  {performanceHistory.map((entry, index) => (
                    <Text key={index} style={{fontSize: 11, color: '#666'}}>
                      Load {index + 1}: {entry.time}ms ({entry.source})
                      {entry.source === 'Cache' && ' ⚡'}
                      {entry.source === 'Network' && ' 🌐'}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Demo Control Buttons */}
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <TouchableOpacity
              style={{
                backgroundColor: '#28a745',
                padding: 12,
                borderRadius: 8,
                flex: 0.48,
                alignItems: 'center',
              }}
              onPress={handleRefresh}>
              <Text style={{color: 'white', fontWeight: 'bold'}}>
                🔄 Refresh Data
              </Text>
              <Text style={{color: 'white', fontSize: 11}}>
                (Should be fast if cached)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: '#dc3545',
                padding: 12,
                borderRadius: 8,
                flex: 0.48,
                alignItems: 'center',
              }}
              onPress={clearCacheDemo}>
              <Text style={{color: 'white', fontWeight: 'bold'}}>
                🗑️ Clear Cache
              </Text>
              <Text style={{color: 'white', fontSize: 11}}>
                (Test network vs cache)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner with lazy loading */}
        <TouchableOpacity
          style={{
            height: 200,
            marginHorizontal: 20,
            marginBottom: 20,
            borderRadius: 12,
            overflow: 'hidden',
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
              Enhanced Preloading in Action
            </Text>
            <Text style={{color: 'white', fontSize: 14}}>
              Images preloaded instantly!
            </Text>
          </View>
        </TouchableOpacity>

        {/* Navigation Cards with behavior tracking */}
        <View style={{paddingHorizontal: 20, marginBottom: 20}}>
          <Text style={{fontSize: 20, fontWeight: 'bold', marginBottom: 15}}>
            Navigate & See Predictions
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
                onPress={() => navigateToScreen(screen.name)}>
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

        {/* Posts Section */}
        <View style={{paddingHorizontal: 20, marginBottom: 20}}>
          <Text style={{fontSize: 20, fontWeight: 'bold', marginBottom: 15}}>
            Cached Posts
          </Text>

          {posts.length === 0 ? (
            <View style={{alignItems: 'center', padding: 20}}>
              <ActivityIndicator size="large" />
              <Text style={{marginTop: 10, color: '#666'}}>
                Loading posts...
              </Text>
            </View>
          ) : (
            posts.slice(0, 3).map(post => (
              <View
                key={post.id}
                style={{
                  backgroundColor: '#f8f9fa',
                  padding: 15,
                  marginBottom: 10,
                  borderRadius: 8,
                }}>
                <Text
                  style={{fontSize: 16, fontWeight: 'bold', marginBottom: 5}}>
                  {post.title}
                </Text>
                <Text style={{fontSize: 14, color: '#666'}} numberOfLines={2}>
                  {post.body}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Photos Section */}
        <View style={{paddingHorizontal: 20, marginBottom: 20}}>
          <Text style={{fontSize: 20, fontWeight: 'bold', marginBottom: 15}}>
            Preloaded Gallery
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {photos.slice(0, 6).map((photo, index) => (
              <View
                key={photo.id || index}
                style={{
                  width: 120,
                  height: 80,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 8,
                  marginRight: 15,
                  overflow: 'hidden',
                }}>
                <FastImage
                  source={{
                    uri: [
                      RemoteImages.gallery1,
                      RemoteImages.product1,
                      RemoteImages.product2,
                      RemoteImages.banner,
                      RemoteImages.userProfile,
                      RemoteImages.gallery1,
                    ][index],
                    priority: FastImage.priority.normal,
                  }}
                  style={{width: '100%', height: '100%'}}
                  resizeMode={FastImage.resizeMode.cover}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SmartPreloader>
  );
};

export default EnhancedHomeScreen;
