import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

export default function DonationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Donation Hub</Text>
        <Text style={styles.subtitle}>Share surplus, reduce waste, help community</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.comingSoon}>💚 Coming Soon</Text>
        <Text style={styles.description}>
          The donation platform is blooming! Soon you'll be able to:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.feature}>• Donate excess produce and harvests</Text>
          <Text style={styles.feature}>• Share unused gardening tools</Text>
          <Text style={styles.feature}>• Give away seeds and seedlings</Text>
          <Text style={styles.feature}>• Find free gardening supplies nearby</Text>
          <Text style={styles.feature}>• Connect with community members</Text>
          <Text style={styles.feature}>• Coordinate pickup and delivery</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    backgroundColor: Colors.earth[500],
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoon: {
    fontSize: 48,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  featureList: {
    alignItems: 'flex-start',
  },
  feature: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[700],
    marginBottom: 8,
    lineHeight: 20,
  },
});