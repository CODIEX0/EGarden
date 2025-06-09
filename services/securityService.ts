import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { SecurityAuditLog, SecuritySettings } from '@/types';

class SecurityService {
  private encryptionKey: string | null = null;
  private sessionTimeout: number = 30; // minutes
  private lastActivity: Date = new Date();

  async initialize() {
    try {
      // Generate or retrieve encryption key
      let key = await this.getSecureItem('encryption_key');
      if (!key) {
        key = await this.generateEncryptionKey();
        await this.setSecureItem('encryption_key', key);
      }
      this.encryptionKey = key;
    } catch (error) {
      console.error('Security service initialization failed:', error);
    }
  }

  // Secure storage operations
  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // For web, use localStorage with encryption
        const encrypted = await this.encrypt(value);
        localStorage.setItem(`secure_${key}`, encrypted);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('Failed to store secure item:', error);
      throw new Error('Secure storage failed');
    }
  }

  async getSecureItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        const encrypted = localStorage.getItem(`secure_${key}`);
        if (!encrypted) return null;
        return await this.decrypt(encrypted);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error('Failed to retrieve secure item:', error);
      return null;
    }
  }

  async deleteSecureItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(`secure_${key}`);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Failed to delete secure item:', error);
    }
  }

  // Data encryption/decryption
  async encrypt(data: string): Promise<string> {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not available');
      }
      
      // Simple encryption for demo - in production use proper encryption
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data + this.encryptionKey
      );
      
      return btoa(data + '::' + digest);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not available');
      }
      
      const decoded = atob(encryptedData);
      const [data, hash] = decoded.split('::');
      
      // Verify integrity
      const expectedHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data + this.encryptionKey
      );
      
      if (hash !== expectedHash) {
        throw new Error('Data integrity check failed');
      }
      
      return data;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  // Generate secure encryption key
  private async generateEncryptionKey(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Session management
  updateActivity() {
    this.lastActivity = new Date();
  }

  isSessionValid(): boolean {
    const now = new Date();
    const timeDiff = (now.getTime() - this.lastActivity.getTime()) / (1000 * 60);
    return timeDiff < this.sessionTimeout;
  }

  setSessionTimeout(minutes: number) {
    this.sessionTimeout = minutes;
  }

  // Security audit logging
  async logSecurityEvent(
    userId: string,
    action: string,
    success: boolean,
    riskLevel: 'low' | 'medium' | 'high' = 'low'
  ): Promise<void> {
    try {
      const auditLog: SecurityAuditLog = {
        id: await this.generateId(),
        userId,
        action,
        timestamp: new Date(),
        ipAddress: await this.getClientIP(),
        deviceInfo: this.getDeviceInfo(),
        success,
        riskLevel,
      };

      // Store audit log securely
      const logs = await this.getAuditLogs(userId);
      logs.push(auditLog);
      
      // Keep only last 100 logs per user
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      await this.setSecureItem(`audit_logs_${userId}`, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  async getAuditLogs(userId: string): Promise<SecurityAuditLog[]> {
    try {
      const logsJson = await this.getSecureItem(`audit_logs_${userId}`);
      return logsJson ? JSON.parse(logsJson) : [];
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  }

  // Input validation and sanitization
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .trim();
  }

  // Rate limiting
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.rateLimitMap.get(identifier);
    
    if (!record || now > record.resetTime) {
      this.rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= maxRequests) {
      return false;
    }
    
    record.count++;
    return true;
  }

  // Device fingerprinting
  getDeviceInfo(): string {
    const info = {
      platform: Platform.OS,
      version: Platform.Version,
      userAgent: Platform.OS === 'web' ? navigator.userAgent : 'mobile',
      screen: Platform.OS === 'web' ? `${screen.width}x${screen.height}` : 'mobile',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    
    return JSON.stringify(info);
  }

  // Get client IP (simplified for demo)
  private async getClientIP(): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        // In production, this would be handled by your backend
        return 'web-client';
      }
      return 'mobile-client';
    } catch (error) {
      return 'unknown';
    }
  }

  // Generate secure ID
  private async generateId(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Security settings management
  async getSecuritySettings(userId: string): Promise<SecuritySettings> {
    try {
      const settingsJson = await this.getSecureItem(`security_settings_${userId}`);
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      
      // Default security settings
      return {
        twoFactorEnabled: false,
        biometricEnabled: false,
        sessionTimeout: 30,
        dataEncryption: true,
        privacyLevel: 'friends',
      };
    } catch (error) {
      console.error('Failed to get security settings:', error);
      throw new Error('Failed to retrieve security settings');
    }
  }

  async updateSecuritySettings(userId: string, settings: SecuritySettings): Promise<void> {
    try {
      await this.setSecureItem(`security_settings_${userId}`, JSON.stringify(settings));
      this.sessionTimeout = settings.sessionTimeout;
      
      await this.logSecurityEvent(userId, 'security_settings_updated', true, 'low');
    } catch (error) {
      console.error('Failed to update security settings:', error);
      throw new Error('Failed to update security settings');
    }
  }

  // Content Security Policy helpers
  validateImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const allowedDomains = [
        'images.pexels.com',
        'firebasestorage.googleapis.com',
        'localhost',
      ];
      
      return allowedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch (error) {
      return false;
    }
  }

  // XSS Protection
  escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

export const securityService = new SecurityService();