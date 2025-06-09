import React from 'react';
import { View, StyleSheet, Pressable, Text, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { Plant } from '@/types';
import PlantCard from './PlantCard';
import { Plus } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface GardenLayoutProps {
  plants: Plant[];
  onPlantPress: (plant: Plant) => void;
  onAddPlant: () => void;
}

export default function GardenLayout({ plants, onPlantPress, onAddPlant }: GardenLayoutProps) {
  const renderGardenGrid = () => {
    const rows = Math.ceil((plants.length + 1) / 2); // +1 for add button
    const gardenRows = [];

    for (let i = 0; i < rows; i++) {
      const rowPlants = plants.slice(i * 2, (i + 1) * 2);
      const isLastRow = i === rows - 1;
      const needsAddButton = isLastRow && rowPlants.length === 1;

      gardenRows.push(
        <Animated.View 
          key={i} 
          entering={FadeInDown.delay(i * 100)}
          style={styles.gardenRow}
        >
          {rowPlants.map((plant, index) => (
            <View key={plant.id} style={[
              styles.gardenPlot,
              index === 0 ? styles.leftPlot : styles.rightPlot
            ]}>
              <PlantCard
                plant={plant}
                onPress={() => onPlantPress(plant)}
              />
            </View>
          ))}
          
          {needsAddButton && (
            <View style={[styles.gardenPlot, styles.rightPlot, styles.emptyPlot]}>
              <Pressable 
                style={styles.addPlotButton}
                onPress={onAddPlant}
              >
                <Plus size={32} color={Colors.gray[400]} />
                <Text style={styles.addPlotText}>Add Plant</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      );
    }

    // Add a final row with add button if needed
    if (plants.length % 2 === 0 && plants.length > 0) {
      gardenRows.push(
        <Animated.View 
          key={rows} 
          entering={FadeInDown.delay(rows * 100)}
          style={styles.gardenRow}
        >
          <View style={[styles.gardenPlot, styles.leftPlot, styles.emptyPlot]}>
            <Pressable 
              style={styles.addPlotButton}
              onPress={onAddPlant}
            >
              <Plus size={32} color={Colors.gray[400]} />
              <Text style={styles.addPlotText}>Add Plant</Text>
            </Pressable>
          </View>
          <View style={[styles.gardenPlot, styles.rightPlot]} />
        </Animated.View>
      );
    }

    return gardenRows;
  };

  return (
    <View style={styles.gardenContainer}>
      <View style={styles.gardenHeader}>
        <Text style={styles.gardenTitle}>🌿 Your Digital Garden</Text>
        <Text style={styles.gardenSubtitle}>
          {plants.length} plant{plants.length !== 1 ? 's' : ''} growing
        </Text>
      </View>
      
      <View style={styles.gardenBed}>
        <View style={styles.soilLayer} />
        <View style={styles.plantsContainer}>
          {renderGardenGrid()}
        </View>
        
        {/* Garden decorations */}
        <View style={styles.decorations}>
          <Text style={styles.decoration}>🦋</Text>
          <Text style={styles.decoration}>🐝</Text>
          <Text style={styles.decoration}>🌸</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gardenContainer: {
    backgroundColor: Colors.earth[50],
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  gardenHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  gardenTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.earth[800],
    marginBottom: 4,
  },
  gardenSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.earth[600],
  },
  gardenBed: {
    position: 'relative',
    backgroundColor: Colors.earth[100],
    borderRadius: 16,
    padding: 16,
    minHeight: 200,
  },
  soilLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: Colors.earth[300],
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  plantsContainer: {
    flex: 1,
  },
  gardenRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  gardenPlot: {
    flex: 1,
    minHeight: 200,
    backgroundColor: Colors.earth[200],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.earth[300],
    borderStyle: 'solid',
    overflow: 'hidden',
  },
  leftPlot: {
    marginRight: 6,
  },
  rightPlot: {
    marginLeft: 6,
  },
  emptyPlot: {
    borderStyle: 'dashed',
    backgroundColor: Colors.earth[100],
  },
  addPlotButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addPlotText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[600],
  },
  decorations: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  decoration: {
    fontSize: 16,
    opacity: 0.6,
  },
});