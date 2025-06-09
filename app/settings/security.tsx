import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { securityService } from '@/services/securityService';
import Button from '@/components/Button';
import Picker from '@/components/Picker';
import { ArrowLeft, Shield, Lock, Eye, Clock, Database, Users } from 'lucide-react-native';
import { SecuritySettings } from '@/types';

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    biometricEnabled: false,
    sessionTimeout: 30,
    dataEncryption: true,
    privacyLevel: 'friends',
  });
  
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    loadSecuritySettings();
    loadAuditLogs();
  }, []);

  const loadSecuritySettings = async () => {
    if (!user) return;
    
    try {
      const userSettings = await securityService.getSecuritySettings(user.id);
      setSettings(userSettings);
    } catch (error) {
      console.error('Failed to load security settings:', error);
    }
  };

  const loadAuditLogs = async () => {
    if (!user) return;
    
    try {
      const logs = await securityService.getAuditLogs(user.id);
      setAuditLogs(logs.slice(-10)); // Show last 10 logs
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  const updateSettings = async (newSettings: SecuritySettings) => {
    if (!user) return;
    
    setLoading(true);
    try {
      await securityService.updateSecuritySettings(user.id, newSettings);
      setSettings(newSettings);
      Alert.alert(t('common.success'), 'Security settings updated successfully');
    } catch (error) {
      console.error('Failed to update security settings:', error);
      Alert.alert(t('common.error'), 'Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof SecuritySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    updateSettings(newSettings);
  };

  const sessionTimeoutOptions = [
    { label: '15 minutes', value: '15' },
    { label: '30 minutes', value: '30' },
    { label: '1 hour', value: '60' },
    { label: '2 hours', value: '120' },
    { label: '4 hours', value: '240' },
  ];

  const privacyLevelOptions = [
    { label: t('security.public'), value: 'public' },
    { label: t('security.friends'), value: 'friends' },
    { label: t('security.private'), value: 'private' },
  ];

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return Colors.status.error;
      case 'medium': return Colors.status.warning;
      case 'low': return Colors.status.success;
      default: return Colors.gray[500];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </Pressable>
        <Text style={styles.title}>{t('security.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={24} color={Colors.primary[600]} />
            <Text style={styles.sectionTitle}>Authentication</Text>
          </View>
          
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>{t('security.twoFactor')}</Text>
                <Text style={styles.settingDescription}>
                  Add an extra layer of security to your account
                </Text>
              </View>
              <Switch
                value={settings.twoFactorEnabled}
                onValueChange={(value) => handleToggle('twoFactorEnabled', value)}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                thumbColor={settings.twoFactorEnabled ? Colors.primary[600] : Colors.gray[400]}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>{t('security.biometric')}</Text>
                <Text style={styles.settingDescription}>
                  Use fingerprint or face recognition to unlock
                </Text>
              </View>
              <Switch
                value={settings.biometricEnabled}
                onValueChange={(value) => handleToggle('biometricEnabled', value)}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                thumbColor={settings.biometricEnabled ? Colors.primary[600] : Colors.gray[400]}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={24} color={Colors.secondary[600]} />
            <Text style={styles.sectionTitle}>Session Management</Text>
          </View>
          
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <Picker
                label={t('security.sessionTimeout')}
                selectedValue={settings.sessionTimeout.toString()}
                onValueChange={(value) => handleToggle('sessionTimeout', parseInt(value))}
                options={sessionTimeoutOptions}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={24} color={Colors.earth[600]} />
            <Text style={styles.sectionTitle}>Data Protection</Text>
          </View>
          
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>{t('security.dataEncryption')}</Text>
                <Text style={styles.settingDescription}>
                  Encrypt sensitive data stored on your device
                </Text>
              </View>
              <Switch
                value={settings.dataEncryption}
                onValueChange={(value) => handleToggle('dataEncryption', value)}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                thumbColor={settings.dataEncryption ? Colors.primary[600] : Colors.gray[400]}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={24} color={Colors.status.info} />
            <Text style={styles.sectionTitle}>Privacy</Text>
          </View>
          
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <Picker
                label={t('security.privacyLevel')}
                selectedValue={settings.privacyLevel}
                onValueChange={(value) => handleToggle('privacyLevel', value)}
                options={privacyLevelOptions}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eye size={24} color={Colors.gray[600]} />
            <Text style={styles.sectionTitle}>{t('security.auditLog')}</Text>
          </View>
          
          <View style={styles.auditLogContainer}>
            {auditLogs.length > 0 ? (
              auditLogs.map((log, index) => (
                <View key={index} style={styles.auditLogItem}>
                  <View style={styles.auditLogHeader}>
                    <Text style={styles.auditLogAction}>{log.action}</Text>
                    <View style={[
                      styles.riskBadge,
                      { backgroundColor: getRiskLevelColor(log.riskLevel) + '20' }
                    ]}>
                      <Text style={[
                        styles.riskBadgeText,
                        { color: getRiskLevelColor(log.riskLevel) }
                      ]}>
                        {log.riskLevel}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.auditLogTime}>
                    {new Date(log.timestamp).toLocaleString()}
                  </Text>
                  <Text style={styles.auditLogDevice}>
                    {log.deviceInfo}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noLogsText}>No recent security events</Text>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700)} style={styles.actionSection}>
          <Button
            title="Clear Security Data"
            onPress={() => {
              Alert.alert(
                'Clear Security Data',
                'This will clear all stored security data including audit logs. This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: () => {} },
                ]
              );
            }}
            variant="outline"
            style={styles.clearButton}
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
  auditLogContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  auditLogItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  auditLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  auditLogAction: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[900],
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  riskBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
  },
  auditLogTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    marginBottom: 2,
  },
  auditLogDevice: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
  },
  noLogsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
    textAlign: 'center',
    padding: 20,
  },
  actionSection: {
    marginBottom: 40,
  },
  clearButton: {
    borderColor: Colors.status.error,
  },
});