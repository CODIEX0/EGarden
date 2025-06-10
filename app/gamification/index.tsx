import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Badge, Achievement, WeeklyGoal, DailyStreak } from '@/types';
import { gamificationService } from '@/services/gamificationService';

const { width } = Dimensions.get('window');

export default function GamificationScreen() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [dailyStreak, setDailyStreak] = useState<DailyStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'badges' | 'achievements' | 'goals'>('badges');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [badgesData, achievementsData, goalsData, streakData] = await Promise.all([
        gamificationService.getUserBadges(user!.id),
        gamificationService.getUserAchievements(user!.id),
        gamificationService.getWeeklyGoals(user!.id),
        gamificationService.getDailyStreak(user!.id),
      ]);
      
      setBadges(badgesData);
      setAchievements(achievementsData);
      setWeeklyGoals(goalsData);
      setDailyStreak(streakData);
    } catch (error) {
      console.error('Error loading gamification data:', error);
      Alert.alert('Error', 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getBadgeRarityColor = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common': return Colors.badge.common;
      case 'rare': return Colors.badge.rare;
      case 'epic': return Colors.badge.epic;
      case 'legendary': return Colors.badge.legendary;
      default: return Colors.gray[400];
    }
  };

  const renderBadgeCard = (badge: Badge) => (
    <TouchableOpacity key={badge.id} style={styles.badgeCard}>
      <LinearGradient
        colors={[getBadgeRarityColor(badge.rarity), `${getBadgeRarityColor(badge.rarity)}80`]}
        style={styles.badgeGradient}
      >
        <Text style={styles.badgeIcon}>{badge.icon}</Text>
        <Text style={styles.badgeName}>{badge.name}</Text>
        <Text style={styles.badgeDescription} numberOfLines={2}>
          {badge.description}
        </Text>
        <View style={styles.badgeRarity}>
          <Text style={styles.badgeRarityText}>{badge.rarity.toUpperCase()}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderAchievementCard = (achievement: Achievement) => (
    <View key={achievement.id} style={styles.achievementCard}>
      <View style={styles.achievementHeader}>
        <Text style={styles.achievementIcon}>{achievement.icon}</Text>
        <View style={styles.achievementInfo}>
          <Text style={styles.achievementTitle}>{achievement.title}</Text>
          <Text style={styles.achievementDescription}>{achievement.description}</Text>
        </View>
        <View style={styles.achievementPoints}>
          <Text style={styles.pointsText}>{achievement.points}pts</Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(achievement.currentProgress / achievement.targetValue) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {achievement.currentProgress} / {achievement.targetValue}
        </Text>
      </View>
    </View>
  );

  const renderWeeklyGoal = (goal: WeeklyGoal) => (
    <View key={goal.id} style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <Ionicons name={goal.icon as any} size={24} color={Colors.primary[600]} />
        <View style={styles.goalInfo}>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          <Text style={styles.goalDescription}>{goal.description}</Text>
        </View>
        <View style={styles.goalReward}>
          <Text style={styles.rewardText}>+{goal.reward}pts</Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min((goal.currentProgress / goal.targetValue) * 100, 100)}%`,
                backgroundColor: goal.completed ? Colors.status.success : Colors.primary[500]
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {goal.currentProgress} / {goal.targetValue} {goal.unit}
        </Text>
      </View>
      
      {goal.completed && (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.status.success} />
          <Text style={styles.completedText}>Completed!</Text>
        </View>
      )}
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{user?.level || 1}</Text>
        <Text style={styles.statLabel}>Level</Text>
      </View>
      
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{user?.points || 0}</Text>
        <Text style={styles.statLabel}>Points</Text>
      </View>
      
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{badges.length}</Text>
        <Text style={styles.statLabel}>Badges</Text>
      </View>
      
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{dailyStreak?.currentStreak || 0}</Text>
        <Text style={styles.statLabel}>Day Streak</Text>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'badges':
        return (
          <View style={styles.badgesGrid}>
            {badges.map(renderBadgeCard)}
          </View>
        );
      case 'achievements':
        return (
          <View style={styles.achievementsContainer}>
            {achievements.map(renderAchievementCard)}
          </View>
        );
      case 'goals':
        return (
          <View style={styles.goalsContainer}>
            {weeklyGoals.map(renderWeeklyGoal)}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[Colors.primary[500], Colors.primary[700]]} style={styles.header}>
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>Level up your gardening skills!</Text>
        {renderStats()}
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'badges' && styles.activeTab]}
          onPress={() => setSelectedTab('badges')}
        >
          <Ionicons name="medal-outline" size={20} color={selectedTab === 'badges' ? 'white' : Colors.gray[600]} />
          <Text style={[styles.tabText, selectedTab === 'badges' && styles.activeTabText]}>
            Badges
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'achievements' && styles.activeTab]}
          onPress={() => setSelectedTab('achievements')}
        >
          <Ionicons name="trophy-outline" size={20} color={selectedTab === 'achievements' ? 'white' : Colors.gray[600]} />
          <Text style={[styles.tabText, selectedTab === 'achievements' && styles.activeTabText]}>
            Achievements
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'goals' && styles.activeTab]}
          onPress={() => setSelectedTab('goals')}
        >
          <Ionicons name="target-outline" size={20} color={selectedTab === 'goals' ? 'white' : Colors.gray[600]} />
          <Text style={[styles.tabText, selectedTab === 'goals' && styles.activeTabText]}>
            Goals
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading progress...</Text>
          </View>
        ) : (
          renderTabContent()
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: width * 0.2,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -10,
    borderRadius: 12,
    padding: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: Colors.primary[600],
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[600],
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  badgeCard: {
    width: width * 0.42,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  badgeGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 140,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
  },
  badgeRarity: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeRarityText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  achievementsContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  achievementCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[800],
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
  },
  achievementPoints: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: Colors.primary[600],
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[600],
  },
  goalsContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[800],
    marginBottom: 2,
  },
  goalDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
  },
  goalReward: {
    backgroundColor: Colors.secondary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rewardText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: Colors.secondary[600],
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: Colors.status.success,
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
});
