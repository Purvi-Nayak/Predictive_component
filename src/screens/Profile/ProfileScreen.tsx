import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {NavigationProp} from '@react-navigation/native';
import {SmartPreloader} from '../../components/preloaders';
import {RemoteImages, ApiEndpoints, PreloadGroups} from '../../assets';
import {performanceMonitor} from '../../utils/performanceMonitor';
import {RootStackParamList} from '../../navigation/AppNavigator';
import useStyle from './style';

interface ProfileScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Profile'>;
}

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: {
      lat: string;
      lng: string;
    };
  };
  phone: string;
  website: string;
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
}

interface Album {
  userId: number;
  id: number;
  title: string;
}

interface UserPost {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({navigation}) => {
  const styles = useStyle();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const metricId = performanceMonitor.startMetric('profile_screen_load');

    loadProfileData().finally(() => {
      performanceMonitor.endMetric(metricId);
      setIsLoading(false);
    });
  }, []);

  const loadProfileData = async () => {
    try {
      setError(null);

      // Fetch real data from JSONPlaceholder API
      const [userResponse, albumsResponse, postsResponse] = await Promise.all([
        fetch('https://jsonplaceholder.typicode.com/users/1'),
        fetch('https://jsonplaceholder.typicode.com/albums?userId=1&_limit=3'),
        fetch('https://jsonplaceholder.typicode.com/posts?userId=1&_limit=5'),
      ]);

      if (!userResponse.ok || !albumsResponse.ok || !postsResponse.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const userData = await userResponse.json();
      const albumsData = await albumsResponse.json();
      const postsData = await postsResponse.json();

      setUserProfile(userData);
      setAlbums(albumsData);
      setPosts(postsData);
    } catch (error) {
      console.error('Failed to load profile data:', error);
      setError('Failed to load profile data. Please try again.');

      // Fallback to mock data
      setUserProfile({
        id: 1,
        name: 'John Doe',
        username: 'johndoe',
        email: 'john.doe@example.com',
        address: {
          street: 'Kulas Light',
          suite: 'Apt. 556',
          city: 'Gwenborough',
          zipcode: '92998-3874',
          geo: {lat: '-37.3159', lng: '81.1496'},
        },
        phone: '1-770-736-8031 x56442',
        website: 'hildegard.org',
        company: {
          name: 'Romaguera-Crona',
          catchPhrase: 'Multi-layered client-server neural-net',
          bs: 'harness real-time e-markets',
        },
      });
      setAlbums([
        {userId: 1, id: 1, title: 'Personal Photos'},
        {userId: 1, id: 2, title: 'Travel Memories'},
        {userId: 1, id: 3, title: 'Work Projects'},
      ]);
      setPosts([
        {
          userId: 1,
          id: 1,
          title: 'Getting Started',
          body: 'Welcome to my profile!',
        },
        {userId: 1, id: 2, title: 'My Journey', body: 'Here is my story...'},
      ]);
    }
  };

  const navigateBack = () => {
    const startTime = Date.now();
    performanceMonitor.trackNavigation(
      'Profile',
      'Home',
      Date.now() - startTime,
    );
    navigation.goBack();
  };

  const handleEditProfile = () => {
    console.log('Edit profile functionality not  ');
  };

  const handleShareProfile = () => {
    console.log('Share profile functionality not implemented ');
  };

  const handleViewAlbum = (albumId: number) => {
    console.log(`View album ${albumId} functionality not implemented `);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SmartPreloader
      screenName="Profile"
      imageUrls={PreloadGroups.profile.images}
      dataRequests={[
        {key: 'profile_user', url: ApiEndpoints.userProfile},
        {key: 'profile_albums', url: ApiEndpoints.albums},
      ]}
      strategy="smart"
      showDebugInfo={false}>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileImageContainer}>
              <FastImage
                source={{uri: RemoteImages.userProfile}}
                style={styles.profileImage}
                resizeMode={FastImage.resizeMode.cover}
              />
              <View style={styles.onlineIndicator} />
            </View>

            <Text style={styles.profileName}>{userProfile?.name}</Text>
            <Text style={styles.profileEmail}>{userProfile?.email}</Text>
            <Text style={styles.profileLocation}>
              {userProfile?.address.city}, {userProfile?.address.zipcode}
            </Text>

            {/* Profile Stats */}
            <View style={styles.profileStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{albums.length}</Text>
                <Text style={styles.statLabel}>Albums</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>1.2k</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{userProfile?.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Website</Text>
                <Text style={styles.infoValue}>{userProfile?.website}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Company</Text>
                <Text style={styles.infoValue}>
                  {userProfile?.company.name}
                </Text>
              </View>
            </View>
          </View>

          {/* Address Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Street</Text>
                <Text style={styles.infoValue}>
                  {userProfile?.address.street}, {userProfile?.address.suite}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>City</Text>
                <Text style={styles.infoValue}>
                  {userProfile?.address.city}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Zipcode</Text>
                <Text style={styles.infoValue}>
                  {userProfile?.address.zipcode}
                </Text>
              </View>
            </View>
          </View>

          {/* Skills */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialties</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoValue}>
                {userProfile?.company.catchPhrase}
              </Text>
              <View style={styles.skillsContainer}>
                {userProfile?.company.bs.split(' ').map((skill, index) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Recent Albums */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Albums</Text>
            {albums.map(album => (
              <TouchableOpacity
                key={album.id}
                style={styles.recentActivity}
                onPress={() => handleViewAlbum(album.id)}>
                <Text style={styles.activityTitle}>{album.title}</Text>
                <Text style={styles.activityDescription}>
                  Album ID: {album.id} • Tap to view photos
                </Text>
                <Text style={styles.activityTime}>Recently updated</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent Posts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Posts</Text>
            {posts.map(post => (
              <View key={post.id} style={styles.recentActivity}>
                <Text style={styles.activityTitle}>{post.title}</Text>
                <Text style={styles.activityDescription}>
                  {post.body.substring(0, 100)}...
                </Text>
                <Text style={styles.activityTime}>Post ID: {post.id}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEditProfile}>
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleShareProfile}>
              <Text
                style={[
                  styles.actionButtonText,
                  styles.actionButtonTextSecondary,
                ]}>
                Share Profile
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SmartPreloader>
  );
};
