import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { DemoBanner } from '@/components/common/demo-banner';
import { StatusBadge } from '@/components/common/status-badge';
import { formatCurrency } from '@/components/common/money-view';
import { Button } from '@/components/common/button';
import { StateView } from '@/components/common/state-view';

export default function TabScheduleScreen() {
  const { session, permissions } = useAuth();
  const { events, payments, payroll } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [filterMonth, setFilterMonth] = useState('2026-11');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const workspace = session?.activeWorkspace || 'OPERATIONS';

  // ----------------------------------------------------
  // AGENT MY PAY (AGT-05 & GAP G5)
  // ----------------------------------------------------
  if (workspace === 'SHOOTS') {
    const agentId = session?.id || 'usr-agt-01';
    const myEvents = events.filter(e => e.assignments.some(a => a.agentId === agentId));

    let totalEarned = 0;
    const items: { event: (typeof events)[0]; pay: number; role: string; status: string }[] = [];

    myEvents.forEach(e => {
      e.assignments.forEach(a => {
        if (a.agentId === agentId && a.assignmentPay) {
          totalEarned += a.assignmentPay;
          items.push({
            event: e,
            pay: a.assignmentPay,
            role: a.role,
            status: a.status,
          });
        }
      });
    });

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <DemoBanner />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={[typography.title1, { color: colors.textPrimary }]}>
            Assignment Compensation
          </Text>
          <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
            Shoot rates authorized by the studio for your assigned events
          </Text>

          {/* Total Earned Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, marginTop: spacing.md },
            ]}
          >
            <Text style={[typography.caption1, { color: colors.textSecondary }]}>Total Assigned Shoot Pay</Text>
            <Text style={[typography.largeTitle, { color: colors.primary, marginTop: 4 }]}>
              {formatCurrency(totalEarned)}
            </Text>
            <Text style={[typography.caption2, { color: colors.textMuted, marginTop: 4 }]}>
              * Reflects agreed shoot rates. Paid settlement depends on monthly studio disbursement.
            </Text>
          </View>

          {/* Honest Gap G5 Notice */}
          <View
            style={[
              styles.gapCard,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.md },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="information-circle-outline" size={18} color={colors.info} />
              <Text style={[typography.caption1, { color: colors.infoText, fontWeight: '700', marginLeft: 4 }]}>
                INTEGRATION BOUNDARY (GAP G5)
              </Text>
            </View>
            <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 4 }]}>
              A dedicated personal payment history ledger for agents is currently an integration gap on the backend. Your shoot pay amounts are verified from your assigned events.
            </Text>
          </View>

          {/* Per-event breakdown */}
          <Text style={[typography.title3, { color: colors.textPrimary, marginTop: spacing.lg }]}>
            Shoot Pay Breakdown ({items.length})
          </Text>

          {items.map(({ event, pay, role, status }, idx) => (
            <View
              key={idx}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.sm },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[typography.caption2, { color: colors.textMuted }]}>{event.tenantOrderNumber}</Text>
                <StatusBadge label={status} variant={status === 'COMPLETED' ? 'success' : 'info'} size="sm" />
              </View>

              <Text style={[typography.title3, { color: colors.textPrimary, marginTop: 2 }]}>
                {event.eventTypeName}
              </Text>
              <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                {event.orderTitle} · Role: {role}
              </Text>

              <View style={[styles.priceRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.xs }]}>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>Event Compensation:</Text>
                <Text style={[typography.headline, { color: colors.textPrimary }]}>
                  {formatCurrency(pay)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // EDITOR MY PAYMENTS (EDR-05)
  // ----------------------------------------------------
  if (workspace === 'EDITING') {
    const editorId = session?.id || 'usr-edr-01';
    const myPayouts = payments.filter(p => p.type === 'EDITOR_PAYOUT' && p.recipientOrPayerId === editorId);
    const totalPaidAllTime = myPayouts.reduce((acc, p) => acc + p.amount, 0);

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <DemoBanner />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={[typography.title1, { color: colors.textPrimary }]}>
            My Editor Payouts
          </Text>
          <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
            Recorded payouts for completed editing deliverables
          </Text>

          {/* All Time Paid Summary Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, marginTop: spacing.md },
            ]}
          >
            <Text style={[typography.caption1, { color: colors.textSecondary }]}>Total Received (All-Time)</Text>
            <Text style={[typography.largeTitle, { color: colors.success, marginTop: 4 }]}>
              {formatCurrency(totalPaidAllTime)}
            </Text>
            <Text style={[typography.caption2, { color: colors.textMuted, marginTop: 4 }]}>
              Verified studio payouts across all completed editing tasks
            </Text>
          </View>

          {/* Payout records list */}
          <Text style={[typography.title3, { color: colors.textPrimary, marginTop: spacing.lg }]}>
            Payout History ({myPayouts.length})
          </Text>

          {myPayouts.length === 0 ? (
            <StateView type="empty" title="No Payouts Yet" message="No payouts recorded yet for your account." />
          ) : (
            myPayouts.map(pay => (
              <View
                key={pay.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.sm },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[typography.caption2, { color: colors.textMuted }]}>
                    {new Date(pay.paymentDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <StatusBadge label={pay.method} variant="info" size="sm" />
                </View>

                <Text style={[typography.title3, { color: colors.textPrimary, marginTop: 4 }]}>
                  {formatCurrency(pay.amount)}
                </Text>
                <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                  {pay.category || 'Deliverables settlement'} · Ref: {pay.referenceNumber || 'N/A'}
                </Text>
                {pay.notes && (
                  <Text style={[typography.caption1, { color: colors.textMuted, marginTop: 2 }]}>
                    {pay.notes}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // OPERATIONS SCHEDULE / CALENDAR (EVT-01, EVT-03)
  // ----------------------------------------------------
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <DemoBanner />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={[typography.title1, { color: colors.textPrimary }]}>Event Schedule</Text>
        <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
          Calendar schedule, shoot crew assignments and material receipt
        </Text>

        {/* Events list */}
        {events.map(evt => {
          const photographers = evt.assignments.filter(a => a.role === 'PHOTOGRAPHER');
          const videographers = evt.assignments.filter(a => a.role === 'VIDEOGRAPHER');
          const isFullyStaffed =
            photographers.length >= evt.photographersNeeded && videographers.length >= evt.videographersNeeded;

          return (
            <TouchableOpacity
              key={evt.id}
              onPress={() => router.push(`/events/${evt.id}` as any)}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: isFullyStaffed ? colors.border : colors.warning,
                  borderRadius: radii.md,
                  marginTop: spacing.md,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[typography.caption2, { color: colors.textMuted }]}>{evt.tenantOrderNumber}</Text>
                <StatusBadge
                  label={isFullyStaffed ? 'CREW ALLOCATED' : 'STAFFING GAP'}
                  variant={isFullyStaffed ? 'success' : 'warning'}
                  size="sm"
                />
              </View>

              <Text style={[typography.title3, { color: colors.textPrimary, marginTop: 2 }]}>
                {evt.eventTypeName}
              </Text>
              <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                {evt.orderTitle} · Side: {evt.side}
              </Text>

              <View style={[styles.metaRow, { marginTop: 6 }]}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={[typography.caption1, { color: colors.textSecondary, marginLeft: 4 }]}>
                  {new Date(evt.startTime).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                  })}
                </Text>
              </View>

              <View style={[styles.metaRow, { marginTop: 4 }]}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={[typography.caption1, { color: colors.textSecondary, marginLeft: 4, flex: 1 }]} numberOfLines={1}>
                  {evt.venueName} · {evt.venueAddress}
                </Text>
              </View>

              {/* Crew slots */}
              <View style={[styles.crewBox, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.xs }]}>
                <Text style={[typography.caption2, { color: colors.textMuted }]}>
                  CREW ALLOCATION:
                </Text>
                <Text style={[typography.caption1, { color: colors.textPrimary, marginTop: 2 }]}>
                  Photographers: {photographers.length}/{evt.photographersNeeded} · Videographers: {videographers.length}/{evt.videographersNeeded}
                </Text>

                {evt.assignments.map(a => (
                  <View key={a.id} style={styles.crewChip}>
                    <Text style={[typography.caption2, { color: colors.textPrimary }]}>
                      {a.agentName} ({a.role}{a.isPrimary ? ' · Primary' : ''})
                    </Text>
                    {a.materialReceived ? (
                      <Text style={[typography.caption2, { color: colors.success, marginLeft: 6 }]}>✓ Received</Text>
                    ) : a.submissionCount ? (
                      <Text style={[typography.caption2, { color: colors.info, marginLeft: 6 }]}>({a.submissionCount} items)</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    padding: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gapCard: {
    padding: 12,
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  crewBox: {
    borderTopWidth: 1,
  },
  crewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});
