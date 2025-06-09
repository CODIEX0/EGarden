import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

export default function CommunityScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community Hub</Text>
        <Text style={styles.subtitle}>Connect with fellow gardeners</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.comingSoon}>🌱 Coming Soon</Text>
        <Text style={styles.description}>
          Community features are being cultivated! Soon you'll be able to:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.feature}>• Share gardening tips and experiences</Text>
          <Text style={styles.feature}>• Ask questions and get expert advice</Text>
          <Text style={styles.feature}>• Vote on helpful content</Text>
          <Text style={styles.feature}>• Join specialized gardening groups</Text>
          <Text style={styles.feature}>• Participate in challenges and events</Text>
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
    backgroundColor: Colors.primary[500],
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
    color: 'rgba(255, 255, 255, 0.8)',
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