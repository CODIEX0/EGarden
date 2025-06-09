import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Dimensions, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { usePlants } from '@/context/PlantContext';
import Button from '@/components/Button';
import PlantCard from '@/components/PlantCard';
import StatsCard from '@/components/StatsCard';
import GardenLayout from '@/components/GardenLayout';
import { Plus, Camera, Bell, Droplets, Sun, Bug, Cloud, Thermometer, Wifi, WifiOff, RefreshCw, Search } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function GardenScreen() {
  const { user } = useAuth();
  const { plants, loading, isOnline, syncData } = usePlants();
  const [activeFilter, setActiveFilter] = useState<'all' | 'healthy' | 'attention'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'garden'>('garden');
  const router = useRouter();

  const filteredPlants = plants.filter(plant => {
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'healthy' && plant.healthStatus === 'healthy') ||
      (activeFilter === 'attention' && plant.healthStatus !== 'healthy');
    
    const matchesSearch = !searchQuery || 
      plant.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plant.scientificName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: plants.length,
    healthy: plants.filter(p => p.healthStatus === 'healthy').length,
    needsAttention: plants.filter(p => p.healthStatus !== 'healthy').length,
    dueWatering: plants.filter(p => {
      if (!p.lastWatered) return true;
      const daysSinceWatered = Math.floor((new Date().getTime() - p.lastWatered.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceWatered >= p.wateringFrequency;
    }).length,
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncData();
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const renderGardenView = () => {
    if (filteredPlants.length === 0) {
      return (
        <View style={styles.emptyGarden}>
          <View style={styles.gardenSoil}>
            <Text style={styles.soilTexture}>🌱</Text>
            <Text style={styles.emptyGardenText}>Your garden is ready for planting!</Text>
            <Text style={styles.emptyGardenSubtext}>Add your first plant to start growing</Text>
            <Button
              title="Add First Plant"
              onPress={() => router.push('/plant/add')}
              icon={Plus}
              style={styles.addFirstPlantButton}
            />
          </View>
        </View>
      );
    }

    return (
      <GardenLayout 
        plants={filteredPlants}
        onPlantPress={(plant) => router.push(`/plant/${plant.id}`)}
        onAddPlant={() => router.push('/plant/add')}
      />
    );
  };

  const renderGridView = () => {
    if (filteredPlants.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No plants found</Text>
          <Button
            title="Add Plant"
            onPress={() => router.push('/plant/add')}
            icon={Plus}
            style={styles.addButton}
          />
        </View>
      );
    }

    return (
      <View style={styles.gridContainer}>
        {filteredPlants.map((plant) => (
          <View key={plant.id} style={styles.gridItem}>
            <PlantCard
              plant={plant}
              onPress={() => router.push(`/plant/${plant.id}`)}
            />
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[Colors.primary[500], Colors.primary[600]]} style={styles.header}>
        <Animated.View entering={FadeInUp.delay(200)} style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{user?.name || 'Gardener'}! 🌱</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.connectionStatus}>
              {isOnline ? (
                <Wifi size={16} color="rgba(255, 255, 255, 0.8)" />
              ) : (
                <WifiOff size={16} color="rgba(255, 255, 255, 0.6)" />
              )}
              <Text style={[styles.connectionText, !isOnline && styles.offlineText]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <Pressable 
              style={styles.headerButton}
              onPress={() => router.push('/weather')}
            >
              <Cloud size={20} color="white" />
            </Pressable>
            <Pressable style={styles.notificationButton}>
              <Bell size={24} color="white" />
              {stats.dueWatering > 0 && <View style={styles.notificationBadge} />}
            </Pressable>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary[500]]}
            tintColor={Colors.primary[500]}
          />
        }
      >
        <Animated.View entering={FadeInDown.delay(300)} style={styles.statsContainer}>
          <StatsCard
            title="Total Plants"
            value={stats.total}
            icon={Sun}
            color={Colors.primary[500]}
            subtitle="in your garden"
          />
          <StatsCard
            title="Healthy"
            value={stats.healthy}
            icon={Sun}
            color={Colors.status.success}
            subtitle="growing well"
          />
          <StatsCard
            title="Attention"
            value={stats.needsAttention}
            icon={Bug}
            color={Colors.status.warning}
            subtitle="need care"
          />
          <StatsCard
            title="Water Due"
            value={stats.dueWatering}
            icon={Droplets}
            color={Colors.status.info}
            subtitle="plants thirsty"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.actionContainer}>
          <Button
            title="Add New Plant"
            onPress={() => router.push('/plant/add')}
            icon={Plus}
            style={styles.addButton}
          />
          <Button
            title="Plant ID"
            onPress={() => router.push('/plant/identify')}
            icon={Camera}
            variant="outline"
            style={styles.identifyButton}
          />
        </Animated.View>

        {!isOnline && (
          <Animated.View entering={FadeInDown.delay(450)} style={styles.offlineNotice}>
            <WifiOff size={20} color={Colors.status.warning} />
            <Text style={styles.offlineNoticeText}>
              You're offline. Changes will sync when connection is restored.
            </Text>
            <Pressable onPress={handleRefresh} style={styles.retryButton}>
              <RefreshCw size={16} color={Colors.primary[600]} />
            </Pressable>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(500)} style={styles.filterContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Garden</Text>
            <View style={styles.viewToggle}>
              <Pressable
                style={[styles.toggleButton, viewMode === 'garden' && styles.activeToggle]}
                onPress={() => setViewMode('garden')}
              >
                <Text style={[styles.toggleText, viewMode === 'garden' && styles.activeToggleText]}>
                  Garden
                </Text>
              </Pressable>
              <Pressable
                style={[styles.toggleButton, viewMode === 'grid' && styles.activeToggle]}
                onPress={() => setViewMode('grid')}
              >
                <Text style={[styles.toggleText, viewMode === 'grid' && styles.activeToggleText]}>
                  Grid
                </Text>
              </Pressable>
            </View>
          </View>
          
          <View style={styles.filterButtons}>
            {[
              { key: 'all', label: 'All' },
              { key: 'healthy', label: 'Healthy' },
              { key: 'attention', label: 'Needs Attention' },
            ].map((filter) => (
              <Pressable
                key={filter.key}
                style={[
                  styles.filterButton,
                  activeFilter === filter.key && styles.activeFilterButton,
                ]}
                onPress={() => setActiveFilter(filter.key as any)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    activeFilter === filter.key && styles.activeFilterButtonText,
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600)} style={styles.gardenSection}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your garden...</Text>
            </View>
          ) : (
            viewMode === 'garden' ? renderGardenView() : renderGridView()
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700)} style={styles.weatherWidget}>
          <Pressable 
            style={styles.weatherCard}
            onPress={() => router.push('/weather')}
          >
            <View style={styles.weatherHeader}>
              <Thermometer size={20} color={Colors.secondary[600]} />
              <Text style={styles.weatherTitle}>Growing Conditions</Text>
            </View>
            <Text style={styles.weatherDescription}>
              Tap to view detailed weather and growing conditions for your plants
            </Text>
          </Pressable>
        </Animated.View>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: 'white',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  connectionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  offlineText: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.status.error,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: -40,
    marginBottom: 24,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  addButton: {
    flex: 1,
  },
  identifyButton: {
    flex: 1,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.status.warning + '20',
    borderWidth: 1,
    borderColor: Colors.status.warning + '40',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  offlineNoticeText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.status.warning,
  },
  retryButton: {
    padding: 4,
  },
  filterContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[200],
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: Colors.primary[500],
  },
  toggleText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[600],
  },
  activeToggleText: {
    color: 'white',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray[200],
  },
  activeFilterButton: {
    backgroundColor: Colors.primary[500],
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[700],
  },
  activeFilterButtonText: {
    color: 'white',
  },
  gardenSection: {
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
  },
  emptyGarden: {
    backgroundColor: Colors.earth[100],
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  gardenSoil: {
    alignItems: 'center',
  },
  soilTexture: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyGardenText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[700],
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyGardenSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
    textAlign: 'center',
    marginBottom: 20,
  },
  addFirstPlantButton: {
    marginTop: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: (width - 52) / 2, // Account for padding and gap
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    marginBottom: 16,
  },
  weatherWidget: {
    marginBottom: 40,
  },
  weatherCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  weatherTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
  },
  weatherDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    lineHeight: 20,
  },
});