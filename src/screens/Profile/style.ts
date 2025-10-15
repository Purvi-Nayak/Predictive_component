import {StyleSheet} from 'react-native';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';

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
    profileCard: {
      backgroundColor: theme.colors.surface,
      margin: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      alignItems: 'center',
      ...theme.shadows.medium,
    },
    profileImageContainer: {
      position: 'relative',
      marginBottom: theme.spacing.md,
    },
    profileImage: {
      width: scale(120),
      height: scale(120),
      borderRadius: scale(60),
      borderWidth: scale(4),
      borderColor: theme.colors.primary,
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: scale(8),
      right: scale(8),
      width: scale(16),
      height: scale(16),
      borderRadius: scale(8),
      backgroundColor: theme.colors.success,
      borderWidth: scale(2),
      borderColor: theme.colors.background,
    },
    profileName: {
      fontSize: moderateScale(22),
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    profileEmail: {
      fontSize: moderateScale(16),
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    profileLocation: {
      fontSize: moderateScale(14),
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    profileStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginTop: theme.spacing.md,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: moderateScale(20),
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: moderateScale(12),
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
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
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.small,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    infoIcon: {
      width: scale(20),
      height: scale(20),
      marginRight: theme.spacing.sm,
    },
    infoLabel: {
      fontSize: moderateScale(14),
      color: theme.colors.textSecondary,
      flex: 1,
    },
    infoValue: {
      fontSize: moderateScale(14),
      color: theme.colors.text,
      fontWeight: '500',
    },
    actionButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      alignItems: 'center',
      marginVertical: theme.spacing.sm,
      ...theme.shadows.small,
    },
    actionButtonSecondary: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    actionButtonText: {
      fontSize: moderateScale(16),
      fontWeight: '600',
      color: theme.colors.background,
    },
    actionButtonTextSecondary: {
      color: theme.colors.primary,
    },
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.sm,
    },
    skillTag: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.sm,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      marginRight: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    skillText: {
      fontSize: moderateScale(12),
      color: theme.colors.background,
      fontWeight: '500',
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
    recentActivity: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    activityTitle: {
      fontSize: moderateScale(14),
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    activityDescription: {
      fontSize: moderateScale(12),
      color: theme.colors.textSecondary,
      lineHeight: moderateScale(16),
    },
    activityTime: {
      fontSize: moderateScale(11),
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
      fontStyle: 'italic',
    },
  });
};

export default useStyle;
