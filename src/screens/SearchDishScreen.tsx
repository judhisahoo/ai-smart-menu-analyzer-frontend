import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../constants';

const { width } = Dimensions.get('window');

type DishItem = {
  id?: string;
  name: string;
  short_description: string;
  image: string | null;
};

type DetailLoadingState =
  | { type: 'component'; dishName: string }
  | { type: 'ingredient'; dishName: string }
  | null;

const SearchDishScreen = ({ navigation }: any) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [dishes, setDishes] = useState<DishItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState<DetailLoadingState>(null);

  const sanitizeDishName = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const searchDishes = async () => {
    const itemTitle = query.trim();
    if (!itemTitle) {
      Alert.alert('Dish name required', 'Please enter a dish name to search.');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`${BASE_URL}/api/dish/item-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_title: itemTitle }),
      });

      if (res.ok) {
        const json = await res.json();
        const resultList = Array.isArray(json?.data) ? json.data : [];
        setDishes(
          resultList.map((dish: any) => ({
            id: dish?.id ? String(dish.id) : undefined,
            name: String(dish?.name ?? 'Unnamed Dish'),
            short_description: String(dish?.short_description ?? ''),
            image: dish?.image ?? null,
          }))
        );
      } else {
        const errText = await res.text();
        setDishes([]);
        Alert.alert('Search Failed', errText || 'Unable to search dishes. Please try again.');
      }
    } catch (err: any) {
      setDishes([]);
      Alert.alert('Network Error', err.message || 'Please check your connection.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewComponent = async (dishName: string) => {
    const sanitized = sanitizeDishName(dishName);
    setLoadingDetail({ type: 'component', dishName });
    try {
      const res = await fetch(`${BASE_URL}/api/dish/item-component/${sanitized}`);
      if (res.ok) {
        const json = await res.json();
        const resultData = json?.data ?? json;
        if (resultData) {
          navigation.navigate('ComponentScreen', { data: resultData });
        } else {
          Alert.alert('Error', 'No component data returned from server.');
        }
      } else {
        const errText = await res.text();
        Alert.alert('Error', errText || 'Failed to fetch component data.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to load component data.');
    } finally {
      setLoadingDetail(null);
    }
  };

  const handleViewIngredients = async (dishName: string) => {
    const sanitized = sanitizeDishName(dishName);
    setLoadingDetail({ type: 'ingredient', dishName });
    try {
      const res = await fetch(`${BASE_URL}/api/dish/item-ingredient/${sanitized}`);
      if (res.ok) {
        const json = await res.json();
        const resultData = json?.data ?? json;
        if (resultData) {
          navigation.navigate('IngredientScreen', { data: resultData });
        } else {
          Alert.alert('Error', 'No ingredient data returned from server.');
        }
      } else {
        const errText = await res.text();
        Alert.alert('Error', errText || 'Failed to fetch ingredient data.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to load ingredient data.');
    } finally {
      setLoadingDetail(null);
    }
  };

  const renderDishCard = (item: DishItem) => {
    const isLoadingComponent = loadingDetail?.type === 'component' && loadingDetail.dishName === item.name;
    const isLoadingIngredients = loadingDetail?.type === 'ingredient' && loadingDetail.dishName === item.name;

    return (
      <View key={item.id ?? item.name} style={styles.dishCard}>
        <View style={styles.dishMedia}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.dishImage} resizeMode="cover" />
          ) : (
            <View style={styles.dishPlaceholder}>
              <Ionicons name="restaurant" size={34} color="#2C6CB0" />
            </View>
          )}
        </View>

        <View style={styles.dishDetails}>
          <Text style={styles.dishName}>{item.name}</Text>
          <Text style={styles.dishDescription}>
            {item.short_description || 'No description available for this dish.'}
          </Text>

          <View style={styles.dishActionRow}>
            <TouchableOpacity
              style={[styles.dishActionBtn, styles.dishActionBtnPrimary, isLoadingComponent && styles.disabledBtn]}
              onPress={() => handleViewComponent(item.name)}
              activeOpacity={0.82}
              disabled={loadingDetail !== null}
            >
              {isLoadingComponent ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="layers" size={15} color="#fff" style={styles.dishActionIcon} />
                  <Text style={[styles.dishActionBtnText, styles.dishActionBtnTextPrimary]}>View Component</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dishActionBtn, styles.dishActionBtnSecondary, isLoadingIngredients && styles.disabledBtn]}
              onPress={() => handleViewIngredients(item.name)}
              activeOpacity={0.82}
              disabled={loadingDetail !== null}
            >
              {isLoadingIngredients ? (
                <ActivityIndicator size="small" color="#2C6CB0" />
              ) : (
                <>
                  <Ionicons name="list" size={15} color="#2C6CB0" style={styles.dishActionIcon} />
                  <Text style={[styles.dishActionBtnText, styles.dishActionBtnTextSecondary]}>View Ingredients</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Find dishes</Text>
            <Text style={styles.headerTitle}>Search Dishes</Text>
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.82}>
            <Ionicons name="arrow-back" size={22} color="#2C6CB0" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="search-outline" size={38} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Dish Finder</Text>
          <Text style={styles.heroSubtitle}>
            Enter a dish name and explore matching items with component and ingredient insights.
          </Text>
        </View>

        <View style={styles.searchCard}>
          <Text style={styles.inputLabel}>Dish Name</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="restaurant-outline" size={20} color="#2C6CB0" />
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Example: Paneer"
              placeholderTextColor="#7FB3D5"
              autoCapitalize="words"
              returnKeyType="search"
              onSubmitEditing={searchDishes}
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={20} color="#7FB3D5" />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.searchBtn, isSearching && styles.disabledBtn]}
            onPress={searchDishes}
            disabled={isSearching}
            activeOpacity={0.85}
          >
            {isSearching ? (
              <>
                <ActivityIndicator color="#fff" size="small" style={styles.searchSpinner} />
                <Text style={styles.searchBtnText}>Searching...</Text>
              </>
            ) : (
              <>
                <Ionicons name="search" size={18} color="#fff" style={styles.searchBtnIcon} />
                <Text style={styles.searchBtnText}>Search Dish</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {hasSearched ? (
          <View style={styles.resultsCard}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Search Results</Text>
              <Text style={styles.resultsCount}>{dishes.length}</Text>
            </View>

            {dishes.length > 0 ? (
              dishes.map(renderDishCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={34} color="#2C6CB0" />
                <Text style={styles.emptyTitle}>No dishes found</Text>
                <Text style={styles.emptyText}>Try another dish name or a shorter search term.</Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C8E6FA',
    overflow: 'hidden',
  },
  bgBlob1: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.425,
    backgroundColor: 'rgba(74,144,226,0.1)',
    top: -width * 0.3,
    right: -width * 0.2,
  },
  bgBlob2: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(44,108,176,0.08)',
    bottom: -width * 0.15,
    left: -width * 0.15,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#2E86C1',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A5276',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  heroIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A5276',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#2E86C1',
    textAlign: 'center',
    lineHeight: 20,
  },
  searchCard: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A5276',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(44,108,176,0.18)',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    minHeight: 48,
    color: '#1A5276',
    fontSize: 15,
    fontWeight: '700',
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C6CB0',
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 7,
  },
  searchBtnIcon: {
    marginRight: 8,
  },
  searchSpinner: {
    marginRight: 8,
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.72,
  },
  resultsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#34495E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A5276',
  },
  resultsCount: {
    minWidth: 32,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(39,174,96,0.14)',
    color: '#1E8449',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
  },
  dishCard: {
    backgroundColor: 'rgba(232,243,255,0.82)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  dishMedia: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  dishImage: {
    width: '100%',
    height: 150,
    borderRadius: 16,
  },
  dishPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    backgroundColor: 'rgba(44,108,176,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishDetails: {
    width: '100%',
  },
  dishName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A5276',
    marginBottom: 6,
  },
  dishDescription: {
    fontSize: 13,
    color: '#2E86C1',
    lineHeight: 19,
    marginBottom: 14,
  },
  dishActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dishActionBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  dishActionBtnPrimary: {
    backgroundColor: '#2C6CB0',
  },
  dishActionBtnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(44,108,176,0.45)',
  },
  dishActionIcon: {
    marginRight: 5,
  },
  dishActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  dishActionBtnTextPrimary: {
    color: '#fff',
  },
  dishActionBtnTextSecondary: {
    color: '#2C6CB0',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A5276',
    marginTop: 10,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#2E86C1',
    textAlign: 'center',
    lineHeight: 19,
  },
});

export default SearchDishScreen;
