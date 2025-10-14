import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {NavigationProp} from '@react-navigation/native';
import {SmartPreloader} from '../../components/preloaders';
import {RemoteImages, PreloadGroups} from '../../assets';
import {performanceMonitor} from '../../utils/performanceMonitor';
import {RootStackParamList} from '../../navigation/AppNavigator';

const {width} = Dimensions.get('window');
const itemSize = (width - 60) / 3;

interface GalleryItem {
  id: number;
  title: string;
  image: string;
  category: string;
  likes: number;
}

interface GalleryScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Gallery'>;
}

export const GalleryScreen: React.FC<GalleryScreenProps> = ({navigation}) => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const metricId = performanceMonitor.startMetric('gallery_screen_load');

    loadGalleryData().finally(() => {
      performanceMonitor.endMetric(metricId);
      setIsLoading(false);
    });
  }, []);

  const loadGalleryData = async () => {
    try {
      // Mock gallery data
      const mockGalleryItems: GalleryItem[] = [
        {
          id: 1,
          title: 'Urban Architecture',
          image: RemoteImages.gallery1,
          category: 'Architecture',
          likes: 342,
        },
        {
          id: 2,
          title: 'City Lights',
          image: RemoteImages.gallery2,
          category: 'Urban',
          likes: 156,
        },
        {
          id: 3,
          title: 'Modern Design',
          image: RemoteImages.gallery3,
          category: 'Architecture',
          likes: 289,
        },
        {
          id: 4,
          title: 'Street Photography',
          image: RemoteImages.gallery1,
          category: 'Street',
          likes: 78,
        },
        {
          id: 5,
          title: 'Building Details',
          image: RemoteImages.gallery2,
          category: 'Architecture',
          likes: 195,
        },
        {
          id: 6,
          title: 'Urban Life',
          image: RemoteImages.gallery3,
          category: 'Urban',
          likes: 423,
        },
        {
          id: 7,
          title: 'Night Scene',
          image: RemoteImages.gallery1,
          category: 'Night',
          likes: 167,
        },
        {
          id: 8,
          title: 'City Skyline',
          image: RemoteImages.gallery2,
          category: 'Urban',
          likes: 298,
        },
        {
          id: 9,
          title: 'Abstract Art',
          image: RemoteImages.gallery3,
          category: 'Art',
          likes: 134,
        },
      ];

      const uniqueCategories = [
        'All',
        ...Array.from(new Set(mockGalleryItems.map(item => item.category))),
      ];

      setGalleryItems(mockGalleryItems);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to load gallery data:', error);
    }
  };

  const filteredItems =
    selectedCategory === 'All'
      ? galleryItems
      : galleryItems.filter(item => item.category === selectedCategory);

  const navigateBack = () => {
    navigation.goBack();
  };

  const viewImageDetails = (item: GalleryItem) => {
    console.log(`Viewing details for ${item.title}`);
    performanceMonitor.trackNavigation('Gallery', 'ImageDetail', 0);
  };

  const likeImage = (item: GalleryItem) => {
    console.log(`Liked ${item.title}`);
    // Update likes count
    setGalleryItems(prev =>
      prev.map(i => (i.id === item.id ? {...i, likes: i.likes + 1} : i)),
    );
  };

  const renderCategoryButton = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(category)}>
      <Text
        style={[
          styles.categoryText,
          selectedCategory === category && styles.categoryTextActive,
        ]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  const renderGalleryItem = ({item}: {item: GalleryItem}) => (
    <TouchableOpacity
      style={styles.galleryItem}
      onPress={() => viewImageDetails(item)}>
      <FastImage
        source={{uri: item.image}}
        style={styles.galleryImage}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={styles.imageOverlay}>
        <Text style={styles.imageTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => likeImage(item)}>
          <Text style={styles.likeText}>♥ {item.likes}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading gallery...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SmartPreloader
      screenName="Gallery"
      imageUrls={PreloadGroups.gallery.images}
      strategy="smart"
      showDebugInfo={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Gallery</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={({item}) => renderCategoryButton(item)}
            keyExtractor={item => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          />
        </View>

        {/* Gallery Grid */}
        <FlatList
          data={filteredItems}
          renderItem={renderGalleryItem}
          keyExtractor={item => item.id.toString()}
          numColumns={3}
          contentContainerStyle={styles.galleryContainer}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </SmartPreloader>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  placeholder: {
    width: 40,
  },
  categoriesContainer: {
    height: 50,
    marginBottom: 10,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  galleryContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  galleryItem: {
    width: itemSize,
    height: itemSize,
    margin: 2.5,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageTitle: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
  likeButton: {
    padding: 2,
  },
  likeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '500',
  },
});
