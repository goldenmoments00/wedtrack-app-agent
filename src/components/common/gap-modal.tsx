import React from 'react';
import { View, Text, Modal, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Button } from './button';
import { IntegrationGap, INTEGRATION_GAPS } from '@/types/gap';

interface GapModalProps {
  gapId: string | null;
  visible: boolean;
  onClose: () => void;
}

export function GapModal({ gapId, visible, onClose }: GapModalProps) {
  const { colors, typography, spacing, radii } = useTheme();

  if (!gapId) return null;
  const gap = INTEGRATION_GAPS.find(g => g.id === gapId);
  if (!gap) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={[styles.pill, { backgroundColor: colors.warningSubtle, borderColor: colors.warning }]}>
              <Text style={[typography.caption1, { color: colors.warningText, fontWeight: '700' }]}>
                INTEGRATION GAP {gap.id}
              </Text>
            </View>
            <Text style={[typography.title2, { color: colors.textPrimary, marginTop: spacing.xs }]}>
              {gap.name}
            </Text>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={[typography.headline, { color: colors.textPrimary, marginTop: spacing.md }]}>
              Current Limitation
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4 }]}>
              {gap.description}
            </Text>

            <Text style={[typography.headline, { color: colors.textPrimary, marginTop: spacing.md }]}>
              Mobile App Workaround
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4 }]}>
              {gap.currentWorkaround}
            </Text>

            <Text style={[typography.headline, { color: colors.textPrimary, marginTop: spacing.md }]}>
              Required Backend Contract
            </Text>
            <View
              style={[
                styles.codeBox,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  borderRadius: radii.sm,
                },
              ]}
            >
              <Text style={[typography.footnote, { color: colors.primary, fontFamily: 'monospace' }]}>
                {gap.requiredBackendContract}
              </Text>
            </View>
          </ScrollView>

          <Button title="Got it" onPress={onClose} variant="primary" style={{ marginTop: spacing.md }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    marginBottom: 8,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 4,
  },
  body: {
    flexGrow: 0,
  },
  codeBox: {
    padding: 12,
    borderWidth: 1,
    marginTop: 6,
  },
});
