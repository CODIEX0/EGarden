import { database } from '@/config/firebase';
import { ref, push, get, update, remove, query, orderByChild, limitToLast, startAt, endAt, onValue, off } from 'firebase/database';
import { MarketListing, Order, PaymentMethod, ShippingOption } from '@/types';
import { databaseService } from './databaseService';

interface RealtimeSubscription {
  unsubscribe: () => void;
}

export class MarketplaceService {
  private dbService = databaseService;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private listingsCache: Map<string, { data: MarketListing[]; timestamp: number }> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  // Real-time listing updates
  subscribeToListings(
    callback: (listings: MarketListing[]) => void,
    filters?: any
  ): () => void {
    const subscriptionKey = `listings_${JSON.stringify(filters)}`;
    
    // Unsubscribe from existing subscription if any
    this.unsubscribeFromListings(subscriptionKey);
    
    const listingsRef = ref(database, 'marketListings');
    const unsubscribe = onValue(listingsRef, (snapshot) => {
      if (snapshot.exists()) {
        let listings = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        })) as MarketListing[];

        // Apply filters
        if (filters) {
          listings = this.applyFilters(listings, filters);
        }

        callback(listings);
      } else {
        callback([]);
      }
    });

    this.subscriptions.set(subscriptionKey, { unsubscribe });
    
    return () => this.unsubscribeFromListings(subscriptionKey);
  }

  private unsubscribeFromListings(subscriptionKey: string) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Real-time order updates
  subscribeToOrders(
    userId: string,
    type: 'buyer' | 'seller',
    callback: (orders: Order[]) => void
  ): () => void {
    const subscriptionKey = `orders_${userId}_${type}`;
    
    this.unsubscribeFromOrders(subscriptionKey);
    
    const ordersRef = ref(database, 'orders');
    const field = type === 'buyer' ? 'buyerId' : 'sellerId';
    const ordersQuery = query(ordersRef, orderByChild(field), startAt(userId), endAt(userId));
    
    const unsubscribe = onValue(ordersQuery, (snapshot) => {
      if (snapshot.exists()) {
        const orders = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : undefined,
        })) as Order[];
        
        callback(orders);
      } else {
        callback([]);
      }
    });

    this.subscriptions.set(subscriptionKey, { unsubscribe });
    
    return () => this.unsubscribeFromOrders(subscriptionKey);
  }

  private unsubscribeFromOrders(subscriptionKey: string) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Real-time order messages
  subscribeToOrderMessages(
    orderId: string,
    callback: (messages: any[]) => void
  ): () => void {
    const subscriptionKey = `order_messages_${orderId}`;
    
    this.unsubscribeFromOrderMessages(subscriptionKey);
    
    const messagesRef = ref(database, `orders/${orderId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messages = Object.values(snapshot.val()).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        callback(messages);
      } else {
        callback([]);
      }
    });

    this.subscriptions.set(subscriptionKey, { unsubscribe });
    
    return () => this.unsubscribeFromOrderMessages(subscriptionKey);
  }

  private unsubscribeFromOrderMessages(subscriptionKey: string) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Enhanced search with caching and debouncing
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  
  async searchListingsDebounced(
    searchTerm: string,
    filters?: any,
    callback?: (listings: MarketListing[]) => void,
    debounceMs: number = 300
  ): Promise<MarketListing[]> {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    return new Promise((resolve) => {
      this.searchDebounceTimer = setTimeout(async () => {
        const results = await this.searchListings(searchTerm, filters);
        if (callback) callback(results);
        resolve(results);
      }, debounceMs);
    });
  }

  // Performance optimized listing fetch with caching
  async getListingsCached(filters?: any, limit: number = 20): Promise<MarketListing[]> {
    const cacheKey = `listings_${JSON.stringify(filters)}_${limit}`;
    const cached = this.listingsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    const listings = await this.getListings(filters, limit);
    this.listingsCache.set(cacheKey, {
      data: listings,
      timestamp: Date.now(),
    });

    return listings;
  }

  // Bulk operations for performance
  async bulkUpdateListings(updates: Array<{ id: string; data: Partial<MarketListing> }>): Promise<void> {
    try {
      const updatePromises = updates.map(({ id, data }) => 
        this.updateListing(id, data)
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error bulk updating listings:', error);
      throw error;
    }
  }

  async bulkUpdateOrders(updates: Array<{ id: string; data: Partial<Order> }>): Promise<void> {
    try {
      const updatePromises = updates.map(({ id, data }) => 
        this.updateOrder(id, data)
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error bulk updating orders:', error);
      throw error;
    }
  }

  // Helper method to apply filters
  private applyFilters(listings: MarketListing[], filters: any): MarketListing[] {
    let filtered = listings;

    if (filters.category) {
      filtered = filtered.filter(l => l.category === filters.category);
    }
    if (filters.location) {
      filtered = filtered.filter(l => 
        l.location.city.toLowerCase().includes(filters.location.toLowerCase()) ||
        l.location.state.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(l => l.price >= filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(l => l.price <= filters.maxPrice);
    }
    if (filters.organic !== undefined) {
      filtered = filtered.filter(l => l.organic === filters.organic);
    }
    if (filters.sellerId) {
      filtered = filtered.filter(l => l.sellerId === filters.sellerId);
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(l => 
        l.title.toLowerCase().includes(searchTerm) ||
        l.description.toLowerCase().includes(searchTerm) ||
        l.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    return filtered
      .filter(l => l.status === 'active' && (!l.expiresAt || new Date(l.expiresAt) > new Date()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Cleanup method to unsubscribe from all real-time listeners
  cleanup(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
    this.listingsCache.clear();
    
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
  }

  // Marketplace Listings
  async createListing(listingData: Omit<MarketListing, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    const listing: Omit<MarketListing, 'id'> = {
      ...listingData,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await this.dbService.create('marketListings', listing);
  }

  async getListings(filters?: {
    category?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    organic?: boolean;
    sellerId?: string;
    search?: string;
    radius?: number;
  }, limit: number = 20): Promise<MarketListing[]> {
    try {
      let listings = await this.dbService.getAll('marketListings') as MarketListing[];
      
      // Apply filters
      if (filters) {
        if (filters.category) {
          listings = listings.filter(l => l.category === filters.category);
        }
        if (filters.location) {
          listings = listings.filter(l => 
            l.location.city.toLowerCase().includes(filters.location!.toLowerCase()) ||
            l.location.state.toLowerCase().includes(filters.location!.toLowerCase())
          );
        }
        if (filters.minPrice !== undefined) {
          listings = listings.filter(l => l.price >= filters.minPrice!);
        }
        if (filters.maxPrice !== undefined) {
          listings = listings.filter(l => l.price <= filters.maxPrice!);
        }
        if (filters.organic !== undefined) {
          listings = listings.filter(l => l.organic === filters.organic);
        }
        if (filters.sellerId) {
          listings = listings.filter(l => l.sellerId === filters.sellerId);
        }
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          listings = listings.filter(l => 
            l.title.toLowerCase().includes(searchTerm) ||
            l.description.toLowerCase().includes(searchTerm) ||
            l.tags.some(tag => tag.toLowerCase().includes(searchTerm))
          );
        }
      }

      return listings
        .filter(l => l.status === 'active' && (!l.expiresAt || new Date(l.expiresAt) > new Date()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching listings:', error);
      return [];
    }
  }

  async searchListings(searchTerm: string, filters?: any): Promise<MarketListing[]> {
    try {
      let listings = await this.getListings(filters);
      
      return listings.filter(listing => 
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        listing.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching listings:', error);
      return [];
    }
  }

  async updateListing(listingId: string, updates: Partial<MarketListing>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };
      await this.dbService.update('marketListings', listingId, updateData);
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  }

  async deleteListing(listingId: string): Promise<void> {
    try {
      await this.dbService.delete('marketListings', listingId);
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  }

  // Order Management
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'paymentStatus' | 'messages'>): Promise<string> {
    const order: Omit<Order, 'id'> = {
      ...orderData,
      status: 'pending',
      paymentStatus: 'pending',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const orderId = await this.dbService.create('orders', order);

    // Update listing quantity
    const listingRef = ref(database, `marketListings/${orderData.listingId}`);
    const listingSnapshot = await get(listingRef);
    if (listingSnapshot.exists()) {
      const listing = listingSnapshot.val();
      const newQuantity = listing.quantity - orderData.quantity;
      
      await update(listingRef, {
        quantity: newQuantity,
        status: newQuantity <= 0 ? 'sold' : 'active',
        updatedAt: new Date(),
      });
    }

    return orderId;
  }

  async getOrders(userId: string, type: 'buyer' | 'seller' = 'buyer'): Promise<Order[]> {
    try {
      const ordersRef = ref(database, 'orders');
      const field = type === 'buyer' ? 'buyerId' : 'sellerId';
      const ordersQuery = query(ordersRef, orderByChild(field), startAt(userId), endAt(userId));
      
      const snapshot = await get(ordersQuery);
      if (snapshot.exists()) {
        return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const order = await this.dbService.getById('orders', orderId) as Order;
      return order || null;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  async updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };
      await this.dbService.update('orders', orderId, updateData);
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: Order['status'], trackingNumber?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber;
      }

      await this.dbService.update('orders', orderId, updateData);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async addOrderMessage(orderId: string, senderId: string, content: string, attachments?: string[]): Promise<void> {
    try {
      const orderRef = ref(database, `orders/${orderId}`);
      const snapshot = await get(orderRef);
      
      if (snapshot.exists()) {
        const order = snapshot.val();
        const messages = order.messages || [];
        
        const newMessage = {
          id: Date.now().toString(),
          senderId,
          content,
          timestamp: new Date(),
          attachments: attachments || [],
        };

        messages.push(newMessage);
        
        await update(orderRef, {
          messages,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error adding order message:', error);
      throw error;
    }
  }

  // Payment Processing
  async processPayment(orderId: string, paymentMethod: PaymentMethod): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // This is a mock implementation
      // In production, integrate with actual payment processors like Stripe, PayPal, etc.
      
      const mockPaymentDelay = Math.random() * 2000 + 1000; // 1-3 seconds
      await new Promise(resolve => setTimeout(resolve, mockPaymentDelay));
      
      const success = Math.random() > 0.1; // 90% success rate for demo
      
      if (success) {
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Update order payment status
        await this.dbService.update('orders', orderId, {
          paymentStatus: 'paid',
          status: 'confirmed',
          updatedAt: new Date(),
        });

        return { success: true, transactionId };
      } else {
        return { success: false, error: 'Payment processing failed. Please try again.' };
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false, error: 'Payment processing error occurred.' };
    }
  }

  async processCryptoPayment(orderId: string, cryptoCurrency: string, amount: number): Promise<{ success: boolean; walletAddress?: string; error?: string }> {
    try {
      // Mock crypto payment implementation
      // In production, integrate with actual crypto payment processors
      
      const mockWalletAddresses = {
        'BTC': '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        'ETH': '0x742d35Cc6634C0532925a3b8D0e79c04FDD8e78A',
      };

      const walletAddress = mockWalletAddresses[cryptoCurrency as keyof typeof mockWalletAddresses];
      
      if (!walletAddress) {
        return { success: false, error: 'Unsupported cryptocurrency' };
      }

      // Update order with crypto payment info
      await this.dbService.update('orders', orderId, {
        paymentStatus: 'pending',
        cryptoPaymentAddress: walletAddress,
        cryptoAmount: amount,
        cryptoCurrency,
        updatedAt: new Date(),
      });

      return { success: true, walletAddress };
    } catch (error) {
      console.error('Error processing crypto payment:', error);
      return { success: false, error: 'Crypto payment processing error occurred.' };
    }
  }

  // Shipping Options
  async calculateShipping(listingId: string, destinationAddress: any): Promise<ShippingOption[]> {
    try {
      // Mock shipping calculation
      // In production, integrate with actual shipping providers
      
      const baseOptions: ShippingOption[] = [
        {
          id: 'standard',
          name: 'Standard Shipping',
          description: 'Delivery in 5-7 business days',
          price: 9.99,
          estimatedDays: 6,
          trackingAvailable: true,
        },
        {
          id: 'express',
          name: 'Express Shipping',
          description: 'Delivery in 2-3 business days',
          price: 19.99,
          estimatedDays: 3,
          trackingAvailable: true,
        },
        {
          id: 'overnight',
          name: 'Overnight Shipping',
          description: 'Next business day delivery',
          price: 29.99,
          estimatedDays: 1,
          trackingAvailable: true,
        },
      ];

      // Mock distance-based pricing adjustment
      const distance = Math.random() * 1000; // Random distance for demo
      const distanceMultiplier = Math.max(0.8, Math.min(1.5, distance / 500));

      return baseOptions.map(option => ({
        ...option,
        price: Math.round(option.price * distanceMultiplier * 100) / 100,
      }));
    } catch (error) {
      console.error('Error calculating shipping:', error);
      return [];
    }
  }

  // Analytics for Sellers
  async getSellerAnalytics(sellerId: string): Promise<{
    totalListings: number;
    activeListings: number;
    totalSales: number;
    totalRevenue: number;
    averageRating: number;
    recentOrders: Order[];
  }> {
    try {
      const [listings, orders] = await Promise.all([
        this.getListings({ sellerId }),
        this.getOrders(sellerId, 'seller')
      ]);

      const totalListings = listings.length;
      const activeListings = listings.filter(l => l.status === 'active').length;
      const completedOrders = orders.filter(o => o.status === 'completed');
      const totalSales = completedOrders.length;
      const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
      
      // Mock average rating calculation
      const averageRating = 4.2 + Math.random() * 0.8; // Demo rating between 4.2-5.0

      const recentOrders = orders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      return {
        totalListings,
        activeListings,
        totalSales,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageRating: Math.round(averageRating * 10) / 10,
        recentOrders,
      };
    } catch (error) {
      console.error('Error fetching seller analytics:', error);
      return {
        totalListings: 0,
        activeListings: 0,
        totalSales: 0,
        totalRevenue: 0,
        averageRating: 0,
        recentOrders: [],
      };
    }
  }

  // Favorites/Wishlist
  async addToFavorites(userId: string, listingId: string): Promise<void> {
    try {
      const favoritesRef = ref(database, `favorites/${userId}/${listingId}`);
      await update(favoritesRef, {
        addedAt: new Date(),
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  async removeFromFavorites(userId: string, listingId: string): Promise<void> {
    try {
      const favoritesRef = ref(database, `favorites/${userId}/${listingId}`);
      await remove(favoritesRef);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  async getFavorites(userId: string): Promise<MarketListing[]> {
    try {
      const favoritesRef = ref(database, `favorites/${userId}`);
      const snapshot = await get(favoritesRef);
      
      if (snapshot.exists()) {
        const favoriteIds = Object.keys(snapshot.val());
        const listings = await Promise.all(
          favoriteIds.map(async (id) => {
            const listingRef = ref(database, `marketListings/${id}`);
            const listingSnapshot = await get(listingRef);
            return listingSnapshot.exists() ? { id, ...listingSnapshot.val() } : null;
          })
        );
        
        return listings.filter(listing => listing !== null) as MarketListing[];
      }
      return [];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  }

  // Shopping Cart
  async addToCart(userId: string, listingId: string, quantity: number): Promise<void> {
    try {
      const cartRef = ref(database, `carts/${userId}/${listingId}`);
      await update(cartRef, {
        quantity,
        addedAt: new Date(),
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  async removeFromCart(userId: string, listingId: string): Promise<void> {
    try {
      const cartRef = ref(database, `carts/${userId}/${listingId}`);
      await remove(cartRef);
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  async getCart(userId: string): Promise<Array<{ listing: MarketListing; quantity: number }>> {
    try {
      const cartRef = ref(database, `carts/${userId}`);
      const snapshot = await get(cartRef);
      
      if (snapshot.exists()) {
        const cartItems = snapshot.val();
        const listings = await Promise.all(
          Object.keys(cartItems).map(async (listingId) => {
            const listingRef = ref(database, `marketListings/${listingId}`);
            const listingSnapshot = await get(listingRef);
            return listingSnapshot.exists() 
              ? { 
                  listing: { id: listingId, ...listingSnapshot.val() } as MarketListing,
                  quantity: cartItems[listingId].quantity 
                }
              : null;
          })
        );
        
        return listings.filter(item => item !== null) as Array<{ listing: MarketListing; quantity: number }>;
      }
      return [];
    } catch (error) {
      console.error('Error fetching cart:', error);
      return [];
    }
  }
}

export const marketplaceService = new MarketplaceService();
