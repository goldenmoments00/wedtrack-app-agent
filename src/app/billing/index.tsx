import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { StatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/common/button';

export default function BillingScreen() {
  const { session } = useAuth();
  const { credits, subscription, studio, purchaseCredits, setStudioPro } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  const [couponCode, setCouponCode] = useState('');

  const isOwner = session?.roles.includes('OWNER');

  const handleTopUpCredits = (amt: number) => {
    purchaseCredits(amt, couponCode || undefined);
    Alert.alert('Credits Added', `Successfully added ${amt} credits to your studio ledger.`);
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <Text style={[typography.title1, { color: colors.textPrimary }]}>Business & Billing</Text>
        <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md }]}>
          Credits balance, subscription plan, referrals and Pro entitlements
        </Text>

        {/* Pro Entitlement Card (BILL-05) */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: studio.proEnabled ? colors.surface : colors.surfaceSubtle,
              borderColor: studio.proEnabled ? colors.gold : colors.border,
              borderRadius: radii.lg,
            },
          ]}
        >
          <View style={styles.topRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons
                name={studio.proEnabled ? 'star' : 'lock-closed'}
                size={20}
                color={studio.proEnabled ? colors.gold : colors.textMuted}
              />
              <Text style={[typography.headline, { color: colors.textPrimary }]}>WedTrack Pro Suite</Text>
            </View>
            <StatusBadge
              label={studio.proEnabled ? 'ENTITLED' : 'LOCKED'}
              variant={studio.proEnabled ? 'gold' : 'neutral'}
            />
          </View>

          <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 4 }]}>
            {studio.proEnabled
              ? 'Unlocked: Interactive album proofing spreads, video timecode comments, client voice notes, and contract link sharing.'
              : 'Interactive review and contract links require the studio Pro feature grant.'}
          </Text>

          {/* Demo toggle for testing both Pro and non-Pro behavior */}
          <Button
            title={studio.proEnabled ? 'Simulate Pro Disabled' : 'Enable Pro Entitlement'}
            onPress={() => setStudioPro(!studio.proEnabled)}
            size="sm"
            variant="outline"
            style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
          />
        </View>

        {/* Credits Balance Card (BILL-02) */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, marginTop: spacing.md },
          ]}
        >
          <View style={styles.topRow}>
            <Text style={[typography.caption2, { color: colors.textMuted, fontWeight: '700' }]}>
              ORDER CONFIRMATION CREDITS
            </Text>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
          </View>

          <Text style={[typography.largeTitle, { color: colors.primary, marginTop: 4 }]}>
            {credits.balance} Credits
          </Text>
          <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
            Each booking confirmation uses 3 to 5 credits.
          </Text>

          {/* Quick Top-Up */}
          <View style={[styles.topUpRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.md, paddingTop: spacing.sm }]}>
            <Text style={[typography.subhead, { color: colors.textPrimary, marginBottom: 6 }]}>
              Add Credits (Demo Simulation):
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="+25 Credits" onPress={() => handleTopUpCredits(25)} size="sm" variant="outline" style={{ flex: 1 }} />
              <Button title="+50 Credits" onPress={() => handleTopUpCredits(50)} size="sm" variant="outline" style={{ flex: 1 }} />
              <Button title="+100 Credits" onPress={() => handleTopUpCredits(100)} size="sm" variant="primary" style={{ flex: 1 }} />
            </View>
          </View>

          {/* Ledger History */}
          <Text style={[typography.headline, { color: colors.textPrimary, marginTop: spacing.md }]}>
            Recent Credit Transactions
          </Text>
          {credits.history.slice(0, 3).map(entry => (
            <View key={entry.id} style={styles.creditRow}>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                {entry.transactionType === 'PURCHASE'
                  ? 'Credit Purchase'
                  : `Booking: ${entry.orderNumber || 'Confirm'}`}
              </Text>
              <Text
                style={[
                  typography.headline,
                  { color: entry.amount > 0 ? colors.success : colors.danger },
                ]}
              >
                {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
              </Text>
            </View>
          ))}
        </View>

        {/* Subscription Plan Card (BILL-03) */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.md },
          ]}
        >
          <View style={styles.topRow}>
            <Text style={[typography.headline, { color: colors.textPrimary }]}>Subscription Plan</Text>
            <StatusBadge label={subscription.status} variant="success" size="sm" />
          </View>

          <Text style={[typography.title3, { color: colors.primary, marginTop: 4 }]}>
            {subscription.currentPlanName}
          </Text>
          <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
            Active through {new Date(subscription.periodEnd).toLocaleDateString('en-IN', { dateStyle: 'long' })}
          </Text>

          {!isOwner && (
            <View style={[styles.ownerNotice, { backgroundColor: colors.surfaceSubtle, borderRadius: radii.xs, marginTop: spacing.sm }]}>
              <Text style={[typography.caption2, { color: colors.textMuted }]}>
                * Subscription plan changes and payment verification are restricted to the Studio Owner.
              </Text>
            </View>
          )}
        </View>

        {/* Gifts & Referrals (BILL-04) */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.md },
          ]}
        >
          <Text style={[typography.headline, { color: colors.textPrimary }]}>Referrals & Studio Gifts</Text>

          <View style={styles.detailRow}>
            <Text style={[typography.caption1, { color: colors.textSecondary }]}>Your Referral Code:</Text>
            <Text style={[typography.headline, { color: colors.primary }]}>AURA-WED-88</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[typography.caption1, { color: colors.textSecondary }]}>Studios Referred:</Text>
            <Text style={[typography.body, { color: colors.textPrimary }]}>4 Studios (40 Bonus Credits Earned)</Text>
          </View>

          {/* Honest Gifts Switch Disabled Notice */}
          <View style={[styles.giftSwitchBox, { backgroundColor: colors.surfaceSubtle, borderRadius: radii.sm, marginTop: spacing.sm }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
              <Text style={[typography.caption2, { color: colors.textMuted, fontWeight: '700', marginLeft: 4 }]}>
                GIFTS MODULE STATUS: DISABLED
              </Text>
            </View>
            <Text style={[typography.caption2, { color: colors.textSecondary, marginTop: 2 }]}>
              The backend switch GIFTS_ENABLED is currently false in lib/gifts/milestones.ts. Gift claims remain unavailable in live mode.
            </Text>
          </View>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topUpRow: {
    borderTopWidth: 1,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  ownerNotice: {
    padding: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  giftSwitchBox: {
    padding: 10,
  },
});
