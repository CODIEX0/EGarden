import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageContext';
import { aiService } from '@/services/aiService';
import Button from '@/components/Button';
import { Camera, Image as ImageIcon, ArrowLeft, Sparkles, Leaf, Info } from 'lucide-react-native';
import { PlantIdentificationResult } from '@/types';

export default function PlantIdentifyScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [identifying, setIdentifying] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [results, setResults] = useState<PlantIdentificationResult | null>(null);

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setResults(null);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.uploadError'));
    }
  };

  const handleCamera = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert(t('common.error'), t('errors.permissionDenied'));
        return;
      }
    }
    setShowCamera(true);
  };

  const takePicture = async (camera: any) => {
    try {
      const photo = await camera.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      setShowCamera(false);
      setSelectedImage(photo.uri);
      setResults(null);
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.cameraError'));
    }
  };

  const identifyPlant = async () => {
    if (!selectedImage) {
      Alert.alert(t('common.error'), 'Please select an image first');
      return;
    }

    setIdentifying(true);
    try {
      const result = await aiService.identifyPlant(selectedImage);
      setResults(result);
    } catch (error) {
      console.error('Plant identification error:', error);
      Alert.alert(t('common.error'), t('errors.networkError'));
    } finally {
      setIdentifying(false);
    }
  };

  const addToGarden = (species: any) => {
    router.push({
      pathname: '/plant/add',
      params: {
        commonName: species.commonNames[0] || '',
        scientificName: species.scientificName,
        image: selectedImage,
      },
    });
  };

  if (showCamera) {
    return (
      <SafeAreaView style={styles.container}>
        <CameraView style={styles.camera} facing="back">
          {(camera) => (
            <View style={styles.cameraOverlay}>
              <Pressable
                style={styles.backButton}
                onPress={() => setShowCamera(false)}
              >
                <ArrowLeft size={24} color="white" />
              </Pressable>
              
              <View style={styles.cameraControls}>
                <Pressable
                  style={styles.captureButton}
                  onPress={() => takePicture(camera)}
                >
                  <View style={styles.captureButtonInner} />
                </Pressable>
              </View>
            </View>
          )}
        </CameraView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </Pressable>
        <Text style={styles.title}>{t('ai.identifyPlant')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.instructionSection}>
          <View style={styles.instructionCard}>
            <Leaf size={32} color={Colors.primary[500]} />
            <Text style={styles.instructionTitle}>Plant Identification</Text>
            <Text style={styles.instructionText}>
              Take a clear photo of the plant's leaves, flowers, or fruits for the best identification results.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.imageSection}>
          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.plantImage} />
              {identifying && (
                <View style={styles.identifyingOverlay}>
                  <Sparkles size={32} color="white" />
                  <Text style={styles.identifyingText}>{t('ai.analyzing')}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <ImageIcon size={48} color={Colors.gray[400]} />
              <Text style={styles.placeholderText}>Select a plant photo to identify</Text>
            </View>
          )}
          
          <View style={styles.imageButtons}>
            <Button
              title="Camera"
              onPress={handleCamera}
              icon={Camera}
              variant="outline"
              style={styles.imageButton}
            />
            <Button
              title="Gallery"
              onPress={handleImagePicker}
              icon={ImageIcon}
              variant="outline"
              style={styles.imageButton}
            />
          </View>

          {selectedImage && !results && (
            <Button
              title={t('ai.identifyPlant')}
              onPress={identifyPlant}
              loading={identifying}
              icon={Sparkles}
              style={styles.identifyButton}
            />
          )}
        </Animated.View>

        {results && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Identification Results</Text>
            <Text style={styles.confidenceText}>
              {t('ai.confidence', { confidence: Math.round(results.confidence) })}
            </Text>

            {results.species.map((species, index) => (
              <View key={index} style={styles.speciesCard}>
                <View style={styles.speciesHeader}>
                  <View style={styles.speciesInfo}>
                    <Text style={styles.commonName}>
                      {species.commonNames[0] || 'Unknown'}
                    </Text>
                    <Text style={styles.scientificName}>
                      {species.scientificName}
                    </Text>
                    <Text style={styles.family}>
                      Family: {species.family}
                    </Text>
                  </View>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceBadgeText}>
                      {Math.round(species.confidence)}%
                    </Text>
                  </View>
                </View>

                {species.careInstructions && (
                  <View style={styles.careSection}>
                    <Text style={styles.careTitle}>Care Instructions</Text>
                    <View style={styles.careGrid}>
                      <View style={styles.careItem}>
                        <Text style={styles.careLabel}>Watering</Text>
                        <Text style={styles.careValue}>{species.careInstructions.watering}</Text>
                      </View>
                      <View style={styles.careItem}>
                        <Text style={styles.careLabel}>Sunlight</Text>
                        <Text style={styles.careValue}>{species.careInstructions.sunlight}</Text>
                      </View>
                      <View style={styles.careItem}>
                        <Text style={styles.careLabel}>Soil</Text>
                        <Text style={styles.careValue}>{species.careInstructions.soil}</Text>
                      </View>
                      <View style={styles.careItem}>
                        <Text style={styles.careLabel}>Temperature</Text>
                        <Text style={styles.careValue}>{species.careInstructions.temperature}</Text>
                      </View>
                    </View>
                  </View>
                )}

                <Button
                  title="Add to Garden"
                  onPress={() => addToGarden(species)}
                  style={styles.addButton}
                />
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
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
  instructionSection: {
    marginBottom: 24,
  },
  instructionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  instructionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginTop: 12,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  imageSection: {
    marginBottom: 32,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  plantImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  identifyingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  identifyingText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter-Medium',
  },
  imagePlaceholder: {
    height: 250,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  imageButton: {
    flex: 1,
  },
  identifyButton: {
    marginTop: 8,
  },
  resultsSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary[600],
    marginBottom: 20,
  },
  speciesCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  speciesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  speciesInfo: {
    flex: 1,
  },
  commonName: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    fontStyle: 'italic',
    marginBottom: 4,
  },
  family: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
  },
  confidenceBadge: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confidenceBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary[700],
  },
  careSection: {
    marginBottom: 20,
  },
  careTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 12,
  },
  careGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  careItem: {
    width: '47%',
    backgroundColor: Colors.gray[50],
    padding: 12,
    borderRadius: 8,
  },
  careLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[600],
    marginBottom: 4,
  },
  careValue: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[800],
  },
  addButton: {
    marginTop: 8,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 20,
  },
  cameraControls: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
});