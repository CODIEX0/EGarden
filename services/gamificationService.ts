import { database } from '@/config/firebase';
import { ref, get, update, push } from 'firebase/database';
import { Badge, Achievement, UserProgress, DailyStreak, WeeklyGoal } from '@/types';
import { databaseService } from './databaseService';

export class GamificationService {
  private dbService = databaseService;

  // Badge System
  async checkAndAwardBadges(userId: string, action: string, data?: any): Promise<Badge[]> {
    try {
      const userProgress = await this.getUserProgress(userId);
      const newBadges: Badge[] = [];

      const badgeChecks = [
        () => this.checkFirstPlantBadge(userProgress),
        () => this.checkGreenThumbBadge(userProgress),
        () => this.checkDiseaseDetectiveBadge(userProgress),
        () => this.checkCommunityHelperBadge(userProgress),
        () => this.checkStreakMasterBadge(userProgress),
        () => this.checkTradingPioneerBadge(userProgress),
        () => this.checkPlantWhispererBadge(userProgress),
        () => this.checkEcoWarriorBadge(userProgress),
      ];

      for (const checkBadge of badgeChecks) {
        const badge = checkBadge();
        if (badge && !userProgress.achievements.includes(badge.id)) {
          newBadges.push(badge);
          await this.awardBadge(userId, badge);
        }
      }

      return newBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      return [];
    }
  }

  private checkFirstPlantBadge(userProgress: UserProgress): Badge | null {
    if (userProgress.plantsAdded >= 1) {
      return {
        id: 'first_plant',
        name: 'First Sprout',
        description: 'Added your first plant to the garden',
        icon: '🌱',
        category: 'planting',
        rarity: 'common',
        earnedAt: new Date(),
      };
    }
    return null;
  }

  private checkGreenThumbBadge(userProgress: UserProgress): Badge | null {
    if (userProgress.plantsAdded >= 10) {
      return {
        id: 'green_thumb',
        name: 'Green Thumb',
        description: 'Successfully managing 10 plants',
        icon: '👍',
        category: 'planting',
        rarity: 'rare',
        earnedAt: new Date(),
      };
    }
    return null;
  }

  private checkDiseaseDetectiveBadge(userProgress: UserProgress): Badge | null {
    if (userProgress.diseasesIdentified >= 5) {
      return {
        id: 'disease_detective',
        name: 'Disease Detective',
        description: 'Identified 5 plant diseases',
        icon: '🔍',
        category: 'learning',
        rarity: 'rare',
        earnedAt: new Date(),
      };
    }
    return null;
  }

  private checkCommunityHelperBadge(userProgress: UserProgress): Badge | null {
    if (userProgress.helpfulVotes >= 20) {
      return {
        id: 'community_helper',
        name: 'Community Helper',
        description: 'Received 20 helpful votes',
        icon: '🤝',
        category: 'community',
        rarity: 'epic',
        earnedAt: new Date(),
      };
    }
    return null;
  }

  private checkStreakMasterBadge(userProgress: UserProgress): Badge | null {
    if (userProgress.dayStreak >= 30) {
      return {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Maintained a 30-day care streak',
        icon: '🔥',
        category: 'care',
        rarity: 'legendary',
        earnedAt: new Date(),
      };
    }
    return null;
  }

  private checkTradingPioneerBadge(userProgress: UserProgress): Badge | null {
    // This would check marketplace activity - mock for now
    return null;
  }

  private checkPlantWhispererBadge(userProgress: UserProgress): Badge | null {
    if (userProgress.plantsAdded >= 50) {
      return {
        id: 'plant_whisperer',
        name: 'Plant Whisperer',
        description: 'Master gardener with 50+ plants',
        icon: '🌿',
        category: 'planting',
        rarity: 'legendary',
        earnedAt: new Date(),
      };
    }
    return null;
  }

