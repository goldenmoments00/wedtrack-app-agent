import React, { useState } from 'react';
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
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { StatusBadge } from '@/components/common/status-badge';
import { formatCurrency } from '@/components/common/money-view';
import { Button } from '@/components/common/button';
import { StateView } from '@/components/common/state-view';

export default function PackagesScreen() {
  const { session } = useAuth();
  const { packages, packageDrafts, savePackageDraft } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  const [activeTab, setActiveTab] = useState<'CATALOG' | 'DRAFTS'>('CATALOG');

  const isOwnerOrAdmin = session?.roles.includes('OWNER') || session?.roles.includes('ADMIN');

  if (!isOwnerOrAdmin) {
    return (
      <ScreenWrapper>
        <StateView
          type="permission-denied"
          title="Catalogue Access Restricted"
          message="Managing studio packages is restricted to studio administrators."
          actionTitle="Back"
          onAction={() => router.back()}
        />
      </ScreenWrapper>
    );
  }

  const handleSaveDraft = (draftId: string) => {
    savePackageDraft(draftId);
    Alert.alert('Package Published', 'The extracted draft has been saved to your active studio package catalog.');
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[typography.title1, { color: colors.textPrimary }]}>Studio Packages</Text>
            <Text style={[typography.footnote, { color: colors.textSecondary }]}>
              {packages.length} catalog packages · {packageDrafts.length} extracted drafts
            </Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md, marginBottom: spacing.sm }}>
          <Button
            title={`Active Catalogue (${packages.length})`}
            onPress={() => setActiveTab('CATALOG')}
            size="sm"
            variant={activeTab === 'CATALOG' ? 'primary' : 'outline'}
            style={{ flex: 1 }}
          />
          <Button
            title={`Document Drafts (${packageDrafts.filter(d => d.status === 'PENDING_REVIEW').length})`}
            onPress={() => setActiveTab('DRAFTS')}
            size="sm"
            variant={activeTab === 'DRAFTS' ? 'primary' : 'outline'}
            style={{ flex: 1 }}
          />
        </View>

        {/* CATALOG TAB (SET-02) */}
        {activeTab === 'CATALOG' && (
          <View style={{ marginTop: spacing.xs }}>
            {packages.map(pkg => (
              <View
                key={pkg.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginBottom: spacing.sm },
                ]}
              >
                <View style={styles.headerRow}>
                  <Text style={[typography.headline, { color: colors.textPrimary }]}>{pkg.title}</Text>
                  {pkg.price && (
                    <Text style={[typography.title3, { color: colors.primary }]}>{formatCurrency(pkg.price)}</Text>
                  )}
                </View>

                {pkg.description && (
                  <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
                    {pkg.description}
                  </Text>
                )}

                <View style={[styles.delBox, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.xs }]}>
                  <Text style={[typography.caption2, { color: colors.textMuted, fontWeight: '700' }]}>
                    INCLUDED DELIVERABLES:
                  </Text>
                  {pkg.deliverables.map((del, idx) => (
                    <Text key={idx} style={[typography.caption1, { color: colors.textPrimary, marginTop: 2 }]}>
                      • {del.title} {del.countOrDuration ? `(${del.countOrDuration})` : ''}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* DRAFTS TAB (SET-03) */}
        {activeTab === 'DRAFTS' && (
          <View style={{ marginTop: spacing.xs }}>
            <Text style={[typography.footnote, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
              Packages extracted from uploaded rate card PDFs and brochures. Review deliverables before publishing:
            </Text>

            {packageDrafts.map(draft => (
              <View
                key={draft.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: draft.status === 'SAVED' ? colors.border : colors.warning,
                    borderRadius: radii.md,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <View style={styles.headerRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[typography.headline, { color: colors.textPrimary }]}>
                      {draft.extractedTitle}
                    </Text>
                    <Text style={[typography.caption2, { color: colors.textMuted }]}>
                      Source: {draft.fileName}
                    </Text>
                  </View>
                  <StatusBadge
                    label={draft.status === 'SAVED' ? 'PUBLISHED' : 'NEEDS REVIEW'}
                    variant={draft.status === 'SAVED' ? 'success' : 'warning'}
                    size="sm"
                  />
                </View>

                {draft.extractedPrice && (
                  <Text style={[typography.title3, { color: colors.primary, marginTop: 4 }]}>
                    Extracted Price: {formatCurrency(draft.extractedPrice)}
                  </Text>
                )}

                <View style={[styles.delBox, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.xs }]}>
                  <Text style={[typography.caption2, { color: colors.textMuted }]}>EXTRACTED DELIVERABLES:</Text>
                  {draft.extractedDeliverables.map((d, i) => (
                    <Text key={i} style={[typography.caption1, { color: colors.textPrimary, marginTop: 2 }]}>
                      • {d.title} ({d.countOrDuration})
                    </Text>
                  ))}
                </View>

                {draft.status === 'PENDING_REVIEW' && (
                  <Button
                    title="Publish to Active Catalogue"
                    onPress={() => handleSaveDraft(draft.id)}
                    size="sm"
                    variant="primary"
                    style={{ marginTop: spacing.md }}
                  />
                )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    padding: 14,
    borderWidth: 1,
  },
  delBox: {
    borderTopWidth: 1,
  },
});
