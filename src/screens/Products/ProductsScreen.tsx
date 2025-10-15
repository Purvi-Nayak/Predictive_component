import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {NavigationProp} from '@react-navigation/native';
import {SmartPreloader} from '../../components/preloaders';
import {RemoteImages, ApiEndpoints, PreloadGroups} from '../../assets';
import {performanceMonitor} from '../../utils/performanceMonitor';
import {RootStackParamList} from '../../navigation/AppNavigator';
import useStyle from './style';

interface ProductsScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Products'>;
}

interface Product {
  userId: number;
  id: number;
  title: string;
  body: string;
  category?: string;
  price?: number;
  rating?: number;
  image?: string;
  inStock?: boolean;
}

const categories = [
  'All',
  'Electronics',
  'Clothing',
  'Books',
  'Home',
  'Sports',
];
const sortOptions = ['Recent', 'Price', 'Rating', 'Name'];

export const ProductsScreen: React.FC<ProductsScreenProps> = ({navigation}) => {
  const styles = useStyle();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Recent');

  useEffect(() => {
    const metricId = performanceMonitor.startMetric('products_screen_load');

    loadProductsData().finally(() => {
      performanceMonitor.endMetric(metricId);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, selectedCategory, selectedSort]);

  const loadProductsData = async () => {
    try {
      setError(null);

      // Fetch posts from JSONPlaceholder and transform them to products
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/posts?_limit=10',
      );

      if (!response.ok) {
        throw new Error('Failed to fetch products data');
      }

      const postsData = await response.json();

      // Transform posts into product-like objects with additional mock data
      const transformedProducts: Product[] = postsData.map(
        (post: any, index: number) => ({
          ...post,
          category:
            categories[Math.floor(Math.random() * (categories.length - 1)) + 1], // Exclude 'All'
          price: Math.floor(Math.random() * 500) + 20, // Random price between $20-$520
          rating: Math.floor(Math.random() * 50) / 10, // Random rating 0.0-5.0
          image: [
            RemoteImages.product1,
            RemoteImages.product2,
            RemoteImages.gallery1,
            RemoteImages.gallery2,
            RemoteImages.gallery3,
          ][index % 5],
          inStock: Math.random() > 0.2, // 80% chance of being in stock
        }),
      );

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Failed to load products data:', error);
      setError('Failed to load products data. Please try again.');

      // Fallback to mock data
      const mockProducts: Product[] = [
        {
          userId: 1,
          id: 1,
          title: 'Premium Wireless Headphones',
          body: 'High-quality wireless headphones with noise cancellation and premium sound quality.',
          category: 'Electronics',
          price: 299,
          rating: 4.5,
          image: RemoteImages.product1,
          inStock: true,
        },
        {
          userId: 1,
          id: 2,
          title: 'Comfortable Cotton T-Shirt',
          body: 'Soft and comfortable cotton t-shirt available in multiple colors and sizes.',
          category: 'Clothing',
          price: 29,
          rating: 4.2,
          image: RemoteImages.product2,
          inStock: true,
        },
        {
          userId: 1,
          id: 3,
          title: 'Programming Best Practices Book',
          body: 'Learn the best practices for modern software development and clean code principles.',
          category: 'Books',
          price: 45,
          rating: 4.8,
          image: RemoteImages.gallery1,
          inStock: false,
        },
      ];
      setProducts(mockProducts);
    }
  };

  const filterAndSortProducts = useCallback(() => {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        product =>
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.body.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(
        product => product.category === selectedCategory,
      );
    }

    // Sort products
    switch (selectedSort) {
      case 'Price':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'Rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'Name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'Recent':
      default:
        filtered.sort((a, b) => b.id - a.id);
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory, selectedSort]);

  const navigateBack = () => {
    const startTime = Date.now();
    performanceMonitor.trackNavigation(
      'Products',
      'Home',
      Date.now() - startTime,
    );
    navigation.goBack();
  };

  const handleAddToCart = (productId: number) => {
    console.log(
      `Add product ${productId} to cart - functionality not implemented yet`,
    );
  };

  const handleViewDetails = (productId: number) => {
    console.log(
      `View details for product ${productId} - functionality not implemented yet`,
    );
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars)
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Products</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Products</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SmartPreloader
      screenName="Products"
      imageUrls={PreloadGroups.products.images}
      dataRequests={[
        {key: 'products_data', url: ApiEndpoints.posts},
        {key: 'products_photos', url: ApiEndpoints.photos},
      ]}
      strategy="smart"
      showDebugInfo={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Products</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666666"
          />
        </View>

        {/* Category Filter */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterChip,
                  selectedCategory === category && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}>
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === category &&
                      styles.filterChipTextActive,
                  ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          {sortOptions.map(option => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortButton,
                selectedSort === option && styles.sortButtonActive,
              ]}
              onPress={() => setSelectedSort(option)}>
              <Text
                style={[
                  styles.sortButtonText,
                  selectedSort === option && styles.sortButtonTextActive,
                ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Products Grid */}
          <View style={styles.productsGrid}>
            {filteredProducts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No products found</Text>
                <Text style={styles.emptySubtext}>
                  Try adjusting your search or filter criteria
                </Text>
              </View>
            ) : (
              filteredProducts.map(product => (
                <View key={product.id} style={styles.productCard}>
                  {/* Product Image */}
                  {product.image ? (
                    <FastImage
                      source={{uri: product.image}}
                      style={styles.productImage}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Text style={styles.productImagePlaceholderText}>📦</Text>
                    </View>
                  )}

                  {/* Featured Badge */}
                  {product.rating && product.rating > 4.0 && (
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredText}>FEATURED</Text>
                    </View>
                  )}

                  {/* Product Content */}
                  <View style={styles.productContent}>
                    <View style={styles.productHeader}>
                      <Text style={styles.productTitle}>{product.title}</Text>
                      <Text style={styles.productPrice}>${product.price}</Text>
                    </View>

                    <Text style={styles.productDescription}>
                      {product.body.length > 100
                        ? product.body.substring(0, 100) + '...'
                        : product.body}
                    </Text>

                    <View style={styles.productMeta}>
                      <Text style={styles.productCategory}>
                        {product.category}
                      </Text>
                      <View style={styles.productRating}>
                        <Text style={styles.ratingStars}>
                          {renderStars(product.rating || 0)}
                        </Text>
                        <Text style={styles.ratingText}>
                          {product.rating?.toFixed(1)}
                        </Text>
                        <Text
                          style={[
                            styles.stockStatus,
                            product.inStock
                              ? styles.inStock
                              : styles.outOfStock,
                          ]}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.productActions}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.actionButtonSecondary,
                        ]}
                        onPress={() => handleViewDetails(product.id)}>
                        <Text
                          style={[
                            styles.actionButtonText,
                            styles.actionButtonTextSecondary,
                          ]}>
                          Details
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          !product.inStock && {opacity: 0.5},
                        ]}
                        onPress={() => handleAddToCart(product.id)}
                        disabled={!product.inStock}>
                        <Text style={styles.actionButtonText}>
                          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Quick Actions */}
      </SafeAreaView>
    </SmartPreloader>
  );
};
