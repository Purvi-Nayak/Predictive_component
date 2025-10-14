import React, {useEffect, useState} from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {useComponentLoader} from '../../hooks/useComponentLoader';

interface ComponentPreloaderProps {
  components: Array<{
    name: string;
    importFunction: () => Promise<any>;
  }>;
  showProgress?: boolean;
  onComplete?: (result: any) => void;
  onError?: (errors: string[]) => void;
  children?: React.ReactNode;
}

export const ComponentPreloader: React.FC<ComponentPreloaderProps> = ({
  components,
  showProgress = false,
  onComplete,
  onError,
  children,
}) => {
  const {preloadComponents, result} = useComponentLoader();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (components.length > 0 && !isInitialized) {
      setIsInitialized(true);
      preloadComponents(components)
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
  }, [components, isInitialized, preloadComponents, onComplete, onError]);

  if (showProgress && result.isLoading) {
    return (
      <View style={styles.progressContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.progressText}>
          Preloading components... ({result.loadedCount}/{components.length})
        </Text>
        {result.errors.length > 0 && (
          <Text style={styles.errorText}>{result.errors.length} errors</Text>
        )}
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
  errorText: {
    marginLeft: 10,
    fontSize: 12,
    color: '#ff6b6b',
  },
});
