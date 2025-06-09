import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { usePlants } from '@/context/PlantContext';
import { useLanguage } from '@/context/LanguageContext';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Picker from '@/components/Picker';
import { ArrowLeft, Camera, Image as ImageIcon, Save } from 'lucide-react-native';

export default function EditPlantScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlantById, updatePlant } = usePlants();
  const { t } = useLanguage();
  
  const plant = getPlantById(id!);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    image: plant?.image || '',
    commonName: plant?.commonName || '',
    scientificName: plant?.scientificName || '',
    plantType: plant?.plantType || 'other',
    wateringFrequency: plant?.wateringFrequency || 7,
    userNotes: plant?.userNotes || '',
  });

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

  const plantTypeOptions = [
    { label: 'Flower', value: 'flower' },
    { label: 'Vegetable', value: 'vegetable' },
    { label: 'Herb', value: 'herb' },
    { label: 'Tree', value: 'tree' },
    { label: 'Other', value: 'other' },
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
        updateFormData('image', result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to select image');
    }
  };

  const handleSave = async () => {
    if (!formData.commonName.trim()) {
      Alert.alert(t('common.error'), 'Plant name is required');
      return;
    }

    setLoading(true);
    try {
      await updatePlant(plant.id, {
        ...formData,
        wateringFrequency: Number(formData.wateringFrequency),
      });
      
      Alert.alert(t('common.success'), 'Plant updated successfully!', [
        { text: t('common.done'), onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to update plant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </Pressable>
        <Text style={styles.title}>Edit Plant</Text>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Save size={24} color="white" />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Plant Photo</Text>
          
          <Pressable style={styles.imageContainer} onPress={handleImagePicker}>
            {formData.image ? (
              <Image source={{ uri: formData.image }} style={styles.plantImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <ImageIcon size={48} color={Colors.gray[400]} />
                <Text style={styles.placeholderText}>Tap to change photo</Text>
              </View>
            )}
            <View style={styles.imageOverlay}>
              <Camera size={24} color="white" />
            </View>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.formSection}>
          <Input
            label="Plant Name"
            value={formData.commonName}
            onChangeText={(value) => updateFormData('commonName', value)}
            placeholder="e.g., Tomato, Rose, Basil"
          />

          <Input
            label="Scientific Name"
            value={formData.scientificName}
            onChangeText={(value) => updateFormData('scientificName', value)}
            placeholder="e.g., Solanum lycopersicum"
          />

          <Picker
            label="Plant Type"
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
            label="Notes"
            value={formData.userNotes}
            onChangeText={(value) => updateFormData('userNotes', value)}
            placeholder="Add any notes about your plant..."
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.saveSection}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            icon={Save}
            style={styles.saveButtonLarge}
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
  saveButton: {
    padding: 8,
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
    height: 200,
  },
  plantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSection: {
    gap: 16,
    marginBottom: 32,
  },
  notesInput: {
    height: 100,
  },
  saveSection: {
    marginBottom: 40,
  },
  saveButtonLarge: {
    marginTop: 8,
  },
});