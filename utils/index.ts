/**
 * eGarden Utility Functions
 * Common helper functions used throughout the application
 */

import { Plant, Disease, Weather } from '@/types';

// Date utilities
export const formatDate = (date: Date | string, format: 'short' | 'long' | 'relative' = 'short'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'relative') {
    return getRelativeTime(d);
  }
  
  const options: Intl.DateTimeFormatOptions = format === 'long' 
    ? { year: 'numeric', month: 'long', day: 'numeric' }
    : { year: 'numeric', month: 'short', day: 'numeric' };
    
  return d.toLocaleDateString('en-US', options);
};

export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2419200) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  return formatDate(date, 'short');
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const daysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Plant care utilities
export const calculateWateringSchedule = (plant: Plant): Date | null => {
  if (!plant.lastWatered || !plant.wateringFrequency) return null;
  
  return addDays(plant.lastWatered, plant.wateringFrequency);
};

export const isWateringDue = (plant: Plant): boolean => {
  const nextWatering = calculateWateringSchedule(plant);
  if (!nextWatering) return false;
  
  return new Date() >= nextWatering;
};

export const isWateringOverdue = (plant: Plant): boolean => {
  const nextWatering = calculateWateringSchedule(plant);
  if (!nextWatering) return false;
  
  const daysPast = daysBetween(nextWatering, new Date());
  return daysPast > 0;
};

export const getPlantAge = (plant: Plant): string => {
  const daysSincePlanted = daysBetween(plant.plantingDate, new Date());
  
  if (daysSincePlanted < 7) return `${daysSincePlanted} days`;
  if (daysSincePlanted < 30) return `${Math.floor(daysSincePlanted / 7)} weeks`;
  if (daysSincePlanted < 365) return `${Math.floor(daysSincePlanted / 30)} months`;
  return `${Math.floor(daysSincePlanted / 365)} years`;
};

export const calculatePlantHealthScore = (plant: Plant): number => {
  let score = 100;
  
  // Reduce score based on overdue watering
  if (isWateringOverdue(plant)) {
    const daysOverdue = daysBetween(calculateWateringSchedule(plant)!, new Date());
    score -= Math.min(daysOverdue * 10, 50); // Max -50 for watering
  }
  
  // Reduce score for detected diseases
  if (plant.identifiedDisease) {
    const severityPenalty = {
      'low': 10,
      'medium': 25,
      'high': 40
    };
    score -= severityPenalty[plant.identifiedDisease.severity] || 0;
  }
  
  // Factor in health status
  const healthPenalty = {
    'healthy': 0,
    'potential_issue': 15,
    'diseased': 35
  };
  score -= healthPenalty[plant.healthStatus] || 0;
  
  return Math.max(score, 0);
};

// Image utilities
export const generateImageKey = (uri: string): string => {
  return uri.split('/').pop()?.split('?')[0] || `image_${Date.now()}`;
};

export const getImageDimensions = (uri: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = uri;
  });
};

export const compressImageUri = (uri: string, quality: number = 0.8): string => {
  // For React Native, this would use a library like expo-image-manipulator
  // This is a placeholder implementation
  return uri;
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

export const isValidLocation = (location: string): boolean => {
  return location.trim().length >= 3;
};

export const validatePlantData = (plant: Partial<Plant>): string[] => {
  const errors: string[] = [];
  
  if (!plant.commonName?.trim()) {
    errors.push('Plant name is required');
  }
  
  if (!plant.plantType) {
    errors.push('Plant type is required');
  }
  
  if (plant.wateringFrequency && (plant.wateringFrequency < 1 || plant.wateringFrequency > 365)) {
    errors.push('Watering frequency must be between 1 and 365 days');
  }
  
  return errors;
};

// Disease utilities
export const getSeverityColor = (severity: 'low' | 'medium' | 'high'): string => {
  const colors = {
    low: '#22c55e',     // green
    medium: '#f59e0b',  // amber
    high: '#ef4444'     // red
  };
  return colors[severity];
};

export const getHealthStatusColor = (status: Plant['healthStatus']): string => {
  const colors = {
    healthy: '#22c55e',
    potential_issue: '#f59e0b',
    diseased: '#ef4444'
  };
  return colors[status];
};

export const prioritizeDiseases = (diseases: Disease[]): Disease[] => {
  return diseases.sort((a, b) => {
    const urgencyOrder = { immediate: 3, soon: 2, monitor: 1 };
    const severityOrder = { high: 3, medium: 2, low: 1 };
    
    const aScore = urgencyOrder[a.treatmentUrgency] * 10 + severityOrder[a.severity];
    const bScore = urgencyOrder[b.treatmentUrgency] * 10 + severityOrder[b.severity];
    
    return bScore - aScore;
  });
};

// Weather utilities
export const getWeatherIcon = (condition: string): string => {
  const iconMap: Record<string, string> = {
    'clear': '☀️',
    'sunny': '☀️',
    'cloudy': '☁️',
    'partly cloudy': '⛅',
    'overcast': '☁️',
    'rain': '🌧️',
    'drizzle': '🌦️',
    'thunderstorm': '⛈️',
    'snow': '❄️',
    'fog': '🌫️',
    'mist': '🌫️'
  };
  
  return iconMap[condition.toLowerCase()] || '🌤️';
};

export const getGardeningAdvice = (weather: Weather): string[] => {
  const advice: string[] = [];
  const temp = weather.current.temperature;
  const humidity = weather.current.humidity;
  
  if (temp > 85) {
    advice.push('🌡️ Hot weather: Water plants early morning or evening');
    advice.push('🏠 Consider moving sensitive plants to shade');
  }
  
  if (temp < 50) {
    advice.push('🥶 Cold weather: Protect sensitive plants from frost');
    advice.push('💧 Reduce watering frequency');
  }
  
  if (humidity > 80) {
    advice.push('💨 High humidity: Ensure good air circulation');
    advice.push('🍄 Monitor for fungal diseases');
  }
  
  if (humidity < 40) {
    advice.push('💧 Low humidity: Consider misting plants');
    advice.push('🌿 Group plants together to increase local humidity');
  }
  
  if (weather.current.uvIndex > 7) {
    advice.push('☀️ High UV: Provide shade for sensitive plants');
  }
  
  return advice;
};

// String utilities
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncate = (str: string, length: number = 50): string => {
  return str.length > length ? str.substring(0, length) + '...' : str;
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Number utilities
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const unique = <T>(array: T[]): T[] => {
  return array.filter((item, index) => array.indexOf(item) === index);
};

// Local storage utilities (React Native specific)
export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      const { AsyncStorage } = await import('@react-native-async-storage/async-storage');
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  
  async set(key: string, value: string): Promise<void> {
    try {
      const { AsyncStorage } = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },
  
  async remove(key: string): Promise<void> {
    try {
      const { AsyncStorage } = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },
  
  async clear(): Promise<void> {
    try {
      const { AsyncStorage } = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }
};

// Error handling utilities
export const handleError = (error: any, context: string = 'Unknown'): void => {
  console.error(`Error in ${context}:`, error);
  
  // In production, you might want to send this to a logging service
  if (__DEV__) {
    console.trace();
  }
};

export const retryAsync = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryAsync(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};