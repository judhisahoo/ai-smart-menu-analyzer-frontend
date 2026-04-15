import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '../constants';

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 10;
const DISHES_STORAGE_KEY = 'scan_dishes_cache';

type ScanState = 'idle' | 'uploading' | 'success' | 'error';

type DishItem = {
  name: string;
  short_description: string;
  image: string | null;
};

type ScanResult = {
  id: number;
  scan_photo: string;
  captured_at: string;
};

const ScanMenuScreen = ({ navigation }: any) => {
  const [userId, setUserId] = useState<string>('');
  const [rawUser, setRawUser] = useState<string>('Not loaded yet...');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [dishes, setDishes] = useState<DishItem[]>([]);
  const [visibleDishes, setVisibleDishes] = useState<DishItem[]>([]);
  const [isMoreLoading, setIsMoreLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const loadUser = async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) {
          const parsed = JSON.parse(raw);
          const obj = parsed?.data ?? parsed;
          setRawUser(JSON.stringify(obj, null, 2));
          const id = String(obj?.user_id ?? obj?.id ?? obj?.userId ?? obj?._id ?? '');
          setUserId(id);
        } else {
          setRawUser('⚠️ No "user" key found in AsyncStorage');
        }
      } catch (e) {
        setRawUser('❌ Error reading user: ' + String(e));
      }
    };

    const loadCachedDishes = async () => {
      try {
        const raw = await AsyncStorage.getItem(DISHES_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as DishItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDishes(parsed);
            setVisibleDishes(parsed.slice(0, ITEMS_PER_PAGE));
          }
        }
      } catch (e) {
        console.warn('[ScanMenu] failed to load cached dishes', e);
      }
    };

    loadUser();
    loadCachedDishes();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    if (scanState === 'success') {
      Animated.spring(successAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    } else {
      successAnim.setValue(0);
    }
  }, [scanState]);

  const saveDishesLocally = async (dishList: DishItem[]) => {
    try {
      await AsyncStorage.setItem(DISHES_STORAGE_KEY, JSON.stringify(dishList));
    } catch (e) {
      console.warn('[ScanMenu] failed to cache dishes locally', e);
    }
  };

  const updateDishes = (dishList: DishItem[]) => {
    setDishes(dishList);
    setVisibleDishes(dishList.slice(0, ITEMS_PER_PAGE));
    saveDishesLocally(dishList);
  };

  const loadMoreDishes = () => {
    if (isMoreLoading || visibleDishes.length >= dishes.length) {
      return;
    }
    setIsMoreLoading(true);
    const nextCount = Math.min(visibleDishes.length + ITEMS_PER_PAGE, dishes.length);
    setVisibleDishes(dishes.slice(0, nextCount));
    setTimeout(() => setIsMoreLoading(false), 250);
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery access is needed to pick a menu photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setScanState('idle');
      setErrorMsg('');
    }
  };

  const captureWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to scan a menu.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setScanState('idle');
      setErrorMsg('');
    }
  };

  const uploadScan = async () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Please capture or select a menu photo first.');
      return;
    }

    let resolvedUserId = userId;
    if (!resolvedUserId) {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) {
          const parsed = JSON.parse(raw);
          const obj = parsed?.data ?? parsed;
          resolvedUserId = String(obj?.user_id ?? obj?.id ?? obj?.userId ?? obj?._id ?? '');
        }
      } catch (e) {
        console.warn('[ScanMenu] AsyncStorage fallback failed:', e);
      }
    }

    if (!resolvedUserId || resolvedUserId === 'undefined' || resolvedUserId === '') {
      Alert.alert('Session Error', 'Could not find your user ID. Please log out and log in again.');
      return;
    }

    setScanState('uploading');
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('user_id', resolvedUserId);

      const filename = imageUri.split('/').pop() ?? 'scan.jpg';
      const ext = (/\.([a-zA-Z0-9]+)$/.exec(filename) ?? [])[1] ?? 'jpg';
      const mimeType = ext.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';

      formData.append('scan_photo', {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        name: filename,
        type: mimeType,
      } as any);

      const res = await fetch(`${BASE_URL}/api/menu-scans`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        const menuScan = json?.data?.menu_scan ?? json?.menu_scan ?? json?.data;
        const dishesList = Array.isArray(json?.data?.dishes)
          ? json.data.dishes
          : Array.isArray(json?.dishes)
          ? json.dishes
          : [];

        if (menuScan && typeof menuScan === 'object') {
          setScanResult({
            id: Number(menuScan.id ?? 0),
            scan_photo: String(menuScan.scan_photo ?? ''),
            captured_at: String(menuScan.captured_at ?? new Date().toISOString()),
          });
        } else {
          setScanResult(null);
        }

        updateDishes(
          dishesList.map((dish: any) => ({
            name: String(dish.name ?? 'Unnamed Dish'),
            short_description: String(dish.short_description ?? ''),
            image: dish.image ?? null,
          }))
        );
        setScanState('success');
      } else {
        const errText = await res.text();
        setErrorMsg(errText || 'Scan upload failed. Please try again.');
        setScanState('error');
      }
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Network error. Please check your connection.');
      setScanState('error');
    }
  };

  const resetScan = () => {
    setImageUri(null);
    setScanState('idle');
    setErrorMsg('');
    setScanResult(null);
    setDishes([]);
    setVisibleDishes([]);
  };

  const renderDishItem = ({ item }: { item: DishItem }) => (
    <View style={styles.dishCard}>
      <View style={styles.dishImageColumn}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.dishImage} resizeMode="cover" />
        ) : (
          <View style={styles.dishPlaceholder}>
            <Ionicons name="image-outline" size={36} color="#5D6D7E" />
            <Text style={styles.placeholderText}>No image</Text>
          </View>
        )}

        <View style={styles.dishActionColumn}>
          <TouchableOpacity style={[styles.dishActionBtn, styles.dishActionBtnPrimary]} onPress={() => {}} activeOpacity={0.8}>
            <Text style={[styles.dishActionBtnText, styles.dishActionBtnTextPrimary]}>View Components</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dishActionBtn, styles.dishActionBtnSecondary]} onPress={() => {}} activeOpacity={0.8}>
            <Text style={[styles.dishActionBtnText, styles.dishActionBtnTextSecondary]}>View Ingredients</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dishDetails}>
        <Text style={styles.dishName}>{item.name}</Text>
        <Text style={styles.dishDescription}>{item.short_description}</Text>
      </View>
    </View>
  );

  const listFooter = () => {
    if (isMoreLoading) {
      return <ActivityIndicator style={{ marginVertical: 12 }} color="#2C6CB0" />;
    }
    if (visibleDishes.length > 0 && visibleDishes.length < dishes.length) {
      return (
        <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMoreDishes} activeOpacity={0.85}>
          <Text style={styles.loadMoreBtnText}>Load more dishes</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1A5276" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Menu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {scanState === 'success' ? (
          <Animated.View
            style={[
              styles.successCard,
              {
                opacity: successAnim,
                transform: [{ scale: successAnim }],
              },
            ]}
          >
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color="#27AE60" />
            </View>
            <Text style={styles.successTitle}>Menu Scanned Successfully! ✅</Text>
            <Text style={styles.successSubtitle}>
              Your menu photo has been uploaded to the server.
            </Text>

            {scanResult?.scan_photo ? (
              <>
                <Text style={styles.successLabel}>Uploaded Image (from server):</Text>
                <Image
                  source={{ uri: scanResult.scan_photo }}
                  style={styles.successThumb}
                  resizeMode="cover"
                />                                
              </>
            ) : (
              imageUri && <Image source={{ uri: imageUri }} style={styles.successThumb} />
            )}

            <TouchableOpacity style={styles.scanAgainBtn} onPress={resetScan}>
              <Ionicons name="scan-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.scanAgainBtnText}>Scan Another Menu</Text>
            </TouchableOpacity>
          </Animated.View>

          
        ) : (
          <>
            <View style={styles.scannerZone}>
              {imageUri ? (
                <View style={styles.previewWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeBtn} onPress={resetScan}>
                    <Ionicons name="close-circle" size={28} color="#fff" />
                  </TouchableOpacity>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
              ) : (
                <Animated.View
                  style={[styles.scannerRing, { transform: [{ scale: pulseAnim }] }]}
                >
                  <View style={styles.scannerInner}>
                    <Ionicons name="restaurant" size={52} color="#2C6CB0" />
                    <Text style={styles.scannerPrompt}>Tap below to scan</Text>
                  </View>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </Animated.View>
              )}
            </View>

            {scanState === 'error' && errorMsg !== '' && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color="#C0392B" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={captureWithCamera}
                disabled={scanState === 'uploading'}
                activeOpacity={0.82}
              >
                <View style={[styles.actionBtnIcon, { backgroundColor: '#2C6CB0' }]}> 
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
                <Text style={styles.actionBtnLabel}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={pickFromGallery}
                disabled={scanState === 'uploading'}
                activeOpacity={0.82}
              >
                <View style={[styles.actionBtnIcon, { backgroundColor: '#1A7BB9' }]}> 
                  <Ionicons name="images" size={24} color="#fff" />
                </View>
                <Text style={styles.actionBtnLabel}>Gallery</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.uploadBtn,
                !imageUri && styles.uploadBtnDisabled,
                scanState === 'uploading' && styles.uploadBtnDisabled,
              ]}
              onPress={uploadScan}
              disabled={!imageUri || scanState === 'uploading'}
              activeOpacity={0.85}
            >
              {scanState === 'uploading' ? (
                <>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
                  <Text style={styles.uploadBtnText}>Uploading Scan...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.uploadBtnText}>
                    {imageUri ? 'Upload & Analyze Menu' : 'Select a Photo First'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>📋 Tips for best results</Text>
              {[
                'Ensure the menu is well-lit and in focus',
                'Capture the full page — avoid cutting off items',
                'Hold your phone steady while shooting',
                'Avoid glare from lighting sources',
              ].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>           
          </>
        )}

        {scanState === 'success' && dishes.length > 0 && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Dish Results ({dishes.length})</Text>
            <ScrollView
              style={styles.resultsList}
              contentContainerStyle={styles.resultsListContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {visibleDishes.map((dish, index) => (
                <View key={index}>{renderDishItem({ item: dish })}</View>
              ))}
              {listFooter()}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const CORNER_SIZE = 22;
const CORNER_THICKNESS = 3;
const CORNER_COLOR = '#2C6CB0';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#C8E6FA', overflow: 'hidden' },

  bgBlob1: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: 'rgba(74,144,226,0.12)',
    top: -width * 0.35,
    right: -width * 0.25,
  },
  bgBlob2: {
    position: 'absolute',
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: width * 0.375,
    backgroundColor: 'rgba(44,108,176,0.09)',
    bottom: -width * 0.18,
    left: -width * 0.18,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A5276',
    letterSpacing: 0.3,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },

  scannerZone: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  scannerRing: {
    width: width * 0.72,
    height: width * 0.72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  scannerInner: { alignItems: 'center', gap: 10 },
  scannerPrompt: {
    fontSize: 14,
    color: '#2E86C1',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  previewWrapper: {
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    elevation: 10,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 14,
  },

  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 10,
    left: 10,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 10,
    right: 10,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 10,
    left: 10,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 10,
    right: 10,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR,
    borderBottomRightRadius: 4,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(231,76,60,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.3)',
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: '#C0392B', lineHeight: 18 },

  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 18,
    paddingVertical: 18,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  actionBtnIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A5276',
  },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C6CB0',
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  uploadBtnDisabled: { opacity: 0.5 },
  uploadBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  tipsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A5276',
    marginBottom: 12,
  },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2C6CB0',
    marginTop: 5,
  },
  tipText: { flex: 1, fontSize: 13, color: '#2E86C1', lineHeight: 19 },

  successCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  successIconCircle: {
    width: 75,
    height: 75,
    borderRadius: 50,
    backgroundColor: 'rgba(39,174,96,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A5276',
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#2E86C1',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  successThumb: {
    width: width * 0.72,
    height: width * 0.52,
    borderRadius: 14,
    marginBottom: 14,
    resizeMode: 'cover',
  },
  successLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A5276',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  successMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  successMetaText: {
    fontSize: 12,
    color: '#2E86C1',
    fontWeight: '600',
  },
  successUrlBox: {
    width: '100%',
    backgroundColor: 'rgba(200,230,250,0.5)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(44,108,176,0.2)',
    padding: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  successUrlLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A5276',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  successUrl: {
    fontSize: 11,
    color: '#2C6CB0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C6CB0',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scanAgainBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  resultsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 18,
    marginTop: 20,
    shadowColor: '#34495E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A5276',
    marginBottom: 14,
  },
  resultsList: {
    width: '100%',
    maxHeight: 520,
  },
  resultsListContent: {
    paddingBottom: 16,
  },
  dishCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(232,243,255,0.82)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  dishImage: {
    width: 110,
    height: 110,
    borderRadius: 16,
  },
  dishPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: 'rgba(44,108,176,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    marginTop: 6,
    fontSize: 11,
    color: '#5D6D7E',
    textAlign: 'center',
  },
  dishImageColumn: {
    width: 110,
    alignItems: 'center',
    marginRight: 12,
  },
  dishActionColumn: {
    width: '100%',
  },
  dishDetails: {
    flex: 1,
  },
  dishName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A5276',
    marginBottom: 6,
  },
  dishDescription: {
    fontSize: 13,
    color: '#2E86C1',
    lineHeight: 18,
  },
  dishActionBtn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 10,
  },
  dishActionBtnPrimary: {
    backgroundColor: '#2C6CB0',
  },
  dishActionBtnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(44,108,176,0.45)',
  },
  dishActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dishActionBtnTextPrimary: {
    color: '#fff',
  },
  dishActionBtnTextSecondary: {
    color: '#2C6CB0',
  },
  loadMoreText: {
    textAlign: 'center',
    color: '#2E86C1',
    marginVertical: 10,
    fontSize: 12,
  },
  loadMoreBtn: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#2C6CB0',
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  loadMoreBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  debugCard: {
    width: '100%',
    backgroundColor: 'rgba(255,245,245,0.95)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(192,57,43,0.4)',
    padding: 14,
    marginTop: 16,
  },
  debugTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C0392B',
    marginBottom: 4,
  },
  debugUserId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#922B21',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  debugJson: {
    fontSize: 11,
    color: '#4A235A',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 17,
  },
});

export default ScanMenuScreen;
