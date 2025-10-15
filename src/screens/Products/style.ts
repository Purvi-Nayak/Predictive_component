import {StyleSheet, Dimensions} from 'react-native';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';

const {width} = Dimensions.get('window');

interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    accent: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  shadows: {
    small: object;
    medium: object;
    large: object;
  };
}

const useTheme = (): Theme => ({
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#1A1A1A',
    textSecondary: '#666666',
    border: '#E1E5E9',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#5AC8FA',
    accent: '#FF6B6B',
  },
  spacing: {
    xs: scale(4),
    sm: scale(8),
    md: scale(16),
    lg: scale(24),
    xl: scale(32),
    xxl: scale(48),
  },
  borderRadius: {
    sm: scale(4),
    md: scale(8),
    lg: scale(12),
    xl: scale(16),
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: scale(1)},
      shadowOpacity: 0.1,
      shadowRadius: scale(2),
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: scale(2)},
      shadowOpacity: 0.15,
      shadowRadius: scale(4),
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: scale(4)},
      shadowOpacity: 0.2,
      shadowRadius: scale(8),
      elevation: 5,
    },
  },
});

const useStyle = () => {
  const theme = useTheme();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    backButtonText: {
      color: theme.colors.background,
      fontSize: moderateScale(16),
      fontWeight: 'bold',
    },
    headerTitle: {
      fontSize: moderateScale(24),
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    searchContainer: {
      margin: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    searchInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: moderateScale(16),
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterContainer: {
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    filterScroll: {
      paddingVertical: theme.spacing.xs,
    },
    filterChip: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      marginRight: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      fontSize: moderateScale(14),
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    filterChipTextActive: {
      color: theme.colors.background,
    },
    section: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: moderateScale(20),
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    productsGrid: {
      paddingHorizontal: theme.spacing.lg,
    },
    productCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
      overflow: 'hidden',
      ...theme.shadows.medium,
    },
    productImage: {
      width: '100%',
      height: verticalScale(200),
    },
    productImagePlaceholder: {
      width: '100%',
      height: verticalScale(200),
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    productImagePlaceholderText: {
      fontSize: moderateScale(40),
    },
    productContent: {
      padding: theme.spacing.md,
    },
    productHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    productTitle: {
      fontSize: moderateScale(18),
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    productPrice: {
      fontSize: moderateScale(16),
      fontWeight: 'bold',
      color: theme.colors.success,
    },
    productDescription: {
      fontSize: moderateScale(14),
      color: theme.colors.textSecondary,
      lineHeight: moderateScale(20),
      marginBottom: theme.spacing.md,
    },
    productMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    productCategory: {
      fontSize: moderateScale(12),
      color: theme.colors.primary,
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      overflow: 'hidden',
    },
    productRating: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingStars: {
      fontSize: moderateScale(12),
      color: theme.colors.warning,
      marginRight: theme.spacing.xs,
    },
    ratingText: {
      fontSize: moderateScale(12),
      color: theme.colors.textSecondary,
    },
    productActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.sm,
      alignItems: 'center',
      ...theme.shadows.small,
    },
    actionButtonSecondary: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    actionButtonText: {
      fontSize: moderateScale(14),
      fontWeight: '600',
      color: theme.colors.background,
    },
    actionButtonTextSecondary: {
      color: theme.colors.primary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    loadingText: {
      fontSize: moderateScale(16),
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
    },
    errorContainer: {
      margin: theme.spacing.lg,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    errorText: {
      fontSize: moderateScale(16),
      color: theme.colors.background,
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    emptyText: {
      fontSize: moderateScale(18),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
    emptySubtext: {
      fontSize: moderateScale(14),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
    featuredBadge: {
      position: 'absolute',
      top: theme.spacing.sm,
      right: theme.spacing.sm,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    featuredText: {
      fontSize: moderateScale(10),
      color: theme.colors.background,
      fontWeight: 'bold',
    },
    stockStatus: {
      fontSize: moderateScale(12),
      fontWeight: '500',
      marginLeft: theme.spacing.sm,
    },
    inStock: {
      color: theme.colors.success,
    },
    outOfStock: {
      color: theme.colors.error,
    },
    lowStock: {
      color: theme.colors.warning,
    },
    quickActionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    quickActionButton: {
      alignItems: 'center',
      padding: theme.spacing.sm,
    },
    quickActionIcon: {
      width: scale(24),
      height: scale(24),
      marginBottom: theme.spacing.xs,
    },
    quickActionText: {
      fontSize: moderateScale(12),
      color: theme.colors.textSecondary,
    },
    sortContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sortLabel: {
      fontSize: moderateScale(14),
      color: theme.colors.textSecondary,
      marginRight: theme.spacing.sm,
    },
    sortButton: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginRight: theme.spacing.sm,
    },
    sortButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    sortButtonText: {
      fontSize: moderateScale(12),
      color: theme.colors.textSecondary,
    },
    sortButtonTextActive: {
      color: theme.colors.background,
    },
  });
};

export default useStyle;