  private checkEcoWarriorBadge(userProgress: UserProgress): Badge | null {
    if (userProgress.postsCreated >= 15 && userProgress.helpfulVotes >= 50) {
      return {
        id: 'eco_warrior',
        name: 'Eco Warrior',
        description: 'Active community member promoting sustainable gardening',
        icon: '🌍',
        category: 'community',
        rarity: 'legendary',
        earnedAt: new Date(),
      };
    }
    return null;
  }

  private async awardBadge(userId: string, badge: Badge): Promise<void> {
    try {
      const userRef = ref(database, `users/${userId}`);
      const userSnapshot = await get(userRef);
      
      if (userSnapshot.exists()) {
        const user = userSnapshot.val();
        const badges = user.badges || [];
        badges.push(badge);
        
        const points = this.getBadgePoints(badge.rarity);
        const newPoints = (user.points || 0) + points;
        const newLevel = this.calculateLevel(newPoints);
        
        await update(userRef, {
          badges,
          points: newPoints,
          level: newLevel,
        });

        // Update user progress
        const progressRef = ref(database, `userProgress/${userId}`);
        const progressSnapshot = await get(progressRef);
        
        if (progressSnapshot.exists()) {
          const progress = progressSnapshot.val();
          const achievements = progress.achievements || [];
          achievements.push(badge.id);
          
          await update(progressRef, {
            achievements,
            totalPoints: newPoints,
          });
        }
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  }

  private getBadgePoints(rarity: string): number {
    const points: Record<string, number> = {
      'common': 10,
      'rare': 25,
      'epic': 50,
      'legendary': 100,
    };
    return points[rarity] || 10;
  }

  private calculateLevel(points: number): number {
    // Level system: 0-99 points = Level 1, 100-299 = Level 2, etc.
    if (points < 100) return 1;
    if (points < 300) return 2;
    if (points < 600) return 3;
    if (points < 1000) return 4;
    if (points < 1500) return 5;
    if (points < 2100) return 6;
    if (points < 2800) return 7;
    if (points < 3600) return 8;
    if (points < 4500) return 9;
    return Math.min(20, Math.floor(points / 500) + 1); // Cap at level 20
  }

  // Daily Streaks
  async updateDailyStreak(userId: string, streakType: 'plant_care' | 'community' | 'learning'): Promise<DailyStreak> {
    try {
      const streakRef = ref(database, `dailyStreaks/${userId}_${streakType}`);
      const snapshot = await get(streakRef);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let streak: DailyStreak;
      
      if (snapshot.exists()) {
        streak = snapshot.val();
        const lastActivity = new Date(streak.lastActivity);
        lastActivity.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) {
          // Already updated today
          return streak;
        } else if (daysDiff === 1) {
          // Consecutive day
          streak.currentStreak++;
          streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
        } else {
          // Streak broken
          streak.currentStreak = 1;
        }
      } else {
        // New streak
        streak = {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivity: today,
          streakType,
        };
      }
      
      streak.lastActivity = today;
      await update(streakRef, streak);
      
      // Update user progress
      await this.updateUserProgress(userId, { dayStreak: streak.currentStreak });
      
      return streak;
    } catch (error) {
      console.error('Error updating daily streak:', error);
      throw error;
    }
  }

  // User Progress Tracking
  async getUserProgress(userId: string): Promise<UserProgress> {
    try {
      const progressRef = ref(database, `userProgress/${userId}`);
      const snapshot = await get(progressRef);
      
      if (snapshot.exists()) {
        const progress = snapshot.val();
        return {
          ...progress,
          lastActive: new Date(progress.lastActive),
          weeklyGoals: progress.weeklyGoals?.map((goal: any) => ({
            ...goal,
            deadline: new Date(goal.deadline),
          })) || [],
        };
      } else {
        // Initialize new user progress
        const newProgress: UserProgress = {
          userId,
          plantsAdded: 0,
          diseasesIdentified: 0,
          postsCreated: 0,
          helpfulVotes: 0,
          dayStreak: 0,
          lastActive: new Date(),
          achievements: [],
          totalPoints: 0,
          weeklyGoals: this.generateWeeklyGoals(),
        };
        
        await update(progressRef, newProgress);
        return newProgress;
      }
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  async updateUserProgress(userId: string, updates: Partial<UserProgress>): Promise<void> {
    try {
      const progressRef = ref(database, `userProgress/${userId}`);
      await update(progressRef, {
        ...updates,
        lastActive: new Date(),
      });
    } catch (error) {
      console.error('Error updating user progress:', error);
    }
  }

  // Weekly Goals System
  private generateWeeklyGoals(): WeeklyGoal[] {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    return [
      {
        id: 'water_plants',
        type: 'water_plants',
        title: 'Plant Caretaker',
        description: 'Water your plants 10 times this week',
        icon: 'water-outline',
        target: 10,
        current: 0,
        currentProgress: 0,
        targetValue: 10,
        reward: 20,
        deadline: endOfWeek,
        completed: false,
        unit: 'times',
      },
      {
        id: 'add_plants',
        type: 'add_plants',
        title: 'Garden Expander',
        description: 'Add 2 new plants to your garden',
        icon: 'add-circle-outline',
        target: 2,
        current: 0,
        currentProgress: 0,
        targetValue: 2,
        reward: 30,
        deadline: endOfWeek,
        completed: false,
        unit: 'plants',
      },
      {
        id: 'community_engagement',
        type: 'community_engagement',
        title: 'Community Helper',
        description: 'Engage with the community 5 times',
        icon: 'people-outline',
        target: 5,
        current: 0,
        currentProgress: 0,
        targetValue: 5,
        reward: 25,
        deadline: endOfWeek,
        completed: false,
        unit: 'interactions',
      },
    ];
  }

  async updateWeeklyGoal(userId: string, goalType: WeeklyGoal['type'], increment: number = 1): Promise<void> {
    try {
      const progress = await this.getUserProgress(userId);
      const goal = progress.weeklyGoals.find(g => g.type === goalType);
      
      if (goal && goal.current < goal.target) {
        goal.current += increment;
        
        // Check if goal is completed
        if (goal.current >= goal.target) {
          await this.completeWeeklyGoal(userId, goal);
        }
        
        await this.updateUserProgress(userId, { weeklyGoals: progress.weeklyGoals });
      }
    } catch (error) {
      console.error('Error updating weekly goal:', error);
    }
  }

  private async completeWeeklyGoal(userId: string, goal: WeeklyGoal): Promise<void> {
    try {
      // Award points for completing goal
      const userRef = ref(database, `users/${userId}`);
      const userSnapshot = await get(userRef);
      
      if (userSnapshot.exists()) {
        const user = userSnapshot.val();
        const newPoints = (user.points || 0) + goal.reward;
        const newLevel = this.calculateLevel(newPoints);
        
        await update(userRef, {
          points: newPoints,
          level: newLevel,
        });
      }
    } catch (error) {
      console.error('Error completing weekly goal:', error);
    }
  }

  // Achievement System
  async getAvailableAchievements(): Promise<Achievement[]> {
    return [
      {
        id: 'first_plant',
        name: 'First Sprout',
        title: 'First Sprout',
        description: 'Add your first plant to the garden',
        icon: '🌱',
        category: 'planting',
        points: 10,
        rarity: 'common',
        requirements: [
          { type: 'plant_count', target: 1, current: 0 }
        ],
        currentProgress: 0,
        targetValue: 1,
      },
      {
        id: 'green_thumb',
        name: 'Green Thumb',
        title: 'Green Thumb',
        description: 'Successfully manage 10 plants',
        icon: '👍',
        category: 'planting',
        points: 25,
        rarity: 'rare',
        requirements: [
          { type: 'plant_count', target: 10, current: 0 }
        ],
        currentProgress: 0,
        targetValue: 10,
      },
      {
        id: 'disease_detective',
        name: 'Disease Detective',
        title: 'Disease Detective',
        description: 'Identify 5 plant diseases',
        icon: '🔍',
        category: 'learning',
        points: 30,
        rarity: 'rare',
        requirements: [
          { type: 'disease_identified', target: 5, current: 0 }
        ],
        currentProgress: 0,
        targetValue: 5,
      },
      {
        id: 'community_helper',
        name: 'Community Helper',
        title: 'Community Helper',
        description: 'Receive 20 helpful votes',
        icon: '🤝',
        category: 'community',
        points: 50,
        rarity: 'epic',
        requirements: [
          { type: 'helpful_votes', target: 20, current: 0 }
        ],
        currentProgress: 0,
        targetValue: 20,
      },
      {
        id: 'streak_master',
        name: 'Streak Master',
        title: 'Streak Master',
        description: 'Maintain a 30-day care streak',
        icon: '🔥',
        category: 'care',
        points: 100,
        rarity: 'legendary',
        requirements: [
          { type: 'streak_days', target: 30, current: 0 }
        ],
        currentProgress: 0,
        targetValue: 30,
      },
    ];
  }

  // Leaderboard
  async getLeaderboard(type: 'points' | 'plants' | 'streak' = 'points', limit: number = 20): Promise<any[]> {
    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const users = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }));

        // Sort based on type
        let sortedUsers;
        switch (type) {
          case 'plants':
            // Would need to count plants per user
            sortedUsers = users.sort((a, b) => (b.plantsCount || 0) - (a.plantsCount || 0));
            break;
          case 'streak':
            // Would need to get streak data
            sortedUsers = users.sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0));
            break;
          default:
            sortedUsers = users.sort((a, b) => (b.points || 0) - (a.points || 0));
        }

        return sortedUsers.slice(0, limit).map((user, index) => ({
          rank: index + 1,
          id: user.id,
          name: user.name,
          points: user.points || 0,
          level: user.level || 1,
          badges: user.badges || [],
          profilePicture: user.profilePicture,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  // Activity tracking
  async trackActivity(userId: string, activity: {
    type: 'plant_added' | 'watered' | 'fertilized' | 'disease_detected' | 'post_created' | 'helpful_vote';
    data?: any;
  }): Promise<void> {
    try {
      // Update relevant progress counters
      const updates: Partial<UserProgress> = {};
      
      switch (activity.type) {
        case 'plant_added':
          updates.plantsAdded = (await this.getUserProgress(userId)).plantsAdded + 1;
          await this.updateWeeklyGoal(userId, 'add_plants');
          break;
        case 'watered':
          await this.updateWeeklyGoal(userId, 'water_plants');
          break;
        case 'disease_detected':
          updates.diseasesIdentified = (await this.getUserProgress(userId)).diseasesIdentified + 1;
          await this.updateWeeklyGoal(userId, 'disease_identification');
          break;
        case 'post_created':
          updates.postsCreated = (await this.getUserProgress(userId)).postsCreated + 1;
          await this.updateWeeklyGoal(userId, 'community_engagement');
          break;
        case 'helpful_vote':
          updates.helpfulVotes = (await this.getUserProgress(userId)).helpfulVotes + 1;
          break;
      }
      
      if (Object.keys(updates).length > 0) {
        await this.updateUserProgress(userId, updates);
      }
      
      // Update daily streak for relevant activities
      if (['plant_added', 'watered', 'fertilized'].includes(activity.type)) {
        await this.updateDailyStreak(userId, 'plant_care');
      } else if (['post_created', 'helpful_vote'].includes(activity.type)) {
        await this.updateDailyStreak(userId, 'community');
      } else if (activity.type === 'disease_detected') {
        await this.updateDailyStreak(userId, 'learning');
      }
      
      // Check for new badges
      await this.checkAndAwardBadges(userId, activity.type, activity.data);
      
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  // Missing method implementations
  async getUserBadges(userId: string): Promise<Badge[]> {
    try {
      const userProgress = await this.getUserProgress(userId);
      const badges: Badge[] = [];
      
      for (const badgeId of userProgress.achievements) {
        const badge = await this.getBadgeById(badgeId);
        if (badge) {
          badges.push(badge);
        }
      }
      
      return badges;
    } catch (error) {
      console.error('Error getting user badges:', error);
      return [];
    }
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const userProgress = await this.getUserProgress(userId);
      const achievements: Achievement[] = [];
      
      // Generate sample achievements based on user progress
      achievements.push({
        id: 'plant_master',
        name: 'Plant Master',
        title: 'Plant Master',
        description: 'Add 10 plants to your garden',
        icon: '🌿',
        category: 'planting',
        points: 100,
        rarity: 'common',
        requirements: [],
        currentProgress: userProgress.plantsAdded,
        targetValue: 10,
        unlockedAt: userProgress.plantsAdded >= 10 ? new Date() : undefined,
      });

      achievements.push({
        id: 'community_helper',
        name: 'Community Helper',
        title: 'Community Helper',
        description: 'Help other gardeners with advice',
        icon: '🤝',
        category: 'community',
        points: 50,
        rarity: 'common',
        requirements: [],
        currentProgress: userProgress.helpfulVotes,
        targetValue: 5,
        unlockedAt: userProgress.helpfulVotes >= 5 ? new Date() : undefined,
      });

      return achievements;
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  async getWeeklyGoals(userId: string): Promise<WeeklyGoal[]> {
    try {
      const userProgress = await this.getUserProgress(userId);
      const currentDate = new Date();
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(currentDate.getDate() + (7 - currentDate.getDay()));
      
      const goals: WeeklyGoal[] = [
        {
          id: 'water_plants_weekly',
          type: 'water_plants',
          title: 'Watering Champion',
          description: 'Water your plants 7 times this week',
          icon: '💧',
          target: 7,
          current: Math.min(userProgress.plantsAdded * 2, 7), // Estimate based on plants
          currentProgress: Math.min(userProgress.plantsAdded * 2, 7),
          targetValue: 7,
          reward: 50,
          deadline: weekEnd,
          completed: userProgress.plantsAdded * 2 >= 7,
          unit: 'times',
        },
        {
          id: 'community_engagement',
          type: 'community_engagement',
          title: 'Social Gardener',
          description: 'Create 3 posts or comments this week',
          icon: '💬',
          target: 3,
          current: userProgress.postsCreated,
          currentProgress: userProgress.postsCreated,
          targetValue: 3,
          reward: 30,
          deadline: weekEnd,
          completed: userProgress.postsCreated >= 3,
          unit: 'posts',
        },
      ];
      
      return goals;
    } catch (error) {
      console.error('Error getting weekly goals:', error);
      return [];
    }
  }

  async getDailyStreak(userId: string): Promise<DailyStreak> {
    try {
      const userProgress = await this.getUserProgress(userId);
      
      return {
        userId,
        currentStreak: userProgress.dayStreak,
        longestStreak: userProgress.dayStreak, // Simplified for now
        lastActivity: userProgress.lastActive,
        streakType: 'plant_care',
      };
    } catch (error) {
      console.error('Error getting daily streak:', error);
      return {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivity: new Date(),
        streakType: 'plant_care',
      };
    }
  }

  async addPoints(userId: string, points: number, reason?: string): Promise<void> {
    try {
      const userProgress = await this.getUserProgress(userId);
      userProgress.totalPoints += points;
      
      await this.dbService.update(`userProgress/${userId}`, {
        totalPoints: userProgress.totalPoints,
        lastActive: new Date().toISOString(),
      });

      console.log(`Added ${points} points to user ${userId} for: ${reason || 'Unknown reason'}`);
    } catch (error) {
      console.error('Error adding points:', error);
    }
  }

  private async getBadgeById(badgeId: string): Promise<Badge | null> {
    try {
      const badge = await this.dbService.getDocument(`badges/${badgeId}`);
      return badge as Badge || null;
    } catch (error) {
      console.error('Error getting badge by ID:', error);
      return null;
    }
  }
}

export const gamificationService = new GamificationService();
