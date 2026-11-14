import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { DemoStoreProvider } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/forgot-password" options={{ title: 'Reset Password' }} />
      <Stack.Screen
        name="orders/create-wedding"
        options={{ title: 'New Wedding Booking', presentation: 'modal' }}
      />
      <Stack.Screen
        name="orders/create-occasion"
        options={{ title: 'New Occasion Booking', presentation: 'modal' }}
      />
      <Stack.Screen name="orders/[id]/index" options={{ title: 'Booking Detail' }} />
      <Stack.Screen name="events/[id]" options={{ title: 'Event & Crew' }} />
      <Stack.Screen name="review/[itemId]" options={{ title: 'Staff Media Review' }} />
      <Stack.Screen name="payments/index" options={{ title: 'Payment Ledger' }} />
      <Stack.Screen name="payroll/index" options={{ title: 'Staff Payroll' }} />
      <Stack.Screen name="team/index" options={{ title: 'Team Directory' }} />
      <Stack.Screen name="team/[id]" options={{ title: 'Member Profile & Rates' }} />
      <Stack.Screen name="settings/packages" options={{ title: 'Studio Packages' }} />
      <Stack.Screen name="settings/event-types" options={{ title: 'Event Types' }} />
      <Stack.Screen name="settings/activities" options={{ title: 'Activity Templates' }} />
      <Stack.Screen name="settings/studio" options={{ title: 'Studio Setup & Branding' }} />
      <Stack.Screen name="billing/index" options={{ title: 'Billing & Entitlements' }} />
      <Stack.Screen name="audit/index" options={{ title: 'Studio Activity Log' }} />
      <Stack.Screen name="profile/index" options={{ title: 'My Profile' }} />
      <Stack.Screen name="gaps/index" options={{ title: 'Integration Gap Register' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DemoStoreProvider>
          <RootNavigator />
        </DemoStoreProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
