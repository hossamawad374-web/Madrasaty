/*
 * Madrasaty — Root Layout
 * Providers: AlertProvider (outermost) → SafeAreaProvider → AuthProvider → UserProvider
 * Security: Screen capture prevention enabled app-wide
 */

import React, { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider, AuthProvider } from '@/template';
import { UserProvider } from '@/contexts/UserContext';
import { StatusBar } from 'expo-status-bar';
import * as ScreenCapture from 'expo-screen-capture';

export default function RootLayout() {
  useEffect(() => {
    // Enforce RTL for Arabic interface
    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
    }

    // Prevent screenshots and screen recording app-wide
    ScreenCapture.preventScreenCaptureAsync().catch(() => {
      // Silently fail on platforms that don't support it
    });

    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);

  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <UserProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="stage/[id]" options={{ headerShown: false, animation: 'slide_from_left' }} />
              <Stack.Screen name="grade/[id]" options={{ headerShown: false, animation: 'slide_from_left' }} />
              <Stack.Screen name="term/[id]" options={{ headerShown: false, animation: 'slide_from_left' }} />
              <Stack.Screen name="subject/[id]" options={{ headerShown: false, animation: 'slide_from_left' }} />
              <Stack.Screen name="lesson/[id]" options={{ headerShown: false, animation: 'slide_from_left' }} />
              <Stack.Screen name="statistics" options={{ headerShown: false, animation: 'slide_from_left' }} />
              <Stack.Screen name="about" options={{ headerShown: false, animation: 'slide_from_left' }} />
              <Stack.Screen name="support" options={{ headerShown: false, animation: 'slide_from_left' }} />
              <Stack.Screen name="privacy" options={{ headerShown: false, animation: 'slide_from_left' }} />
            </Stack>
          </UserProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
