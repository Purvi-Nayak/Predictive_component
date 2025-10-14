import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {NavigationProp} from '@react-navigation/native';
import {SmartPreloader} from '../../components/preloaders';
import {RemoteImages, ApiEndpoints, PreloadGroups} from '../../assets';
import {performanceMonitor} from '../../utils/performanceMonitor';
import {RootStackParamList} from '../../navigation/AppNavigator';

interface ProfileScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Profile'>;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({navigation}) => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const metricId = performanceMonitor.startMetric('profile_screen_load');

    loadProfileData().finally(() => {
      performanceMonitor.endMetric(metricId);
      setIsLoading(false);
    });
  }, []);

  const loadProfileData = async () => {
    try {
      // Mock user profile data - in real app this would come from cache
      const mockProfile = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        bio: 'Passionate about mobile development and user experience design. Love creating apps that make a difference.',
        location: 'San Francisco, CA',
        website: 'https://johndoe.dev',
        followers: 1234,
        following: 567,
        posts: 89,
      };

      const mockAlbums = [
        {id: 1, title: 'Travel Photos', count: 25},
        {id: 2, title: 'Work Projects', count: 18},
        {id: 3, title: 'Family', count: 42},
        {id: 4, title: 'Nature', count: 33},
      ];

      setUserProfile(mockProfile);
      setAlbums(mockAlbums);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    }
  };

  const navigateBack = () => {
    navigation.goBack();
  };

  const editProfile = () => {
    console.log('Editing profile');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
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
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Profile</Text>
            <TouchableOpacity style={styles.editButton} onPress={editProfile}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <FastImage
              source={{uri: RemoteImages.userProfile}}
              style={styles.profileImage}
              resizeMode={FastImage.resizeMode.cover}
            />
            <Text style={styles.profileName}>{userProfile?.name}</Text>
            <Text style={styles.profileEmail}>{userProfile?.email}</Text>
            <Text style={styles.profileBio}>{userProfile?.bio}</Text>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userProfile?.posts}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userProfile?.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userProfile?.following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>

          {/* User Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{userProfile?.location}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Website</Text>
              <Text style={styles.infoValue}>{userProfile?.website}</Text>
            </View>
          </View>

          {/* Albums */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Albums</Text>
            {albums.map(album => (
              <TouchableOpacity key={album.id} style={styles.albumItem}>
                <FastImage
                  source={{uri: RemoteImages.gallery1}}
                  style={styles.albumThumbnail}
                  resizeMode={FastImage.resizeMode.cover}
                />
                <View style={styles.albumInfo}>
                  <Text style={styles.albumTitle}>{album.title}</Text>
                  <Text style={styles.albumCount}>{album.count} photos</Text>
                </View>
                <Text style={styles.albumArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>View Activity</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Share Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Settings</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  editButton: {
    padding: 5,
  },
  editButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 10,
  },
  profileBio: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666666',
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  albumThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
  },
  albumInfo: {
    flex: 1,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  albumCount: {
    fontSize: 14,
    color: '#666666',
  },
  albumArrow: {
    fontSize: 16,
    color: '#666666',
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
