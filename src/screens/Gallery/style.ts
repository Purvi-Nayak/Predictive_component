import {StyleSheet, Dimensions} from 'react-native';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';

const {width, height} = Dimensions.get('window');

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
    overlay: string;
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
    overlay: 'rgba(0, 0, 0, 0.8)',
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
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerButton: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(18),
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: theme.spacing.sm,
    },
    headerButtonText: {
      color: theme.colors.background,
      fontSize: moderateScale(14),
      fontWeight: 'bold',
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
    albumsContainer: {
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    albumsScroll: {
      paddingVertical: theme.spacing.sm,
    },
    albumCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginRight: theme.spacing.md,
      overflow: 'hidden',
      width: scale(150),
      ...theme.shadows.small,
    },
    albumImage: {
      width: '100%',
      height: verticalScale(100),
    },
    albumImagePlaceholder: {
      width: '100%',
      height: verticalScale(100),
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    albumImagePlaceholderText: {
      fontSize: moderateScale(24),
    },
    albumContent: {
      padding: theme.spacing.sm,
    },
    albumTitle: {
      fontSize: moderateScale(14),
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    albumCount: {
      fontSize: moderateScale(12),
      color: theme.colors.textSecondary,
    },
    photosGrid: {
      paddingHorizontal: theme.spacing.lg,
    },
    photoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    photoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      width: (width - scale(56)) / 2, // Account for padding and gap
      ...theme.shadows.small,
    },
    photoImage: {
      width: '100%',
      height: verticalScale(120),
    },
    photoImagePlaceholder: {
      width: '100%',
      height: verticalScale(120),
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoImagePlaceholderText: {
      fontSize: moderateScale(20),
    },
    photoContent: {
      padding: theme.spacing.sm,
    },
    photoTitle: {
      fontSize: moderateScale(12),
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    photoMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    photoLikes: {
      fontSize: moderateScale(10),
      color: theme.colors.textSecondary,
    },
    photoDate: {
      fontSize: moderateScale(10),
      color: theme.colors.textSecondary,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      width: width - scale(48),
      maxHeight: height * 0.8,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    modalTitle: {
      fontSize: moderateScale(18),
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    modalCloseButton: {
      width: scale(32),
      height: scale(32),
      borderRadius: scale(16),
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCloseText: {
      fontSize: moderateScale(14),
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
    },
    modalImage: {
      width: '100%',
      height: verticalScale(200),
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
    },
    modalDescription: {
      fontSize: moderateScale(14),
      color: theme.colors.textSecondary,
      lineHeight: moderateScale(20),
      marginBottom: theme.spacing.md,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    modalButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.sm,
      alignItems: 'center',
    },
    modalButtonSecondary: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    modalButtonText: {
      fontSize: moderateScale(14),
      fontWeight: '600',
      color: theme.colors.background,
    },
    modalButtonTextSecondary: {
      color: theme.colors.primary,
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
    statsContainer: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      ...theme.shadows.small,
    },
    statsTitle: {
      fontSize: moderateScale(16),
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: moderateScale(18),
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: moderateScale(12),
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    favoriteButton: {
      position: 'absolute',
      top: theme.spacing.sm,
      right: theme.spacing.sm,
      width: scale(32),
      height: scale(32),
      borderRadius: scale(16),
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.small,
    },
    favoriteIcon: {
      fontSize: moderateScale(16),
    },
    favoriteActive: {
      color: theme.colors.error,
    },
    favoriteInactive: {
      color: theme.colors.textSecondary,
    },
  });
};

export default useStyle;
