import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Reminder } from '@/types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'eGarden Reminders',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#22c55e',
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.warn('Failed to get push token for push notification!');
          return;
        }
      } else {
        console.warn('Must use physical device for Push Notifications');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  async scheduleReminder(reminder: Reminder): Promise<string | null> {
    try {
      await this.initialize();

      const trigger = {
        seconds: Math.max(1, Math.floor((reminder.nextDue.getTime() - Date.now()) / 1000)),
        repeats: false,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.description,
          sound: reminder.notificationSettings.sound ? 'default' : undefined,
          vibrate: reminder.notificationSettings.vibration ? [0, 250, 250, 250] : undefined,
          data: {
            reminderId: reminder.id,
            plantId: reminder.plantId,
            type: reminder.type,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, Math.floor((reminder.nextDue.getTime() - Date.now()) / 1000)),
          repeats: false,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  async scheduleRecurringReminder(reminder: Reminder): Promise<string | null> {
    try {
      await this.initialize();

      const trigger = {
        seconds: reminder.frequency * 24 * 60 * 60, // Convert days to seconds
        repeats: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.description,
          sound: reminder.notificationSettings.sound ? 'default' : undefined,
          vibrate: reminder.notificationSettings.vibration ? [0, 250, 250, 250] : undefined,
          data: {
            reminderId: reminder.id,
            plantId: reminder.plantId,
            type: reminder.type,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          ...trigger,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule recurring notification:', error);
      return null;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  async sendImmediateNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await this.initialize();

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          data,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send immediate notification:', error);
    }
  }

  // Smart Reminder System
  async scheduleSmartReminders(plants: any[], userId: string): Promise<void> {
    try {
      // Cancel existing reminders for this user
      await this.cancelUserReminders(userId);

      for (const plant of plants) {
        await this.scheduleWateringReminder(plant, userId);
        await this.scheduleFertilizingReminder(plant, userId);
        await this.scheduleHealthCheckReminder(plant, userId);
      }
    } catch (error) {
      console.error('Error scheduling smart reminders:', error);
    }
  }

  async scheduleWateringReminder(plant: any, userId: string): Promise<void> {
    try {
      const nextWateringDate = this.calculateNextWateringDate(plant);
      if (!nextWateringDate) return;

      const identifier = `water_${plant.id}_${userId}`;
      
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: '💧 Time to Water!',
          body: `Your ${plant.commonName} needs watering`,
          data: {
            type: 'watering',
            plantId: plant.id,
            plantName: plant.commonName,
            userId,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: nextWateringDate,
        },
      });

      // Schedule advance notice (1 hour before)
      const advanceNoticeDate = new Date(nextWateringDate.getTime() - 60 * 60 * 1000);
      if (advanceNoticeDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          identifier: `water_advance_${plant.id}_${userId}`,
          content: {
            title: '🌱 Watering Reminder',
            body: `Don't forget to water your ${plant.commonName} in 1 hour`,
            data: {
              type: 'watering_advance',
              plantId: plant.id,
              plantName: plant.commonName,
              userId,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: advanceNoticeDate,
          },
        });
      }
    } catch (error) {
      console.error('Error scheduling watering reminder:', error);
    }
  }

  async scheduleFertilizingReminder(plant: any, userId: string): Promise<void> {
    try {
      const nextFertilizingDate = this.calculateNextFertilizingDate(plant);
      if (!nextFertilizingDate) return;

      const identifier = `fertilize_${plant.id}_${userId}`;
      
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: '🌿 Fertilizing Time!',
          body: `Your ${plant.commonName} could use some nutrients`,
          data: {
            type: 'fertilizing',
            plantId: plant.id,
            plantName: plant.commonName,
            userId,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: nextFertilizingDate,
        },
      });
    } catch (error) {
      console.error('Error scheduling fertilizing reminder:', error);
    }
  }

  async scheduleHealthCheckReminder(plant: any, userId: string): Promise<void> {
    try {
      // Schedule weekly health check reminders
      const nextHealthCheck = new Date();
      nextHealthCheck.setDate(nextHealthCheck.getDate() + 7);
      nextHealthCheck.setHours(9, 0, 0, 0); // 9 AM

      const identifier = `health_${plant.id}_${userId}`;
      
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: '🔍 Plant Health Check',
          body: `Time to check on your ${plant.commonName}`,
          data: {
            type: 'health_check',
            plantId: plant.id,
            plantName: plant.commonName,
            userId,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: nextHealthCheck,
        },
      });
    } catch (error) {
      console.error('Error scheduling health check reminder:', error);
    }
  }

  private calculateNextWateringDate(plant: any): Date | null {
    if (!plant.wateringFrequency) return null;

    const lastWatered = plant.lastWatered ? new Date(plant.lastWatered) : new Date(plant.dateAdded);
    const nextWatering = new Date(lastWatered);
    nextWatering.setDate(nextWatering.getDate() + plant.wateringFrequency);
    
    // If the date is in the past, set it to tomorrow at 9 AM
    if (nextWatering < new Date()) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    }
    
    // Set time to 9 AM
    nextWatering.setHours(9, 0, 0, 0);
    return nextWatering;
  }

  private calculateNextFertilizingDate(plant: any): Date | null {
    const lastFertilized = plant.lastFertilized ? new Date(plant.lastFertilized) : new Date(plant.dateAdded);
    const fertilizingInterval = this.getFertilizingInterval(plant.plantType);
    
    const nextFertilizing = new Date(lastFertilized);
    nextFertilizing.setDate(nextFertilizing.getDate() + fertilizingInterval);
    
    // If the date is in the past, set it to next week
    if (nextFertilizing < new Date()) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(10, 0, 0, 0);
      return nextWeek;
    }
    
    nextFertilizing.setHours(10, 0, 0, 0);
    return nextFertilizing;
  }

  private getFertilizingInterval(plantType: string): number {
    const intervals: Record<string, number> = {
      'vegetable': 14, // Every 2 weeks
      'flower': 21,   // Every 3 weeks
      'herb': 28,     // Every 4 weeks
      'tree': 42,     // Every 6 weeks
      'other': 21,    // Default 3 weeks
    };
    return intervals[plantType] || 21;
  }

  async cancelUserReminders(userId: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const userNotifications = scheduledNotifications.filter(notification => 
        notification.content.data?.userId === userId
      );

      for (const notification of userNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
      console.error('Error canceling user reminders:', error);
    }
  }

  // Disease Alert System
  async sendDiseaseAlert(plant: any, disease: any, userId: string): Promise<void> {
    try {
      const severity = disease.severity || 'medium';
      const urgencyLevel = this.getUrgencyLevel(severity);
      
      await Notifications.scheduleNotificationAsync({
        identifier: `disease_${plant.id}_${Date.now()}`,
        content: {
          title: `🚨 ${urgencyLevel.emoji} Disease Alert!`,
          body: `${disease.name} detected on your ${plant.commonName}`,
          data: {
            type: 'disease_alert',
            plantId: plant.id,
            plantName: plant.commonName,
            diseaseName: disease.name,
            severity,
            userId,
          },
          sound: urgencyLevel.sound,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending disease alert:', error);
    }
  }

  private getUrgencyLevel(severity: string) {
    switch (severity) {
      case 'high':
        return {
          emoji: '🔴',
          sound: 'default',
          priority: Notifications.AndroidImportance.HIGH
        };
      case 'medium':
        return {
          emoji: '🟡',
          sound: 'default',
          priority: Notifications.AndroidImportance.DEFAULT
        };
      default:
        return {
          emoji: '🟢',
          sound: 'default',
          priority: Notifications.AndroidImportance.LOW
        };
    }
  }

  // Community Notifications
  async sendCommunityNotification(type: 'new_post' | 'comment_reply' | 'helpful_vote', data: any, userId: string): Promise<void> {
    try {
      const notificationContent = this.getCommunityNotificationContent(type, data);
      
      await Notifications.scheduleNotificationAsync({
        identifier: `community_${type}_${Date.now()}`,
        content: {
          ...notificationContent,
          data: {
            type: `community_${type}`,
            ...data,
            userId,
          },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending community notification:', error);
    }
  }

  private getCommunityNotificationContent(type: string, data: any) {
    switch (type) {
      case 'new_post':
        return {
          title: '📝 New Community Post',
          body: `Check out the latest post in ${data.category}`,
          sound: 'default',
        };
      case 'comment_reply':
        return {
          title: '💬 New Reply',
          body: `Someone replied to your comment`,
          sound: 'default',
        };
      case 'helpful_vote':
        return {
          title: '👍 Helpful Vote',
          body: `Your post was marked as helpful!`,
          sound: 'default',
        };
      default:
        return {
          title: '🌱 eGarden Update',
          body: 'Something new happened in the community',
          sound: 'default',
        };
    }
  }

  // Marketplace Notifications
  async sendMarketplaceNotification(type: 'new_order' | 'order_update' | 'payment_received', data: any, userId: string): Promise<void> {
    try {
      const notificationContent = this.getMarketplaceNotificationContent(type, data);
      
      await Notifications.scheduleNotificationAsync({
        identifier: `marketplace_${type}_${Date.now()}`,
        content: {
          ...notificationContent,
          data: {
            type: `marketplace_${type}`,
            ...data,
            userId,
          },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending marketplace notification:', error);
    }
  }

  private getMarketplaceNotificationContent(type: string, data: any) {
    switch (type) {
      case 'new_order':
        return {
          title: '📦 New Order!',
          body: `You have a new order for ${data.itemName}`,
          sound: 'default',
        };
      case 'order_update':
        return {
          title: '📋 Order Update',
          body: `Your order status has been updated to ${data.status}`,
          sound: 'default',
        };
      case 'payment_received':
        return {
          title: '💰 Payment Received',
          body: `Payment of ${data.amount} ${data.currency} received`,
          sound: 'default',
        };
      default:
        return {
          title: '🛒 Marketplace Update',
          body: 'Something new happened with your orders',
          sound: 'default',
        };
    }
  }

  // Badge management
  async updateBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to update badge count:', error);
    }
  }

  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Failed to clear badge:', error);
    }
  }

  // Notification response handling
  setupNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  setupNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();