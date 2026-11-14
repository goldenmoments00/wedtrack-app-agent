import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { DemoBanner } from '@/components/common/demo-banner';

interface MenuItemProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?: string;
  destructive?: boolean;
}

function MenuItem({ title, subtitle, icon, onPress, badge, destructive }: MenuItemProps) {
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.menuItem,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.md,
          marginBottom: spacing.xs,
        },
      ]}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: destructive ? colors.dangerSubtle : colors.surfaceSubtle,
            borderRadius: radii.sm,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? colors.danger : colors.primary}
        />
      </View>

      <View style={{ flex: 1, marginLeft: spacing.md, marginRight: spacing.sm }}>
        <Text
          style={[
            typography.headline,
            { color: destructive ? colors.danger : colors.textPrimary },
          ]}
        >
          {title}
        </Text>
        <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
          {subtitle}
        </Text>
      </View>

      {badge && (
        <View style={[styles.badge, { backgroundColor: colors.goldSubtle, borderColor: colors.gold }]}>
          <Text style={[typography.caption2, { color: colors.gold, fontWeight: '700' }]}>{badge}</Text>
        </View>
      )}

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

export default function TabMoreScreen() {
  const { session, permissions, signOut, mode } = useAuth();
  const { colors, typography, spacing } = useTheme();

  const isOwnerOrAdmin = session?.roles.includes('OWNER') || session?.roles.includes('ADMIN');
  const isManager = session?.roles.includes('MANAGER');
  const canSeeMoney = permissions.money.revenue !== 'none';
  const canSeePayroll = permissions.destinations.includes('Payroll') && permissions.money.cost !== 'none';
  const canSeeTeams = isOwnerOrAdmin;

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of this studio workspace?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <DemoBanner />
      <ScrollView contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}>
        <Text style={[typography.title1, { color: colors.textPrimary }]}>Studio Administration</Text>
        <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
          Account settings, studio catalog, permissions and integration records
        </Text>

        {/* User Profile Card */}
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={[
            styles.profileCard,
            { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.md },
          ]}
        >
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={[typography.title2, { color: colors.primaryText }]}>
              {session?.name.charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[typography.headline, { color: colors.textPrimary }]}>{session?.name}</Text>
            <Text style={[typography.caption1, { color: colors.textSecondary }]}>{session?.email}</Text>
            <Text style={[typography.caption2, { color: colors.primary, marginTop: 2 }]}>
              Role: {session?.primaryRole} · Active
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Financial Administration */}
        {(isOwnerOrAdmin || canSeePayroll) && (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[typography.caption2, { color: colors.textMuted, fontWeight: '700', marginBottom: spacing.xs }]}>
              MONEY & PAYROLL
            </Text>

            {isOwnerOrAdmin && (
              <MenuItem
                title="Payment Ledger"
                subtitle="Search client receipts, agent payouts and editor settlements"
                icon="receipt-outline"
                onPress={() => router.push('/payments')}
              />
            )}

            {canSeePayroll && (
              <MenuItem
                title="Staff Payroll & CSV Export"
                subtitle="Monthly earnings, balances due, payout records and CSV sharing"
                icon="cash-outline"
                onPress={() => router.push('/payroll')}
              />
            )}
          </View>
        )}

        {/* Team & Permissions */}
        {canSeeTeams && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={[typography.caption2, { color: colors.textMuted, fontWeight: '700', marginBottom: spacing.xs }]}>
              TEAM & ROSTER
            </Text>
            <MenuItem
              title="Team Directory"
              subtitle="Crew agents, editors, managers, dual capabilities and rates"
              icon="people-outline"
              onPress={() => router.push('/team')}
            />
          </View>
        )}

        {/* Studio Catalogues & Setup */}
        {isOwnerOrAdmin && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={[typography.caption2, { color: colors.textMuted, fontWeight: '700', marginBottom: spacing.xs }]}>
              STUDIO CATALOGUE & SETUP
            </Text>

            <MenuItem
              title="Packages & AI Draft Review"
              subtitle="Catalog deliverables and package document extraction review"
              icon="albums-outline"
              onPress={() => router.push('/settings/packages')}
            />

            <MenuItem
              title="Event Types Configuration"
              subtitle="Wedding ceremony, Sangeet, Haldi, date drivers and sides"
              icon="calendar-number-outline"
              onPress={() => router.push('/settings/event-types')}
            />

            <MenuItem
              title="Activity Templates"
              subtitle="Standard checklist workflows for client shortlisting and delivery"
              icon="checkbox-outline"
              onPress={() => router.push('/settings/activities')}
            />

            <MenuItem
              title="Branding, Terms & Domain"
              subtitle="Studio contact, terms of service and custom domain status"
              icon="business-outline"
              onPress={() => router.push('/settings/studio')}
            />
          </View>
        )}

        {/* Billing & Pro Entitlements */}
        <View style={{ marginTop: spacing.md }}>
          <Text style={[typography.caption2, { color: colors.textMuted, fontWeight: '700', marginBottom: spacing.xs }]}>
            BUSINESS ACCOUNT
          </Text>

          <MenuItem
            title="Credits, Subscription & Pro"
            subtitle="Ledger balance, plan status, referrals and feature entitlements"
            icon="card-outline"
            badge={session?.studio.proEnabled ? 'PRO ACTIVE' : 'STANDARD'}
            onPress={() => router.push('/billing')}
          />

          <MenuItem
            title="Studio Activity Log"
            subtitle="Read-only audit history of order changes, payouts and uploads"
            icon="time-outline"
            onPress={() => router.push('/audit')}
          />
        </View>

        {/* Integration Boundary / Gaps Register */}
        <View style={{ marginTop: spacing.md }}>
          <Text style={[typography.caption2, { color: colors.textMuted, fontWeight: '700', marginBottom: spacing.xs }]}>
            TECHNICAL ARCHITECTURE
          </Text>

          <MenuItem
            title="Integration Gap Register"
            subtitle="Documentation of G1-G10 gaps, workarounds and required contracts"
            icon="git-branch-outline"
            badge="G1 - G10"
            onPress={() => router.push('/gaps')}
          />
        </View>

        {/* Sign Out */}
        <View style={{ marginTop: spacing.xl, marginBottom: 40 }}>
          <MenuItem
            title="Sign Out"
            subtitle="Clear cached studio session and return to discovery"
            icon="log-out-outline"
            destructive
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 4,
  },
});
