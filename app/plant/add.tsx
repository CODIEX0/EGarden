import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { usePlants } from '@/context/PlantContext';
import { useLanguage } from '@/context/LanguageContext';
import { aiService } from '@/services/aiService';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Picker from '@/components/Picker';
import { Camera, Image as ImageIcon, ArrowLeft, Sparkles } from 'lucide-react-native';

export default function AddPlantScreen() {
  const router = useRouter();
  const { addPlant } = usePlants();
  const { t } = useLanguage();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  
  const [formData, setFormData] = useState({
    image: '',
    commonName: '',
    scientificName: '',
    plantType: 'other' as 'flower' | 'vegetable' | 'herb' | 'tree' | 'other',
    plantingDate: new Date(),
    wateringFrequency: 7,
    userNotes: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const plantTypeOptions = [
    { label: t('plant.flower'), value: 'flower' },
    { label: t('plant.vegetable'), value: 'vegetable' },
    { label: t('plant.herb'), value: 'herb' },
    { label: t('plant.tree'), value: 'tree' },
    { label: t('plant.other'), value: 'other' },
  ];

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
        updateFormData('image', imageUri);
        
        // Automatically identify plant
        await identifyPlant(imageUri);
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
      updateFormData('image', photo.uri);
      
      // Automatically identify plant
      await identifyPlant(photo.uri);
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.cameraError'));
    }
  };

  const identifyPlant = async (imageUri: string) => {
    setIdentifying(true);
    try {
      const result = await aiService.identifyPlant(imageUri);
      
      if (result.species.length > 0) {
        const topSpecies = result.species[0];
        updateFormData('commonName', topSpecies.commonNames[0] || '');
        updateFormData('scientificName', topSpecies.scientificName);
        
        Alert.alert(
          t('ai.identifyPlant'),
          `${t('ai.confidence', { confidence: Math.round(topSpecies.confidence) })}\n\n${topSpecies.commonNames[0]} (${topSpecies.scientificName})`,
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.save'), onPress: () => {} },
          ]
        );
      }
    } catch (error) {
      console.error('Plant identification error:', error);
      Alert.alert(t('common.error'), t('errors.networkError'));
    } finally {
      setIdentifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.commonName || !formData.image) {
      Alert.alert(t('common.error'), t('validation.required'));
      return;
    }

    setLoading(true);
    try {
      await addPlant({
        ...formData,
        healthStatus: 'healthy',
        careInstructions: '',
      });
      
      Alert.alert(t('common.success'), 'Plant added successfully!', [
        { text: t('common.done'), onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.serverError'));
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.title}>{t('garden.addNewPlant')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Plant Photo</Text>
          
          {formData.image ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: formData.image }} style={styles.plantImage} />
              {identifying && (
                <View style={styles.identifyingOverlay}>
                  <Sparkles size={24} color="white" />
                  <Text style={styles.identifyingText}>{t('ai.analyzing')}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <ImageIcon size={48} color={Colors.gray[400]} />
              <Text style={styles.placeholderText}>Add a photo of your plant</Text>
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
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.formSection}>
          <Input
            label={t('plant.commonName')}
            value={formData.commonName}
            onChangeText={(value) => updateFormData('commonName', value)}
            placeholder="e.g., Tomato, Rose, Basil"
          />

          <Input
            label={t('plant.scientificName')}
            value={formData.scientificName}
            onChangeText={(value) => updateFormData('scientificName', value)}
            placeholder="e.g., Solanum lycopersicum"
          />

          <Picker
            label={t('plant.plantType')}
            selectedValue={formData.plantType}
            onValueChange={(value) => updateFormData('plantType', value)}
            options={plantTypeOptions}
          />

          <Input
            label="Watering Frequency (days)"
            value={formData.wateringFrequency.toString()}
            onChangeText={(value) => updateFormData('wateringFrequency', parseInt(value) || 7)}
            placeholder="7"
            keyboardType="numeric"
          />

          <Input
            label={t('plant.userNotes')}
            value={formData.userNotes}
            onChangeText={(value) => updateFormData('userNotes', value)}
            placeholder="Add any notes about your plant..."
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600)} style={styles.submitSection}>
          <Button
            title="Add Plant to Garden"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
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
  imageSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  plantImage: {
    width: '100%',
    height: 200,
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
    gap: 8,
  },
  identifyingText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  imagePlaceholder: {
    height: 200,
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
  },
  imageButton: {
    flex: 1,
  },
  formSection: {
    gap: 16,
    marginBottom: 32,
  },
  notesInput: {
    height: 100,
  },
  submitSection: {
    marginBottom: 40,
  },
  submitButton: {
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