import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { notificationService } from '@/services/notificationService';
import Button from '@/components/Button';
import Picker from '@/components/Picker';
import { ArrowLeft, Bell, Droplets, TriangleAlert as AlertTriangle, Cloud, Users, ShoppingBag, Volume2, Vibrate, Clock, Star } from 'lucide-react-native';

interface NotificationSettings {
  pushNotifications: boolean;
  plantReminders: boolean;
  diseaseAlerts: boolean;
  weatherUpdates: boolean;
  communityUpdates: boolean;
  marketingMessages: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  priority: 'high' | 'medium' | 'low';
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    plantReminders: true,
    diseaseAlerts: true,
    weatherUpdates: true,
    communityUpdates: false,
    marketingMessages: false,
    sound: true,
    vibration: true,
    badge: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    priority: 'medium',
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotificationSettings();
    initializeNotificationService();
  }, []);

  const loadNotificationSettings = async () => {
    // In a real app, load from secure storage or Firebase
    try {
      // Mock loading settings
      console.log('Loading notification settings for user:', user?.id);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const initializeNotificationService = async () => {
    try {
      await notificationService.initialize();
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Save to storage
    try {
      // In a real app, save to secure storage or Firebase
      console.log('Saving notification settings:', newSettings);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  const testNotification = async () => {
    try {
      await notificationService.sendImmediateNotification(
        'Test Notification',
        'This is a test notification from eGarden! 🌱',
        { type: 'test' }
      );
      Alert.alert(t('common.success'), 'Test notification sent!');
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to send test notification');
    }
  };

  const clearAllNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'This will cancel all scheduled notifications. Are you sure?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.cancelAllNotifications();
              await notificationService.clearBadge();
              Alert.alert(t('common.success'), 'All notifications cleared');
            } catch (error) {
              Alert.alert(t('common.error'), 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  };

  const priorityOptions = [
    { label: t('notifications.high'), value: 'high' },
    { label: t('notifications.medium'), value: 'medium' },
    { label: t('notifications.low'), value: 'low' },
  ];

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return { label: `${hour}:00`, value: `${hour}:00` };
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </Pressable>
        <Text style={styles.title}>{t('notifications.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={24} color={Colors.primary[600]} />
            <Text style={styles.sectionTitle}>General Settings</Text>
          </View>
          
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>{t('notifications.pushNotifications')}</Text>
                <Text style={styles.settingDescription}>
                  Enable push notifications for the app
                </Text>
              </View>
              <Switch
                value={settings.pushNotifications}
                onValueChange={(value) => updateSetting('pushNotifications', value)}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                thumbColor={settings.pushNotifications ? Colors.primary[600] : Colors.gray[400]}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>{t('notifications.sound')}</Text>
                <Text style={styles.settingDescription}>
                  Play sound for notifications
                </Text>
              </View>
              <Switch
                value={settings.sound}
                onValueChange={(value) => updateSetting('sound', value)}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                thumbColor={settings.sound ? Colors.primary[600] : Colors.gray[400]}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>{t('notifications.vibration')}</Text>
                <Text style={styles.settingDescription}>
                  Vibrate device for notifications
                </Text>
              </View>
              <Switch
                value={settings.vibration}
                onValueChange={(value) => updateSetting('vibration', value)}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                thumbColor={settings.vibration ? Colors.primary[600] : Colors.gray[400]}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>{t('notifications.badge')}</Text>
                <Text style={styles.settingDescription}>
                  Show notification count on app icon
                </Text>
              </View>
              <Switch
                value={settings.badge}
                onValueChange={(value) => updateSetting('badge', value)}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                thumbColor={settings.badge ? Colors.primary[600] : Colors.gray[400]}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Droplets size={24} color={Colors.status.info} />
            <Text style={styles.sectionTitle}>Plant Care Notifications</Text>
          </View>
          
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>{t('notifications.plantReminders')}</Text>
                <Text style={styles.settingDescription}>
                  Watering, fertilizing, and care reminders
                </Text>
              </View>
              <Switch
                value={settings.plantReminders}
                onValueChange={(value) => updateSetting('plantReminders', value)}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                thumbColor={settings.plantReminders ? Colors.primary[600] : Colors.gray[400]}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>{t('notifications.diseaseAlerts')}</Text>
                <Text style={styles.settingDescription}>
                  Urgent alerts for plant diseases and health issues
                </Text>
              </View>
              <Switch
                value={settings.diseaseAlerts}
                onValueChange={(value) => updateSetting('diseaseAlerts', value)}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                thumbColor={settings.diseaseAlerts ? Colors.primary[600] : Colors.gray[400]}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>{t('notifications.weatherUpdates')}</Text>
                <Text style={styles.settingDescription}>
                  Weather conditions affecting your plants
                </Text>
              </View>
              <Switch
                value={settings.weatherUpdates}
                onValueChange={(value) => updateSetting('weatherUpdates', value)}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                thumbColor={settings.weatherUpdates ? Colors.primary[600] : Colors.gray[400]}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={24} color={Colors.secondary[600]} />
            <Text style={styles.sectionTitle}>Community & Marketing</Text>
          </View>
          
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>{t('notifications.communityUpdates')}</Text>
                <Text style={styles.settingDescription}>
                  New posts, comments, and community activity
                </Text>
              </View>
              <Switch
                value={settings.communityUpdates}
                onValueChange={(value) => updateSetting('communityUpdates', value)}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                thumbColor={settings.communityUpdates ? Colors.primary[600] : Colors.gray[400]}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>{t('notifications.marketingMessages')}</Text>
                <Text style={styles.settingDescription}>
                  Promotional offers and product updates
                </Text>
              </View>
              <Switch
                value={settings.marketingMessages}
                onValueChange={(value) => updateSetting('marketingMessages', value)}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                thumbColor={settings.marketingMessages ? Colors.primary[600] : Colors.gray[400]}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={24} color={Colors.earth[600]} />
            <Text style={styles.sectionTitle}>{t('notifications.quietHours')}</Text>
          </View>
          
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Enable Quiet Hours</Text>
                <Text style={styles.settingDescription}>
                  Silence non-urgent notifications during specified hours
                </Text>
              </View>
              <Switch
                value={settings.quietHoursEnabled}
                onValueChange={(value) => updateSetting('quietHoursEnabled', value)}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                thumbColor={settings.quietHoursEnabled ? Colors.primary[600] : Colors.gray[400]}
              />
            </View>

            {settings.quietHoursEnabled && (
              <>
                <View style={styles.settingItem}>
                  <Picker
                    label="Start Time"
                    selectedValue={settings.quietHoursStart}
                    onValueChange={(value) => updateSetting('quietHoursStart', value)}
                    options={timeOptions}
                  />
                </View>

                <View style={styles.settingItem}>
                  <Picker
                    label="End Time"
                    selectedValue={settings.quietHoursEnd}
                    onValueChange={(value) => updateSetting('quietHoursEnd', value)}
                    options={timeOptions}
                  />
                </View>
              </>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Star size={24} color={Colors.status.warning} />
            <Text style={styles.sectionTitle}>{t('notifications.priority')}</Text>
          </View>
          
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <Picker
                label="Notification Priority"
                selectedValue={settings.priority}
                onValueChange={(value) => updateSetting('priority', value)}
                options={priorityOptions}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700)} style={styles.actionSection}>
          <Button
            title="Send Test Notification"
            onPress={testNotification}
            icon={Bell}
            style={styles.actionButton}
          />
          
          <Button
            title="Clear All Notifications"
            onPress={clearAllNotifications}
            variant="outline"
            icon={AlertTriangle}
            style={StyleSheet.flatten([styles.actionButton, styles.clearButton])}
          />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
  },
  settingsList: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    lineHeight: 18,
  },
  actionSection: {
    gap: 12,
    marginBottom: 40,
  },
  actionButton: {
    marginBottom: 8,
  },
  clearButton: {
    borderColor: Colors.status.error,
  },
});