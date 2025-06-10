import { marketplaceService } from '@/services/marketplaceService';
import { MarketListing, Order } from '@/types';

// Mock Firebase and dependencies
jest.mock('@/config/firebase');
jest.mock('@/services/databaseService');

describe('MarketplaceService', () => {
  const mockListing: MarketListing = {
    id: '1',
    title: 'Fresh Tomatoes',
    description: 'Organic tomatoes from local farm',
    price: 5.99,
    quantity: 10,
    category: 'vegetables',
    sellerId: 'seller-123',
    location: {
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      coordinates: { lat: 40.7128, lng: -74.0060 },
    },
    images: [],
    tags: ['organic', 'fresh'],
    organic: true,
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createListing', () => {
    it('should create a listing successfully', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      const mockCreate = jest.fn().mockResolvedValue('listing-123');
      mockDbService.mockImplementation(() => ({
        create: mockCreate,
      }));

      const listingData = {
        title: 'Fresh Tomatoes',
        description: 'Organic tomatoes',
        price: 5.99,
        quantity: 10,
        category: 'vegetables',
        sellerId: 'seller-123',
        location: mockListing.location,
        images: [],
        tags: ['organic'],
        organic: true,
      };

      const result = await marketplaceService.createListing(listingData);

      expect(result).toBe('listing-123');
      expect(mockCreate).toHaveBeenCalledWith('marketListings', expect.objectContaining({
        ...listingData,
        status: 'active',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));
    });
  });

  describe('getListings', () => {
    it('should return filtered active listings', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      const mockGetAll = jest.fn().mockResolvedValue([mockListing]);
      mockDbService.mockImplementation(() => ({
        getAll: mockGetAll,
      }));

      const result = await marketplaceService.getListings({
        category: 'vegetables',
        organic: true,
      });

      expect(result).toEqual([mockListing]);
    });

    it('should filter by price range', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      const mockGetAll = jest.fn().mockResolvedValue([
        { ...mockListing, price: 3.99 },
        { ...mockListing, id: '2', price: 7.99 },
        { ...mockListing, id: '3', price: 10.99 },
      ]);
      mockDbService.mockImplementation(() => ({
        getAll: mockGetAll,
      }));

      const result = await marketplaceService.getListings({
        minPrice: 5,
        maxPrice: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });
  });

  describe('searchListings', () => {
    it('should search listings by title and tags', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      const mockGetAll = jest.fn().mockResolvedValue([
        mockListing,
        { ...mockListing, id: '2', title: 'Fresh Carrots', tags: ['organic'] },
        { ...mockListing, id: '3', title: 'Regular Potatoes', tags: ['regular'] },
      ]);
      mockDbService.mockImplementation(() => ({
        getAll: mockGetAll,
      }));

      const result = await marketplaceService.searchListings('organic');

      expect(result).toHaveLength(2);
      expect(result.map(l => l.id)).toEqual(['1', '2']);
    });
  });

  describe('Real-time features', () => {
    it('should subscribe to listings updates', () => {
      const callback = jest.fn();
      const unsubscribe = marketplaceService.subscribeToListings(callback);

      expect(typeof unsubscribe).toBe('function');
      
      // Test unsubscribe
      unsubscribe();
    });

    it('should debounce search queries', async () => {
      const callback = jest.fn();
      
      // Multiple rapid calls
      marketplaceService.searchListingsDebounced('test1', {}, callback, 100);
      marketplaceService.searchListingsDebounced('test2', {}, callback, 100);
      marketplaceService.searchListingsDebounced('test3', {}, callback, 100);

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should only be called once with the last search term
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance optimizations', () => {
    it('should cache listings', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      const mockGetAll = jest.fn().mockResolvedValue([mockListing]);
      mockDbService.mockImplementation(() => ({
        getAll: mockGetAll,
      }));

      // First call
      const result1 = await marketplaceService.getListingsCached();
      expect(mockGetAll).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await marketplaceService.getListingsCached();
      expect(mockGetAll).toHaveBeenCalledTimes(1); // Should not call again
      expect(result2).toEqual(result1);
    });

    it('should handle bulk updates', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      mockDbService.mockImplementation(() => ({
        update: mockUpdate,
      }));

      const updates = [
        { id: '1', data: { price: 4.99 } },
        { id: '2', data: { price: 6.99 } },
      ];

      await marketplaceService.bulkUpdateListings(updates);

      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });
  });
});
