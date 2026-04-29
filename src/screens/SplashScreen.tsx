import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  LocationPermission: undefined;
  SavingLocation: undefined;
};

type SplashScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'LocationPermission'>;
};

const SplashScreen = ({ navigation }: SplashScreenProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    let isActive = true;

    const checkStartupRoute = async () => {
      try {
        const [permission, servicesEnabled] = await Promise.all([
          Location.getForegroundPermissionsAsync(),
          Location.hasServicesEnabledAsync(),
        ]);

        if (!isActive) {
          return;
        }

        if (permission.status === 'granted' && servicesEnabled) {
          navigation.replace('SavingLocation');
          return;
        }

        navigation.replace('LocationPermission');
      } catch {
        if (isActive) {
          navigation.replace('LocationPermission');
        }
      }
    };

    const timer = setTimeout(() => {
      void checkStartupRoute();
    }, 2500);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [fadeAnim, navigation, scaleAnim, slideUpAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      <Animated.View
        style={[
          styles.topContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] },
        ]}
      >
        <Text style={styles.title}>Smart Menu Analyzer</Text>
        <Text style={styles.tagline}>Scan. Understand. Enjoy.</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.imageContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Image
          source={require('../../assets/splash-image-final.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.bottomContainer, { opacity: fadeAnim }]}>
        <Text style={styles.loadingText}>Loading...</Text>
        <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
        <Text style={styles.poweredText}>
          Powered by <Text style={styles.poweredBold}>AI</Text>
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C8E6FA',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 56,
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(74,144,226,0.12)',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  bgCircle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(44,108,176,0.1)',
    bottom: height * 0.1,
    left: -width * 0.15,
  },
  bgCircle3: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(93,173,226,0.15)',
    bottom: -width * 0.1,
    right: -width * 0.05,
  },
  topContainer: {
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1A5276',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#2E86C1',
    marginTop: 8,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  image: {
    width: width * 0.78,
    height: width * 0.78,
  },
  bottomContainer: {
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#2C6CB0',
    fontWeight: '600',
    marginBottom: 8,
  },
  loader: {
    marginVertical: 4,
  },
  poweredText: {
    marginTop: 10,
    fontSize: 14,
    color: '#2E86C1',
  },
  poweredBold: {
    fontWeight: '900',
    color: '#1A5276',
  },
});

export default SplashScreen;
