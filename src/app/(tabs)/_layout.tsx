import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { FloatingTabBar } from '@/components/navigation/floating-tab-bar';

export default function TabLayout() {
  const { session, permissions } = useAuth();
  const { colors } = useTheme();

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
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
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
      {/* Tab 1: Home */}
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={String(color)} />
          ),
        }}
      />

      {/* Tab 2: Search */}
      <Tabs.Screen
        name="orders"
        options={{
          headerShown: false,
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={String(color)} />
          ),
        }}
      />

      {/* Tab 3: Create */}
      <Tabs.Screen
        name="schedule"
        options={{
          headerShown: false,
          title: 'Create',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add" size={size} color={String(color)} />
          ),
        }}
      />

      {/* Tab 4: Inbox */}
      <Tabs.Screen
        name="work"
        options={{
          headerShown: false,
          title: 'Inbox',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={String(color)} />
          ),
        }}
      />

      {/* Tab 5: Saved */}
      <Tabs.Screen
        name="more"
        options={{
          headerShown: false,
          title: 'Saved',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
