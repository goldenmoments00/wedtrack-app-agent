import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { StatusBadge } from '@/components/common/status-badge';

export default function ActivitiesSettingsScreen() {
  const { activityTemplates } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <Text style={[typography.title1, { color: colors.textPrimary }]}>Activity Templates</Text>
        <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md }]}>
          Reusable checklist workflows with ordered status stages
        </Text>

        {activityTemplates.map(tmpl => (
          <View
            key={tmpl.id}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginBottom: spacing.sm },
            ]}
          >
            <View style={styles.headerRow}>
              <Text style={[typography.headline, { color: colors.textPrimary }]}>{tmpl.title}</Text>
              <StatusBadge label={tmpl.defaultAssigneeRole || 'STAFF'} variant="info" size="sm" />
            </View>

            {tmpl.description && (
              <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
                {tmpl.description}
              </Text>
            )}

            <View style={[styles.statusFlow, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.xs }]}>
              <Text style={[typography.caption2, { color: colors.textMuted, fontWeight: '700' }]}>
                ORDERED STATUS SEQUENCE:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {tmpl.defaultStatuses.map((st, i) => (
                  <View key={st} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.stagePill, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                      <Text style={[typography.caption2, { color: colors.textPrimary }]}>
                        {i + 1}. {st}
                      </Text>
                    </View>
                    {i < tmpl.defaultStatuses.length - 1 && (
                      <Text style={[typography.caption2, { color: colors.textMuted, marginHorizontal: 4 }]}>→</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusFlow: {
    borderTopWidth: 1,
  },
  stagePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 4,
  },
});
