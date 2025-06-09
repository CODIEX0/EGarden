import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import Button from '@/components/Button';
import { Leaf, Users, ShoppingCart } from 'lucide-react-native';

const { height } = Dimensions.get('window');

const onboardingSteps = [
  {
    title: 'Welcome to eGarden',
    subtitle: 'Your Digital Gardening Companion',
    description: 'Manage your plants, identify diseases, and connect with fellow gardeners in one beautiful app.',
    icon: Leaf,
    gradient: [Colors.primary[400], Colors.primary[600]],
  },
  {
    title: 'Smart Plant Care',
    subtitle: 'AI-Powered Garden Management',
    description: 'Get personalized care reminders, disease diagnosis, and expert advice for healthier plants.',
    icon: Leaf,
    gradient: [Colors.secondary[400], Colors.secondary[600]],
  },
  {
    title: 'Community & Commerce',
    subtitle: 'Connect, Share, Trade',
    description: 'Join our vibrant community, share knowledge, donate surplus, and trade with local farmers.',
    icon: Users,
    gradient: [Colors.earth[400], Colors.earth[600]],
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/auth/signup');
    }
  };

  const handleSkip = () => {
    router.push('/auth/login');
  };

  const step = onboardingSteps[currentStep];
  const IconComponent = step.icon;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={step.gradient} style={styles.gradient}>
        <View style={styles.content}>
          <Animated.View entering={FadeInUp.delay(200)} style={styles.iconContainer}>
            <IconComponent size={80} color="white" strokeWidth={1.5} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)} style={styles.textContainer}>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.subtitle}>{step.subtitle}</Text>
            <Text style={styles.description}>{step.description}</Text>
          </Animated.View>

          <View style={styles.indicators}>
            {onboardingSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentStep && styles.activeIndicator,
                ]}
              />
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
              onPress={handleNext}
              variant="secondary"
              style={styles.nextButton}
            />
            <Button
              title="Already have an account? Sign In"
              onPress={handleSkip}
              variant="ghost"
              textStyle={styles.skipText}
            />
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  indicators: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: 'white',
    width: 24,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  nextButton: {
    marginBottom: 16,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
});