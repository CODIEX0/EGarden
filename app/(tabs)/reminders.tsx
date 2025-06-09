import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { usePlants } from '@/context/PlantContext';
import { useLanguage } from '@/context/LanguageContext';
import Button from '@/components/Button';
import { 
  Plus, 
  Bell, 
  Droplets, 
  Sun, 
  Calendar,
  Clock,
  Settings
} from 'lucide-react-native';
import { Reminder } from '@/types';

export default function RemindersTabScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { plants } = usePlants();
  const { t } = useLanguage();
  
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      // Generate automatic watering reminders from plants
      const wateringReminders: Reminder[] = plants.map(plant => {
        const nextDue = new Date();
        if (plant.lastWatered) {
          nextDue.setTime(plant.lastWatered.getTime() + (plant.wateringFrequency * 24 * 60 * 60 * 1000));
        }
        
        return {
          id: `water-${plant.id}`,
          userId: user?.id || '',
          plantId: plant.id,
          type: 'watering',
          title: `Water ${plant.commonName}`,
          description: `Time to water your ${plant.commonName}`,
          frequency: plant.wateringFrequency,
          nextDue,
          isActive: true,
          dateCreated: new Date(),
          notificationSettings: {
            enabled: true,
            sound: true,
            vibration: true,
            advanceNotice: 1,
            repeatInterval: 60,
          },
        };
      });

      setReminders(wateringReminders);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = async (reminderId: string, enabled: boolean) => {
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === reminderId 
          ? { ...reminder, isActive: enabled }
          : reminder
      )
    );
  };

  const isOverdue = (reminder: Reminder) => {
    return new Date() > reminder.nextDue;
  };

  const getDaysUntil = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'watering': return Droplets;
      case 'fertilizing': return Sun;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'watering': return Colors.status.info;
      case 'fertilizing': return Colors.secondary[600];
      default: return Colors.primary[600];
    }
  };

  const activeReminders = reminders.filter(r => r.isActive);
  const overdueReminders = activeReminders.filter(isOverdue);
  const todayReminders = activeReminders.filter(r => {
    const days = getDaysUntil(r.nextDue);
    return days === 0 && !isOverdue(r);
  });
  const upcomingReminders = activeReminders.filter(r => {
    const days = getDaysUntil(r.nextDue);
    return days > 0;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Reminders</Text>
          <Text style={styles.subtitle}>Stay on top of your plant care</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable 
            style={styles.headerButton}
            onPress={() => router.push('/reminders/add')}
          >
            <Plus size={20} color="white" />
          </Pressable>
          <Pressable 
            style={styles.headerButton}
            onPress={() => router.push('/settings/notifications')}
          >
            <Settings size={20} color="white" />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading reminders...</Text>
          </View>
        ) : (
          <>
            {/* Quick Stats */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{overdueReminders.length}</Text>
                <Text style={styles.statLabel}>Overdue</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{todayReminders.length}</Text>
                <Text style={styles.statLabel}>Due Today</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{upcomingReminders.length}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </View>
            </Animated.View>

            {/* Overdue Reminders */}
            {overdueReminders.length > 0 && (
              <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                <Text style={styles.sectionTitle}>Overdue ({overdueReminders.length})</Text>
                {overdueReminders.slice(0, 3).map((reminder) => {
                  const IconComponent = getTypeIcon(reminder.type);
                  const plant = plants.find(p => p.id === reminder.plantId);
                  
                  return (
                    <View key={reminder.id} style={[styles.reminderCard, styles.overdueCard]}>
                      <View style={styles.reminderContent}>
                        <View style={[styles.iconContainer, { backgroundColor: Colors.status.error + '20' }]}>
                          <IconComponent size={20} color={Colors.status.error} />
                        </View>
                        <View style={styles.reminderDetails}>
                          <Text style={styles.reminderTitle}>{reminder.title}</Text>
                          <Text style={styles.overdueText}>
                            {Math.abs(getDaysUntil(reminder.nextDue))} days overdue
                          </Text>
                        </View>
                        <Switch
                          value={reminder.isActive}
                          onValueChange={(value) => toggleReminder(reminder.id, value)}
                          trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                          thumbColor={reminder.isActive ? Colors.primary[600] : Colors.gray[400]}
                        />
                      </View>
                      
                      {plant && (
                        <Pressable 
                          style={styles.plantAction}
                          onPress={() => router.push(`/plant/${plant.id}`)}
                        >
                          <Text style={styles.plantActionText}>View {plant.commonName}</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
                
                {overdueReminders.length > 3 && (
                  <Pressable 
                    style={styles.viewAllButton}
                    onPress={() => router.push('/reminders')}
                  >
                    <Text style={styles.viewAllText}>
                      View all {overdueReminders.length} overdue reminders
                    </Text>
                  </Pressable>
                )}
              </Animated.View>
            )}

            {/* Today's Reminders */}
            {todayReminders.length > 0 && (
              <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
                <Text style={styles.sectionTitle}>Due Today ({todayReminders.length})</Text>
                {todayReminders.map((reminder) => {
                  const IconComponent = getTypeIcon(reminder.type);
                  const plant = plants.find(p => p.id === reminder.plantId);
                  
                  return (
                    <View key={reminder.id} style={styles.reminderCard}>
                      <View style={styles.reminderContent}>
                        <View style={[styles.iconContainer, { backgroundColor: getTypeColor(reminder.type) + '20' }]}>
                          <IconComponent size={20} color={getTypeColor(reminder.type)} />
                        </View>
                        <View style={styles.reminderDetails}>
                          <Text style={styles.reminderTitle}>{reminder.title}</Text>
                          <Text style={styles.dueTodayText}>Due today</Text>
                        </View>
                        <Switch
                          value={reminder.isActive}
                          onValueChange={(value) => toggleReminder(reminder.id, value)}
                          trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                          thumbColor={reminder.isActive ? Colors.primary[600] : Colors.gray[400]}
                        />
                      </View>
                      
                      {plant && (
                        <Pressable 
                          style={styles.plantAction}
                          onPress={() => router.push(`/plant/${plant.id}`)}
                        >
                          <Text style={styles.plantActionText}>View {plant.commonName}</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </Animated.View>
            )}

            {/* Upcoming Reminders */}
            <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming</Text>
              {upcomingReminders.length === 0 ? (
                <View style={styles.emptyState}>
                  <Bell size={48} color={Colors.gray[400]} />
                  <Text style={styles.emptyStateTitle}>All caught up!</Text>
                  <Text style={styles.emptyStateText}>
                    No upcoming reminders. Your plants are well cared for.
                  </Text>
                </View>
              ) : (
                <>
                  {upcomingReminders.slice(0, 3).map((reminder) => {
                    const IconComponent = getTypeIcon(reminder.type);
                    const daysUntil = getDaysUntil(reminder.nextDue);
                    
                    return (
                      <View key={reminder.id} style={styles.reminderCard}>
                        <View style={styles.reminderContent}>
                          <View style={[styles.iconContainer, { backgroundColor: getTypeColor(reminder.type) + '20' }]}>
                            <IconComponent size={20} color={getTypeColor(reminder.type)} />
                          </View>
                          <View style={styles.reminderDetails}>
                            <Text style={styles.reminderTitle}>{reminder.title}</Text>
                            <Text style={styles.upcomingText}>
                              {daysUntil === 1 ? 'Due tomorrow' : `Due in ${daysUntil} days`}
                            </Text>
                          </View>
                          <Switch
                            value={reminder.isActive}
                            onValueChange={(value) => toggleReminder(reminder.id, value)}
                            trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                            thumbColor={reminder.isActive ? Colors.primary[600] : Colors.gray[400]}
                          />
                        </View>
                      </View>
                    );
                  })}
                  
                  {upcomingReminders.length > 3 && (
                    <Pressable 
                      style={styles.viewAllButton}
                      onPress={() => router.push('/reminders')}
                    >
                      <Text style={styles.viewAllText}>
                        View all {upcomingReminders.length} upcoming reminders
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
            </Animated.View>

            {/* Quick Actions */}
            <Animated.View entering={FadeInDown.delay(600)} style={styles.actionSection}>
              <Button
                title="Add Custom Reminder"
                onPress={() => router.push('/reminders/add')}
                icon={Plus}
                style={styles.actionButton}
              />
              <Button
                title="View All Reminders"
                onPress={() => router.push('/reminders')}
                variant="outline"
                icon={Calendar}
                style={styles.actionButton}
              />
            </Animated.View>
          </>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary[500],
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
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    marginTop: -40,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.gray[900],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[600],
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 12,
  },
  reminderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.status.error,
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderDetails: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 2,
  },
  overdueText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.status.error,
  },
  dueTodayText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.status.warning,
  },
  upcomingText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.primary[600],
  },
  plantAction: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  plantActionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary[600],
  },
  viewAllButton: {
    backgroundColor: Colors.gray[100],
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[700],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[700],
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  actionSection: {
    gap: 12,
    marginBottom: 40,
  },
  actionButton: {
    marginBottom: 8,
  },
});