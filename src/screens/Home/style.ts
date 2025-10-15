import {useTheme} from '@react-navigation/native';
import {height, width} from '../../utils/helper';
import {StyleSheet} from 'react-native';
import {scale} from 'react-native-size-matters';

const useStyle = () => {
  const {colors} = useTheme();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: scale(20),
      paddingTop: scale(10),
    },
    title: {
      fontSize: scale(32),
      fontWeight: 'bold',
      color: colors.text,
    },
    subtitle: {
      fontSize: scale(16),
      color: colors.text,
      marginTop: scale(4),
      opacity: 0.7,
    },
    bannerContainer: {
      height: scale(200),
      marginHorizontal: scale(20),
      marginBottom: scale(20),
      borderRadius: scale(12),
      overflow: 'hidden',
      position: 'relative',
    },
    bannerImage: {
      width: '100%',
      height: '100%',
    },
    bannerOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: scale(20),
    },
    bannerText: {
      color: 'white',
      fontSize: scale(20),
      fontWeight: 'bold',
    },
    bannerSubtext: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: scale(14),
      marginTop: scale(4),
    },
    section: {
      marginHorizontal: scale(20),
      marginBottom: scale(30),
    },
    sectionTitle: {
      fontSize: scale(22),
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: scale(15),
    },
    cardGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    navCard: {
      width: (width - scale(60)) / 2,
      backgroundColor: colors.card,
      borderRadius: scale(12),
      padding: scale(15),
      marginBottom: scale(15),
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: scale(2),
      },
      shadowOpacity: 0.1,
      shadowRadius: scale(4),
      elevation: 3,
    },
    cardImage: {
      width: scale(60),
      height: scale(60),
      borderRadius: scale(30),
      marginBottom: scale(10),
    },
    placeholderImage: {
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: scale(24),
    },
    cardTitle: {
      fontSize: scale(16),
      fontWeight: '600',
      color: colors.text,
      marginBottom: scale(4),
    },
    cardDescription: {
      fontSize: scale(12),
      color: colors.text,
      textAlign: 'center',
      opacity: 0.6,
    },
    postCard: {
      backgroundColor: colors.card,
      padding: scale(15),
      borderRadius: scale(8),
      marginBottom: scale(10),
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: scale(1),
      },
      shadowOpacity: 0.05,
      shadowRadius: scale(2),
      elevation: 1,
    },
    postTitle: {
      fontSize: scale(16),
      fontWeight: '600',
      color: colors.text,
      marginBottom: scale(8),
    },
    postBody: {
      fontSize: scale(14),
      color: colors.text,
      lineHeight: scale(20),
      opacity: 0.7,
    },
    loadingText: {
      fontSize: scale(14),
      color: colors.text,
      textAlign: 'center',
      padding: scale(20),
      opacity: 0.6,
    },
    photoCard: {
      marginRight: scale(15),
      alignItems: 'center',
    },
    photoImage: {
      width: scale(120),
      height: scale(80),
      borderRadius: scale(8),
      marginBottom: scale(8),
    },
    photoTitle: {
      fontSize: scale(12),
      color: colors.text,
      textAlign: 'center',
      opacity: 0.6,
    },
  });
};

export default useStyle;
