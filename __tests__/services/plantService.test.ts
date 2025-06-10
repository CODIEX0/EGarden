import { plantService } from '@/services/plantService';
import { Plant } from '@/types';

// Mock Firebase
jest.mock('@/config/firebase', () => ({
  database: {},
  auth: {},
}));

// Mock DatabaseService
jest.mock('@/services/databaseService', () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('PlantService', () => {
  const mockPlant: Plant = {
    id: '1',
    name: 'Test Plant',
    scientificName: 'Testus plantus',
    species: 'Test Species',
    variety: 'Test Variety',
    plantingDate: new Date('2024-01-01'),
    location: 'Garden',
    wateringSchedule: {
      frequency: 'daily',
      amount: '500ml',
      time: '08:00',
    },
    fertilizingSchedule: {
      frequency: 'weekly',
      type: 'organic',
      lastApplied: new Date('2024-01-01'),
    },
    harvestDate: new Date('2024-06-01'),
    notes: 'Test notes',
    images: [],
    healthStatus: 'healthy',
    growthStage: 'seedling',
    tags: ['test'],
    weather: {
      temperature: 25,
      humidity: 60,
      conditions: 'sunny',
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addPlant', () => {
    it('should add a plant successfully', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      const mockCreate = jest.fn().mockResolvedValue('plant-id-123');
      mockDbService.mockImplementation(() => ({
        create: mockCreate,
      }));

      const plantData = {
        name: 'Test Plant',
        scientificName: 'Testus plantus',
        species: 'Test Species',
        variety: 'Test Variety',
        plantingDate: new Date('2024-01-01'),
        location: 'Garden',
      };

      const result = await plantService.addPlant(plantData);

      expect(result).toBe('plant-id-123');
      expect(mockCreate).toHaveBeenCalledWith('plants', expect.objectContaining({
        ...plantData,
        healthStatus: 'healthy',
        growthStage: 'seedling',
        tags: [],
        images: [],
        notes: '',
      }));
    });

    it('should throw error when adding plant fails', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      const mockCreate = jest.fn().mockRejectedValue(new Error('Database error'));
      mockDbService.mockImplementation(() => ({
        create: mockCreate,
      }));

      const plantData = {
        name: 'Test Plant',
        species: 'Test Species',
        plantingDate: new Date(),
        location: 'Garden',
      };

      await expect(plantService.addPlant(plantData)).rejects.toThrow('Database error');
    });
  });

  describe('getPlants', () => {
    it('should return all plants for a user', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      const mockGetAll = jest.fn().mockResolvedValue([mockPlant]);
      mockDbService.mockImplementation(() => ({
        getAll: mockGetAll,
      }));

      const result = await plantService.getPlants('user-123');

      expect(result).toEqual([mockPlant]);
      expect(mockGetAll).toHaveBeenCalledWith('plants');
    });

    it('should return empty array when no plants found', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      const mockGetAll = jest.fn().mockResolvedValue([]);
      mockDbService.mockImplementation(() => ({
        getAll: mockGetAll,
      }));

      const result = await plantService.getPlants('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('updatePlant', () => {
    it('should update plant successfully', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      mockDbService.mockImplementation(() => ({
        update: mockUpdate,
      }));

      const updates = { name: 'Updated Plant Name' };

      await plantService.updatePlant('plant-123', updates);

      expect(mockUpdate).toHaveBeenCalledWith('plants', 'plant-123', expect.objectContaining({
        ...updates,
        updatedAt: expect.any(Date),
      }));
    });
  });

  describe('deletePlant', () => {
    it('should delete plant successfully', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      const mockDelete = jest.fn().mockResolvedValue(undefined);
      mockDbService.mockImplementation(() => ({
        delete: mockDelete,
      }));

      await plantService.deletePlant('plant-123');

      expect(mockDelete).toHaveBeenCalledWith('plants', 'plant-123');
    });
  });

  describe('searchPlants', () => {
    it('should search plants by name', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      const mockGetAll = jest.fn().mockResolvedValue([mockPlant]);
      mockDbService.mockImplementation(() => ({
        getAll: mockGetAll,
      }));

      const result = await plantService.searchPlants('user-123', 'Test');

      expect(result).toEqual([mockPlant]);
    });

    it('should return empty array when no matches found', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      const mockGetAll = jest.fn().mockResolvedValue([mockPlant]);
      mockDbService.mockImplementation(() => ({
        getAll: mockGetAll,
      }));

      const result = await plantService.searchPlants('user-123', 'NonExistent');

      expect(result).toEqual([]);
    });
  });
});
