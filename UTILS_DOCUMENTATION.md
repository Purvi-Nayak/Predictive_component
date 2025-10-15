# Utility Functions Documentation

This document provides comprehensive documentation for all utility functions in the predictive components system, their usage patterns, and practical examples.

## Table of Contents

1. [Performance Monitor](#performance-monitor)
2. [Cache Helper](#cache-helper)
3. [Preload Manager](#preload-manager)
4. [Helper Functions](#helper-functions)
5. [Usage Examples](#usage-examples)

---

## Performance Monitor

The `performanceMonitor` utility provides comprehensive performance tracking for React Native applications. It's available both as a React hook (`usePerformanceMonitor`) and as a singleton class for backward compatibility.

### Hook Usage (Recommended)

```typescript
import {usePerformanceMonitor} from '../utils/performanceMonitor';

const MyComponent = () => {
  const {
    startMetric,
    endMetric,
    trackNavigation,
    trackCacheHit,
    getStats,
    clearStats,
  } = usePerformanceMonitor();

  // Usage examples...
};
```

### Singleton Usage (Legacy)

```typescript
import {performanceMonitor} from '../utils/performanceMonitor';

// Start tracking a metric
const metricId = performanceMonitor.startMetric('screen_load', 'navigation');
// ... do work ...
// End tracking
performanceMonitor.endMetric(metricId);
```

### Methods

#### `startMetric(name, type?, metadata?)`

Starts tracking a performance metric.

**Parameters:**

- `name` (string): Unique identifier for the metric
- `type` (optional): Type of metric ('navigation' | 'image_load' | 'component_mount' | 'api_call' | 'custom')
- `metadata` (optional): Additional data to store with the metric

**Returns:** `string` - Metric ID for ending the measurement

**Example:**

```typescript
const metricId = startMetric('user_login', 'api_call', {userId: 123});
```

#### `endMetric(id)`

Ends tracking a performance metric.

**Parameters:**

- `id` (string): Metric ID returned from startMetric

**Returns:** `Promise<PerformanceMetric | null>` - Completed metric data

**Example:**

```typescript
const completedMetric = await endMetric(metricId);
console.log(`Login took ${completedMetric.duration}ms`);
```

#### `trackNavigation(from, to, duration)`

Tracks navigation performance between screens.

**Parameters:**

- `from` (string): Source screen name
- `to` (string): Destination screen name
- `duration` (number): Navigation duration in milliseconds

**Example:**

```typescript
trackNavigation('Home', 'Profile', 150);
```

#### `trackCacheHit(isHit)`

Tracks cache hit/miss statistics.

**Parameters:**

- `isHit` (boolean): Whether the cache request was a hit or miss

**Example:**

```typescript
trackCacheHit(true); // Cache hit
trackCacheHit(false); // Cache miss
```

#### `getStats()`

Returns comprehensive performance statistics.

**Returns:** Object containing metrics, navigation history, cache stats, and averages

**Example:**

```typescript
const stats = getStats();
console.log(
  `Average navigation time: ${stats.averageMetricsByType.navigation}ms`,
);
console.log(`Cache hit rate: ${stats.cache.hitRate * 100}%`);
```

---

## Cache Helper

The `cacheHelper` utility provides efficient caching mechanisms for images, data, and components using AsyncStorage.

### Import

```typescript
import {cacheHelper} from '../utils/cacheHelper';
```

### Methods

#### `set(key, data, expirationMinutes?)`

Stores data in cache with optional expiration.

**Parameters:**

- `key` (string): Cache key
- `data` (any): Data to cache
- `expirationMinutes` (optional, number): Expiration time in minutes

**Example:**

```typescript
// Cache user data for 30 minutes
await cacheHelper.set('user_profile', userProfile, 30);

// Cache without expiration
await cacheHelper.set('app_settings', settings);
```

#### `get(key)`

Retrieves data from cache.

**Parameters:**

- `key` (string): Cache key

**Returns:** `Promise<any | null>` - Cached data or null if not found/expired

**Example:**

```typescript
const cachedProfile = await cacheHelper.get('user_profile');
if (cachedProfile) {
  setUserProfile(cachedProfile);
} else {
  // Fetch from API
}
```

#### `remove(key)`

Removes specific item from cache.

**Parameters:**

- `key` (string): Cache key to remove

**Example:**

```typescript
await cacheHelper.remove('expired_data');
```

#### `clear()`

Clears all cache data.

**Example:**

```typescript
await cacheHelper.clear(); // Clear all cache
```

#### `getSize()`

Gets total cache size in bytes.

**Returns:** `Promise<number>` - Cache size in bytes

**Example:**

```typescript
const cacheSize = await cacheHelper.getSize();
console.log(`Cache size: ${cacheSize} bytes`);
```

#### `getKeys()`

Gets all cache keys.

**Returns:** `Promise<string[]>` - Array of cache keys

**Example:**

```typescript
const keys = await cacheHelper.getKeys();
console.log('Cached items:', keys);
```

---

## Preload Manager

The `preloadManager` utility handles predictive preloading of images, data, and components to improve perceived performance.

### Import

```typescript
import {preloadManager} from '../utils/preloadManager';
```

### Methods

#### `preloadImages(imageUrls, priority?)`

Preloads images using FastImage.

**Parameters:**

- `imageUrls` (string[]): Array of image URLs to preload
- `priority` (optional): FastImage priority ('low' | 'normal' | 'high')

**Returns:** `Promise<void>`

**Example:**

```typescript
// Preload high-priority images
await preloadManager.preloadImages(
  ['https://example.com/hero.jpg', 'https://example.com/banner.jpg'],
  'high',
);
```

#### `preloadData(requests, cacheTime?)`

Preloads data from API endpoints.

**Parameters:**

- `requests` (Array): Array of request objects with `key` and `url`
- `cacheTime` (optional, number): Cache duration in minutes

**Returns:** `Promise<Record<string, any>>`

**Example:**

```typescript
const preloadedData = await preloadManager.preloadData(
  [
    {key: 'posts', url: 'https://api.example.com/posts'},
    {key: 'users', url: 'https://api.example.com/users'},
  ],
  15,
);

console.log(preloadedData.posts); // Cached posts data
```

#### `preloadComponents(componentKeys)`

Preloads React components for faster mounting.

**Parameters:**

- `componentKeys` (string[]): Array of component identifiers

**Returns:** `Promise<void>`

**Example:**

```typescript
await preloadManager.preloadComponents([
  'UserProfile',
  'ProductCard',
  'ImageGallery',
]);
```

#### `getPreloadStatus()`

Gets current preload status and statistics.

**Returns:** Object with preload statistics

**Example:**

```typescript
const status = preloadManager.getPreloadStatus();
console.log(
  `Images preloaded: ${status.images.completed}/${status.images.total}`,
);
```

#### `clearPreloadCache()`

Clears all preloaded data.

**Example:**

```typescript
preloadManager.clearPreloadCache();
```

---

## Helper Functions

The `helper` utility provides responsive design and utility functions for consistent UI scaling.

### Import

```typescript
import {
  scale,
  verticalScale,
  moderateScale,
  isTablet,
  getDeviceWidth,
  getDeviceHeight,
} from '../utils/helper';
```

### Scaling Functions

#### `scale(size)`

Scales size based on device width.

**Parameters:**

- `size` (number): Base size to scale

**Returns:** `number` - Scaled size

**Example:**

```typescript
const buttonWidth = scale(100); // Scales based on device width
```

#### `verticalScale(size)`

Scales size based on device height.

**Parameters:**

- `size` (number): Base size to scale

**Returns:** `number` - Vertically scaled size

**Example:**

```typescript
const headerHeight = verticalScale(60);
```

#### `moderateScale(size, factor?)`

Moderately scales size with optional factor.

**Parameters:**

- `size` (number): Base size to scale
- `factor` (optional, number): Scaling factor (default: 0.5)

**Returns:** `number` - Moderately scaled size

**Example:**

```typescript
const fontSize = moderateScale(16); // Good for text scaling
const customScale = moderateScale(20, 0.3); // Custom factor
```

### Device Information

#### `isTablet()`

Checks if device is a tablet.

**Returns:** `boolean` - True if device is tablet

**Example:**

```typescript
const padding = isTablet() ? scale(20) : scale(16);
```

#### `getDeviceWidth()` / `getDeviceHeight()`

Gets device dimensions.

**Returns:** `number` - Device width/height

**Example:**

```typescript
const screenWidth = getDeviceWidth();
const cardWidth = screenWidth * 0.9;
```

---

## Usage Examples

### Complete Screen Setup with Performance Monitoring

```typescript
import React, { useEffect, useState } from 'react';
import { usePerformanceMonitor } from '../utils/performanceMonitor';
import { cacheHelper } from '../utils/cacheHelper';
import { preloadManager } from '../utils/preloadManager';

const ProfileScreen = () => {
  const { startMetric, endMetric, trackNavigation } = usePerformanceMonitor();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const metricId = startMetric('profile_load', 'component_mount');

    try {
      // Try cache first
      let profile = await cacheHelper.get('user_profile');

      if (!profile) {
        // Cache miss - fetch from API
        const response = await fetch('/api/user/profile');
        profile = await response.json();

        // Cache for 30 minutes
        await cacheHelper.set('user_profile', profile, 30);
      }

      setUserData(profile);

      // Preload next screen's images
      await preloadManager.preloadImages([
        profile.avatarUrl,
        profile.bannerUrl
      ], 'high');

    } finally {
      endMetric(metricId);
    }
  };

  const navigateToSettings = () => {
    const startTime = Date.now();
    navigation.navigate('Settings');
    trackNavigation('Profile', 'Settings', Date.now() - startTime);
  };

  return (
    // Component JSX...
  );
};
```

### Cache Management Strategy

```typescript
// Initialize cache for app startup
const initializeCache = async () => {
  // Check cache size
  const cacheSize = await cacheHelper.getSize();

  // Clear if over 10MB
  if (cacheSize > 10 * 1024 * 1024) {
    await cacheHelper.clear();
  }

  // Preload critical data
  await preloadManager.preloadData(
    [
      {key: 'app_config', url: '/api/config'},
      {key: 'user_preferences', url: '/api/user/preferences'},
    ],
    60,
  ); // Cache for 1 hour
};
```

### Responsive Design Implementation

```typescript
import {scale, verticalScale, moderateScale, isTablet} from '../utils/helper';

const styles = StyleSheet.create({
  container: {
    padding: scale(16),
    marginVertical: verticalScale(20),
  },
  title: {
    fontSize: moderateScale(isTablet() ? 24 : 18),
    marginBottom: verticalScale(12),
  },
  button: {
    width: scale(isTablet() ? 200 : 150),
    height: verticalScale(48),
  },
});
```

### Performance Analytics Dashboard

```typescript
const PerformanceDashboard = () => {
  const {getStats, clearStats} = usePerformanceMonitor();
  const [stats, setStats] = useState(null);

  const loadStats = () => {
    const performanceStats = getStats();
    setStats(performanceStats);
  };

  const formatStats = () => {
    if (!stats) return null;

    return {
      avgNavigation: stats.averageMetricsByType.navigation?.toFixed(2) || 'N/A',
      cacheHitRate: (stats.cache.hitRate * 100).toFixed(1) + '%',
      totalMetrics: stats.metrics.length,
      recentNavigations: stats.navigation.slice(-5),
    };
  };

  return (
    <View>
      <Button title="Load Stats" onPress={loadStats} />
      <Button title="Clear Stats" onPress={clearStats} />
      {stats && (
        <View>
          <Text>Avg Navigation: {formatStats().avgNavigation}ms</Text>
          <Text>Cache Hit Rate: {formatStats().cacheHitRate}</Text>
          <Text>Total Metrics: {formatStats().totalMetrics}</Text>
        </View>
      )}
    </View>
  );
};
```

### Smart Preloading Strategy

```typescript
const SmartPreloadingComponent = ({screenName, nextScreens}) => {
  const {trackCacheHit} = usePerformanceMonitor();

  useEffect(() => {
    implementSmartPreloading();
  }, []);

  const implementSmartPreloading = async () => {
    // Preload based on user behavior patterns
    const userHistory = await cacheHelper.get('navigation_history');

    if (userHistory) {
      const likelyNextScreens = predictNextScreens(userHistory, screenName);

      // Preload images for likely next screens
      for (const nextScreen of likelyNextScreens) {
        const images = getImagesForScreen(nextScreen);
        await preloadManager.preloadImages(images, 'normal');
      }
    }

    // Preload data that expires soon
    const keys = await cacheHelper.getKeys();
    for (const key of keys) {
      const data = await cacheHelper.get(key);
      if (data) {
        trackCacheHit(true);
      } else {
        trackCacheHit(false);
        // Refresh expired data
        await refreshDataForKey(key);
      }
    }
  };
};
```

This documentation provides a comprehensive guide to all utility functions in the predictive components system. Each utility is designed to work together to create a performant, responsive, and intelligent mobile application experience.
