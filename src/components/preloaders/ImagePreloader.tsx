import React, {useEffect, useState} from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {useImagePreloader} from '../../hooks/useImagePreloader';

interface ImagePreloaderProps {
  imageUrls: string[];
  priority?: 'low' | 'normal' | 'high';
  showProgress?: boolean;
  onComplete?: (result: any) => void;
  onError?: (errors: string[]) => void;
  children?: React.ReactNode;
}

export const ImagePreloader: React.FC<ImagePreloaderProps> = ({
  imageUrls,
  priority = 'normal',
  showProgress = false,
  onComplete,
  onError,
  children,
}) => {
  const {preloadRemoteImages, result} = useImagePreloader();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (imageUrls.length > 0 && !isInitialized) {
      setIsInitialized(true);
      preloadRemoteImages(imageUrls, priority)
        .then(preloadResult => {
          if (onComplete) {
            onComplete(preloadResult);
          }
        })
        .catch(error => {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          if (onError) {
            onError([errorMessage]);
          }
        });
    }
  }, [
    imageUrls,
    priority,
    isInitialized,
    preloadRemoteImages,
    onComplete,
    onError,
  ]);

  if (showProgress && result.isPreloading) {
    return (
      <View style={styles.progressContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.progressText}>
          Preloading images... ({result.preloadedCount}/{imageUrls.length})
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    margin: 10,
  },
  progressText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
});
