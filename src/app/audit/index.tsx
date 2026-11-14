import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { StatusBadge } from '@/components/common/status-badge';

export default function AuditLogScreen() {
  const { activityLogs } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <Text style={[typography.title1, { color: colors.textPrimary }]}>Studio Activity Log</Text>
        <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md }]}>
          Read-only audit record of booking mutations, uploads, assignments and receipts (AUD-01)
        </Text>

        {activityLogs.map(log => (
          <View
            key={log.id}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginBottom: spacing.sm },
            ]}
          >
            <View style={styles.topRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                  {new Date(log.timestamp).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                  })}
                </Text>
              </View>
              <StatusBadge label={log.entityType} size="sm" />
            </View>

            <Text style={[typography.headline, { color: colors.textPrimary, marginTop: 4 }]}>
              {log.action.replace('_', ' ')}: {log.entityTitle}
            </Text>

            <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
              Actor: {log.actorName} ({log.actorRole})
            </Text>

            {log.details && (
              <Text style={[typography.footnote, { color: colors.textPrimary, marginTop: 4 }]}>
                {log.details}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  card: {
    padding: 14,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
