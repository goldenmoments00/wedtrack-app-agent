import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { StatusBadge } from '@/components/common/status-badge';
import { INTEGRATION_GAPS } from '@/types/gap';

export default function GapRegisterScreen() {
  const { colors, typography, spacing, radii } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>('G1');

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <Text style={[typography.title1, { color: colors.textPrimary }]}>
          Integration Gap Register
        </Text>
        <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md }]}>
          Authoritative boundary between verified backend endpoints and mobile native requirements
        </Text>

        {INTEGRATION_GAPS.map(gap => {
          const isExpanded = expandedId === gap.id;
          return (
            <View
              key={gap.id}
              style={[
                styles.gapCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isExpanded ? colors.primary : colors.border,
                  borderRadius: radii.md,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => toggleExpand(gap.id)}
                style={styles.cardHeader}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.gapIdBadge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                      <Text style={[typography.caption2, { color: colors.primary, fontWeight: '700' }]}>
                        {gap.id}
                      </Text>
                    </View>
                    <Text style={[typography.headline, { color: colors.textPrimary }]}>
                      {gap.name}
                    </Text>
                  </View>
                  <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 4 }]}>
                    Screens: {gap.affectedScreens.join(', ')}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <StatusBadge
                    label={gap.status.replace('_', ' ')}
                    variant={gap.status === 'DEMO_FALLBACK' ? 'warning' : 'info'}
                    size="sm"
                  />
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textMuted}
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={[styles.expandedBody, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.sm }]}>
                  <Text style={[typography.caption2, { color: colors.textMuted, fontWeight: '700' }]}>
                    LIMITATION / BACKEND GAP:
                  </Text>
                  <Text style={[typography.footnote, { color: colors.textPrimary, marginTop: 2 }]}>
                    {gap.description}
                  </Text>

                  <Text style={[typography.caption2, { color: colors.gold, fontWeight: '700', marginTop: spacing.sm }]}>
                    HONEST MOBILE WORKAROUND:
                  </Text>
                  <Text style={[typography.footnote, { color: colors.textPrimary, marginTop: 2 }]}>
                    {gap.currentWorkaround}
                  </Text>

                  <Text style={[typography.caption2, { color: colors.infoText, fontWeight: '700', marginTop: spacing.sm }]}>
                    REQUIRED BACKEND CONTRACT:
                  </Text>
                  <View
                    style={[
                      styles.codeBox,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, borderRadius: radii.xs },
                    ]}
                  >
                    <Text style={[typography.caption2, { color: colors.primary, fontFamily: 'monospace' }]}>
                      {gap.requiredBackendContract}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  gapCard: {
    padding: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gapIdBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderRadius: 4,
  },
  expandedBody: {
    borderTopWidth: 1,
  },
  codeBox: {
    padding: 10,
    borderWidth: 1,
    marginTop: 4,
  },
});
