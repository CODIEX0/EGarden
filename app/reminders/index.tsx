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
import { Plus, Bell, Droplets, Sun, Calendar, Clock, CreditCard as Edit, Trash2 } from 'lucide-react-native';
import { Reminder } from '@/types';

export default function RemindersScreen() {
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

  const deleteReminder = (reminderId: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setReminders(prev => prev.filter(r => r.id !== reminderId));
          },
        },
      ]
    );
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

  const isOverdue = (reminder: Reminder) => {
    return new Date() > reminder.nextDue;
  };

  const getDaysUntil = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const activeReminders = reminders.filter(r => r.isActive);
  const overdueReminders = activeReminders.filter(isOverdue);
  const upcomingReminders = activeReminders.filter(r => !isOverdue(r));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
        <Pressable 
          style={styles.addButton}
          onPress={() => router.push('/reminders/add')}
        >
          <Plus size={24} color="white" />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading reminders...</Text>
          </View>
        ) : (
          <>
            {overdueReminders.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
                <Text style={styles.sectionTitle}>Overdue ({overdueReminders.length})</Text>
                {overdueReminders.map((reminder) => {
                  const IconComponent = getTypeIcon(reminder.type);
                  const plant = plants.find(p => p.id === reminder.plantId);
                  
                  return (
                    <View key={reminder.id} style={[styles.reminderCard, styles.overdueCard]}>
                      <View style={styles.reminderHeader}>
                        <View style={styles.reminderInfo}>
                          <View style={[styles.iconContainer, { backgroundColor: Colors.status.error + '20' }]}>
                            <IconComponent size={20} color={Colors.status.error} />
                          </View>
                          <View style={styles.reminderDetails}>
                            <Text style={styles.reminderTitle}>{reminder.title}</Text>
                            <Text style={styles.reminderDescription}>{reminder.description}</Text>
                            <Text style={styles.overdueText}>
                              {Math.abs(getDaysUntil(reminder.nextDue))} days overdue
                            </Text>
                          </View>
                        </View>
                        <View style={styles.reminderActions}>
                          <Switch
                            value={reminder.isActive}
                            onValueChange={(value) => toggleReminder(reminder.id, value)}
                            trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                            thumbColor={reminder.isActive ? Colors.primary[600] : Colors.gray[400]}
                          />
                        </View>
                      </View>
                      
                      {plant && (
                        <Pressable 
                          style={styles.plantLink}
                          onPress={() => router.push(`/plant/${plant.id}`)}
                        >
                          <Text style={styles.plantLinkText}>View {plant.commonName}</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming ({upcomingReminders.length})</Text>
              {upcomingReminders.length === 0 ? (
                <View style={styles.emptyState}>
                  <Bell size={48} color={Colors.gray[400]} />
                  <Text style={styles.emptyStateTitle}>No upcoming reminders</Text>
                  <Text style={styles.emptyStateText}>
                    Your plants are all up to date! Add more plants or custom reminders to stay on track.
                  </Text>
                </View>
              ) : (
                upcomingReminders.map((reminder) => {
                  const IconComponent = getTypeIcon(reminder.type);
                  const plant = plants.find(p => p.id === reminder.plantId);
                  const daysUntil = getDaysUntil(reminder.nextDue);
                  
                  return (
                    <View key={reminder.id} style={styles.reminderCard}>
                      <View style={styles.reminderHeader}>
                        <View style={styles.reminderInfo}>
                          <View style={[styles.iconContainer, { backgroundColor: getTypeColor(reminder.type) + '20' }]}>
                            <IconComponent size={20} color={getTypeColor(reminder.type)} />
                          </View>
                          <View style={styles.reminderDetails}>
                            <Text style={styles.reminderTitle}>{reminder.title}</Text>
                            <Text style={styles.reminderDescription}>{reminder.description}</Text>
                            <Text style={styles.dueDateText}>
                              {daysUntil === 0 ? 'Due today' : 
                               daysUntil === 1 ? 'Due tomorrow' : 
                               `Due in ${daysUntil} days`}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.reminderActions}>
                          <Switch
                            value={reminder.isActive}
                            onValueChange={(value) => toggleReminder(reminder.id, value)}
                            trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                            thumbColor={reminder.isActive ? Colors.primary[600] : Colors.gray[400]}
                          />
                        </View>
                      </View>
                      
                      {plant && (
                        <Pressable 
                          style={styles.plantLink}
                          onPress={() => router.push(`/plant/${plant.id}`)}
                        >
                          <Text style={styles.plantLinkText}>View {plant.commonName}</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400)} style={styles.actionSection}>
              <Button
                title="Add Custom Reminder"
                onPress={() => router.push('/reminders/add')}
                icon={Plus}
                style={styles.addReminderButton}
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
  },
  addButton: {
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 16,
  },
  reminderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.status.error,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  reminderInfo: {
    flexDirection: 'row',
    flex: 1,
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
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    marginBottom: 4,
  },
  dueDateText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.primary[600],
  },
  overdueText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.status.error,
  },
  reminderActions: {
    alignItems: 'center',
    gap: 8,
  },
  plantLink: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  plantLinkText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary[600],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
    marginBottom: 40,
  },
  addReminderButton: {
    marginTop: 8,
  },
});