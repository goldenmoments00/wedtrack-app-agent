import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { StatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/common/button';

export default function StudioSettingsScreen() {
  const { session } = useAuth();
  const { colors, typography, spacing, radii } = useTheme();

  const studio = session?.studio;
  const [termsText, setTermsText] = useState(studio?.termsText || '');

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <Text style={[typography.title1, { color: colors.textPrimary }]}>Studio Setup</Text>
        <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md }]}>
          Business profile, booking terms and custom domain integration
        </Text>

        {/* Studio Identity Card (SET-01) */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md },
          ]}
        >
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            Studio Identity & Branding
          </Text>

          <View style={styles.detailRow}>
            <Text style={[typography.caption1, { color: colors.textSecondary }]}>Studio Name:</Text>
            <Text style={[typography.headline, { color: colors.textPrimary }]}>{studio?.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[typography.caption1, { color: colors.textSecondary }]}>Subdomain:</Text>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{studio?.subdomain}.wedtrack.com</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[typography.caption1, { color: colors.textSecondary }]}>Currency:</Text>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{studio?.currency} ({studio?.currencySymbol})</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={[typography.caption1, { color: colors.textSecondary }]}>Theme Accent:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.colorDot, { backgroundColor: studio?.primaryColor }]} />
              <Text style={[typography.caption1, { color: colors.textPrimary, marginLeft: 6 }]}>
                {studio?.primaryColor}
              </Text>
            </View>
          </View>
        </View>

        {/* Custom Domain Verification (SET-05) */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.md },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={[typography.headline, { color: colors.textPrimary }]}>Custom Domain</Text>
            <StatusBadge
              label={studio?.domainStatus ? studio.domainStatus.toUpperCase() : 'NOT CONNECTED'}
              variant={studio?.domainStatus === 'verified' ? 'success' : 'neutral'}
              size="sm"
            />
          </View>

          <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 4 }]}>
            Host the client portal on your own branded domain:
          </Text>

          <View style={[styles.domainBox, { backgroundColor: colors.surfaceSubtle, borderRadius: radii.sm, marginTop: spacing.sm }]}>
            <Text style={[typography.subhead, { color: colors.textPrimary, fontWeight: '700' }]}>
              {studio?.customDomain || 'crew.yourstudio.com'}
            </Text>
            <Text style={[typography.caption2, { color: colors.textMuted, marginTop: 2 }]}>
              CNAME target: cname.wedtrack.com (SSL certificate auto-renewed)
            </Text>
          </View>
        </View>

        {/* Booking Terms (SET-05) */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.md },
          ]}
        >
          <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
            Standard Booking Terms
          </Text>
          <Text style={[typography.caption1, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
            Included in digital contract generation and client portal consent
          </Text>

          <TextInput
            value={termsText}
            onChangeText={setTermsText}
            multiline
            numberOfLines={4}
            style={[styles.multilineInput, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
          />

          <Button
            title="Save Terms"
            onPress={() => Alert.alert('Saved', 'Studio terms of service updated.')}
            size="sm"
            variant="outline"
            style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
          />
        </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  domainBox: {
    padding: 10,
  },
  multilineInput: {
    minHeight: 80,
    padding: 10,
    borderWidth: 1,
    textAlignVertical: 'top',
    fontSize: 14,
  },
});
