import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Alert, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { usePlants } from '@/context/PlantContext';
import { useLanguage } from '@/context/LanguageContext';
import { aiService } from '@/services/aiService';
import Button from '@/components/Button';
import { ArrowLeft, Calendar, Droplets, CreditCard as Edit, Share as ShareIcon, Trash2, Camera, Sparkles, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, MapPin, Thermometer, Sun, Wind } from 'lucide-react-native';

export default function PlantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlantById, updatePlant, deletePlant } = usePlants();
  const { t } = useLanguage();
  
  const [plant, setPlant] = useState(getPlantById(id!));
  const [analyzing, setAnalyzing] = useState(false);
  const [showFullNotes, setShowFullNotes] = useState(false);

  useEffect(() => {
    const currentPlant = getPlantById(id!);
    setPlant(currentPlant);
  }, [id]);

  if (!plant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Plant not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleWaterPlant = async () => {
    try {
      await updatePlant(plant.id, { lastWatered: new Date() });
      setPlant({ ...plant, lastWatered: new Date() });
      Alert.alert(t('common.success'), 'Plant watered successfully! 💧');
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to update watering record');
    }
  };

  const handleAnalyzePlant = async () => {
    if (!plant.image) {
      Alert.alert(t('common.error'), 'No image available for analysis');
      return;
    }

    setAnalyzing(true);
    try {
      const analysis = await aiService.generatePlantAnalysis(plant, plant.image);
      await updatePlant(plant.id, { aiAnalysis: analysis });
      setPlant({ ...plant, aiAnalysis: analysis });
      Alert.alert(t('common.success'), 'Plant analysis completed!');
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to analyze plant');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSharePlant = async () => {
    try {
      await Share.share({
        message: `Check out my ${plant.commonName}! 🌱 Growing beautifully in my eGarden.`,
        title: `My ${plant.commonName}`,
      });
    } catch (error) {
      console.error('Error sharing plant:', error);
    }
  };

  const handleDeletePlant = () => {
    Alert.alert(
      'Delete Plant',
      `Are you sure you want to delete ${plant.commonName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlant(plant.id);
              router.back();
            } catch (error) {
              Alert.alert(t('common.error'), 'Failed to delete plant');
            }
          },
        },
      ]
    );
  };

  const getDaysUntilWatering = () => {
    if (!plant.lastWatered) return 0;
    const daysSinceWatered = Math.floor((new Date().getTime() - plant.lastWatered.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, plant.wateringFrequency - daysSinceWatered);
  };

  const getHealthColor = () => {
    switch (plant.healthStatus) {
      case 'healthy': return Colors.status.success;
      case 'potential_issue': return Colors.status.warning;
      case 'diseased': return Colors.status.error;
      default: return Colors.gray[400];
    }
  };

  const needsWatering = getDaysUntilWatering() <= 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: plant.image }} style={styles.plantImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          
          <View style={styles.headerActions}>
            <Pressable style={styles.actionButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="white" />
            </Pressable>
            <View style={styles.rightActions}>
              <Pressable style={styles.actionButton} onPress={handleSharePlant}>
                <ShareIcon size={20} color="white" />
              </Pressable>
              <Pressable style={styles.actionButton} onPress={() => router.push(`/plant/edit/${plant.id}`)}>
                <Edit size={20} color="white" />
              </Pressable>
            </View>
          </View>

          <View style={styles.imageInfo}>
            <Text style={styles.plantName}>{plant.commonName}</Text>
            {plant.scientificName && (
              <Text style={styles.scientificName}>{plant.scientificName}</Text>
            )}
            <View style={[styles.healthBadge, { backgroundColor: getHealthColor() }]}>
              <Text style={styles.healthBadgeText}>
                {plant.healthStatus === 'healthy' ? 'Healthy' : 
                 plant.healthStatus === 'potential_issue' ? 'Needs Attention' : 'Diseased'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(200)} style={styles.quickActions}>
            <Button
              title={needsWatering ? "Water Now!" : "Water Plant"}
              onPress={handleWaterPlant}
              icon={Droplets}
              style={[styles.actionBtn, needsWatering && styles.urgentAction]}
            />
            <Button
              title="Analyze"
              onPress={handleAnalyzePlant}
              loading={analyzing}
              icon={Sparkles}
              variant="outline"
              style={styles.actionBtn}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300)} style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Calendar size={20} color={Colors.primary[600]} />
              <Text style={styles.statLabel}>Planted</Text>
              <Text style={styles.statValue}>
                {plant.plantingDate.toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <Droplets size={20} color={needsWatering ? Colors.status.error : Colors.status.info} />
              <Text style={styles.statLabel}>Watering</Text>
              <Text style={[styles.statValue, needsWatering && styles.urgentText]}>
                {needsWatering ? 'Due now!' : `${getDaysUntilWatering()}d left`}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Sun size={20} color={Colors.secondary[600]} />
              <Text style={styles.statLabel}>Type</Text>
              <Text style={styles.statValue}>
                {plant.plantType.charAt(0).toUpperCase() + plant.plantType.slice(1)}
              </Text>
            </View>
          </Animated.View>

          {plant.identifiedDisease && (
            <Animated.View entering={FadeInDown.delay(400)} style={styles.diseaseAlert}>
              <View style={styles.diseaseHeader}>
                <AlertTriangle size={24} color={Colors.status.error} />
                <Text style={styles.diseaseTitle}>Disease Detected</Text>
              </View>
              <Text style={styles.diseaseName}>{plant.identifiedDisease.name}</Text>
              <Text style={styles.diseaseDescription}>
                Severity: {plant.identifiedDisease.severity.toUpperCase()}
              </Text>
              <Button
                title="View Treatment"
                onPress={() => router.push(`/plant/disease/${plant.id}`)}
                variant="outline"
                style={styles.treatmentButton}
              />
            </Animated.View>
          )}

          {plant.aiAnalysis && (
            <Animated.View entering={FadeInDown.delay(500)} style={styles.analysisSection}>
              <Text style={styles.sectionTitle}>AI Analysis</Text>
              <View style={styles.analysisCard}>
                <View style={styles.analysisHeader}>
                  <Sparkles size={20} color={Colors.secondary[600]} />
                  <Text style={styles.analysisConfidence}>
                    {Math.round(plant.aiAnalysis.confidence)}% Confidence
                  </Text>
                </View>
                
                {plant.aiAnalysis.careRecommendations.length > 0 && (
                  <View style={styles.recommendationsContainer}>
                    <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                    {plant.aiAnalysis.careRecommendations.slice(0, 3).map((rec, index) => (
                      <View key={index} style={styles.recommendationItem}>
                        <CheckCircle size={16} color={Colors.status.success} />
                        <Text style={styles.recommendationText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.analysisDate}>
                  Last analyzed: {plant.aiAnalysis.lastAnalyzed.toLocaleDateString()}
                </Text>
              </View>
            </Animated.View>
          )}

          {plant.userNotes && (
            <Animated.View entering={FadeInDown.delay(600)} style={styles.notesSection}>
              <Text style={styles.sectionTitle}>My Notes</Text>
              <View style={styles.notesCard}>
                <Text 
                  style={styles.notesText}
                  numberOfLines={showFullNotes ? undefined : 3}
                >
                  {plant.userNotes}
                </Text>
                {plant.userNotes.length > 100 && (
                  <Pressable onPress={() => setShowFullNotes(!showFullNotes)}>
                    <Text style={styles.showMoreText}>
                      {showFullNotes ? 'Show less' : 'Show more'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(700)} style={styles.careSection}>
            <Text style={styles.sectionTitle}>Care Schedule</Text>
            <View style={styles.careCard}>
              <View style={styles.careItem}>
                <Droplets size={18} color={Colors.status.info} />
                <Text style={styles.careLabel}>Watering Frequency</Text>
                <Text style={styles.careValue}>Every {plant.wateringFrequency} days</Text>
              </View>
              
              {plant.lastWatered && (
                <View style={styles.careItem}>
                  <Calendar size={18} color={Colors.gray[600]} />
                  <Text style={styles.careLabel}>Last Watered</Text>
                  <Text style={styles.careValue}>
                    {plant.lastWatered.toLocaleDateString()}
                  </Text>
                </View>
              )}

              {plant.lastFertilized && (
                <View style={styles.careItem}>
                  <Sun size={18} color={Colors.secondary[600]} />
                  <Text style={styles.careLabel}>Last Fertilized</Text>
                  <Text style={styles.careValue}>
                    {plant.lastFertilized.toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(800)} style={styles.dangerZone}>
            <Button
              title="Delete Plant"
              onPress={handleDeletePlant}
              icon={Trash2}
              variant="outline"
              style={styles.deleteButton}
              textStyle={styles.deleteButtonText}
            />
          </Animated.View>
        </View>
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
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  plantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  headerActions: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  plantName: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  healthBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  healthBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  content: {
    padding: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
  },
  urgentAction: {
    backgroundColor: Colors.status.error,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[600],
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    textAlign: 'center',
  },
  urgentText: {
    color: Colors.status.error,
  },
  diseaseAlert: {
    backgroundColor: Colors.status.error + '10',
    borderWidth: 1,
    borderColor: Colors.status.error + '30',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  diseaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  diseaseTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.status.error,
  },
  diseaseName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[900],
    marginBottom: 4,
  },
  diseaseDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    marginBottom: 12,
  },
  treatmentButton: {
    borderColor: Colors.status.error,
  },
  analysisSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 12,
  },
  analysisCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  analysisConfidence: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.secondary[700],
  },
  recommendationsContainer: {
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[900],
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[700],
    flex: 1,
    lineHeight: 16,
  },
  analysisDate: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
    textAlign: 'right',
  },
  notesSection: {
    marginBottom: 24,
  },
  notesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[700],
    lineHeight: 20,
    marginBottom: 8,
  },
  showMoreText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary[600],
  },
  careSection: {
    marginBottom: 24,
  },
  careCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  careItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  careLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[700],
    marginLeft: 12,
    flex: 1,
  },
  careValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[900],
  },
  dangerZone: {
    marginBottom: 40,
  },
  deleteButton: {
    borderColor: Colors.status.error,
  },
  deleteButtonText: {
    color: Colors.status.error,
  },
});