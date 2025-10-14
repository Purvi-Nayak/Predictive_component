import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useImagePreloader} from '../hooks/useImagePreloader';
import {useAssetCache} from '../hooks/useAssetCache';
import {useComponentLoader} from '../hooks/useComponentLoader';
import {createPreloadManager} from '../utils/preloadManager';
import {performanceMonitor} from '../utils/performanceMonitor';
import {
  HomeScreen,
  ProfileScreen,
  ProductsScreen,
  GalleryScreen,
} from '../screens';

export type RootStackParamList = {
  Home: undefined;
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
    // Only create the preload manager once
    const manager = createPreloadManager(
      {
        strategy: {
          images: 'predictive',
          components: 'lazy',
          data: 'predictive',
        },
        maxConcurrentImages: 3,
        maxConcurrentComponents: 2,
        imagePriority: 'normal',
        enablePerformanceMonitoring: true,
      },
      {
        imagePreloader,
        assetCache,
        componentLoader,
      },
    );

    setPreloadManager(manager);
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    if (!preloadManager) return;

    // Preload critical assets when the app starts (only once)
    preloadManager.preloadCriticalAssets();

    // Set up periodic performance monitoring
    const performanceInterval = setInterval(() => {
      performanceMonitor.takeMemorySnapshot();

      // Clean up expired cache entries periodically
      assetCache.cleanupExpired();
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(performanceInterval);
    };
  }, [preloadManager]); // Only depend on preloadManager

  const handleNavigationStateChange = (state: any) => {
    if (state && preloadManager) {
      const currentScreen = getCurrentScreenName(state);
      if (currentScreen) {
        // Track navigation for predictive preloading
        preloadManager.onNavigate(currentScreen);

        // Preload assets for the current screen
        preloadManager.preloadForScreen(currentScreen);
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
            title: 'Home',
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
