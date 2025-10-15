import {Dimensions} from 'react-native';

const {width, height} = Dimensions.get('window');

// Standard dimensions for design
const standardWidth = 375;
const standardHeight = 812;

// Helper functions for responsive design
export const getWidth = (percentage: number): number => {
  return (width * percentage) / 100;
};

export const getHeight = (percentage: number): number => {
  return (height * percentage) / 100;
};

// Get device dimensions
export {width, height};

// Responsive scaling based on device size
export const scaleFont = (size: number): number => {
  const scale = width / standardWidth;
  return Math.ceil(size * scale);
};

// Check if device is tablet
export const isTablet = (): boolean => {
  const aspectRatio = height / width;
  return width >= 768 && aspectRatio <= 1.6;
};

// Check device orientation
export const isLandscape = (): boolean => {
  return width > height;
};

// Safe area calculations (basic implementation)
export const getSafeAreaTop = (): number => {
  // This would typically use react-native-safe-area-context
  // For now, return a default value
  return height > 800 ? 44 : 20;
};

export const getSafeAreaBottom = (): number => {
  // This would typically use react-native-safe-area-context
  // For now, return a default value
  return height > 800 ? 34 : 0;
};

// Color helpers
export const hexToRgba = (hex: string, alpha: number = 1): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Format helpers
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatPrice = (price: number, currency: string = '$'): string => {
  return `${currency}${price.toFixed(2)}`;
};

// Delay helper for demo purposes
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Debounce helper
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle helper
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Deep clone helper
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Array helpers
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// String helpers
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Date helpers
export const formatDate = (
  date: Date | string,
  format: 'short' | 'long' = 'short',
): string => {
  const d = new Date(date);

  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(target);
};
