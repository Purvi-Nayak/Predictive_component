// Local Images - for bundled assets
export const Images = {
  register: require('./images/regfinal.png'),
  design: require('./images/design.png'),
};

// Local Icons - for bundled assets
export const Icons = {
  bell: require('./icons/bell.png'),
  location: require('./icons/location.png'),
  downarrow: require('./icons/arrow-down.png'),
  loupe: require('./icons/loupe.png'),
};

// Fonts for preloading
export const Fonts = {
  comicRelief: require('./fonts/Comic Relief Regular.ttf'),
  notoSansJP: require('./fonts/Noto Sans JP.ttf'),
  openSans: require('./fonts/Open Sans.ttf'),
};

// Remote Images URLs for FastImage preloading
export const RemoteImages = {
  userProfile:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  banner:
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop',
  product1:
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
  product2:
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop',
  product3:
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop',
  gallery1:
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
  gallery2:
    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=300&fit=crop',
  gallery3:
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
};

// Mock API URLs for data preloading
export const ApiEndpoints = {
  userProfile: 'https://jsonplaceholder.typicode.com/users/1',
  posts: 'https://jsonplaceholder.typicode.com/posts',
  albums: 'https://jsonplaceholder.typicode.com/albums',
  photos: 'https://jsonplaceholder.typicode.com/photos?_limit=10',
  todos: 'https://jsonplaceholder.typicode.com/todos?_limit=5',
};

// Asset preloading groups for different screens
export const PreloadGroups = {
  home: {
    images: [RemoteImages.banner, RemoteImages.product1, RemoteImages.product2],
    apis: [ApiEndpoints.posts, ApiEndpoints.photos],
  },
  profile: {
    images: [RemoteImages.userProfile, RemoteImages.gallery1],
    apis: [ApiEndpoints.userProfile, ApiEndpoints.albums],
  },
  products: {
    images: [
      RemoteImages.product1,
      RemoteImages.product2,
      RemoteImages.product3,
    ],
    apis: [ApiEndpoints.photos],
  },
  gallery: {
    images: [
      RemoteImages.gallery1,
      RemoteImages.gallery2,
      RemoteImages.gallery3,
    ],
    apis: [ApiEndpoints.albums],
  },
};
