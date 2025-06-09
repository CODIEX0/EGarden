import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { usePlants } from '@/context/PlantContext';
import { useLanguage } from '@/context/LanguageContext';
import Button from '@/components/Button';
import { ArrowLeft, TriangleAlert as AlertTriangle, Shield, Lightbulb, Clock, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';

export default function DiseaseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlantById } = usePlants();
  const { t } = useLanguage();
  
  const plant = getPlantById(id!);
  const disease = plant?.identifiedDisease;

  if (!plant || !disease) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Disease information not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const getSeverityColor = () => {
    switch (disease.severity) {
      case 'high': return Colors.status.error;
      case 'medium': return Colors.status.warning;
      case 'low': return Colors.status.success;
      default: return Colors.gray[400];
    }
  };

  const getUrgencyColor = () => {
    switch (disease.treatmentUrgency) {
      case 'immediate': return Colors.status.error;
      case 'soon': return Colors.status.warning;
      case 'monitor': return Colors.status.info;
      default: return Colors.gray[400];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </Pressable>
        <Text style={styles.title}>Disease Treatment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.diseaseHeader}>
          <View style={styles.plantInfo}>
            <Image source={{ uri: plant.image }} style={styles.plantImage} />
            <View style={styles.plantDetails}>
              <Text style={styles.plantName}>{plant.commonName}</Text>
              <Text style={styles.diseaseName}>{disease.name}</Text>
              <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: getSeverityColor() + '20' }]}>
                  <Text style={[styles.badgeText, { color: getSeverityColor() }]}>
                    {disease.severity.toUpperCase()} SEVERITY
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: getUrgencyColor() + '20' }]}>
                  <Text style={[styles.badgeText, { color: getUrgencyColor() }]}>
                    {disease.treatmentUrgency.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <Text style={styles.confidence}>
            {Math.round(disease.confidence)}% Confidence
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={24} color={Colors.status.warning} />
            <Text style={styles.sectionTitle}>Symptoms</Text>
          </View>
          <View style={styles.listContainer}>
            {disease.symptoms.map((symptom, index) => (
              <View key={index} style={styles.listItem}>
                <XCircle size={16} color={Colors.status.error} />
                <Text style={styles.listText}>{symptom}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lightbulb size={24} color={Colors.secondary[600]} />
            <Text style={styles.sectionTitle}>Causes</Text>
          </View>
          <View style={styles.listContainer}>
            {disease.causes.map((cause, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.listText}>{cause}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={24} color={Colors.status.error} />
            <Text style={styles.sectionTitle}>Immediate Treatment</Text>
          </View>
          <View style={styles.treatmentCard}>
            <Text style={styles.urgencyText}>
              Treatment Urgency: {disease.treatmentUrgency.charAt(0).toUpperCase() + disease.treatmentUrgency.slice(1)}
            </Text>
            <View style={styles.listContainer}>
              {disease.controlMeasures.map((measure, index) => (
                <View key={index} style={styles.listItem}>
                  <CheckCircle size={16} color={Colors.status.success} />
                  <Text style={styles.listText}>{measure}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={24} color={Colors.status.success} />
            <Text style={styles.sectionTitle}>Prevention</Text>
          </View>
          <View style={styles.listContainer}>
            {disease.prevention.map((prevention, index) => (
              <View key={index} style={styles.listItem}>
                <Shield size={16} color={Colors.status.success} />
                <Text style={styles.listText}>{prevention}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700)} style={styles.actionSection}>
          <Button
            title="Mark as Treated"
            onPress={() => {
              // Update plant health status
              router.back();
            }}
            icon={CheckCircle}
            style={styles.actionButton}
          />
          <Button
            title="Get Expert Help"
            onPress={() => router.push('/ai/chat')}
            variant="outline"
            icon={Lightbulb}
            style={styles.actionButton}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[700],
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  diseaseHeader: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  plantInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  plantImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  plantDetails: {
    flex: 1,
  },
  plantName: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 4,
  },
  diseaseName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.status.error,
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  confidence: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary[600],
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
  },
  listContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  listText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[700],
    flex: 1,
    lineHeight: 20,
  },
  bulletPoint: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: Colors.gray[600],
    width: 16,
  },
  treatmentCard: {
    backgroundColor: Colors.status.error + '10',
    borderWidth: 1,
    borderColor: Colors.status.error + '30',
    borderRadius: 12,
    padding: 16,
  },
  urgencyText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.status.error,
    marginBottom: 12,
  },
  actionSection: {
    gap: 12,
    marginBottom: 40,
  },
  actionButton: {
    marginBottom: 8,
  },
});