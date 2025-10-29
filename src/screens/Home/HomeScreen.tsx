import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {NavigationProp} from '@react-navigation/native';
import {SmartPreloader} from '../../components/preloaders';
import {RemoteImages, ApiEndpoints, PreloadGroups} from '../../assets';
import {RootStackParamList} from '../../navigation/AppNavigator';
import useStyle from './style';
import {performanceMonitor} from '../../utils/performanceMonitor';

interface HomeScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Home'>;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  const styles = useStyle();
  const [posts, setPosts] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Track screen navigation performance
    const metricId = performanceMonitor.startMetric('home_screen_load');

    setTimeout(() => {
      performanceMonitor.endMetric(metricId);
      performanceMonitor.trackNavigation(
        'App',
        'Home',
        Date.now() - Date.now(),
      );
    }, 100);

    // Load data from JSONPlaceholder API
    loadApiData();
  }, []);

  const loadApiData = async () => {
    setIsLoading(true);

    try {
      // ✅ REAL PERFORMANCE: No artificial delays - measuring actual network time
      const networkStartTime = Date.now();

      // Fetch real data from JSONPlaceholder API (no caching)
      const [postsResponse, photosResponse] = await Promise.all([
        fetch('https://jsonplaceholder.typicode.com/posts?_limit=3'),
        fetch('https://jsonplaceholder.typicode.com/photos?_limit=3'),
      ]);

      const networkTime = Date.now() - networkStartTime;
      console.log(`🌐 REAL Network Time: ${networkTime}ms`);

      const postsData = await postsResponse.json();
      const photosData = await photosResponse.json();

      setPosts(postsData);
      setPhotos(
        photosData.map((photo: any, index: number) => ({
          ...photo,
          url: [
            RemoteImages.product1,
            RemoteImages.product2,
            RemoteImages.gallery1,
          ][index],
        })),
      );
    } catch (error) {
      console.error('Failed to load API data:', error);
      // Fallback to mock data
      setPosts([
        {
          id: 1,
          title: 'Welcome to Predictive Components',
          body: 'This app demonstrates advanced preloading techniques...',
        },
        {
          id: 2,
          title: 'Performance Optimization',
          body: 'Learn how to optimize your React Native app performance...',
        },
        {
          id: 3,
          title: 'User Experience',
          body: 'Creating smooth and responsive user interfaces...',
        },
      ]);
      setPhotos([
        {id: 1, title: 'Product 1', url: RemoteImages.product1},
        {id: 2, title: 'Product 2', url: RemoteImages.product2},
        {id: 3, title: 'Gallery 1', url: RemoteImages.gallery1},
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToScreen = (screenName: string) => {
    const startTime = Date.now();

    // Track navigation performance
    performanceMonitor.trackNavigation(
      'Home',
      screenName,
      Date.now() - startTime,
    );

    // Navigate to the screen using React Navigation
    switch (screenName) {
      case 'Profile':
        navigation.navigate('Profile');
        break;
      case 'Products':
        navigation.navigate('Products');
        break;
      case 'Gallery':
        navigation.navigate('Gallery');
        break;

      case 'Settings':
        console.log('Settings screen not implemented yet');
        break;
      default:
        console.log(`Unknown screen: ${screenName}`);
    }
  };

  return (
    <SmartPreloader
      screenName="Home"
      imageUrls={PreloadGroups.home.images}
      dataRequests={[
        {key: 'home_posts', url: ApiEndpoints.posts},
        {key: 'home_photos', url: ApiEndpoints.photos},
      ]}
      strategy="smart"
      showDebugInfo={false}>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Regular Home Screen</Text>
            <Text style={styles.subtitle}>Basic Preloading Demo</Text>

            {/* Demo Comparison Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#007AFF',
                padding: 15,
                borderRadius: 10,
                marginTop: 15,
                alignItems: 'center',
              }}
              onPress={() => navigation.navigate('EnhancedHome')}>
              <Text style={{color: 'white', fontWeight: 'bold', fontSize: 16}}>
                Try Advanced Preloading Demo
              </Text>
              <Text style={{color: 'white', fontSize: 12, marginTop: 5}}>
                See the difference in performance!
              </Text>
            </TouchableOpacity>
          </View>

          {/* Banner Image */}
          <View style={styles.bannerContainer}>
            <FastImage
              source={{
                uri: RemoteImages.banner,
                priority: FastImage.priority.high,
              }}
              style={styles.bannerImage}
              resizeMode={FastImage.resizeMode.cover}
            />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerText}>
                Welcome to Predictive Preloading
              </Text>
              <Text style={styles.bannerSubtext}>
                Experience lightning-fast navigation and smooth interactions
              </Text>
            </View>
          </View>

          {/* Navigation Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Explore Screens</Text>
            <View style={styles.cardGrid}>
              <TouchableOpacity
                style={styles.navCard}
                onPress={() => navigateToScreen('Profile')}>
                <FastImage
                  source={{uri: RemoteImages.userProfile}}
                  style={styles.cardImage}
                  resizeMode={FastImage.resizeMode.cover}
                />
                <Text style={styles.cardTitle}>Profile</Text>
                <Text style={styles.cardDescription}>View user profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navCard}
                onPress={() => navigateToScreen('Products')}>
                <FastImage
                  source={{uri: RemoteImages.product1}}
                  style={styles.cardImage}
                  resizeMode={FastImage.resizeMode.cover}
                />
                <Text style={styles.cardTitle}>Products</Text>
                <Text style={styles.cardDescription}>Browse products</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navCard}
                onPress={() => navigateToScreen('Gallery')}>
                <FastImage
                  source={{uri: RemoteImages.gallery1}}
                  style={styles.cardImage}
                  resizeMode={FastImage.resizeMode.cover}
                />
                <Text style={styles.cardTitle}>Gallery</Text>
                <Text style={styles.cardDescription}>View gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navCard}
                onPress={() => navigateToScreen('Settings')}>
                <View style={[styles.cardImage, styles.placeholderImage]}>
                  <Text style={styles.placeholderText}>⚙️</Text>
                </View>
                <Text style={styles.cardTitle}>Settings</Text>
                <Text style={styles.cardDescription}>App settings</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Posts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Posts</Text>
            {isLoading ? (
              <Text style={styles.loadingText}>Loading posts...</Text>
            ) : (
              posts.map(post => (
                <View key={post.id} style={styles.postCard}>
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postBody}>{post.body}</Text>
                </View>
              ))
            )}
          </View>

          {/* Photos Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {photos.map(photo => (
                <View key={photo.id} style={styles.photoCard}>
                  <FastImage
                    source={{uri: photo.url}}
                    style={styles.photoImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                  <Text style={styles.photoTitle}>{photo.title}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SmartPreloader>
  );
};
