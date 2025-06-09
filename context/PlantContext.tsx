import React, { createContext, useContext, useEffect, useState } from 'react';
import { databaseService } from '@/services/databaseService';
import { Plant } from '@/types';
import { useAuth } from './AuthContext';

interface PlantContextType {
  plants: Plant[];
  loading: boolean;
  isOnline: boolean;
  addPlant: (plant: Omit<Plant, 'id' | 'userId' | 'dateAdded'>) => Promise<void>;
  updatePlant: (id: string, updates: Partial<Plant>) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
  getPlantById: (id: string) => Plant | undefined;
  searchPlants: (query: string) => Plant[];
  syncData: () => Promise<void>;
  exportData: () => Promise<any>;
  importData: (data: any) => Promise<void>;
}

const PlantContext = createContext<PlantContextType | undefined>(undefined);

export function PlantProvider({ children }: { children: React.ReactNode }) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setPlants([]);
      setLoading(false);
      return;
    }

    loadPlants();
    
    // Set up real-time listener
    const unsubscribe = databaseService.subscribe('plants', (data) => {
      if (data) {
        const userPlants = Object.values(data).filter((plant: any) => plant.userId === user.id);
        setPlants(userPlants as Plant[]);
      }
      setLoading(false);
    });

    // Monitor connection status
    const checkConnection = () => {
      setIsOnline(databaseService.getConnectionStatus());
    };
    
    const interval = setInterval(checkConnection, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [user]);

  const loadPlants = async () => {
    if (!user) return;
    
    try {
      const userPlants = await databaseService.getPlantsByUser(user.id);
      setPlants(userPlants.map(plant => ({
        ...plant,
        plantingDate: plant.plantingDate ? new Date(plant.plantingDate) : new Date(),
        dateAdded: plant.dateAdded ? new Date(plant.dateAdded) : new Date(),
        lastWatered: plant.lastWatered ? new Date(plant.lastWatered) : undefined,
        lastFertilized: plant.lastFertilized ? new Date(plant.lastFertilized) : undefined,
      })));
    } catch (error) {
      console.error('Failed to load plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPlant = async (plantData: Omit<Plant, 'id' | 'userId' | 'dateAdded'>) => {
    if (!user) throw new Error('User not authenticated');

    const newPlant = {
      ...plantData,
      userId: user.id,
      dateAdded: new Date(),
      plantingDate: plantData.plantingDate || new Date(),
    };

    const id = await databaseService.create('plants', newPlant);
    
    // Update local state immediately for better UX
    setPlants(prev => [{ ...newPlant, id }, ...prev]);
  };

  const updatePlant = async (id: string, updates: Partial<Plant>) => {
    await databaseService.update('plants', id, updates);
    
    // Update local state
    setPlants(prev => prev.map(plant => 
      plant.id === id ? { ...plant, ...updates } : plant
    ));
  };

  const deletePlant = async (id: string) => {
    await databaseService.delete('plants', id);
    
    // Update local state
    setPlants(prev => prev.filter(plant => plant.id !== id));
  };

  const getPlantById = (id: string) => {
    return plants.find(plant => plant.id === id);
  };

  const searchPlants = (query: string): Plant[] => {
    if (!query.trim()) return plants;
    
    const lowercaseQuery = query.toLowerCase();
    return plants.filter(plant => 
      plant.commonName.toLowerCase().includes(lowercaseQuery) ||
      plant.scientificName?.toLowerCase().includes(lowercaseQuery) ||
      plant.plantType.toLowerCase().includes(lowercaseQuery) ||
      plant.userNotes?.toLowerCase().includes(lowercaseQuery)
    );
  };

  const syncData = async () => {
    try {
      await databaseService.forceSync();
      await loadPlants();
    } catch (error) {
      console.error('Failed to sync data:', error);
      throw error;
    }
  };

  const exportData = async () => {
    if (!user) throw new Error('User not authenticated');
    return await databaseService.exportUserData(user.id);
  };

  const importData = async (data: any) => {
    if (!user) throw new Error('User not authenticated');
    await databaseService.importUserData(user.id, data);
    await loadPlants();
  };

  const value = {
    plants,
    loading,
    isOnline,
    addPlant,
    updatePlant,
    deletePlant,
    getPlantById,
    searchPlants,
    syncData,
    exportData,
    importData,
  };

  return <PlantContext.Provider value={value}>{children}</PlantContext.Provider>;
}

export function usePlants() {
  const context = useContext(PlantContext);
  if (context === undefined) {
    throw new Error('usePlants must be used within a PlantProvider');
  }
  return context;
}