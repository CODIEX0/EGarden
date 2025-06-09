import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { usePlants } from '@/context/PlantContext';
import { useLanguage } from '@/context/LanguageContext';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Picker from '@/components/Picker';
import { ArrowLeft, Save, Bell, Droplets, Sun, Calendar } from 'lucide-react-native';

export default function AddReminderScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { plants } = usePlants();
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    plantId: '',
    type: 'custom' as 'watering' | 'fertilizing' | 'custom',
    title: '',
    description: '',
    frequency: 7,
    advanceNotice: 1,
    sound: true,
    vibration: true,
  });

  const plantOptions = plants.map(plant => ({
    label: plant.commonName,
    value: plant.id,
  }));

  const typeOptions = [
    { label: 'Watering', value: 'watering' },
    { label: 'Fertilizing', value: 'fertilizing' },
    { label: 'Custom', value: 'custom' },
  ];

  const frequencyOptions = [
    { label: 'Daily', value: '1' },
    { label: 'Every 2 days', value: '2' },
    { label: 'Every 3 days', value: '3' },
    { label: 'Weekly', value: '7' },
    { label: 'Bi-weekly', value: '14' },
    { label: 'Monthly', value: '30' },
  ];

  const advanceNoticeOptions = [
    { label: '1 hour before', value: '1' },
    { label: '2 hours before', value: '2' },
    { label: '4 hours before', value: '4' },
    { label: '1 day before', value: '24' },
  ];

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert(t('common.error'), 'Reminder title is required');
      return;
    }

    if (formData.type !== 'custom' && !formData.plantId) {
      Alert.alert(t('common.error'), 'Please select a plant for this reminder type');
      return;
    }

    setLoading(true);
    try {
      // In a real app, this would save to Firebase
      console.log('Saving reminder:', formData);
      
      Alert.alert(t('common.success'), 'Reminder created successfully!', [
        { text: t('common.done'), onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = () => {
    switch (formData.type) {
      case 'watering': return Droplets;
      case 'fertilizing': return Sun;
      default: return Bell;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </Pressable>
        <Text style={styles.title}>Add Reminder</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.typeSection}>
          <Text style={styles.sectionTitle}>Reminder Type</Text>
          <View style={styles.typeButtons}>
            {typeOptions.map((option) => {
              const IconComponent = option.value === 'watering' ? Droplets : 
                                 option.value === 'fertilizing' ? Sun : Bell;
              const isSelected = formData.type === option.value;
              
              return (
                <Pressable
                  key={option.value}
                  style={[styles.typeButton, isSelected && styles.selectedTypeButton]}
                  onPress={() => updateFormData('type', option.value)}
                >
                  <IconComponent 
                    size={24} 
                    color={isSelected ? 'white' : Colors.gray[600]} 
                  />
                  <Text style={[
                    styles.typeButtonText,
                    isSelected && styles.selectedTypeButtonText
                  ]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.formSection}>
          {formData.type !== 'custom' && (
            <Picker
              label="Select Plant"
              selectedValue={formData.plantId}
              onValueChange={(value) => updateFormData('plantId', value)}
              options={plantOptions}
              placeholder="Choose a plant..."
            />
          )}

          <Input
            label="Reminder Title"
            value={formData.title}
            onChangeText={(value) => updateFormData('title', value)}
            placeholder={`e.g., Water ${formData.type === 'watering' ? 'plants' : formData.type === 'fertilizing' ? 'garden' : 'reminder'}`}
          />

          <Input
            label="Description (Optional)"
            value={formData.description}
            onChangeText={(value) => updateFormData('description', value)}
            placeholder="Add any additional notes..."
            multiline
            numberOfLines={3}
          />

          <Picker
            label="Frequency"
            selectedValue={formData.frequency.toString()}
            onValueChange={(value) => updateFormData('frequency', parseInt(value))}
            options={frequencyOptions}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.notificationSection}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          
          <View style={styles.notificationCard}>
            <Picker
              label="Advance Notice"
              selectedValue={formData.advanceNotice.toString()}
              onValueChange={(value) => updateFormData('advanceNotice', parseInt(value))}
              options={advanceNoticeOptions}
            />

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Sound</Text>
                <Text style={styles.toggleDescription}>Play notification sound</Text>
              </View>
              <Pressable
                style={[styles.toggle, formData.sound && styles.toggleActive]}
                onPress={() => updateFormData('sound', !formData.sound)}
              >
                <View style={[styles.toggleThumb, formData.sound && styles.toggleThumbActive]} />
              </Pressable>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Vibration</Text>
                <Text style={styles.toggleDescription}>Vibrate device</Text>
              </View>
              <Pressable
                style={[styles.toggle, formData.vibration && styles.toggleActive]}
                onPress={() => updateFormData('vibration', !formData.vibration)}
              >
                <View style={[styles.toggleThumb, formData.vibration && styles.toggleThumbActive]} />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewIcon}>
                {React.createElement(getTypeIcon(), { size: 20, color: Colors.primary[600] })}
              </View>
              <View style={styles.previewContent}>
                <Text style={styles.previewTitle}>
                  {formData.title || 'Reminder Title'}
                </Text>
                <Text style={styles.previewDescription}>
                  {formData.description || 'Reminder description will appear here'}
                </Text>
                <Text style={styles.previewFrequency}>
                  Repeats every {formData.frequency} day{formData.frequency !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600)} style={styles.saveSection}>
          <Button
            title="Create Reminder"
            onPress={handleSave}
            loading={loading}
            icon={Save}
            style={styles.saveButton}
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
  typeSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 16,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray[200],
    gap: 8,
  },
  selectedTypeButton: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  typeButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[600],
  },
  selectedTypeButtonText: {
    color: 'white',
  },
  formSection: {
    gap: 16,
    marginBottom: 32,
  },
  notificationSection: {
    marginBottom: 32,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[900],
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.gray[300],
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: Colors.primary[500],
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  previewSection: {
    marginBottom: 32,
  },
  previewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    marginBottom: 4,
  },
  previewFrequency: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.primary[600],
  },
  saveSection: {
    marginBottom: 40,
  },
  saveButton: {
    marginTop: 8,
  },
});