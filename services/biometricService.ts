import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface BiometricCapabilities {
  fingerprint: boolean;
  faceId: boolean;
  iris: boolean;
  voice: boolean;
}

interface BiometricSettings {
  enabled: boolean;
  type: 'fingerprint' | 'faceId' | 'pin' | null;
  fallbackEnabled: boolean;
  autoLockTimeout: number;
}

class BiometricService {
  private isInitialized = false;
  private capabilities: BiometricCapabilities = {
    fingerprint: false,
    faceId: false,
    iris: false,
    voice: false,
  };

  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.checkCapabilities();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize biometric service:', error);
    }
  }

  private async checkCapabilities() {
    if (Platform.OS === 'web') {
      // Web doesn't support biometric authentication
      this.capabilities = {
        fingerprint: false,
        faceId: false,
        iris: false,
        voice: false,
      };
      return;
    }

    // For mobile platforms, simulate capability detection
    // In a real app, you would use expo-local-authentication
    this.capabilities = {
      fingerprint: Platform.OS === 'android' || Platform.OS === 'ios',
      faceId: Platform.OS === 'ios',
      iris: false,
      voice: false,
    };
  }

  async isAvailable(): Promise<boolean> {
    await this.initialize();
    return this.capabilities.fingerprint || this.capabilities.faceId;
  }

  async getCapabilities(): Promise<BiometricCapabilities> {
    await this.initialize();
    return this.capabilities;
  }

  async authenticate(reason: string = 'Authenticate to access eGarden'): Promise<boolean> {
    if (Platform.OS === 'web') {
      // For web, show a modal or use Web Authentication API
      return this.webAuthenticate(reason);
    }

    try {
      // In a real app, use expo-local-authentication
      // const result = await LocalAuthentication.authenticateAsync({
      //   promptMessage: reason,
      //   fallbackLabel: 'Use PIN',
      //   disableDeviceFallback: false,
      // });
      // return result.success;

      // For demo purposes, simulate successful authentication
      return new Promise((resolve) => {
        setTimeout(() => resolve(true), 1000);
      });
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  private async webAuthenticate(reason: string): Promise<boolean> {
    // For web, we can use the Web Authentication API if available
    if ('credentials' in navigator && 'create' in navigator.credentials) {
      try {
        // This is a simplified example - in production you'd need proper WebAuthn setup
        return confirm(`${reason}\n\nClick OK to simulate biometric authentication.`);
      } catch (error) {
        console.error('Web authentication failed:', error);
        return false;
      }
    }

    // Fallback for browsers without WebAuthn support
    return confirm(`${reason}\n\nBiometric authentication not available. Use PIN instead?`);
  }

  async enableBiometric(type: 'fingerprint' | 'faceId'): Promise<boolean> {
    if (!this.capabilities[type]) {
      throw new Error(`${type} is not available on this device`);
    }

    try {
      const success = await this.authenticate(`Enable ${type} authentication`);
      if (success) {
        await this.saveBiometricSettings({
          enabled: true,
          type,
          fallbackEnabled: true,
          autoLockTimeout: 5,
        });
      }
      return success;
    } catch (error) {
      console.error(`Failed to enable ${type}:`, error);
      return false;
    }
  }

  async disableBiometric(): Promise<void> {
    await this.saveBiometricSettings({
      enabled: false,
      type: null,
      fallbackEnabled: false,
      autoLockTimeout: 0,
    });
  }

  async getBiometricSettings(): Promise<BiometricSettings> {
    try {
      const settingsJson = await SecureStore.getItemAsync('biometric_settings');
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
    } catch (error) {
      console.error('Failed to get biometric settings:', error);
    }

    return {
      enabled: false,
      type: null,
      fallbackEnabled: true,
      autoLockTimeout: 5,
    };
  }

  private async saveBiometricSettings(settings: BiometricSettings): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('biometric_settings', JSON.stringify(settings));
      } else {
        await SecureStore.setItemAsync('biometric_settings', JSON.stringify(settings));
      }
    } catch (error) {
      console.error('Failed to save biometric settings:', error);
    }
  }

  async setupPIN(pin: string): Promise<boolean> {
    if (pin.length < 4) {
      throw new Error('PIN must be at least 4 digits');
    }

    try {
      const hashedPin = await this.hashPIN(pin);
      if (Platform.OS === 'web') {
        localStorage.setItem('user_pin', hashedPin);
      } else {
        await SecureStore.setItemAsync('user_pin', hashedPin);
      }
      return true;
    } catch (error) {
      console.error('Failed to setup PIN:', error);
      return false;
    }
  }

  async verifyPIN(pin: string): Promise<boolean> {
    try {
      const storedPin = Platform.OS === 'web' 
        ? localStorage.getItem('user_pin')
        : await SecureStore.getItemAsync('user_pin');

      if (!storedPin) return false;

      const hashedPin = await this.hashPIN(pin);
      return hashedPin === storedPin;
    } catch (error) {
      console.error('Failed to verify PIN:', error);
      return false;
    }
  }

  private async hashPIN(pin: string): Promise<string> {
    // Simple hashing for demo - in production use proper crypto
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'egarden_salt');
    
    if (Platform.OS === 'web' && 'crypto' in window && 'subtle' in window.crypto) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback for environments without Web Crypto API
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  async removePIN(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('user_pin');
      } else {
        await SecureStore.deleteItemAsync('user_pin');
      }
    } catch (error) {
      console.error('Failed to remove PIN:', error);
    }
  }

  async hasPIN(): Promise<boolean> {
    try {
      const pin = Platform.OS === 'web' 
        ? localStorage.getItem('user_pin')
        : await SecureStore.getItemAsync('user_pin');
      return !!pin;
    } catch (error) {
      return false;
    }
  }

  // Auto-lock functionality
  private lastActivity: Date = new Date();
  private lockTimer: NodeJS.Timeout | null = null;

  updateActivity() {
    this.lastActivity = new Date();
    this.resetLockTimer();
  }

  private async resetLockTimer() {
    if (this.lockTimer) {
      clearTimeout(this.lockTimer);
    }

    const settings = await this.getBiometricSettings();
    if (settings.autoLockTimeout > 0) {
      this.lockTimer = setTimeout(() => {
        this.triggerAutoLock();
      }, settings.autoLockTimeout * 60 * 1000);
    }
  }

  private triggerAutoLock() {
    // Emit an event or call a callback to lock the app
    // This would typically navigate to a lock screen
    console.log('Auto-lock triggered');
  }

  async isSessionValid(): Promise<boolean> {
    const settings = await this.getBiometricSettings();
    if (settings.autoLockTimeout === 0) return true;

    const now = new Date();
    const timeDiff = (now.getTime() - this.lastActivity.getTime()) / (1000 * 60);
    return timeDiff < settings.autoLockTimeout;
  }
}

export const biometricService = new BiometricService();