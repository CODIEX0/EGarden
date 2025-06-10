import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { PlantProvider } from '@/context/PlantContext';
import { useNotifications } from '@/hooks/useNotifications';
import { imageCacheService } from '@/services/imageCacheService';
import { monitoringService } from '@/services/monitoringService';
import { performanceService } from '@/services/performanceService';
import { securityService } from '@/services/securityService';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import '@/config/i18n';

function RootLayoutNav() {
  // Initialize notifications
  useNotifications();

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize services in parallel for better performance
        await Promise.all([
          imageCacheService.initialize(),
          monitoringService.initialize(),
          securityService.initialize(),
        ]);

        // Optimize app state
        await performanceService.optimizeAppState();

        console.log('All services initialized successfully');
      } catch (error) {
        console.error('Failed to initialize services:', error);
        monitoringService.logError(error as Error, { context: 'service_initialization' }, 'high');
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      performanceService.cleanup();
      monitoringService.cleanup();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding/index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="plant" />
      <Stack.Screen name="ai" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="reminders" />
      <Stack.Screen name="gamification" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="weather" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <PlantProvider>
            <StatusBar style="auto" />
            <RootLayoutNav />
          </PlantProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}