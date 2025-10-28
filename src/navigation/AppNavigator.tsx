import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useImagePreloader} from '../hooks/useImagePreloader';
import {useAssetCache} from '../hooks/useAssetCache';
import {useComponentLoader} from '../hooks/useComponentLoader';
import {
  createPreloadManager,
  initializePreloadManager,
} from '../utils/preloadManager';
import {ProfileScreen} from '../screens/Profile/ProfileScreen';
import {ProductsScreen} from '../screens/Products/ProductsScreen';
import {GalleryScreen} from '../screens/Gallery/GalleryScreen';
import {HomeScreen} from '../screens/Home/HomeScreen';
import EnhancedHomeScreen from '../screens/EnhancedHomeScreen';
import {performanceMonitor} from '../utils/performanceMonitor';

export type RootStackParamList = {
  Home: undefined;
  EnhancedHome: undefined;
  Profile: undefined;
  Products: undefined;
  Gallery: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const imagePreloader = useImagePreloader();
  const assetCache = useAssetCache();
  const componentLoader = useComponentLoader();

  // Initialize preload manager with useEffect to avoid recreating on every render
  const [preloadManager, setPreloadManager] = React.useState<ReturnType<
    typeof createPreloadManager
  > | null>(null);

  useEffect(() => {
    // Initialize preload manager with hooks
    const manager = initializePreloadManager({
      strategy: {
        images: 'predictive',
        components: 'lazy',
        data: 'predictive',
      },
      maxConcurrentImages: 3,
      maxConcurrentComponents: 2,
      imagePriority: 'normal',
      enablePerformanceMonitoring: true,
    });

    setPreloadManager(manager);
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    if (!preloadManager) return;

    // Create hooks object for the functional API
    const hooks = {
      imagePreloader,
      assetCache,
      componentLoader,
    };

    // Preload critical assets when the app starts (only once)
    preloadManager.preloadCriticalAssets(hooks);

    // Set up periodic performance monitoring
    const performanceInterval = setInterval(() => {
      performanceMonitor.takeMemorySnapshot();

      // Clean up expired cache entries periodically
      assetCache.cleanupExpired();
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(performanceInterval);
    };
  }, [preloadManager, imagePreloader, assetCache, componentLoader]); // Depend on hooks too

  const handleNavigationStateChange = (state: any) => {
    if (state && preloadManager) {
      const currentScreen = getCurrentScreenName(state);
      if (currentScreen) {
        // Create hooks object for the functional API
        const hooks = {
          imagePreloader,
          assetCache,
          componentLoader,
        };

        // Track navigation for predictive preloading
        preloadManager.onNavigate(currentScreen, componentLoader);

        // Preload assets for the current screen
        preloadManager.preloadForScreen(currentScreen, hooks);
      }
    }
  };

  const getCurrentScreenName = (state: any): string | null => {
    if (!state || !state.routes) return null;

    const route = state.routes[state.index];
    if (!route) return null;

    if (route.state) {
      return getCurrentScreenName(route.state);
    }

    return route.name;
  };

  return (
    <NavigationContainer onStateChange={handleNavigationStateChange}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Regular Home',
          }}
        />
        <Stack.Screen
          name="EnhancedHome"
          component={EnhancedHomeScreen}
          options={{
            title: 'Advanced Preloading Demo',
          }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: 'Profile',
          }}
        />
        <Stack.Screen
          name="Products"
          component={ProductsScreen}
          options={{
            title: 'Products',
          }}
        />
        <Stack.Screen
          name="Gallery"
          component={GalleryScreen}
          options={{
            title: 'Gallery',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
