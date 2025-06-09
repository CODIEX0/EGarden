import { Platform } from 'react-native';
import * as Location from 'expo-location';

interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  icon: string;
  uvIndex: number;
  windSpeed: number;
}

interface GrowingConditions {
  temperature: 'optimal' | 'good' | 'poor';
  humidity: 'optimal' | 'good' | 'poor';
  light: 'optimal' | 'good' | 'poor';
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

class LocationService {
  private currentLocation: Location.LocationObject | null = null;
  private weatherCache: { data: WeatherData; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Location permission not granted');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      this.currentLocation = location;
      return location;
    } catch (error) {
      console.error('Failed to get current location:', error);
      return null;
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result.length > 0) {
        const address = result[0];
        return `${address.city || address.subregion || ''}, ${address.region || address.country || ''}`.trim();
      }

      return 'Unknown location';
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
      return 'Unknown location';
    }
  }

  async getWeatherData(latitude?: number, longitude?: number): Promise<WeatherData | null> {
    try {
      // Check cache first
      if (this.weatherCache && Date.now() - this.weatherCache.timestamp < this.CACHE_DURATION) {
        return this.weatherCache.data;
      }

      let coords = { latitude, longitude };
      
      if (!latitude || !longitude) {
        const location = await this.getCurrentLocation();
        if (!location) return null;
        coords = location.coords;
      }

      // In a real app, you would use a weather API like OpenWeatherMap
      // For demo purposes, we'll return mock data
      const mockWeatherData: WeatherData = {
        temperature: 22 + Math.random() * 10, // 22-32°C
        humidity: 40 + Math.random() * 40, // 40-80%
        description: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
        icon: '☀️',
        uvIndex: Math.floor(Math.random() * 11),
        windSpeed: Math.random() * 20,
      };

      // Cache the result
      this.weatherCache = {
        data: mockWeatherData,
        timestamp: Date.now(),
      };

      return mockWeatherData;
    } catch (error) {
      console.error('Failed to get weather data:', error);
      return null;
    }
  }

  async getGrowingConditions(plantType?: string): Promise<GrowingConditions> {
    try {
      const weather = await this.getWeatherData();
      
      if (!weather) {
        return {
          temperature: 'good',
          humidity: 'good',
          light: 'good',
          overall: 'good',
          recommendations: ['Unable to get current weather conditions'],
        };
      }

      const conditions: GrowingConditions = {
        temperature: this.evaluateTemperature(weather.temperature, plantType),
        humidity: this.evaluateHumidity(weather.humidity, plantType),
        light: this.evaluateLight(weather.uvIndex, weather.description),
        overall: 'good',
        recommendations: [],
      };

      // Calculate overall conditions
      const scores = {
        optimal: 3,
        good: 2,
        poor: 1,
      };

      const avgScore = (
        scores[conditions.temperature] +
        scores[conditions.humidity] +
        scores[conditions.light]
      ) / 3;

      if (avgScore >= 2.7) conditions.overall = 'excellent';
      else if (avgScore >= 2.3) conditions.overall = 'good';
      else if (avgScore >= 1.7) conditions.overall = 'fair';
      else conditions.overall = 'poor';

      // Generate recommendations
      conditions.recommendations = this.generateRecommendations(weather, conditions, plantType);

      return conditions;
    } catch (error) {
      console.error('Failed to get growing conditions:', error);
      return {
        temperature: 'good',
        humidity: 'good',
        light: 'good',
        overall: 'good',
        recommendations: ['Unable to assess growing conditions'],
      };
    }
  }

  private evaluateTemperature(temp: number, plantType?: string): 'optimal' | 'good' | 'poor' {
    const ranges = {
      tropical: { optimal: [24, 30], good: [20, 35] },
      temperate: { optimal: [18, 25], good: [15, 30] },
      cool: { optimal: [15, 22], good: [10, 27] },
      default: { optimal: [18, 26], good: [15, 30] },
    };

    const range = ranges[plantType as keyof typeof ranges] || ranges.default;

    if (temp >= range.optimal[0] && temp <= range.optimal[1]) return 'optimal';
    if (temp >= range.good[0] && temp <= range.good[1]) return 'good';
    return 'poor';
  }

  private evaluateHumidity(humidity: number, plantType?: string): 'optimal' | 'good' | 'poor' {
    const ranges = {
      tropical: { optimal: [60, 80], good: [50, 90] },
      desert: { optimal: [30, 50], good: [20, 60] },
      default: { optimal: [40, 70], good: [30, 80] },
    };

    const range = ranges[plantType as keyof typeof ranges] || ranges.default;

    if (humidity >= range.optimal[0] && humidity <= range.optimal[1]) return 'optimal';
    if (humidity >= range.good[0] && humidity <= range.good[1]) return 'good';
    return 'poor';
  }

  private evaluateLight(uvIndex: number, description: string): 'optimal' | 'good' | 'poor' {
    if (description.toLowerCase().includes('sunny') && uvIndex >= 6) return 'optimal';
    if (description.toLowerCase().includes('partly') || uvIndex >= 3) return 'good';
    return 'poor';
  }

  private generateRecommendations(
    weather: WeatherData,
    conditions: GrowingConditions,
    plantType?: string
  ): string[] {
    const recommendations: string[] = [];

    if (conditions.temperature === 'poor') {
      if (weather.temperature < 15) {
        recommendations.push('Consider moving plants indoors or providing protection from cold');
      } else {
        recommendations.push('Provide shade or move plants to cooler location during hot weather');
      }
    }

    if (conditions.humidity === 'poor') {
      if (weather.humidity < 30) {
        recommendations.push('Increase humidity around plants with misting or humidity trays');
      } else {
        recommendations.push('Improve air circulation to prevent fungal issues');
      }
    }

    if (conditions.light === 'poor') {
      recommendations.push('Consider supplemental lighting or relocating plants for better light exposure');
    }

    if (weather.windSpeed > 15) {
      recommendations.push('Protect plants from strong winds with windbreaks or shelter');
    }

    if (weather.uvIndex > 8) {
      recommendations.push('Provide afternoon shade to prevent leaf burn');
    }

    if (recommendations.length === 0) {
      recommendations.push('Conditions are favorable for plant growth!');
    }

    return recommendations;
  }

  async getPlantingZone(latitude?: number, longitude?: number): Promise<string> {
    try {
      let coords = { latitude, longitude };
      
      if (!latitude || !longitude) {
        const location = await this.getCurrentLocation();
        if (!location) return 'Unknown';
        coords = location.coords;
      }

      // Simplified hardiness zone calculation based on latitude
      // In a real app, you would use a proper hardiness zone API
      const lat = Math.abs(coords.latitude ?? 0);
      
      if (lat < 23.5) return 'Zone 11-12 (Tropical)';
      if (lat < 30) return 'Zone 9-10 (Subtropical)';
      if (lat < 35) return 'Zone 8-9 (Warm Temperate)';
      if (lat < 40) return 'Zone 7-8 (Cool Temperate)';
      if (lat < 45) return 'Zone 6-7 (Cold Temperate)';
      if (lat < 50) return 'Zone 5-6 (Cool Continental)';
      return 'Zone 3-5 (Cold Continental)';
    } catch (error) {
      console.error('Failed to get planting zone:', error);
      return 'Unknown';
    }
  }

  async getNearbyGardenCenters(radius: number = 10000): Promise<any[]> {
    try {
      const location = await this.getCurrentLocation();
      if (!location) return [];

      // In a real app, you would use Google Places API or similar
      // For demo purposes, return mock data
      return [
        {
          id: '1',
          name: 'Green Thumb Garden Center',
          address: '123 Garden St, Plant City',
          distance: 2.5,
          rating: 4.5,
          phone: '+1234567890',
        },
        {
          id: '2',
          name: 'Botanical Supply Co.',
          address: '456 Flora Ave, Garden Town',
          distance: 5.2,
          rating: 4.2,
          phone: '+1234567891',
        },
      ];
    } catch (error) {
      console.error('Failed to get nearby garden centers:', error);
      return [];
    }
  }
}

export const locationService = new LocationService();