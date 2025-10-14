import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {NavigationProp} from '@react-navigation/native';
import {SmartPreloader} from '../../components/preloaders';
import {RemoteImages, PreloadGroups} from '../../assets';
import {performanceMonitor} from '../../utils/performanceMonitor';
import {RootStackParamList} from '../../navigation/AppNavigator';

const {width} = Dimensions.get('window');
const itemWidth = (width - 60) / 2;

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
}

interface ProductsScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Products'>;
}

export const ProductsScreen: React.FC<ProductsScreenProps> = ({navigation}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const metricId = performanceMonitor.startMetric('products_screen_load');

    loadProductsData().finally(() => {
      performanceMonitor.endMetric(metricId);
      setIsLoading(false);
    });
  }, []);

  const loadProductsData = async () => {
    try {
      // Mock products data
      const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Wireless Headphones',
          price: 99.99,
          image: RemoteImages.product1,
          category: 'Electronics',
          rating: 4.5,
        },
        {
          id: 2,
          name: 'Smart Watch',
          price: 199.99,
          image: RemoteImages.product2,
          category: 'Electronics',
          rating: 4.2,
        },
        {
          id: 3,
          name: 'Camera Lens',
          price: 299.99,
          image: RemoteImages.product3,
          category: 'Photography',
          rating: 4.8,
        },
        {
          id: 4,
          name: 'Laptop Stand',
          price: 49.99,
          image: RemoteImages.product1,
          category: 'Accessories',
          rating: 4.3,
        },
        {
          id: 5,
          name: 'USB-C Hub',
          price: 79.99,
          image: RemoteImages.product2,
          category: 'Accessories',
          rating: 4.6,
        },
        {
          id: 6,
          name: 'Bluetooth Speaker',
          price: 89.99,
          image: RemoteImages.product3,
          category: 'Electronics',
          rating: 4.4,
        },
      ];

      const uniqueCategories = [
        'All',
        ...Array.from(new Set(mockProducts.map(p => p.category))),
      ];

      setProducts(mockProducts);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to load products data:', error);
    }
  };

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter(product => product.category === selectedCategory);

  const navigateBack = () => {
    navigation.goBack();
  };

  const viewProductDetails = (product: Product) => {
    console.log(`Viewing details for ${product.name}`);
    performanceMonitor.trackNavigation('Products', 'ProductDetail', 0);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalfStar) {
      stars.push('☆');
    }
    while (stars.length < 5) {
      stars.push('☆');
    }

    return stars.join('');
  };

  const renderProduct = ({item}: {item: Product}) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => viewProductDetails(item)}>
      <FastImage
        source={{uri: item.image}}
        style={styles.productImage}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.stars}>{renderStars(item.rating)}</Text>
          <Text style={styles.ratingText}>({item.rating})</Text>
        </View>
        <Text style={styles.productPrice}>${item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SmartPreloader
      screenName="Products"
      imageUrls={PreloadGroups.products.images}
      strategy="smart"
      showDebugInfo={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Products</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          style={styles.categoriesContainer}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}>
          {categories.map(category => (
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
          ))}
        </ScrollView>

        {/* Products Grid */}
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.productsContainer}
          columnWrapperStyle={styles.productRow}
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
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
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
  productsContainer: {
    padding: 20,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: itemWidth,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 18,
  },
  productCategory: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    fontSize: 12,
    color: '#ffc107',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#666666',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
