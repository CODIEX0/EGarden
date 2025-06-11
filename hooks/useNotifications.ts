import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { usePlants } from '@/context/PlantContext';
import { notificationService } from '@/services/notificationService';

export const useNotifications = () => {
  const { user } = useAuth();
  const { plants } = usePlants();
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token ?? '');
    });

    // Notification received while app is running
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // User tapped on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Schedule smart reminders for all plants
  useEffect(() => {
    if (user && plants.length > 0) {
      scheduleSmartReminders();
    }
  }, [user, plants]);

  const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    let token: string | null = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'eGarden Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22c55e',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    try {
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id';
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      // Store token for the user
      if (user && token) {
        await storeUserPushToken(user.id, token);
      }
    } catch (error) {
      console.error('Error getting push token:', error);
    }

    return token;
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    // Handle different notification types
    switch (data?.type) {
      case 'watering':
      case 'fertilizing':
        if (data.plantId) {
          // Navigate to plant detail screen
          // This would need to be implemented with your navigation system
          console.log('Navigate to plant:', data.plantId);
        }
        break;
      case 'disease_alert':
        if (data.plantId) {
          // Navigate to disease detail screen
          console.log('Navigate to disease alert:', data.plantId);
        }
        break;
      case 'community_new_post':
        // Navigate to community screen
        console.log('Navigate to community');
        break;
      case 'marketplace_new_order':
        // Navigate to marketplace orders
        console.log('Navigate to marketplace orders');
        break;
      default:
        console.log('Unknown notification type:', data?.type);
    }
  };

  const scheduleSmartReminders = async () => {
    try {
      if (!user) return;
      
      await notificationService.scheduleSmartReminders(plants, user.id);
    } catch (error) {
      console.error('Failed to schedule smart reminders:', error);
    }
  };

  const storeUserPushToken = async (userId: string, token: string) => {
    try {
      // In a real app, store this in your backend/Firebase
      console.log('Storing push token for user:', userId, token);
    } catch (error) {
      console.error('Failed to store push token:', error);
    }
  };

  const sendTestNotification = async () => {
    try {
      await notificationService.sendImmediateNotification(
        'Test Notification',
        'This is a test notification from eGarden! 🌱',
        { type: 'test' }
      );
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await notificationService.cancelAllNotifications();
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  };

  return {
    expoPushToken,
    notification,
    sendTestNotification,
    cancelAllNotifications,
    scheduleSmartReminders,
  };
};
