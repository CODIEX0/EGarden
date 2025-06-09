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

  // Plant care specific notifications
  async scheduleWateringReminder(plant: any): Promise<string | null> {
    const nextWateringDate = new Date();
    if (plant.lastWatered) {
      nextWateringDate.setTime(plant.lastWatered.getTime() + (plant.wateringFrequency * 24 * 60 * 60 * 1000));
    } else {
      nextWateringDate.setTime(Date.now() + (plant.wateringFrequency * 24 * 60 * 60 * 1000));
    }

    const reminder: Reminder = {
      id: `water-${plant.id}`,
      userId: plant.userId,
      plantId: plant.id,
      type: 'watering',
      title: `Water ${plant.commonName}`,
      description: `Time to water your ${plant.commonName}! 💧`,
      frequency: plant.wateringFrequency,
      nextDue: nextWateringDate,
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

    return await this.scheduleRecurringReminder(reminder);
  }

  async scheduleDiseaseAlert(plant: any, disease: any): Promise<void> {
    const urgencyMessages = {
      immediate: 'Immediate attention required! 🚨',
      soon: 'Treatment needed soon 🔔',
      monitor: 'Keep monitoring 👀',
    };

    await this.sendImmediateNotification(
      `Disease detected in ${plant.commonName}`,
      `${disease.name} - ${urgencyMessages[disease.treatmentUrgency as keyof typeof urgencyMessages]}`,
      {
        plantId: plant.id,
        diseaseId: disease.id,
        type: 'disease_alert',
      }
    );
  }

  async scheduleHealthCheckReminder(plant: any): Promise<string | null> {
    const reminder: Reminder = {
      id: `health-${plant.id}`,
      userId: plant.userId,
      plantId: plant.id,
      type: 'custom',
      title: `Health check for ${plant.commonName}`,
      description: `Time to check on your ${plant.commonName}'s health 🌿`,
      frequency: 7, // Weekly health checks
      nextDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

    return await this.scheduleRecurringReminder(reminder);
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