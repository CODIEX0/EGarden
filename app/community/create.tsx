import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  Alert,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { communityService } from '@/services/communityService';
import { gamificationService } from '@/services/gamificationService';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Picker from '@/components/Picker';
import { ArrowLeft, Camera, Image as ImageIcon, X, Plus } from 'lucide-react-native';

const categories = [
  { label: 'Pests & Diseases', value: 'pests' },
  { label: 'Soil & Fertilizers', value: 'soil' },
  { label: 'Vegetables', value: 'vegetables' },
  { label: 'Flowers', value: 'flowers' },
  { label: 'Hydroponics', value: 'hydroponics' },
  { label: 'Tools & Equipment', value: 'tools' },
  { label: 'General Discussion', value: 'general' },
];

export default function CreatePostScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: [] as string[],
    images: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateFormData('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFormData('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [16, 9],
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);
        updateFormData('images', [...formData.images, ...newImages].slice(0, 5)); // Max 5 images
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        aspect: [16, 9],
      });

      if (!result.canceled && result.assets[0]) {
        updateFormData('images', [...formData.images, result.assets[0].uri].slice(0, 5));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeImage = (index: number) => {
    updateFormData('images', formData.images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for your post');
      return;
    }

    if (!formData.content.trim()) {
      Alert.alert('Validation Error', 'Please enter some content for your post');
      return;
    }

    setLoading(true);
    try {
      const postData = {
        userId: user!.id,
        userProfile: {
          name: user!.name,
          profilePicture: user!.profilePicture,
          badges: user!.badges || [],
          level: user!.level || 1,
        },
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category as any,
        tags: formData.tags,
        images: formData.images,
        location: user!.location,
      };

      await communityService.createPost(postData);
      
      // Track activity for gamification
      await gamificationService.trackActivity(user!.id, {
        type: 'post_created',
        data: { category: formData.category },
      });

      Alert.alert(
        'Success',
        'Your post has been created successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
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
        <Text style={styles.title}>Create Post</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
            <Input
              label="Post Title"
              value={formData.title}
              onChangeText={(value) => updateFormData('title', value)}
              placeholder="What's your gardening question or tip?"
              maxLength={100}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
            <Picker
              label="Category"
              selectedValue={formData.category}
              onValueChange={(value) => updateFormData('category', value)}
              options={categories}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <Text style={styles.sectionLabel}>Content</Text>
            <TextInput
              style={styles.contentInput}
              value={formData.content}
              onChangeText={(value) => updateFormData('content', value)}
              placeholder="Share your gardening experience, ask questions, or provide helpful tips..."
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {formData.content.length}/1000
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
            <Text style={styles.sectionLabel}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add tags (e.g., tomatoes, organic)"
                onSubmitEditing={addTag}
                returnKeyType="done"
              />
              <Pressable style={styles.addTagButton} onPress={addTag}>
                <Plus size={20} color={Colors.primary[600]} />
              </Pressable>
            </View>
            
            {formData.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {formData.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                    <Pressable onPress={() => removeTag(tag)}>
                      <X size={16} color={Colors.gray[600]} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
            <Text style={styles.sectionLabel}>Images (Optional)</Text>
            <View style={styles.imageActions}>
              <Button
                title="Camera"
                onPress={takePhoto}
                icon={Camera}
                variant="outline"
                style={styles.imageButton}
              />
              <Button
                title="Gallery"
                onPress={pickImage}
                icon={ImageIcon}
                variant="outline"
                style={styles.imageButton}
              />
            </View>

            {formData.images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                {formData.images.map((imageUri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: imageUri }} style={styles.image} />
                    <Pressable style={styles.removeImageButton} onPress={() => removeImage(index)}>
                      <X size={16} color="white" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700)} style={styles.submitSection}>
            <Button
              title="Create Post"
              onPress={handleSubmit}
              loading={loading}
              disabled={!formData.title.trim() || !formData.content.trim()}
              style={styles.submitButton}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[900],
    marginBottom: 8,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[900],
    backgroundColor: 'white',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
    textAlign: 'right',
    marginTop: 4,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[900],
    backgroundColor: 'white',
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary[700],
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  imageButton: {
    flex: 1,
  },
  imagesContainer: {
    marginTop: 8,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitSection: {
    marginBottom: 40,
  },
  submitButton: {
    marginTop: 8,
  },
});
