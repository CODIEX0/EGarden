import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageContext';
import { locationService } from '@/services/locationService';
import Button from '@/components/Button';
import { ArrowLeft, MapPin, Thermometer, Droplets, Sun, Wind, Eye, RefreshCw, TrendingUp, TriangleAlert as AlertTriangle } from 'lucide-react-native';

export default function WeatherScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [weather, setWeather] = useState<any>(null);
  const [conditions, setConditions] = useState<any>(null);
  const [location, setLocation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    try {
      const [weatherData, growingConditions, currentLocation] = await Promise.all([
        locationService.getWeatherData(),
        locationService.getGrowingConditions(),
        locationService.getCurrentLocation(),
      ]);

      setWeather(weatherData);
      setConditions(growingConditions);

      if (currentLocation) {
        const address = await locationService.reverseGeocode(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude
        );
        setLocation(address);
      }
    } catch (error) {
      console.error('Failed to load weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWeatherData();
    setRefreshing(false);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return Colors.status.success;
      case 'optimal': return Colors.status.success;
      case 'good': return Colors.primary[500];
      case 'fair': return Colors.status.warning;
      case 'poor': return Colors.status.error;
      default: return Colors.gray[500];
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'excellent':
      case 'optimal': return '🌟';
      case 'good': return '✅';
      case 'fair': return '⚠️';
      case 'poor': return '❌';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading weather data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[Colors.primary[500], Colors.primary[700]]} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="white" />
          </Pressable>
          <Text style={styles.title}>Weather & Growing</Text>
          <Pressable style={styles.refreshButton} onPress={handleRefresh}>
            <RefreshCw size={24} color="white" />
          </Pressable>
        </View>

        {location && (
          <View style={styles.locationContainer}>
            <MapPin size={16} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {weather && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.weatherCard}>
            <View style={styles.currentWeather}>
              <View style={styles.temperatureContainer}>
                <Text style={styles.temperature}>{Math.round(weather.temperature)}°C</Text>
                <Text style={styles.description}>{weather.description}</Text>
              </View>
              <Text style={styles.weatherIcon}>{weather.icon}</Text>
            </View>

            <View style={styles.weatherDetails}>
              <View style={styles.weatherItem}>
                <Droplets size={20} color={Colors.status.info} />
                <Text style={styles.weatherLabel}>Humidity</Text>
                <Text style={styles.weatherValue}>{Math.round(weather.humidity)}%</Text>
              </View>
              
              <View style={styles.weatherItem}>
                <Sun size={20} color={Colors.secondary[600]} />
                <Text style={styles.weatherLabel}>UV Index</Text>
                <Text style={styles.weatherValue}>{weather.uvIndex}</Text>
              </View>
              
              <View style={styles.weatherItem}>
                <Wind size={20} color={Colors.gray[600]} />
                <Text style={styles.weatherLabel}>Wind</Text>
                <Text style={styles.weatherValue}>{Math.round(weather.windSpeed)} km/h</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {conditions && (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.conditionsCard}>
            <Text style={styles.cardTitle}>Growing Conditions</Text>
            
            <View style={styles.overallCondition}>
              <Text style={styles.overallIcon}>
                {getConditionIcon(conditions.overall)}
              </Text>
              <View style={styles.overallInfo}>
                <Text style={styles.overallLabel}>Overall Conditions</Text>
                <Text style={[
                  styles.overallValue,
                  { color: getConditionColor(conditions.overall) }
                ]}>
                  {conditions.overall.charAt(0).toUpperCase() + conditions.overall.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.conditionDetails}>
              <View style={styles.conditionItem}>
                <Thermometer size={18} color={getConditionColor(conditions.temperature)} />
                <Text style={styles.conditionLabel}>Temperature</Text>
                <View style={[
                  styles.conditionBadge,
                  { backgroundColor: getConditionColor(conditions.temperature) + '20' }
                ]}>
                  <Text style={[
                    styles.conditionBadgeText,
                    { color: getConditionColor(conditions.temperature) }
                  ]}>
                    {conditions.temperature}
                  </Text>
                </View>
              </View>

              <View style={styles.conditionItem}>
                <Droplets size={18} color={getConditionColor(conditions.humidity)} />
                <Text style={styles.conditionLabel}>Humidity</Text>
                <View style={[
                  styles.conditionBadge,
                  { backgroundColor: getConditionColor(conditions.humidity) + '20' }
                ]}>
                  <Text style={[
                    styles.conditionBadgeText,
                    { color: getConditionColor(conditions.humidity) }
                  ]}>
                    {conditions.humidity}
                  </Text>
                </View>
              </View>

              <View style={styles.conditionItem}>
                <Sun size={18} color={getConditionColor(conditions.light)} />
                <Text style={styles.conditionLabel}>Light</Text>
                <View style={[
                  styles.conditionBadge,
                  { backgroundColor: getConditionColor(conditions.light) + '20' }
                ]}>
                  <Text style={[
                    styles.conditionBadgeText,
                    { color: getConditionColor(conditions.light) }
                  ]}>
                    {conditions.light}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {conditions?.recommendations && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.recommendationsCard}>
            <Text style={styles.cardTitle}>Recommendations</Text>
            
            {conditions.recommendations.map((recommendation: string, index: number) => (
              <View key={index} style={styles.recommendationItem}>
                <TrendingUp size={16} color={Colors.primary[600]} />
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(500)} style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          
          <View style={styles.actionButtons}>
            <Button
              title="View Plant Care Tips"
              onPress={() => router.push('/ai/chat')}
              icon={Eye}
              style={styles.actionButton}
            />
            
            <Button
              title="Check Plant Health"
              onPress={() => router.push('/plant/identify')}
              variant="outline"
              icon={AlertTriangle}
              style={styles.actionButton}
            />
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
  },
  refreshButton: {
    padding: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  weatherCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currentWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  temperatureContainer: {
    flex: 1,
  },
  temperature: {
    fontSize: 48,
    fontFamily: 'Poppins-Bold',
    color: Colors.gray[900],
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
  },
  weatherIcon: {
    fontSize: 64,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherItem: {
    alignItems: 'center',
    flex: 1,
  },
  weatherLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[600],
    marginTop: 8,
    marginBottom: 4,
  },
  weatherValue: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
  },
  conditionsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 16,
  },
  overallCondition: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
  },
  overallIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  overallInfo: {
    flex: 1,
  },
  overallLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[600],
    marginBottom: 4,
  },
  overallValue: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  conditionDetails: {
    gap: 12,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  conditionLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.gray[700],
    marginLeft: 12,
    flex: 1,
  },
  conditionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'capitalize',
  },
  recommendationsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[700],
    flex: 1,
    lineHeight: 20,
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
});