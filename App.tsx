/**
 * Predictive Components Demo App
 * Demonstrates advanced preloading techniques for React Native
 */

import React from 'react';
import {StatusBar} from 'react-native';
import {AppNavigator} from './src/navigation';

const App = (): React.JSX.Element => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AppNavigator />
    </>
  );
};

export default App;
