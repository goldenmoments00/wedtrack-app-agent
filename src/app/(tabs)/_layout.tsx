import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function TabLayout() {
  const { session, permissions } = useAuth();
  const { colors, isDark } = useTheme();

  const workspace = session?.activeWorkspace || 'OPERATIONS';

  // Determine dynamic tab configuration
  const isAgent = workspace === 'SHOOTS';
  const isEditor = workspace === 'EDITING';
  const isOperations = workspace === 'OPERATIONS';

  const canSeeOrders = isOperations || (isEditor && permissions.destinations.includes('Orders'));
  const canSeeSchedule = isOperations && permissions.destinations.includes('Assignments');
  const canSeeWork = isOperations ? permissions.destinations.includes('Work') : isEditor;
  const canSeePayments = isEditor && permissions.destinations.includes('Payments');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      {/* Tab 1: Index / Overview / My Work / My Shoots */}
      <Tabs.Screen
        name="index"
        options={{
          title: isAgent ? 'My Shoots' : isEditor ? 'My Work' : 'Overview',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={isAgent ? 'camera-outline' : isEditor ? 'film-outline' : 'grid-outline'}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />

      {/* Tab 2: Orders (Operations or Editor if granted) OR Submissions (Agent) */}
      <Tabs.Screen
        name="orders"
        options={{
          title: isAgent ? 'Submit' : 'Orders',
          href: isAgent || canSeeOrders ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={isAgent ? 'cloud-upload-outline' : 'folder-open-outline'}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />

      {/* Tab 3: Schedule (Operations) OR My Pay (Agent) OR My Payments (Editor) */}
      <Tabs.Screen
        name="schedule"
        options={{
          title: isAgent ? 'My Pay' : isEditor ? 'My Payouts' : 'Schedule',
          href: isAgent || (isEditor ? canSeePayments : canSeeSchedule) ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={isAgent || isEditor ? 'cash-outline' : 'calendar-outline'}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />

      {/* Tab 4: Work (Editing coordination in Operations) */}
      <Tabs.Screen
        name="work"
        options={{
          title: 'Workload',
          href: isOperations && canSeeWork ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" size={size} color={String(color)} />
          ),
        }}
      />

      {/* Tab 5: More (Occasional Administration, Profile, Gaps) */}
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
