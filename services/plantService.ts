import { database } from '@/config/firebase';
import { ref, push, get, update, remove, query, orderByChild, startAt, endAt } from 'firebase/database';
import { Plant, Disease, AIAnalysis } from '@/types';
import { databaseService } from './databaseService';

export class PlantService {
  private dbService = databaseService;

  // Plant CRUD operations
  async createPlant(plantData: Omit<Plant, 'id' | 'dateAdded'>): Promise<string> {
    const plant: Omit<Plant, 'id'> = {
      ...plantData,
      dateAdded: new Date(),
    };

    return await this.dbService.create('plants', plant);
  }

  async getPlants(userId: string): Promise<Plant[]> {
    try {
      const plantsRef = ref(database, 'plants');
      const plantsQuery = query(plantsRef, orderByChild('userId'), startAt(userId), endAt(userId));
      
      const snapshot = await get(plantsQuery);
      if (snapshot.exists()) {
        return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          plantingDate: new Date(data.plantingDate),
          dateAdded: new Date(data.dateAdded),
          lastWatered: data.lastWatered ? new Date(data.lastWatered) : undefined,
          lastFertilized: data.lastFertilized ? new Date(data.lastFertilized) : undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching plants:', error);
      return [];
    }
  }

  async getPlant(plantId: string): Promise<Plant | null> {
    try {
      const plant = await this.dbService.read('plants', plantId);
      if (plant) {
        return {
          ...plant,
          plantingDate: new Date(plant.plantingDate),
          dateAdded: new Date(plant.dateAdded),
          lastWatered: plant.lastWatered ? new Date(plant.lastWatered) : undefined,
          lastFertilized: plant.lastFertilized ? new Date(plant.lastFertilized) : undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching plant:', error);
      return null;
    }
  }

  async updatePlant(plantId: string, updates: Partial<Plant>): Promise<void> {
    try {
      await this.dbService.update('plants', plantId, updates);
    } catch (error) {
      console.error('Error updating plant:', error);
      throw error;
    }
  }

  async deletePlant(plantId: string): Promise<void> {
    try {
      await this.dbService.delete('plants', plantId);
    } catch (error) {
      console.error('Error deleting plant:', error);
      throw error;
    }
  }

  // Plant care tracking
  async recordWatering(plantId: string): Promise<void> {
    try {
      await this.updatePlant(plantId, {
        lastWatered: new Date(),
      });
    } catch (error) {
      console.error('Error recording watering:', error);
      throw error;
    }
  }

  async recordFertilizing(plantId: string): Promise<void> {
    try {
      await this.updatePlant(plantId, {
        lastFertilized: new Date(),
      });
    } catch (error) {
      console.error('Error recording fertilizing:', error);
      throw error;
    }
  }

  // Plant identification
  async identifyPlant(imageUri: string): Promise<Plant | null> {
    try {
      // Mock plant identification
      // In production, integrate with PlantNet API or similar service
      const mockIdentification = {
        commonName: 'Mock Plant',
        scientificName: 'Plantus mockus',
        plantType: 'herb' as const,
        confidence: 0.85,
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        id: '',
        userId: '',
        image: imageUri,
        ...mockIdentification,
        plantingDate: new Date(),
        wateringFrequency: 7, // days
        healthStatus: 'healthy',
        userNotes: '',
        dateAdded: new Date(),
        aiAnalysis: {
          confidence: mockIdentification.confidence,
          identificationSource: 'plantnet',
          careRecommendations: [
            'Water regularly but avoid overwatering',
            'Provide bright, indirect sunlight',
            'Fertilize monthly during growing season',
          ],
          environmentalFactors: {
            lightLevel: 'medium',
            humidity: 50,
            temperature: 22,
            soilMoisture: 'moist',
          },
          lastAnalyzed: new Date(),
        },
      };
    } catch (error) {
      console.error('Error identifying plant:', error);
      return null;
    }
  }

  // Disease detection
  async detectDisease(plantId: string, imageUri: string): Promise<Disease[]> {
    try {
      // Mock disease detection
      // In production, integrate with plant disease detection API
      const mockDiseases: Disease[] = [
        {
          name: 'Leaf Spot',
          severity: 'low',
          symptoms: ['Brown spots on leaves', 'Yellowing around spots'],
          causes: ['Fungal infection', 'Overwatering', 'Poor air circulation'],
          controlMeasures: ['Remove affected leaves', 'Improve air circulation', 'Reduce watering frequency'],
          prevention: ['Avoid overhead watering', 'Ensure good drainage', 'Space plants properly'],
          confidence: 0.75,
          treatmentUrgency: 'soon',
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update plant with disease detection results
      await this.updatePlant(plantId, {
        healthStatus: mockDiseases.length > 0 ? 'potential_issue' : 'healthy',
        identifiedDisease: mockDiseases[0] || undefined,
      });

      return mockDiseases;
    } catch (error) {
      console.error('Error detecting disease:', error);
      return [];
    }
  }

  // Plant search and filtering
  async searchPlants(userId: string, searchTerm: string): Promise<Plant[]> {
    try {
      const plants = await this.getPlants(userId);
      return plants.filter(plant => 
        plant.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plant.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plant.userNotes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching plants:', error);
      return [];
    }
  }

  async getPlantsByType(userId: string, plantType: Plant['plantType']): Promise<Plant[]> {
    try {
      const plants = await this.getPlants(userId);
      return plants.filter(plant => plant.plantType === plantType);
    } catch (error) {
      console.error('Error filtering plants by type:', error);
      return [];
    }
  }

  async getPlantsByHealthStatus(userId: string, healthStatus: Plant['healthStatus']): Promise<Plant[]> {
    try {
      const plants = await this.getPlants(userId);
      return plants.filter(plant => plant.healthStatus === healthStatus);
    } catch (error) {
      console.error('Error filtering plants by health status:', error);
      return [];
    }
  }

  // Plant care reminders
  async getPlantsNeedingWater(userId: string): Promise<Plant[]> {
    try {
      const plants = await this.getPlants(userId);
      const now = new Date();
      
      return plants.filter(plant => {
        if (!plant.lastWatered) return true;
        const daysSinceWatered = Math.floor((now.getTime() - plant.lastWatered.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceWatered >= plant.wateringFrequency;
      });
    } catch (error) {
      console.error('Error getting plants needing water:', error);
      return [];
    }
  }

  async getPlantsNeedingFertilizer(userId: string): Promise<Plant[]> {
    try {
      const plants = await this.getPlants(userId);
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      return plants.filter(plant => {
        if (!plant.lastFertilized) return true;
        return plant.lastFertilized < oneMonthAgo;
      });
    } catch (error) {
      console.error('Error getting plants needing fertilizer:', error);
      return [];
    }
  }

  // Analytics
  async getPlantStatistics(userId: string): Promise<{
    totalPlants: number;
    healthyPlants: number;
    plantsWithIssues: number;
    plantsByType: Record<string, number>;
    averageHealth: number;
  }> {
    try {
      const plants = await this.getPlants(userId);
      
      const totalPlants = plants.length;
      const healthyPlants = plants.filter(p => p.healthStatus === 'healthy').length;
      const plantsWithIssues = plants.filter(p => p.healthStatus !== 'healthy').length;
      
      const plantsByType = plants.reduce((acc, plant) => {
        acc[plant.plantType] = (acc[plant.plantType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const averageHealth = healthyPlants / totalPlants * 100 || 0;

      return {
        totalPlants,
        healthyPlants,
        plantsWithIssues,
        plantsByType,
        averageHealth: Math.round(averageHealth),
      };
    } catch (error) {
      console.error('Error getting plant statistics:', error);
      return {
        totalPlants: 0,
        healthyPlants: 0,
        plantsWithIssues: 0,
        plantsByType: {},
        averageHealth: 0,
      };
    }
  }
}

export const plantService = new PlantService();
