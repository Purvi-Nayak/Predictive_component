import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {NavigationProp} from '@react-navigation/native';
import {SmartPreloader} from '../../components/preloaders';
import {RemoteImages, ApiEndpoints, PreloadGroups} from '../../assets';
import {performanceMonitor} from '../../utils/performanceMonitor';
import {RootStackParamList} from '../../navigation/AppNavigator';

const {width} = Dimensions.get('window');

interface HomeScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Home'>;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Track screen navigation performance
    const metricId = performanceMonitor.startMetric('home_screen_load');

    // Simulate screen setup time
    setTimeout(() => {
      performanceMonitor.endMetric(metricId);
      performanceMonitor.trackNavigation(
        'App',
        'Home',
        Date.now() - Date.now(),
      );
    }, 100);

    // Load cached data
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    setIsLoading(true);

    try {
      // These would typically come from your cache
      // For demo purposes, we'll simulate cached data
      const mockPosts = [
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
      ];

      const mockPhotos = [
        {id: 1, title: 'Product 1', url: RemoteImages.product1},
        {id: 2, title: 'Product 2', url: RemoteImages.product2},
        {id: 3, title: 'Gallery 1', url: RemoteImages.gallery1},
      ];

      setPosts(mockPosts);
      setPhotos(mockPhotos);
    } catch (error) {
      console.error('Failed to load cached data:', error);
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
      showDebugInfo={false} // Disabled debug for better UI
    >
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Home</Text>
            <Text style={styles.subtitle}>Predictive Component Demo</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  bannerContainer: {
    height: 200,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  bannerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bannerSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  navCard: {
    width: (width - 60) / 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },
  placeholderImage: {
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  postBody: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    padding: 20,
  },
  photoCard: {
    marginRight: 15,
    alignItems: 'center',
  },
  photoImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  photoTitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});
