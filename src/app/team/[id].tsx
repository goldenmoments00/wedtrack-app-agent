import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { StatusBadge } from '@/components/common/status-badge';
import { formatCurrency } from '@/components/common/money-view';
import { Button } from '@/components/common/button';
import { StateView } from '@/components/common/state-view';

export default function TeamMemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { team, toggleMemberActive, updateCapability } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  const member = team.find(m => m.id === id);

  if (!member) {
    return (
      <ScreenWrapper>
        <StateView
          type="error"
          title="Staff Member Not Found"
          actionTitle="Back to Team"
          onAction={() => router.back()}
        />
      </ScreenWrapper>
    );
  }

  const isOwnerOrAdmin = session?.roles.includes('OWNER') || session?.roles.includes('ADMIN');

  const handleToggleCapability = (cap: 'SHOOTING' | 'EDITING', currentVal: boolean) => {
    const action =
      cap === 'SHOOTING'
        ? currentVal
          ? 'DISABLE_SHOOTING'
          : 'ENABLE_SHOOTING'
        : currentVal
        ? 'DISABLE_EDITING'
        : 'ENABLE_EDITING';

    const res = updateCapability({
      memberId: member.id,
      action,
      profession: member.profession || 'BOTH',
      editingCategories: member.editingCategories || ['PHOTO_EDIT', 'ALBUM'],
    });

    if (res.warning) {
      Alert.alert('Capability Updated with Warning', res.warning);
    } else {
      Alert.alert('Capability Updated', `${member.name}'s capabilities have been updated.`);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Profile Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg },
          ]}
        >
          <View style={styles.topRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[typography.headline, { color: colors.textPrimary }]}>{member.name}</Text>
              {!member.isActive && <StatusBadge label="DEACTIVATED" variant="danger" size="sm" />}
            </View>
            <StatusBadge label={member.roles.join(' & ')} variant="info" size="sm" />
          </View>

          <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 4 }]}>
            {member.email} · {member.phone || 'No phone'}
          </Text>
          <Text style={[typography.caption2, { color: colors.textMuted, marginTop: 2 }]}>
            Canonical ID: {member.canonicalId}
          </Text>

          {/* Active / Inactive Toggle (TEAM-02) */}
          <View style={[styles.switchRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.md, paddingTop: spacing.sm }]}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.subhead, { color: colors.textPrimary }]}>Account Active Status</Text>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                Inactive members are hidden from active shoot & task pickers
              </Text>
            </View>
            <Switch
              value={member.isActive}
              onValueChange={() => toggleMemberActive(member.id)}
            />
          </View>
        </View>

        {/* Dual Capability Controls (TEAM-03, TEAM-04) */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.md },
          ]}
        >
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
            Workspace Capabilities
          </Text>
          <Text style={[typography.caption1, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            Convert staff without creating duplicate accounts. Open tasks are guarded when disabling.
          </Text>

          {/* Shooting Capability */}
          <View style={[styles.capRow, { borderBottomColor: colors.borderSubtle }]}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.subhead, { color: colors.textPrimary }]}>Shooting Capability</Text>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                Profession: {member.profession || 'Not set'} ({member.openAssignmentsCount} open shoots)
              </Text>
            </View>
            <Switch
              value={member.capabilities.shooting}
              onValueChange={val => handleToggleCapability('SHOOTING', !val)}
            />
          </View>

          {/* Editing Capability */}
          <View style={[styles.capRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.subhead, { color: colors.textPrimary }]}>Editing Capability</Text>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                Categories: {member.editingCategories?.join(', ') || 'None'} ({member.openTasksCount} open tasks)
              </Text>
            </View>
            <Switch
              value={member.capabilities.editing}
              onValueChange={val => handleToggleCapability('EDITING', !val)}
            />
          </View>
        </View>

        {/* Event Rates Card (TEAM-05) */}
        {member.rates && member.rates.length > 0 && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.md },
            ]}
          >
            <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
              Authorized Shoot Rates by Event Type
            </Text>
            <Text style={[typography.caption1, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
              Standard rate applied when assigning this member to events
            </Text>

            {member.rates.map(r => (
              <View key={r.id} style={styles.rateRow}>
                <Text style={[typography.body, { color: colors.textPrimary }]}>{r.eventTypeName}</Text>
                <Text style={[typography.headline, { color: colors.primary }]}>{formatCurrency(r.rate)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  capRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
});
