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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../constants';

const { width } = Dimensions.get('window');

type IngredientData = {
  item: {
    item_id: string;
    item_name: string;
  };
  ingredient: Array<{
    name: string;
    detail: string;
  }>;
};

const IngredientScreen = ({ navigation, route }: any) => {
  const data = route?.params?.data as IngredientData | undefined;
  const ingredientItems = Array.isArray(data?.ingredient) ? data.ingredient : [];
  const [isLoadingComponent, setIsLoadingComponent] = useState(false);

  const sanitizeDishName = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  if (!data) {
    return (
      <View style={styles.container}>
        <View style={styles.bgBlob1} />
        <View style={styles.bgBlob2} />
        <View style={styles.centerFallback}>
          <Text style={styles.fallbackTitle}>Missing ingredient data</Text>
          <TouchableOpacity style={styles.footerBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.footerBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleViewComponent = async () => {
    const sanitized = sanitizeDishName(data.item.item_name);
    setIsLoadingComponent(true);
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
      setIsLoadingComponent(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1A5276" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerIconBadge}>
            <Ionicons name="nutrition" size={22} color="#1A5276" />
          </View>
          <Text style={styles.headerTitle}>Ingredient Details</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.itemNameRow}>
          <Ionicons name="restaurant" size={28} color="#1A5276" />
          <Text style={styles.itemName}>{data.item.item_name}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.tableHeaderItem}>
              <Ionicons name="document-text" size={16} color="#1A5276" />
              <Text style={styles.tableHeaderText}>Name</Text>
            </View>
            <View style={styles.tableHeaderItem}>
              <Ionicons name="information-circle" size={16} color="#1A5276" />
              <Text style={styles.tableHeaderText}>Details</Text>
            </View>
          </View>
          {ingredientItems.length > 0 ? (
            ingredientItems.map((ing, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCellName}>{ing.name}</Text>
                <Text style={styles.tableCellDetail}>{ing.detail}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateRow}>
              <Text style={styles.emptyStateText}>No ingredient details available.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footerSection}>
        <View style={styles.footerBtnRow}>
          <TouchableOpacity
            style={[styles.footerBtn, styles.footerBtnRowItem, { marginRight: 8, opacity: isLoadingComponent ? 0.7 : 1 }]}
            onPress={handleViewComponent}
            activeOpacity={0.8}
            disabled={isLoadingComponent}
          >
            {isLoadingComponent ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="small" color="#fff" style={styles.loadingSpinner} />
                <Ionicons name="layers" size={16} color="#fff" style={styles.loadingIcon} />
                <Text style={styles.footerBtnText}>Please wait</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="layers" size={16} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.footerBtnText}>View Component</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerBtn, styles.footerBtnSecondary, styles.footerBtnRowItem]}
            onPress={() => navigation.navigate('Main')}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="home" size={16} color="#2C6CB0" style={styles.buttonIcon} />
              <Text style={[styles.footerBtnText, styles.footerBtnSecondaryText]}>Go to Dashboard</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    marginHorizontal: 12,
  },
  headerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(44,108,176,0.18)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A5276',
    letterSpacing: 0.3,
  },

  contentScroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },

  itemName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1A5276',
    textAlign: 'center',
    flexShrink: 1,
  },

  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },

  table: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#34495E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },

  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A5276',
  },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  tableCellName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#2C6CB0',
    textAlign: 'center',
  },

  tableCellDetail: {
    flex: 1,
    fontSize: 13,
    color: '#2E86C1',
    textAlign: 'left',
    lineHeight: 18,
  },

  footerBtn: {
    backgroundColor: '#2C6CB0',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  footerBtnRow: {
    flexDirection: 'row',
    width: '100%',
  },
  footerBtnRowItem: {
    flex: 1,
    marginTop: 0,
  },

  footerBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },

  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    marginRight: 8,
  },
  loadingIcon: {
    marginRight: 6,
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 6,
  },

  footerBtnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2C6CB0',
  },

  footerSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 35 : 28,
  },
  footerBtnSecondaryText: {
    color: '#2C6CB0',
  },

  centerFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A5276',
    textAlign: 'center',
    marginBottom: 18,
  },
  emptyStateRow: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#2E86C1',
    textAlign: 'center',
  },
});

export default IngredientScreen;
