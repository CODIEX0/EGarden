import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: [string, string];
  component?: () => React.ReactElement;
}

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userType, setUserType] = useState<'farmer' | 'buyer' | 'both' | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'expert' | null>(null);
  const router = useRouter();

  const availableInterests = [
    { id: 'vegetables', label: 'Vegetables', icon: 'leaf-outline' },
    { id: 'fruits', label: 'Fruits', icon: 'nutrition-outline' },
    { id: 'herbs', label: 'Herbs', icon: 'flower-outline' },
    { id: 'flowers', label: 'Flowers', icon: 'rose-outline' },
    { id: 'trees', label: 'Trees', icon: 'tree-outline' },
    { id: 'indoor', label: 'Indoor Plants', icon: 'home-outline' },
    { id: 'organic', label: 'Organic Farming', icon: 'leaf-outline' },
    { id: 'hydroponics', label: 'Hydroponics', icon: 'water-outline' },
  ];

  const UserTypeStep = () => (
    <View style={styles.stepContent}>
      <Animated.View entering={FadeInUp.delay(200)} style={styles.stepHeader}>
        <Ionicons name="people-outline" size={80} color={Colors.primary[500]} />
        <Text style={styles.stepTitle}>What brings you to eGarden?</Text>
        <Text style={styles.stepDescription}>Choose your primary role to personalize your experience</Text>
      </Animated.View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionCard, userType === 'farmer' && styles.optionCardSelected]}
          onPress={() => setUserType('farmer')}
        >
          <Ionicons 
            name="leaf-outline" 
            size={40} 
            color={userType === 'farmer' ? 'white' : Colors.primary[500]} 
          />
          <Text style={[styles.optionTitle, userType === 'farmer' && styles.optionTitleSelected]}>
            Farmer/Grower
          </Text>
          <Text style={[styles.optionDescription, userType === 'farmer' && styles.optionDescriptionSelected]}>
            I grow and sell produce
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, userType === 'buyer' && styles.optionCardSelected]}
          onPress={() => setUserType('buyer')}
        >
          <Ionicons 
            name="storefront-outline" 
            size={40} 
            color={userType === 'buyer' ? 'white' : Colors.primary[500]} 
          />
          <Text style={[styles.optionTitle, userType === 'buyer' && styles.optionTitleSelected]}>
            Home Gardener
          </Text>
          <Text style={[styles.optionDescription, userType === 'buyer' && styles.optionDescriptionSelected]}>
            I garden for personal use
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, userType === 'both' && styles.optionCardSelected]}
          onPress={() => setUserType('both')}
        >
          <Ionicons 
            name="swap-horizontal-outline" 
            size={40} 
            color={userType === 'both' ? 'white' : Colors.primary[500]} 
          />
          <Text style={[styles.optionTitle, userType === 'both' && styles.optionTitleSelected]}>
            Both
          </Text>
          <Text style={[styles.optionDescription, userType === 'both' && styles.optionDescriptionSelected]}>
            I grow and buy produce
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const InterestsStep = () => (
    <View style={styles.stepContent}>
      <Animated.View entering={FadeInUp.delay(200)} style={styles.stepHeader}>
        <Ionicons name="heart-outline" size={80} color={Colors.primary[500]} />
        <Text style={styles.stepTitle}>What are you interested in?</Text>
        <Text style={styles.stepDescription}>Select all that apply to get personalized recommendations</Text>
      </Animated.View>

      <ScrollView style={styles.interestsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.interestsGrid}>
          {availableInterests.map((interest) => (
            <TouchableOpacity
              key={interest.id}
              style={[
                styles.interestCard,
                interests.includes(interest.id) && styles.interestCardSelected
              ]}
              onPress={() => {
                if (interests.includes(interest.id)) {
                  setInterests(interests.filter(i => i !== interest.id));
                } else {
                  setInterests([...interests, interest.id]);
                }
              }}
            >
              <Ionicons 
                name={interest.icon as any} 
                size={24} 
                color={interests.includes(interest.id) ? 'white' : Colors.primary[500]} 
              />
              <Text style={[
                styles.interestText,
                interests.includes(interest.id) && styles.interestTextSelected
              ]}>
                {interest.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const ExperienceStep = () => (
    <View style={styles.stepContent}>
      <Animated.View entering={FadeInUp.delay(200)} style={styles.stepHeader}>
        <Ionicons name="school-outline" size={80} color={Colors.primary[500]} />
        <Text style={styles.stepTitle}>What's your experience level?</Text>
        <Text style={styles.stepDescription}>This helps us provide appropriate guidance</Text>
      </Animated.View>

      <View style={styles.experienceContainer}>
        <TouchableOpacity
          style={[styles.experienceCard, experienceLevel === 'beginner' && styles.experienceCardSelected]}
          onPress={() => setExperienceLevel('beginner')}
        >
          <Ionicons 
            name="flower-outline" 
            size={48} 
            color={experienceLevel === 'beginner' ? 'white' : Colors.primary[500]} 
          />
          <Text style={[styles.experienceTitle, experienceLevel === 'beginner' && styles.experienceTitleSelected]}>
            Beginner
          </Text>
          <Text style={[styles.experienceDescription, experienceLevel === 'beginner' && styles.experienceDescriptionSelected]}>
            Just starting my gardening journey
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.experienceCard, experienceLevel === 'intermediate' && styles.experienceCardSelected]}
          onPress={() => setExperienceLevel('intermediate')}
        >
          <Ionicons 
            name="leaf-outline" 
            size={48} 
            color={experienceLevel === 'intermediate' ? 'white' : Colors.primary[500]} 
          />
          <Text style={[styles.experienceTitle, experienceLevel === 'intermediate' && styles.experienceTitleSelected]}>
            Intermediate
          </Text>
          <Text style={[styles.experienceDescription, experienceLevel === 'intermediate' && styles.experienceDescriptionSelected]}>
            I have some gardening experience
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.experienceCard, experienceLevel === 'expert' && styles.experienceCardSelected]}
          onPress={() => setExperienceLevel('expert')}
        >
          <Ionicons 
            name="trophy-outline" 
            size={48} 
            color={experienceLevel === 'expert' ? 'white' : Colors.primary[500]} 
          />
          <Text style={[styles.experienceTitle, experienceLevel === 'expert' && styles.experienceTitleSelected]}>
            Expert
          </Text>
          <Text style={[styles.experienceDescription, experienceLevel === 'expert' && styles.experienceDescriptionSelected]}>
            I'm an experienced gardener
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to eGarden',
      subtitle: 'Your Digital Gardening Companion',
      description: 'Manage your plants, identify diseases, and connect with fellow gardeners in one beautiful app.',
      icon: 'leaf-outline',
      gradient: [Colors.primary[400], Colors.primary[600]],
    },
    {
      id: 'features',
      title: 'Smart Plant Care',
      subtitle: 'AI-Powered Garden Management',
      description: 'Get personalized care reminders, disease diagnosis, and expert advice for healthier plants.',
      icon: 'bulb-outline',
      gradient: [Colors.secondary[400], Colors.secondary[600]],
    },
    {
      id: 'community',
      title: 'Community & Commerce',
      subtitle: 'Connect, Share, Trade',
      description: 'Join our vibrant community, share knowledge, donate surplus, and trade with local farmers.',
      icon: 'people-outline',
      gradient: [Colors.earth[400], Colors.earth[600]],
    },
    {
      id: 'usertype',
      title: 'Choose Your Role',
      subtitle: 'Personalize Your Experience',
      description: 'Tell us about yourself to get the most relevant features and recommendations.',
      icon: 'person-outline',
      gradient: [Colors.primary[500], Colors.primary[700]],
      component: UserTypeStep,
    },
    {
      id: 'interests',
      title: 'Your Interests',
      subtitle: 'What Do You Love Growing?',
      description: 'Select your gardening interests to receive personalized content and recommendations.',
      icon: 'heart-outline',
      gradient: [Colors.secondary[500], Colors.secondary[700]],
      component: InterestsStep,
    },
    {
      id: 'experience',
      title: 'Experience Level',
      subtitle: 'How Much Do You Know?',
      description: 'Help us tailor our guidance to your gardening experience level.',
      icon: 'school-outline',
      gradient: [Colors.earth[500], Colors.earth[700]],
      component: ExperienceStep,
    },
  ];

  const currentStepData = onboardingSteps[currentStep];

  const canProceed = () => {
    switch (currentStepData.id) {
      case 'usertype':
        return userType !== null;
      case 'interests':
        return interests.length > 0;
      case 'experience':
        return experienceLevel !== null;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Store onboarding data and navigate to signup
      const onboardingData = {
        userType,
        interests,
        experienceLevel,
        completed: true,
      };
      // TODO: Store in AsyncStorage or pass to signup
      router.push('/auth/signup');
    }
  };

  const handleSkip = () => {
    router.push('/auth/login');
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={currentStepData.gradient} style={styles.gradient}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {onboardingSteps.length}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {currentStepData.component ? (
            <currentStepData.component />
          ) : (
            <View style={styles.stepContent}>
              <Animated.View entering={FadeInUp.delay(200)} style={styles.stepHeader}>
                <Ionicons name={currentStepData.icon as any} size={80} color="white" />
                <Text style={styles.stepTitle}>{currentStepData.title}</Text>
                <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>
                <Text style={styles.stepDescription}>{currentStepData.description}</Text>
              </Animated.View>
            </View>
          )}
        </View>

        {/* Navigation */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.navigation}>
          <View style={styles.navigationButtons}>
            {currentStep > 0 && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={24} color="white" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.rightButtons}>
              {currentStep < onboardingSteps.length - 1 && (
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
                onPress={handleNext}
                disabled={!canProceed()}
              >
                <Text style={styles.nextText}>
                  {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
                </Text>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
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
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 8,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    width: '100%',
    gap: 16,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'white',
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    marginTop: 12,
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: 'white',
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  optionDescriptionSelected: {
    color: 'white',
  },
  interestsContainer: {
    flex: 1,
    marginTop: 20,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  interestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: width * 0.28,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  interestCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'white',
  },
  interestText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginTop: 8,
    textAlign: 'center',
  },
  interestTextSelected: {
    color: 'white',
  },
  experienceContainer: {
    width: '100%',
    gap: 16,
  },
  experienceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  experienceCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'white',
  },
  experienceTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  experienceTitleSelected: {
    color: 'white',
  },
  experienceDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  experienceDescriptionSelected: {
    color: 'white',
  },
  navigation: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'white',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginRight: 4,
  },
});