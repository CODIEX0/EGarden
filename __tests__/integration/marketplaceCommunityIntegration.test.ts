import { marketplaceService } from '@/services/marketplaceService';
import { communityRealtimeService } from '@/services/communityRealtimeService';
import { gamificationService } from '@/services/gamificationService';

// Mock services
jest.mock('@/config/firebase');
jest.mock('@/services/databaseService');

describe('Marketplace and Community Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cross-platform notifications', () => {
    it('should create community post when marketplace item is sold', async () => {
      // Mock successful order creation
      const mockDbService = require('@/services/databaseService').DatabaseService;
      mockDbService.mockImplementation(() => ({
        create: jest.fn().mockResolvedValue('order-123'),
        getById: jest.fn().mockResolvedValue({
          id: 'listing-123',
          title: 'Fresh Tomatoes',
          sellerId: 'seller-123',
          quantity: 5,
        }),
        update: jest.fn().mockResolvedValue(undefined),
      }));

      const orderData = {
        listingId: 'listing-123',
        buyerId: 'buyer-123',
        sellerId: 'seller-123',
        quantity: 2,
        totalPrice: 11.98,
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
        },
      };

      const orderId = await marketplaceService.createOrder(orderData);

      expect(orderId).toBe('order-123');
      
      // Verify that listing quantity was updated
      expect(mockDbService().update).toHaveBeenCalledWith(
        expect.stringContaining('marketListings'),
        'listing-123',
        expect.objectContaining({
          quantity: 3, // 5 - 2
          status: 'active',
        })
      );
    });

    it('should award points for successful marketplace transaction', async () => {
      // This would test the integration between marketplace and gamification
      const mockGamificationService = jest.spyOn(gamificationService, 'addPoints');
      mockGamificationService.mockResolvedValue(undefined);

      // Simulate successful order completion
      await marketplaceService.updateOrderStatus('order-123', 'completed');

      // Should award points to both buyer and seller
      expect(mockGamificationService).toHaveBeenCalledWith('buyer-123', 10, 'marketplace_purchase');
      expect(mockGamificationService).toHaveBeenCalledWith('seller-123', 15, 'marketplace_sale');
    });
  });

  describe('Real-time updates across platforms', () => {
    it('should update community when user completes marketplace transaction', async () => {
      const mockCommunityService = jest.spyOn(communityRealtimeService, 'createNotification');
      mockCommunityService.mockImplementation(jest.fn());

      // Simulate order completion
      await marketplaceService.updateOrderStatus('order-123', 'completed');

      // Should create community notification
      expect(mockCommunityService).toHaveBeenCalledWith(
        'seller-123',
        expect.objectContaining({
          type: 'marketplace_sale',
          message: 'Your item has been purchased!',
        })
      );
    });

    it('should handle concurrent real-time subscriptions', () => {
      const marketplaceCallback = jest.fn();
      const communityCallback = jest.fn();

      // Subscribe to both services
      const unsubscribeMarketplace = marketplaceService.subscribeToListings(marketplaceCallback);
      const unsubscribeCommunity = communityRealtimeService.subscribeToPosts(communityCallback);

      // Both should return unsubscribe functions
      expect(typeof unsubscribeMarketplace).toBe('function');
      expect(typeof unsubscribeCommunity).toBe('function');

      // Cleanup
      unsubscribeMarketplace();
      unsubscribeCommunity();
    });
  });

  describe('Performance under load', () => {
    it('should handle multiple concurrent operations', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      mockDbService.mockImplementation(() => ({
        create: jest.fn().mockResolvedValue('id-123'),
        update: jest.fn().mockResolvedValue(undefined),
        getAll: jest.fn().mockResolvedValue([]),
      }));

      // Simulate multiple concurrent operations
      const operations = [
        marketplaceService.createListing({
          title: 'Test 1',
          description: 'Test listing 1',
          price: 10,
          quantity: 5,
          category: 'vegetables',
          sellerId: 'seller-1',
          location: {
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            coordinates: { lat: 40.7128, lng: -74.0060 },
          },
          images: [],
          tags: [],
          organic: false,
        }),
        communityRealtimeService.likePost('post-123', 'user-456'),
        marketplaceService.addToCart('user-789', 'listing-456', 2),
      ];

      // All operations should complete successfully
      const results = await Promise.allSettled(operations);
      
      expect(results.every(result => result.status === 'fulfilled')).toBe(true);
    });

    it('should maintain data consistency during bulk operations', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      mockDbService.mockImplementation(() => ({
        update: mockUpdate,
      }));

      const bulkUpdates = [
        { id: '1', data: { price: 5.99 } },
        { id: '2', data: { price: 7.99 } },
        { id: '3', data: { price: 9.99 } },
      ];

      await marketplaceService.bulkUpdateListings(bulkUpdates);

      // All updates should be called
      expect(mockUpdate).toHaveBeenCalledTimes(3);
      
      // Each update should include timestamp
      bulkUpdates.forEach((update, index) => {
        expect(mockUpdate).toHaveBeenNthCalledWith(
          index + 1,
          'marketListings',
          update.id,
          expect.objectContaining({
            ...update.data,
            updatedAt: expect.any(Date),
          })
        );
      });
    });
  });

  describe('Error handling and recovery', () => {
    it('should handle service failures gracefully', async () => {
      const mockDbService = require('@/services/databaseService').DatabaseService;
      mockDbService.mockImplementation(() => ({
        create: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      }));

      // Should not throw unhandled errors
      await expect(
        marketplaceService.createListing({
          title: 'Test',
          description: 'Test',
          price: 10,
          quantity: 1,
          category: 'vegetables',
          sellerId: 'seller-1',
          location: {
            city: 'Test',
            state: 'TS',
            zipCode: '12345',
            coordinates: { lat: 0, lng: 0 },
          },
          images: [],
          tags: [],
          organic: false,
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should recover from network interruptions', async () => {
      let callCount = 0;
      const mockDbService = require('@/services/databaseService').DatabaseService;
      mockDbService.mockImplementation(() => ({
        getAll: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            throw new Error('Network error');
          }
          return Promise.resolve([]);
        }),
      }));

      // First call should fail, but service should be able to recover
      await expect(marketplaceService.getListings()).rejects.toThrow('Network error');
      
      // Second call should succeed
      const result = await marketplaceService.getListings();
      expect(result).toEqual([]);
    });
  });
});
