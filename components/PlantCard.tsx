import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { Plant } from '@/types';
import { Droplets, Calendar, TriangleAlert as AlertTriangle } from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PlantCardProps {
  plant: Plant;
  onPress: () => void;
}

export default function PlantCard({ plant, onPress }: PlantCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getHealthColor = () => {
    switch (plant.healthStatus) {
      case 'healthy':
        return Colors.status.success;
      case 'potential_issue':
        return Colors.status.warning;
      case 'diseased':
        return Colors.status.error;
      default:
        return Colors.gray[400];
    }
  };

  const getHealthText = () => {
    switch (plant.healthStatus) {
      case 'healthy':
        return 'Healthy';
      case 'potential_issue':
        return 'Needs Attention';
      case 'diseased':
        return 'Diseased';
      default:
        return 'Unknown';
    }
  };

  const getDaysUntilWatering = () => {
    if (!plant.lastWatered) return 0;
    const daysSinceWatered = Math.floor((new Date().getTime() - plant.lastWatered.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, plant.wateringFrequency - daysSinceWatered);
  };

  const needsWatering = getDaysUntilWatering() <= 0;

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        {plant.image ? (
          <Image source={{ uri: plant.image }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>🌱</Text>
          </View>
        )}
        <View style={[styles.healthBadge, { backgroundColor: getHealthColor() }]}>
          <Text style={styles.healthBadgeText}>{getHealthText()}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.commonName} numberOfLines={1}>
          {plant.commonName}
        </Text>
        {plant.scientificName && (
          <Text style={styles.scientificName} numberOfLines={1}>
            {plant.scientificName}
          </Text>
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Calendar size={14} color={Colors.gray[500]} />
            <Text style={styles.infoText}>
              {plant.plantingDate.toLocaleDateString()}
            </Text>
          </View>
          
          <View style={[styles.infoItem, needsWatering && styles.warningInfo]}>
            <Droplets size={14} color={needsWatering ? Colors.status.error : Colors.gray[500]} />
            <Text style={[styles.infoText, needsWatering && styles.warningText]}>
              {needsWatering ? 'Water now!' : `${getDaysUntilWatering()}d left`}
            </Text>
          </View>
        </View>

        {plant.healthStatus !== 'healthy' && (
          <View style={styles.alertRow}>
            <AlertTriangle size={14} color={Colors.status.warning} />
            <Text style={styles.alertText}>
              {plant.identifiedDisease?.name || 'Needs attention'}
            </Text>
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
  },
  healthBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  content: {
    padding: 16,
  },
  commonName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    fontStyle: 'italic',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warningInfo: {
    padding: 4,
    backgroundColor: Colors.status.error + '20',
    borderRadius: 6,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
  },
  warningText: {
    color: Colors.status.error,
    fontFamily: 'Inter-SemiBold',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.status.warning + '20',
    borderRadius: 8,
  },
  alertText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.status.warning,
    flex: 1,
  },
});