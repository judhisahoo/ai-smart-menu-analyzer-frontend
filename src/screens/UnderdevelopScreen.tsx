import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const UnderdevelopScreen = ({ navigation, route }: any) => {
  const screenName = route?.params?.screenName ?? 'Screen';

  return (
    <View style={styles.container}>
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1A5276" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{screenName}</Text>
        <Text style={styles.subtitle}>Screen under development.</Text>

        <View style={styles.card}>
          <Text style={styles.cardText}>
            This page will be built soon. For now, use the menu to navigate back or continue scanning.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C8E6FA',
    paddingTop: 56,
    paddingHorizontal: 20,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A5276',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A5276',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#2E86C1',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#2C6CB0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#2E86C1',
    lineHeight: 22,
    textAlign: 'center',
  },
});

export default UnderdevelopScreen;
