import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Picker from '@/components/Picker';
import { Leaf, Mail, Lock, User, MapPin } from 'lucide-react-native';

export default function SignupScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'buyer' as 'farmer' | 'buyer' | 'both',
    location: '',
    experienceLevel: 'beginner' as 'beginner' | 'intermediate' | 'expert',
  });
  const [loading, setLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const { signUp } = useAuth();
  const router = useRouter();

  // Load onboarding data when component mounts
  useEffect(() => {
    loadOnboardingData();
  }, []);

  const loadOnboardingData = async () => {
    try {
      const stored = await AsyncStorage.getItem('onboardingData');
      if (stored) {
        const data = JSON.parse(stored);
        setOnboardingData(data);
        
        // Pre-populate form with onboarding data
        setFormData(prev => ({
          ...prev,
          userType: data.userType || 'buyer',
          experienceLevel: data.experienceLevel || 'beginner',
        }));
        
        console.log('Loaded onboarding data:', data);
      }
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
    }
  };

  const handleSignup = async () => {
    const { name, email, password, confirmPassword, userType, location, experienceLevel } = formData;

    if (!name || !email || !password || !location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, {
        name,
        userType,
        location,
        experienceLevel,
        interests: onboardingData?.interests || [], // Use onboarding data if available
        onboardingCompleted: !!onboardingData,
        joinDate: new Date(),
      });
      
      // Clear stored onboarding data after successful signup
      await AsyncStorage.removeItem('onboardingData');
      
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const userTypeOptions = [
    { label: 'Buyer - I want to purchase plants and products', value: 'buyer' },
    { label: 'Farmer - I want to sell my produce', value: 'farmer' },
    { label: 'Both - I want to buy and sell', value: 'both' },
  ];

  const experienceOptions = [
    { label: 'Beginner - Just starting my gardening journey', value: 'beginner' },
    { label: 'Intermediate - Some gardening experience', value: 'intermediate' },
    { label: 'Expert - Experienced gardener', value: 'expert' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[Colors.primary[500], Colors.primary[700]]} style={styles.gradient}>
        <KeyboardAvoidingView 
          style={styles.keyboardView} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
              <View style={styles.logoContainer}>
                <Leaf size={40} color="white" />
              </View>
              <Text style={styles.title}>Join eGarden</Text>
              <Text style={styles.subtitle}>Create your account to start growing</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400)} style={styles.form}>
              <Input
                label="Full Name"
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                placeholder="Enter your full name"
                icon={User}
              />

              <Input
                label="Email"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                icon={Mail}
              />

              <Input
                label="Location"
                value={formData.location}
                onChangeText={(value) => updateFormData('location', value)}
                placeholder="City, State/Country"
                icon={MapPin}
              />

              <Picker
                label="I am a..."
                selectedValue={formData.userType}
                onValueChange={(value) => updateFormData('userType', value)}
                options={userTypeOptions}
              />

              <Picker
                label="Experience Level"
                selectedValue={formData.experienceLevel}
                onValueChange={(value) => updateFormData('experienceLevel', value)}
                options={experienceOptions}
              />

              <Input
                label="Password"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                placeholder="Create a password"
                secureTextEntry
                icon={Lock}
              />

              <Input
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                placeholder="Confirm your password"
                secureTextEntry
                icon={Lock}
              />

              <Button
                title="Create Account"
                onPress={handleSignup}
                loading={loading}
                style={styles.signupButton}
              />

              <Button
                title="Already have an account? Sign In"
                onPress={() => router.push('/auth/login')}
                variant="ghost"
                textStyle={styles.loginText}
              />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  signupButton: {
    marginTop: 8,
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
});