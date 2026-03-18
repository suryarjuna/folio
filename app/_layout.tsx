import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getDatabase, autoArchiveExpired } from '../src/db/database';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await getDatabase();
      await autoArchiveExpired();
      setReady(true);
    })();
  }, []);

  // Auto-archive expired coupons on foreground
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        autoArchiveExpired();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, []);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="add-coupon"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="edit-coupon"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="processing"
          options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="coupon-detail"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  );
}
