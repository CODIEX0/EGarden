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
import { DonationItem, DonationCategory } from '@/types';
import { communityService } from '@/services/communityService';

export default function DonationsScreen() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<DonationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DonationCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateDonation, setShowCreateDonation] = useState(false);

  const categories: Array<{ key: DonationCategory | 'all'; label: string; icon: string }> = [
    { key: 'all', label: 'All', icon: 'grid-outline' },
    { key: 'produce', label: 'Produce', icon: 'leaf-outline' },
    { key: 'tools', label: 'Tools', icon: 'construct-outline' },
    { key: 'seeds', label: 'Seeds', icon: 'flower-outline' },
    { key: 'fertilizer', label: 'Fertilizer', icon: 'flask-outline' },
    { key: 'containers', label: 'Containers', icon: 'cube-outline' },
    { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
  ];

  useEffect(() => {
    loadDonations();
  }, []);

  useEffect(() => {
    filterDonations();
  }, [donations, searchQuery, selectedCategory]);

  const loadDonations = async () => {
    try {
      setLoading(true);
      const data = await communityService.getDonations({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        search: searchQuery,
        location: user?.location,
        radius: 25,
      });
      setDonations(data);
    } catch (error) {
      console.error('Error loading donations:', error);
      Alert.alert('Error', 'Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  const filterDonations = () => {
    let filtered = donations;

    if (searchQuery) {
      filtered = filtered.filter(donation =>
        donation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        donation.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(donation => donation.category === selectedCategory);
    }

    setFilteredDonations(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDonations();
    setRefreshing(false);
  };

  const handleRequestDonation = async (donation: DonationItem) => {
    try {
      await communityService.requestDonation(user!.id, donation.id, 'Hi, I would like to request this donation. When can I pick it up?');
      Alert.alert('Success', 'Request sent to donor');
    } catch (error) {
      console.error('Error requesting donation:', error);
      Alert.alert('Error', 'Failed to send request');
    }
  };

  const handleMarkCompleted = async (donation: DonationItem) => {
    try {
      await communityService.markDonationCompleted(donation.id);
      Alert.alert('Success', 'Donation marked as completed');
      loadDonations();
    } catch (error) {
      console.error('Error marking donation completed:', error);
      Alert.alert('Error', 'Failed to mark as completed');
    }
  };

  const getStatusColor = (status: DonationItem['status']) => {
    switch (status) {
      case 'available': return Colors.status.success;
      case 'pending': return Colors.secondary[500];
      case 'completed': return Colors.gray[500];
      default: return Colors.gray[400];
    }
  };

  const getStatusText = (status: DonationItem['status']) => {
    switch (status) {
      case 'available': return 'Available';
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const renderDonationCard = (donation: DonationItem) => (
    <TouchableOpacity key={donation.id} style={styles.donationCard}>
      <Image source={{ uri: donation.images[0] }} style={styles.donationImage} />
      <View style={styles.donationContent}>
        <View style={styles.donationHeader}>
          <Text style={styles.donationTitle}>{donation.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(donation.status) }]}>
            <Text style={styles.statusText}>{getStatusText(donation.status)}</Text>
          </View>
        </View>
        <Text style={styles.donationDescription} numberOfLines={2}>
          {donation.description}
        </Text>
        <View style={styles.donationMeta}>
          <View style={styles.donorInfo}>
            <Ionicons name="person-outline" size={16} color={Colors.gray[500]} />
            <Text style={styles.donorName}>{donation.donorName}</Text>
          </View>
          <View style={styles.locationInfo}>
            <Ionicons name="location-outline" size={16} color={Colors.gray[500]} />
            <Text style={styles.locationText}>{donation.location}</Text>
          </View>
        </View>
        <View style={styles.donationActions}>
          {donation.status === 'available' && donation.donorId !== user?.id && (
            <TouchableOpacity
              style={styles.requestButton}
              onPress={() => handleRequestDonation(donation)}
            >
              <Ionicons name="hand-right-outline" size={20} color={Colors.primary[600]} />
              <Text style={styles.requestText}>Request</Text>
            </TouchableOpacity>
          )}
          {donation.donorId === user?.id && donation.status === 'pending' && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => handleMarkCompleted(donation)}
            >
              <Ionicons name="checkmark-outline" size={20} color="white" />
              <Text style={styles.completeText}>Mark Complete</Text>
            </TouchableOpacity>
          )}
          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>
              Posted {new Date(donation.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Donation Hub</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateDonation(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search donations..."
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

      {/* Donations */}
      <ScrollView
        style={styles.donationsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading donations...</Text>
          </View>
        ) : filteredDonations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={Colors.gray[400]} />
            <Text style={styles.emptyTitle}>No donations found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? 'Try adjusting your search' : 'Be the first to donate something!'}
            </Text>
          </View>
        ) : (
          <View style={styles.donationsGrid}>
            {filteredDonations.map(renderDonationCard)}
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
    backgroundColor: Colors.earth[500],
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
    backgroundColor: Colors.earth[500],
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
  donationsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  donationsGrid: {
    paddingBottom: 20,
  },
  donationCard: {
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
  donationImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.gray[200],
  },
  donationContent: {
    padding: 16,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  donationTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[800],
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  donationDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    lineHeight: 20,
    marginBottom: 12,
  },
  donationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  donorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  donorName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[600],
    marginLeft: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[600],
    marginLeft: 4,
  },
  donationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary[600],
    gap: 8,
  },
  requestText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary[600],
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.status.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  completeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  timeInfo: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
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