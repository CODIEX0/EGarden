import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { MarketListing, MarketCategory, Order } from '@/types';
import { marketplaceService } from '@/services/marketplaceService';

export default function MarketScreen() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<MarketListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);

  const categories: Array<{ key: MarketCategory | 'all'; label: string; icon: string }> = [
    { key: 'all', label: 'All', icon: 'grid-outline' },
    { key: 'vegetables', label: 'Vegetables', icon: 'leaf-outline' },
    { key: 'fruits', label: 'Fruits', icon: 'nutrition-outline' },
    { key: 'tools', label: 'Tools', icon: 'construct-outline' },
    { key: 'seeds', label: 'Seeds', icon: 'flower-outline' },
    { key: 'flowers', label: 'Flowers', icon: 'rose-outline' },
    { key: 'herbs', label: 'Herbs', icon: 'leaf-outline' },
    { key: 'fertilizer', label: 'Fertilizer', icon: 'flask-outline' },
  ];

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    filterListings();
  }, [listings, searchQuery, selectedCategory]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await marketplaceService.getListings({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        search: searchQuery,
        location: user?.location,
        radius: 50,
      });
      setListings(data);
    } catch (error) {
      console.error('Error loading listings:', error);
      Alert.alert('Error', 'Failed to load marketplace listings');
    } finally {
      setLoading(false);
    }
  };

  const filterListings = () => {
    let filtered = listings;

    if (searchQuery) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(listing => listing.category === selectedCategory);
    }

    setFilteredListings(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadListings();
    setRefreshing(false);
  };

  const handleAddToCart = async (listing: MarketListing) => {
    try {
      await marketplaceService.addToCart(user!.id, listing.id, 1);
      Alert.alert('Success', 'Item added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const handleBuyNow = async (listing: MarketListing) => {
    try {
      const order = await marketplaceService.createOrder({
        buyerId: user!.id,
        sellerId: listing.sellerId,
        listingId: listing.id,
        quantity: 1,
        totalPrice: listing.price,
        currency: listing.currency,
        paymentMethod: {
          type: 'fiat' as const,
          method: 'stripe' as const,
          enabled: true,
        },
        shippingAddress: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          zipCode: '12345',
          country: 'US',
        },
        shippingOption: {
          id: 'standard',
          name: 'Standard Shipping',
          description: 'Standard delivery',
          price: 5.99,
          estimatedDays: 5,
          trackingAvailable: true,
        },
      });
      
      Alert.alert('Success', 'Order placed successfully!');
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to place order');
    }
  };

  const renderListingCard = (listing: MarketListing) => (
    <TouchableOpacity key={listing.id} style={styles.listingCard}>
      <Image source={{ uri: listing.images[0] }} style={styles.listingImage} />
      <View style={styles.listingContent}>
        <Text style={styles.listingTitle}>{listing.title}</Text>
        <Text style={styles.listingDescription} numberOfLines={2}>
          {listing.description}
        </Text>
        <View style={styles.listingMeta}>
          <Text style={styles.listingPrice}>${listing.price.toFixed(2)}</Text>
          <View style={styles.listingRating}>
            <Ionicons name="star" size={16} color={Colors.secondary[500]} />
            <Text style={styles.ratingText}>{listing.rating.toFixed(1)}</Text>
          </View>
        </View>
        <View style={styles.listingActions}>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => handleAddToCart(listing)}
          >
            <Ionicons name="cart-outline" size={20} color={Colors.primary[600]} />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buyNowButton}
            onPress={() => handleBuyNow(listing)}
          >
            <Text style={styles.buyNowText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {user?.userType === 'farmer' ? 'Farmers Market' : 'Marketplace'}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.cartButton}>
            <Ionicons name="cart-outline" size={24} color="white" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
          {user?.userType === 'farmer' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateListing(true)}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryItem,
              selectedCategory === category.key && styles.categoryItemActive
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <Ionicons
              name={category.icon as any}
              size={20}
              color={selectedCategory === category.key ? 'white' : Colors.gray[600]}
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === category.key && styles.categoryTextActive
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Listings */}
      <ScrollView
        style={styles.listingsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading marketplace...</Text>
          </View>
        ) : filteredListings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color={Colors.gray[400]} />
            <Text style={styles.emptyTitle}>No listings found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? 'Try adjusting your search' : 'Be the first to list an item!'}
            </Text>
          </View>
        ) : (
          <View style={styles.listingsGrid}>
            {filteredListings.map(renderListingCard)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: 'white',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartButton: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.status.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[700],
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryItemActive: {
    backgroundColor: Colors.primary[600],
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[600],
  },
  categoryTextActive: {
    color: 'white',
  },
  listingsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listingsGrid: {
    paddingBottom: 20,
  },
  listingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  listingImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.gray[200],
  },
  listingContent: {
    padding: 16,
  },
  listingTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[800],
    marginBottom: 4,
  },
  listingDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    lineHeight: 20,
    marginBottom: 12,
  },
  listingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listingPrice: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.primary[600],
  },
  listingRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[600],
  },
  listingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[50],
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary[600],
    gap: 8,
  },
  addToCartText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary[600],
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: Colors.primary[600],
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[700],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});