import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  withSequence,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { Leaf } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

export default function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Initial fade in
    opacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) });
    
    // Scale animation
    scale.value = withSequence(
      withTiming(1.1, { duration: 600, easing: Easing.out(Easing.back(1.2)) }),
      withTiming(1, { duration: 400, easing: Easing.inOut(Easing.quad) })
    );

    // Gentle rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );

    // Auto-complete after animation
    const timer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ],
      opacity: opacity.value,
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedContainerStyle]}>
        <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
          <Leaf size={80} color={Colors.primary[500]} strokeWidth={1.5} />
        </Animated.View>
        
        {/* Subtle glow effect */}
        <View style={styles.glowContainer}>
          <View style={[styles.glow, styles.glow1]} />
          <View style={[styles.glow, styles.glow2]} />
          <View style={[styles.glow, styles.glow3]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  glowContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: Colors.primary[500],
  },
  glow1: {
    width: 140,
    height: 140,
    opacity: 0.1,
  },
  glow2: {
    width: 160,
    height: 160,
    opacity: 0.06,
  },
  glow3: {
    width: 180,
    height: 180,
    opacity: 0.03,
  },
});