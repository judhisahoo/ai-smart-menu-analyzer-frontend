import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const LocationPermissionScreen = ({ navigation }: any) => {
  const [requesting, setRequesting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [servicesEnabled, setServicesEnabled] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const checkLocationState = useCallback(async () => {
    setCheckingStatus(true);

    try {
      const [permission, enabled] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.hasServicesEnabledAsync(),
      ]);

      const granted = permission.status === 'granted';
      setPermissionGranted(granted);
      setServicesEnabled(enabled);

      if (granted && enabled) {
        navigation.replace('SavingLocation');
      }
    } catch {
      setPermissionGranted(false);
      setServicesEnabled(false);
    } finally {
      setCheckingStatus(false);
    }
  }, [navigation]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [fadeAnim, pulseAnim, slideAnim]);

  useFocusEffect(
    useCallback(() => {
      void checkLocationState();
    }, [checkLocationState])
  );

  const handleAllowLocation = async () => {
    setRequesting(true);

    try {
      const currentPermission = await Location.getForegroundPermissionsAsync();
      let permissionStatus = currentPermission.status;
      let canAskAgain = currentPermission.canAskAgain;

      if (permissionStatus !== 'granted') {
        const requestedPermission = await Location.requestForegroundPermissionsAsync();
        permissionStatus = requestedPermission.status;
        canAskAgain = requestedPermission.canAskAgain;
      }

      if (permissionStatus !== 'granted') {
        setPermissionGranted(false);
        setServicesEnabled(false);

        if (!canAskAgain) {
          Alert.alert(
            'Location Permission Required',
            'Location permission is blocked right now. Please allow it on the next prompt and tap the button again.',
            [{ text: 'OK' }]
          );
          return;
        }

        Alert.alert(
          'Location Permission Required',
          'This app requires location permission to continue.',
          [{ text: 'Try Again' }]
        );
        return;
      }

      setPermissionGranted(true);

      let enabled = await Location.hasServicesEnabledAsync();

      if (enabled) {
        setServicesEnabled(true);
        navigation.replace('SavingLocation');
        return;
      }

      if (Platform.OS === 'android') {
        try {
          await Location.enableNetworkProviderAsync();
          enabled = await Location.hasServicesEnabledAsync();
        } catch {
          // User dismissed system prompt.
        }
      }

      setServicesEnabled(enabled);

      if (enabled) {
        navigation.replace('SavingLocation');
        return;
      }

      Alert.alert(
        'Turn On Location Service',
        'Location service is still OFF. Turn it ON and tap the button again.',
        [{ text: 'Try Again' }]
      );
    } catch {
      Alert.alert('Error', 'Could not request location access. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  const buttonLabel = checkingStatus
    ? 'Checking location status...'
    : permissionGranted && !servicesEnabled
      ? 'Turn On Location Service'
      : 'Allow Location Access';

  const subtitleText = permissionGranted && !servicesEnabled
    ? 'Location permission is granted. Please turn on device location service, then tap the button again.'
    : 'Smart Menu Analyzer uses your location to show nearby restaurants and provide personalized menu recommendations.';

  const mandatoryText = permissionGranted && !servicesEnabled
    ? 'Device location service must stay ON to use this app.'
    : 'Location access is mandatory to use this app.';

  return (
    <View style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.iconWrapper}>
          <View style={styles.iconRing2} />
          <View style={styles.iconRing1} />
          <Animated.View
            style={[styles.iconCircle, { transform: [{ scale: pulseAnim }] }]}
          >
            <Ionicons name="location-sharp" size={52} color="#ffffff" />
          </Animated.View>
        </View>

        <Text style={styles.title}>Location Access{'\n'}Required</Text>
        <Text style={styles.subtitle}>{subtitleText}</Text>

        <View style={styles.featureList}>
          {[
            { icon: 'restaurant-outline', text: 'Find restaurants near you' },
            { icon: 'star-outline', text: 'Personalized recommendations' },
            { icon: 'shield-checkmark-outline', text: 'Your location stays private' },
          ].map((item, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconBg}>
                <Ionicons name={item.icon as any} size={18} color="#2C6CB0" />
              </View>
              <Text style={styles.featureText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.mandatoryNote}>
          <Ionicons name="information-circle-outline" size={16} color="#E67E22" />
          <Text style={styles.mandatoryText}>{mandatoryText}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.allowButton,
            (requesting || checkingStatus) && styles.allowButtonDisabled,
          ]}
          onPress={handleAllowLocation}
          disabled={requesting || checkingStatus}
          activeOpacity={0.85}
        >
          <Ionicons name="location-outline" size={20} color="#fff" style={styles.btnIcon} />
          <Text style={styles.allowButtonText}>
            {requesting ? 'Working...' : buttonLabel}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>You cannot skip this step.</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C8E6FA',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: 'rgba(74,144,226,0.1)',
    top: -width * 0.3,
    right: -width * 0.25,
  },
  bgCircle2: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(44,108,176,0.08)',
    bottom: -width * 0.2,
    left: -width * 0.15,
  },
  content: {
    width: '88%',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  iconRing2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(44,108,176,0.12)',
  },
  iconRing1: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(44,108,176,0.18)',
  },
  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#2C6CB0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A5276',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 15,
    color: '#2C6CB0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  featureList: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(74,144,226,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#1A5276',
    fontWeight: '500',
  },
  mandatoryNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231,76,60,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 24,
    gap: 6,
  },
  mandatoryText: {
    fontSize: 13,
    color: '#E67E22',
    fontWeight: '500',
    flex: 1,
  },
  allowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C6CB0',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 14,
  },
  allowButtonDisabled: {
    opacity: 0.65,
  },
  btnIcon: {
    marginRight: 8,
  },
  allowButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerNote: {
    fontSize: 12,
    color: '#5DADE2',
    textAlign: 'center',
  },
});

export default LocationPermissionScreen;
