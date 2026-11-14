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
      {/* Tab 1: Index / Home / My Work / My Shoots */}
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: isAgent ? 'My Shoots' : isEditor ? 'My Work' : 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={isAgent ? 'camera-outline' : isEditor ? 'film-outline' : 'home-outline'}
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

      {/* Tab 3: Assign / Schedule (Operations) OR My Pay (Agent) OR My Payments (Editor) */}
      <Tabs.Screen
        name="schedule"
        options={{
          title: isAgent ? 'My Pay' : isEditor ? 'My Payouts' : 'Assign',
          href: isAgent || (isEditor ? canSeePayments : canSeeSchedule) ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={isAgent || isEditor ? 'cash-outline' : 'clipboard-outline'}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />

      {/* Tab 4: Team / Work (Editing coordination & Crew in Operations) */}
      <Tabs.Screen
        name="work"
        options={{
          title: 'Team',
          href: isOperations && canSeeWork ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={String(color)} />
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
