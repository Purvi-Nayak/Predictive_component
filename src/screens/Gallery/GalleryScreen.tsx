import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {NavigationProp} from '@react-navigation/native';
import {SmartPreloader} from '../../components/preloaders';
import {RemoteImages, ApiEndpoints, PreloadGroups} from '../../assets';
import {performanceMonitor} from '../../utils/performanceMonitor';
import {RootStackParamList} from '../../navigation/AppNavigator';
import useStyle from './style';

interface GalleryScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Gallery'>;
}

interface Photo {
  albumId: number;
  id: number;
  title: string;
  url: string;
  thumbnailUrl: string;
}

interface Album {
  userId: number;
  id: number;
  title: string;
  photoCount?: number;
}

const filterOptions = ['All', 'Recent', 'Popular', 'Favorites'];

export const GalleryScreen: React.FC<GalleryScreenProps> = ({navigation}) => {
  const styles = useStyle();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    const metricId = performanceMonitor.startMetric('gallery_screen_load');

    loadGalleryData().finally(() => {
      performanceMonitor.endMetric(metricId);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    filterPhotos();
  }, [photos, selectedFilter, favorites]);

  const loadGalleryData = async () => {
    try {
      setError(null);

      // Fetch real data from JSONPlaceholder API
      const [photosResponse, albumsResponse] = await Promise.all([
        fetch('https://jsonplaceholder.typicode.com/photos?_limit=15'),
        fetch('https://jsonplaceholder.typicode.com/albums?_limit=5'),
      ]);

      if (!photosResponse.ok || !albumsResponse.ok) {
        throw new Error('Failed to fetch gallery data');
      }

      const photosData = await photosResponse.json();
      const albumsData = await albumsResponse.json();

      // Map JSONPlaceholder photos to our local images for better visual experience
      const localImages = [
        RemoteImages.gallery1,
        RemoteImages.gallery2,
        RemoteImages.gallery3,
        RemoteImages.product1,
        RemoteImages.product2,
        RemoteImages.userProfile,
        RemoteImages.banner,
      ];

      const transformedPhotos: Photo[] = photosData.map(
        (photo: any, index: number) => ({
          ...photo,
          url: localImages[index % localImages.length],
          thumbnailUrl: localImages[index % localImages.length],
        }),
      );

      // Add photo counts to albums
      const albumsWithCounts = albumsData.map((album: Album) => ({
        ...album,
        photoCount: photosData.filter(
          (photo: Photo) => photo.albumId === album.id,
        ).length,
      }));

      setPhotos(transformedPhotos);
      setAlbums(albumsWithCounts);
    } catch (error) {
      console.error('Failed to load gallery data:', error);
      setError('Failed to load gallery data. Please try again.');

      // Fallback to mock data
      const mockPhotos: Photo[] = [
        {
          albumId: 1,
          id: 1,
          title: 'Beautiful Landscape',
          url: RemoteImages.gallery1,
          thumbnailUrl: RemoteImages.gallery1,
        },
        {
          albumId: 1,
          id: 2,
          title: 'City Architecture',
          url: RemoteImages.gallery2,
          thumbnailUrl: RemoteImages.gallery2,
        },
        {
          albumId: 2,
          id: 3,
          title: 'Nature Photography',
          url: RemoteImages.gallery3,
          thumbnailUrl: RemoteImages.gallery3,
        },
      ];

      const mockAlbums: Album[] = [
        {userId: 1, id: 1, title: 'Travel Photos', photoCount: 2},
        {userId: 1, id: 2, title: 'Nature Collection', photoCount: 1},
      ];

      setPhotos(mockPhotos);
      setAlbums(mockAlbums);
    }
  };

  const filterPhotos = () => {
    let filtered = [...photos];

    switch (selectedFilter) {
      case 'Recent':
        filtered.sort((a, b) => b.id - a.id);
        break;
      case 'Popular':
        // Simulate popularity by random sorting with bias towards higher IDs
        filtered.sort(() => Math.random() - 0.3);
        break;
      case 'Favorites':
        filtered = filtered.filter(photo => favorites.has(photo.id));
        break;
      case 'All':
      default:
        // Keep original order
        break;
    }

    setFilteredPhotos(filtered);
  };

  const navigateBack = () => {
    const startTime = Date.now();
    performanceMonitor.trackNavigation(
      'Gallery',
      'Home',
      Date.now() - startTime,
    );
    navigation.goBack();
  };

  const handlePhotoPress = (photo: Photo) => {
    setSelectedPhoto(photo);
    setModalVisible(true);
  };

  const handleAlbumPress = (albumId: number) => {
    console.log(`View album ${albumId} - functionality not implemented yet`);
  };

  const toggleFavorite = (photoId: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(photoId)) {
      newFavorites.delete(photoId);
    } else {
      newFavorites.add(photoId);
    }
    setFavorites(newFavorites);
  };

  const handleShare = (photo: Photo) => {
    console.log(`Share photo ${photo.id} - functionality not implemented yet`);
  };

  const handleDownload = (photo: Photo) => {
    console.log(
      `Download photo ${photo.id} - functionality not implemented yet`,
    );
  };

  const renderPhotoGrid = () => {
    const rows = [];
    for (let i = 0; i < filteredPhotos.length; i += 2) {
      const leftPhoto = filteredPhotos[i];
      const rightPhoto = filteredPhotos[i + 1];

      rows.push(
        <View key={i} style={styles.photoRow}>
          <TouchableOpacity
            style={styles.photoCard}
            onPress={() => handlePhotoPress(leftPhoto)}>
            <FastImage
              source={{uri: leftPhoto.url}}
              style={styles.photoImage}
              resizeMode={FastImage.resizeMode.cover}
            />
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(leftPhoto.id)}>
              <Text
                style={[
                  styles.favoriteIcon,
                  favorites.has(leftPhoto.id)
                    ? styles.favoriteActive
                    : styles.favoriteInactive,
                ]}></Text>
            </TouchableOpacity>
            <View style={styles.photoContent}>
              <Text style={styles.photoTitle} numberOfLines={1}>
                {leftPhoto.title}
              </Text>
              <View style={styles.photoMeta}>
                <Text style={styles.photoLikes}>
                  {favorites.has(leftPhoto.id) ? '❤️ Liked' : '🤍 Like'}
                </Text>
                <Text style={styles.photoDate}>#{leftPhoto.id}</Text>
              </View>
            </View>
          </TouchableOpacity>

          {rightPhoto && (
            <TouchableOpacity
              style={styles.photoCard}
              onPress={() => handlePhotoPress(rightPhoto)}>
              <FastImage
                source={{uri: rightPhoto.url}}
                style={styles.photoImage}
                resizeMode={FastImage.resizeMode.cover}
              />
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => toggleFavorite(rightPhoto.id)}>
                <Text
                  style={[
                    styles.favoriteIcon,
                    favorites.has(rightPhoto.id)
                      ? styles.favoriteActive
                      : styles.favoriteInactive,
                  ]}></Text>
              </TouchableOpacity>
              <View style={styles.photoContent}>
                <Text style={styles.photoTitle} numberOfLines={1}>
                  {rightPhoto.title}
                </Text>
                <View style={styles.photoMeta}>
                  <Text style={styles.photoLikes}>
                    {favorites.has(rightPhoto.id) ? '❤️ Liked' : '🤍 Like'}
                  </Text>
                  <Text style={styles.photoDate}>#{rightPhoto.id}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>,
      );
    }
    return rows;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gallery</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading gallery...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && photos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gallery</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SmartPreloader
      screenName="Gallery"
      imageUrls={PreloadGroups.gallery.images}
      dataRequests={[
        {key: 'gallery_photos', url: ApiEndpoints.photos},
        {key: 'gallery_albums', url: ApiEndpoints.albums},
      ]}
      strategy="smart"
      showDebugInfo={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gallery</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Text style={styles.headerButtonText}>📤</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Text style={styles.headerButtonText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Gallery Stats */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Gallery Overview</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{photos.length}</Text>
                <Text style={styles.statLabel}>Photos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{albums.length}</Text>
                <Text style={styles.statLabel}>Albums</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{favorites.size}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
            </View>
          </View>

          {/* Albums Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Albums</Text>
          </View>
          <View style={styles.albumsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.albumsScroll}>
              {albums.map(album => (
                <TouchableOpacity
                  key={album.id}
                  style={styles.albumCard}
                  onPress={() => handleAlbumPress(album.id)}>
                  <FastImage
                    source={{uri: RemoteImages.gallery1}}
                    style={styles.albumImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                  <View style={styles.albumContent}>
                    <Text style={styles.albumTitle} numberOfLines={1}>
                      {album.title}
                    </Text>
                    <Text style={styles.albumCount}>
                      {album.photoCount} photos
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Filter Options */}
          <View style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}>
              {filterOptions.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterChip,
                    selectedFilter === option && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedFilter(option)}>
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilter === option && styles.filterChipTextActive,
                    ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Photos Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedFilter === 'All'
                ? 'All Photos'
                : `${selectedFilter} Photos`}
            </Text>
          </View>

          <View style={styles.photosGrid}>
            {filteredPhotos.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No photos found</Text>
                <Text style={styles.emptySubtext}>
                  {selectedFilter === 'Favorites'
                    ? 'Start liking photos to add them to your favorites'
                    : 'Try adjusting your filter criteria'}
                </Text>
              </View>
            ) : (
              renderPhotoGrid()
            )}
          </View>
        </ScrollView>

        {/* Photo Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedPhoto?.title || 'Photo Details'}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedPhoto && (
                <>
                  <FastImage
                    source={{uri: selectedPhoto.url}}
                    style={styles.modalImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />

                  <Text style={styles.modalDescription}>
                    Photo ID: {selectedPhoto.id} • Album:{' '}
                    {selectedPhoto.albumId}
                  </Text>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonSecondary]}
                      onPress={() =>
                        selectedPhoto && handleShare(selectedPhoto)
                      }>
                      <Text
                        style={[
                          styles.modalButtonText,
                          styles.modalButtonTextSecondary,
                        ]}>
                        Share
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() =>
                        selectedPhoto && handleDownload(selectedPhoto)
                      }>
                      <Text style={styles.modalButtonText}>Download</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SmartPreloader>
  );
};
