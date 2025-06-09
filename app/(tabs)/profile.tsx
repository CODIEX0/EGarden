import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { usePlants } from '@/context/PlantContext';
import Button from '@/components/Button';
import StatsCard from '@/components/StatsCard';
import { 
  User, 
  MapPin, 
  Calendar, 
  Award, 
  Settings, 
  LogOut, 
  Leaf, 
  Target, 
  TrendingUp,
  Star,
  Download,
  Upload,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { plants, isOnline, exportData, importData, syncData } = usePlants();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/auth/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const data = await exportData();
      const jsonString = JSON.stringify(data, null, 2);
      
      await Share.share({
        message: jsonString,
        title: 'eGarden Data Export',
      });
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export data');
    }
  };

  const handleSyncData = async () => {
    try {
      await syncData();
      Alert.alert('Success', 'Data synced successfully!');
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync data. Please try again.');
    }
  };

  const stats = {
    totalPlants: plants.length,
    healthyPlants: plants.filter(p => p.healthStatus === 'healthy').length,
    level: user?.level || 1,
    points: user?.points || 0,
  };

  const achievements = [
    { name: 'First Plant', icon: '🌱', earned: plants.length > 0 },
    { name: 'Green Thumb', icon: '👍', earned: plants.length >= 5 },
    { name: 'Plant Parent', icon: '🌿', earned: plants.length >= 10 },
    { name: 'Garden Master', icon: '🏆', earned: plants.length >= 25 },
  ];

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Animated.View entering={FadeInDown.delay(200)} style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.userMeta}>
                <View style={styles.metaItem}>
                  <MapPin size={14} color={Colors.gray[600]} />
                  <Text style={styles.metaText}>{user.location}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Calendar size={14} color={Colors.gray[600]} />
                  <Text style={styles.metaText}>
                    Joined {user.joinDate.toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300)} style={styles.levelCard}>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Level {user.level}</Text>
              <Text style={styles.experienceText}>
                {user.experienceLevel.charAt(0).toUpperCase() + user.experienceLevel.slice(1)} Gardener
              </Text>
            </View>
            <View style={styles.pointsInfo}>
              <Star size={20} color={Colors.secondary[500]} />
              <Text style={styles.pointsText}>{user.points} pts</Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(400)} style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Garden Stats</Text>
            <View style={styles.statsRow}>
              <StatsCard
                title="Total Plants"
                value={stats.totalPlants}
                icon={Leaf}
                color={Colors.primary[500]}
                subtitle="in garden"
              />
              <StatsCard
                title="Healthy"
                value={stats.healthyPlants}
                icon={Target}
                color={Colors.status.success}
                subtitle="thriving"
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500)} style={styles.achievementsContainer}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement, index) => (
                <View 
                  key={achievement.name}
                  style={[
                    styles.achievementCard,
                    achievement.earned && styles.achievementEarned
                  ]}
                >
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <Text style={[
                    styles.achievementName,
                    achievement.earned && styles.achievementNameEarned
                  ]}>
                    {achievement.name}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600)} style={styles.dataContainer}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            <View style={styles.dataCard}>
              <View style={styles.connectionStatus}>
                {isOnline ? (
                  <Wifi size={20} color={Colors.status.success} />
                ) : (
                  <WifiOff size={20} color={Colors.status.error} />
                )}
                <Text style={[
                  styles.connectionText,
                  { color: isOnline ? Colors.status.success : Colors.status.error }
                ]}>
                  {isOnline ? 'Online - Data syncing' : 'Offline - Local storage only'}
                </Text>
              </View>
              
              <View style={styles.dataActions}>
                <Button
                  title="Sync Data"
                  onPress={handleSyncData}
                  icon={Database}
                  variant="outline"
                  style={styles.dataButton}
                  disabled={!isOnline}
                />
                <Button
                  title="Export Data"
                  onPress={handleExportData}
                  icon={Download}
                  variant="outline"
                  style={styles.dataButton}
                />
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700)} style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.actionsList}>
              <Pressable 
                style={styles.actionItem}
                onPress={() => router.push('/settings/notifications')}
              >
                <Settings size={20} color={Colors.gray[600]} />
                <Text style={styles.actionText}>Notification Settings</Text>
              </Pressable>

              <Pressable 
                style={styles.actionItem}
                onPress={() => router.push('/settings/security')}
              >
                <Settings size={20} color={Colors.gray[600]} />
                <Text style={styles.actionText}>Security Settings</Text>
              </Pressable>

              <Pressable 
                style={styles.actionItem}
                onPress={() => router.push('/settings/language')}
              >
                <Settings size={20} color={Colors.gray[600]} />
                <Text style={styles.actionText}>Language Settings</Text>
              </Pressable>
              
              <Pressable style={styles.actionItem} onPress={handleLogout}>
                <LogOut size={20} color={Colors.status.error} />
                <Text style={[styles.actionText, { color: Colors.status.error }]}>
                  Sign Out
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
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
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  userMeta: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  levelCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    marginBottom: 2,
  },
  experienceText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  content: {
    padding: 20,
    marginTop: -20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  achievementsContainer: {
    marginBottom: 32,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '47%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    opacity: 0.5,
  },
  achievementEarned: {
    opacity: 1,
    backgroundColor: Colors.secondary[50],
    borderWidth: 1,
    borderColor: Colors.secondary[200],
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[600],
    textAlign: 'center',
  },
  achievementNameEarned: {
    color: Colors.secondary[700],
  },
  dataContainer: {
    marginBottom: 32,
  },
  dataCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  connectionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  dataActions: {
    flexDirection: 'row',
    gap: 12,
  },
  dataButton: {
    flex: 1,
  },
  actionsContainer: {
    marginBottom: 40,
  },
  actionsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[700],
  },
});