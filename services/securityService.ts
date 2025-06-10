import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { SecurityAuditLog, SecuritySettings } from '@/types';

class SecurityService {
  private encryptionKey: string | null = null;
  private sessionTimeout: number = 30; // minutes
  private lastActivity: Date = new Date();

  // Advanced Authentication Security
  private loginAttempts = new Map<string, { count: number; lastAttempt: Date; lockUntil?: Date }>();
  private maxLoginAttempts = 5;
  private lockoutDuration = 15 * 60 * 1000; // 15 minutes

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

  // Advanced Authentication Security
  async recordFailedLogin(identifier: string): Promise<{ isLocked: boolean; lockUntil?: Date }> {
    const now = new Date();
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: now };
    
    attempts.count += 1;
    attempts.lastAttempt = now;
    
    if (attempts.count >= this.maxLoginAttempts) {
      attempts.lockUntil = new Date(now.getTime() + this.lockoutDuration);
      await this.logSecurityEvent(identifier, 'account_locked', true, 'high');
    }
    
    this.loginAttempts.set(identifier, attempts);
    
    // Persist to secure storage
    await this.setSecureItem(`login_attempts_${identifier}`, JSON.stringify(attempts));
    
    return {
      isLocked: !!attempts.lockUntil && attempts.lockUntil > now,
      lockUntil: attempts.lockUntil,
    };
  }

  async isAccountLocked(identifier: string): Promise<boolean> {
    const attempts = this.loginAttempts.get(identifier);
    if (!attempts || !attempts.lockUntil) {
      // Check persisted data
      const persistedData = await this.getSecureItem(`login_attempts_${identifier}`);
      if (persistedData) {
        const parsed = JSON.parse(persistedData);
        if (parsed.lockUntil && new Date(parsed.lockUntil) > new Date()) {
          this.loginAttempts.set(identifier, parsed);
          return true;
        }
      }
      return false;
    }
    
    return attempts.lockUntil > new Date();
  }

  async resetLoginAttempts(identifier: string): Promise<void> {
    this.loginAttempts.delete(identifier);
    await this.deleteSecureItem(`login_attempts_${identifier}`);
  }

  // Enhanced Password Security
  async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const passwordSalt = salt || await this.generateSalt();
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + passwordSalt
    );
    return { hash, salt: passwordSalt };
  }

  async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const { hash: newHash } = await this.hashPassword(password, salt);
    return newHash === hash;
  }

  private async generateSalt(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Token Management with JWT-like structure
  async generateSecureToken(userId: string, expiresIn: number = 24 * 60 * 60 * 1000): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      userId,
      iat: Date.now(),
      exp: Date.now() + expiresIn,
    };
    
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    
    const signature = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${encodedHeader}.${encodedPayload}.${this.encryptionKey}`
    );
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  async verifyToken(token: string): Promise<{ valid: boolean; userId?: string; expired?: boolean }> {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split('.');
      
      // Verify signature
      const expectedSignature = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${encodedHeader}.${encodedPayload}.${this.encryptionKey}`
      );
      
      if (signature !== expectedSignature) {
        return { valid: false };
      }
      
      const payload = JSON.parse(atob(encodedPayload));
      const now = Date.now();
      
      if (payload.exp < now) {
        return { valid: false, expired: true, userId: payload.userId };
      }
      
      return { valid: true, userId: payload.userId };
    } catch (error) {
      return { valid: false };
    }
  }

  // Privacy and Data Protection
  async anonymizeData(data: any, fieldsToAnonymize: string[]): Promise<any> {
    const anonymized = { ...data };
    
    for (const field of fieldsToAnonymize) {
      if (anonymized[field]) {
        if (field.includes('email')) {
          anonymized[field] = this.anonymizeEmail(anonymized[field]);
        } else if (field.includes('phone')) {
          anonymized[field] = this.anonymizePhone(anonymized[field]);
        } else {
          anonymized[field] = '***ANONYMIZED***';
        }
      }
    }
    
    return anonymized;
  }

  private anonymizeEmail(email: string): string {
    const [local, domain] = email.split('@');
    const anonymizedLocal = local.length > 2 
      ? local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1)
      : '***';
    return `${anonymizedLocal}@${domain}`;
  }

  private anonymizePhone(phone: string): string {
    return phone.replace(/\d(?=\d{4})/g, '*');
  }

  // GDPR Compliance helpers
  async exportUserData(userId: string): Promise<any> {
    try {
      const userData: any = {};
      
      // Collect user data from various sources
      userData.securitySettings = await this.getSecuritySettings(userId);
      userData.auditLogs = await this.getAuditLogs(userId);
      userData.loginAttempts = await this.getSecureItem(`login_attempts_${userId}`);
      
      return userData;
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw new Error('Data export failed');
    }
  }

  async deleteUserData(userId: string): Promise<void> {
    try {
      // Delete all user-related secure data
      await this.deleteSecureItem(`security_settings_${userId}`);
      await this.deleteSecureItem(`audit_logs_${userId}`);
      await this.deleteSecureItem(`login_attempts_${userId}`);
      
      // Remove from memory
      this.loginAttempts.delete(userId);
      this.rateLimitMap.delete(userId);
      
      await this.logSecurityEvent(userId, 'user_data_deleted', true, 'medium');
    } catch (error) {
      console.error('Failed to delete user data:', error);
      throw new Error('Data deletion failed');
    }
  }

  // Security Monitoring
  async performSecurityScan(): Promise<{
    score: number;
    vulnerabilities: string[];
    recommendations: string[];
  }> {
    const vulnerabilities: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check for development mode
    if (__DEV__) {
      vulnerabilities.push('Application running in development mode');
      score -= 20;
    }

    // Check encryption key strength
    if (!this.encryptionKey || this.encryptionKey.length < 32) {
      vulnerabilities.push('Weak encryption key detected');
      score -= 15;
    }

    // Check session timeout
    if (this.sessionTimeout > 60) {
      recommendations.push('Consider reducing session timeout for better security');
      score -= 5;
    }

    // Check for locked accounts
    const lockedAccounts = Array.from(this.loginAttempts.values())
      .filter(attempt => attempt.lockUntil && attempt.lockUntil > new Date()).length;
    
    if (lockedAccounts > 0) {
      recommendations.push(`${lockedAccounts} accounts are currently locked due to failed login attempts`);
    }

    return {
      score: Math.max(0, score),
      vulnerabilities,
      recommendations,
    };
  }

  // Secure Communication
  async encryptMessage(message: string, recipientPublicKey?: string): Promise<string> {
    // Simplified encryption - in production, use proper public key cryptography
    return await this.encrypt(message);
  }

  async decryptMessage(encryptedMessage: string, privateKey?: string): Promise<string> {
    // Simplified decryption - in production, use proper private key decryption
    return await this.decrypt(encryptedMessage);
  }
}

export const securityService = new SecurityService();