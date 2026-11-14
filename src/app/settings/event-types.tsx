import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { StatusBadge } from '@/components/common/status-badge';

export default function EventTypesScreen() {
  const { eventTypes } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <Text style={[typography.title1, { color: colors.textPrimary }]}>Event Types</Text>
        <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md }]}>
          Configure ceremony types, client sides and calendar date-driving priority
        </Text>

        {eventTypes.map(et => (
          <View
            key={et.id}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginBottom: spacing.sm },
            ]}
          >
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.headline, { color: colors.textPrimary }]}>{et.name}</Text>
                <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                  Side: {et.side} · Sort Priority: #{et.sortOrder}
                </Text>
              </View>

              <View style={{ gap: 4, alignItems: 'flex-end' }}>
                {et.isDateDriver && (
                  <StatusBadge label="DATE DRIVER" variant="gold" size="sm" />
                )}
                <StatusBadge label={et.isActive ? 'ACTIVE' : 'INACTIVE'} variant="neutral" size="sm" />
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
});
