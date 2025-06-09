import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { biometricService } from '@/services/biometricService';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Picker from '@/components/Picker';
import { ArrowLeft, Fingerprint, Scan, Lock, Shield, Clock, Key } from 'lucide-react-native';

interface BiometricSettings {
  fingerprintEnabled: boolean;
  faceIdEnabled: boolean;
  pinEnabled: boolean;
  pinCode: string;
  autoLockEnabled: boolean;
  autoLockTimeout: number;
  requireBiometricForSensitive: boolean;
}

export default function BiometricSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [settings, setSettings] = useState<BiometricSettings>({
    fingerprintEnabled: false,
    faceIdEnabled: false,
    pinEnabled: false,
    pinCode: '',
    autoLockEnabled: true,
    autoLockTimeout: 5,
    requireBiometricForSensitive: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState({
    fingerprint: false,
    faceId: false,
  });

  useEffect(() => {
    checkBiometricAvailability();
    loadBiometricSettings();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const capabilities = await biometricService.getCapabilities();
      setBiometricAvailable({
        fingerprint: capabilities.fingerprint,
        faceId: capabilities.faceId,
      });
    } catch (error) {
      console.error('Failed to check biometric availability:', error);
    }
  };

  const loadBiometricSettings = async () => {
    try {
      const biometricSettings = await biometricService.getBiometricSettings();
      const hasPIN = await biometricService.hasPIN();
      
      setSettings({
        fingerprintEnabled: biometricSettings.enabled && biometricSettings.type === 'fingerprint',
        faceIdEnabled: biometricSettings.enabled && biometricSettings.type === 'faceId',
        pinEnabled: hasPIN,
        pinCode: '',
        autoLockEnabled: biometricSettings.autoLockTimeout > 0,
        autoLockTimeout: biometricSettings.autoLockTimeout || 5,
        requireBiometricForSensitive: true,
      });
    } catch (error) {
      console.error('Failed to load biometric settings:', error);
    }
  };

  const updateSetting = async (key: keyof BiometricSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  const enableFingerprint = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Fingerprint authentication is not available on web platform');
      return;
    }

    try {
      setLoading(true);
      const success = await biometricService.enableBiometric('fingerprint');
      if (success) {
        await updateSetting('fingerprintEnabled', true);
        Alert.alert(t('common.success'), 'Fingerprint authentication enabled');
      } else {
        Alert.alert(t('common.error'), 'Failed to enable fingerprint authentication');
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to enable fingerprint authentication');
    } finally {
      setLoading(false);
    }
  };

  const enableFaceId = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Face ID is only available on iOS devices');
      return;
    }

    try {
      setLoading(true);
      const success = await biometricService.enableBiometric('faceId');
      if (success) {
        await updateSetting('faceIdEnabled', true);
        Alert.alert(t('common.success'), 'Face ID authentication enabled');
      } else {
        Alert.alert(t('common.error'), 'Failed to enable Face ID authentication');
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to enable Face ID authentication');
    } finally {
      setLoading(false);
    }
  };

  const setupPin = async () => {
    if (!settings.pinCode || settings.pinCode.length < 4) {
      Alert.alert(t('common.error'), 'PIN must be at least 4 digits');
      return;
    }

    try {
      setLoading(true);
      const success = await biometricService.setupPIN(settings.pinCode);
      if (success) {
        await updateSetting('pinEnabled', true);
        await updateSetting('pinCode', '');
        Alert.alert(t('common.success'), 'PIN code set successfully');
      } else {
        Alert.alert(t('common.error'), 'Failed to set PIN code');
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to set PIN code');
    } finally {
      setLoading(false);
    }
  };

  const testBiometric = async () => {
    try {
      setLoading(true);
      const success = await biometricService.authenticate('Test biometric authentication');
      if (success) {
        Alert.alert(t('common.success'), 'Biometric authentication test successful');
      } else {
        Alert.alert(t('common.error'), 'Biometric authentication test failed');
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Biometric authentication test failed');
    } finally {
      setLoading(false);
    }
  };

  const timeoutOptions = [
    { label: '1 minute', value: '1' },
    { label: '5 minutes', value: '5' },
    { label: '15 minutes', value: '15' },
    { label: '30 minutes', value: '30' },
    { label: '1 hour', value: '60' },
    { label: 'Never', value: '0' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </Pressable>
        <Text style={styles.title}>Biometric Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Fingerprint size={24} color={Colors.primary[600]} />
            <Text style={styles.sectionTitle}>Biometric Authentication</Text>
          </View>
          
          <View style={styles.settingsList}>
            {biometricAvailable.fingerprint && (
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingName}>{t('security.fingerprint')}</Text>
                  <Text style={styles.settingDescription}>
                    Use fingerprint to unlock the app
                  </Text>
                </View>
                <Switch
                  value={settings.fingerprintEnabled}
                  onValueChange={(value) => {
                    if (value) {
                      enableFingerprint();
                    } else {
                      updateSetting('fingerprintEnabled', false);
                      biometricService.disableBiometric();
                    }
                  }}
                  trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                  thumbColor={settings.fingerprintEnabled ? Colors.primary[600] : Colors.gray[400]}
                />
              </View>
            )}

            {biometricAvailable.faceId && (
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingName}>{t('security.faceId')}</Text>
                  <Text style={styles.settingDescription}>
                    Use Face ID to unlock the app
                  </Text>
                </View>
                <Switch
                  value={settings.faceIdEnabled}
                  onValueChange={(value) => {
                    if (value) {
                      enableFaceId();
                    } else {
                      updateSetting('faceIdEnabled', false);
                      biometricService.disableBiometric();
                    }
                  }}
                  trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                  thumbColor={settings.faceIdEnabled ? Colors.primary[600] : Colors.gray[400]}
                />
              </View>
            )}

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Require for Sensitive Actions</Text>
                <Text style={styles.settingDescription}>
                  Require biometric authentication for sensitive operations
                </Text>
              </View>
              <Switch
                value={settings.requireBiometricForSensitive}
                onValueChange={(value) => updateSetting('requireBiometricForSensitive', value)}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                thumbColor={settings.requireBiometricForSensitive ? Colors.primary[600] : Colors.gray[400]}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Key size={24} color={Colors.secondary[600]} />
            <Text style={styles.sectionTitle}>{t('security.pinCode')}</Text>
          </View>
          
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Enable PIN Code</Text>
                <Text style={styles.settingDescription}>
                  Use a PIN as backup authentication method
                </Text>
              </View>
              <Switch
                value={settings.pinEnabled}
                onValueChange={async (value) => {
                  if (!value) {
                    await biometricService.removePIN();
                  }
                  updateSetting('pinEnabled', value);
                }}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                thumbColor={settings.pinEnabled ? Colors.primary[600] : Colors.gray[400]}
              />
            </View>

            {!settings.pinEnabled && (
              <View style={styles.pinSetupContainer}>
                <Input
                  label="Set PIN Code"
                  value={settings.pinCode}
                  onChangeText={(value) => updateSetting('pinCode', value)}
                  placeholder="Enter 4-6 digit PIN"
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                />
                <Button
                  title="Set PIN"
                  onPress={setupPin}
                  loading={loading}
                  disabled={settings.pinCode.length < 4}
                  style={styles.setPinButton}
                />
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={24} color={Colors.earth[600]} />
            <Text style={styles.sectionTitle}>{t('security.autoLock')}</Text>
          </View>
          
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Enable Auto Lock</Text>
                <Text style={styles.settingDescription}>
                  Automatically lock the app after inactivity
                </Text>
              </View>
              <Switch
                value={settings.autoLockEnabled}
                onValueChange={(value) => updateSetting('autoLockEnabled', value)}
                trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
                thumbColor={settings.autoLockEnabled ? Colors.primary[600] : Colors.gray[400]}
              />
            </View>

            {settings.autoLockEnabled && (
              <View style={styles.settingItem}>
                <Picker
                  label="Auto Lock Timeout"
                  selectedValue={settings.autoLockTimeout.toString()}
                  onValueChange={(value) => updateSetting('autoLockTimeout', parseInt(value))}
                  options={timeoutOptions}
                />
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Shield size={32} color={Colors.status.info} />
            <Text style={styles.infoTitle}>Security Information</Text>
            <Text style={styles.infoText}>
              Biometric authentication provides an additional layer of security for your eGarden account. 
              Your biometric data is stored securely on your device and never transmitted to our servers.
            </Text>
            <Text style={styles.infoText}>
              • Fingerprint and Face ID data stays on your device
            </Text>
            <Text style={styles.infoText}>
              • PIN codes are encrypted and stored securely
            </Text>
            <Text style={styles.infoText}>
              • Auto-lock protects your data when away
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600)} style={styles.actionSection}>
          <Button
            title="Test Biometric Authentication"
            onPress={testBiometric}
            loading={loading}
            icon={Scan}
            style={styles.actionButton}
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
  pinSetupContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  setPinButton: {
    marginTop: 12,
  },
  infoSection: {
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginTop: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[700],
    lineHeight: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  actionSection: {
    marginBottom: 40,
  },
  actionButton: {
    marginBottom: 8,
  },
});