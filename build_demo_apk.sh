#!/bin/bash

# 🚀 Build Release APK for Demo
echo "🔧 Building Release APK for Performance Demo..."

# Clean everything first
echo "🧹 Cleaning project..."
cd /Users/ips-162/Documents/ReactNative/predictive_components

# Clean React Native
npx react-native clean

# Clean Android
cd android
./gradlew clean
cd ..

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Release APK
echo "🏗️ Building Release APK..."
cd android
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    echo "✅ APK Build Successful!"
    echo ""
    echo "📱 APK Location:"
    echo "android/app/build/outputs/apk/release/app-release.apk"
    echo ""
    echo "🎯 Demo Features in APK:"
    echo "• REAL Performance Demo (🚀 button on home screen)"
    echo "• No artificial delays - genuine network vs cache timing"
    echo "• Live performance metrics"
    echo "• Predictive preloading system"
    echo ""
    echo "📊 How to demo to your sir:"
    echo "1. Install APK on device: adb install android/app/build/outputs/apk/release/app-release.apk"
    echo "2. Open app and tap '🚀 REAL Performance' button"
    echo "3. Run performance tests to show real metrics"
    echo "4. Clear cache and test again to show differences"
    echo ""
else
    echo "❌ APK Build Failed!"
    echo "Check the errors above and try again."
fi