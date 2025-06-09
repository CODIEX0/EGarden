import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

export default function MarketScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {user?.userType === 'farmer' ? 'Farmers Market' : 'Marketplace'}
        </Text>
        <Text style={styles.subtitle}>
          {user?.userType === 'farmer' 
            ? 'Sell your fresh produce and gardening supplies' 
            : 'Browse fresh produce and gardening supplies'
          }
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.comingSoon}>🛒 Coming Soon</Text>
        <Text style={styles.description}>
          The marketplace is growing! Soon you'll be able to:
        </Text>
        <View style={styles.featureList}>
          {user?.userType === 'farmer' ? (
            <>
              <Text style={styles.feature}>• List your fresh produce for sale</Text>
              <Text style={styles.feature}>• Manage your inventory and pricing</Text>
              <Text style={styles.feature}>• Accept crypto and fiat payments</Text>
              <Text style={styles.feature}>• Track orders and customer reviews</Text>
              <Text style={styles.feature}>• Connect with local buyers</Text>
            </>
          ) : (
            <>
              <Text style={styles.feature}>• Browse fresh local produce</Text>
              <Text style={styles.feature}>• Find gardening tools and supplies</Text>
              <Text style={styles.feature}>• Pay with crypto or traditional methods</Text>
              <Text style={styles.feature}>• Read reviews and ratings</Text>
              <Text style={styles.feature}>• Support local farmers</Text>
            </>
          )}
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
    backgroundColor: Colors.secondary[500],
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