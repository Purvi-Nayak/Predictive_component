import React, {useEffect, useState} from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {useAssetCache} from '../../hooks/useAssetCache';

interface DataPreloaderProps {
  requests: Array<{
    key: string;
    url: string;
    ttl?: number;
  }>;
  showProgress?: boolean;
  onComplete?: (data: Record<string, any>) => void;
  onError?: (errors: string[]) => void;
  children?: React.ReactNode;
}

export const DataPreloader: React.FC<DataPreloaderProps> = ({
  requests,
  showProgress = false,
  onComplete,
  onError,
  children,
}) => {
  const {fetchWithCache} = useAssetCache();
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    completed: 0,
    total: requests.length,
    errors: [] as string[],
  });

  useEffect(() => {
    if (requests.length > 0) {
      preloadData();
    }
  }, [requests]);

  const preloadData = async () => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      completed: 0,
      errors: [],
    }));

    const results: Record<string, any> = {};
    const errors: string[] = [];
    let completed = 0;

    try {
      const promises = requests.map(async ({key, url, ttl}) => {
        try {
          const data = await fetchWithCache(
            key,
            async () => {
              const response = await fetch(url);
              if (!response.ok) {
                throw new Error(
                  `HTTP ${response.status}: ${response.statusText}`,
                );
              }
              return response.json();
            },
            ttl,
          );

          results[key] = data;
          completed++;
          setLoadingState(prev => ({...prev, completed}));

          return {key, data, success: true};
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to load ${key}: ${errorMessage}`);
          completed++;
          setLoadingState(prev => ({...prev, completed, errors}));

          return {key, error: errorMessage, success: false};
        }
      });

      await Promise.allSettled(promises);

      setLoadingState(prev => ({...prev, isLoading: false}));

      if (errors.length > 0 && onError) {
        onError(errors);
      }

      if (onComplete) {
        onComplete(results);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        errors: [errorMessage],
      }));

      if (onError) {
        onError([errorMessage]);
      }
    }
  };

  if (showProgress && loadingState.isLoading) {
    return (
      <View style={styles.progressContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.progressText}>
          Loading data... ({loadingState.completed}/{loadingState.total})
        </Text>
        {loadingState.errors.length > 0 && (
          <Text style={styles.errorText}>
            {loadingState.errors.length} errors
          </Text>
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
