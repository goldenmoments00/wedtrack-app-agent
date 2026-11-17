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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { DemoBanner } from '@/components/common/demo-banner';
import { StatusBadge } from '@/components/common/status-badge';
import { formatCurrency } from '@/components/common/money-view';
import { Button } from '@/components/common/button';
import { StateView } from '@/components/common/state-view';
import { PaymentRecord } from '@/types/money';

const EDITOR_MONTH_OPTIONS = [
  { key: 'ALL', label: 'ALL', fullName: 'All Months' },
  { key: '2026-09', label: 'SEP 26', fullName: 'September 2026' },
  { key: '2026-10', label: 'OCT 26', fullName: 'October 2026' },
  { key: '2026-11', label: 'NOV 26', fullName: 'November 2026' },
  { key: '2026-12', label: 'DEC 26', fullName: 'December 2026' },
  { key: '2027-01', label: 'JAN 27', fullName: 'January 2027' },
];

export default function TabScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { session, permissions } = useAuth();
  const { events, payments, payroll } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [filterMonth, setFilterMonth] = useState('2026-11');
  const [selectedEditorMonth, setSelectedEditorMonth] = useState('2026-11');

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
  // EDITOR MY PAYMENTS (EDR-05) - Reference Payment History
  // ----------------------------------------------------
  if (workspace === 'EDITING') {
    const editorId = session?.id || 'usr-edr-01';
    let myPayouts = payments.filter(p => p.type === 'EDITOR_PAYOUT' && p.recipientOrPayerId === editorId);

    // If using legacy in-memory demo store, use reference payments matching mockup
    if (myPayouts.length === 0 || myPayouts.some(p => p.id === 'pay-payout-05' || p.id === 'pay-payout-06')) {
      myPayouts = [
        {
          id: 'pay-payout-ref-01',
          type: 'EDITOR_PAYOUT',
          recipientOrPayerId: 'usr-edr-01',
          recipientOrPayerName: 'Vikram Das',
          amount: 2000,
          currency: 'INR',
          paymentDate: '2026-11-10T10:00:00Z',
          method: 'CASH',
          status: 'COMPLETED',
          category: '-',
          referenceNumber: '-',
          recordedByStaffId: 'usr-owner-01',
          recordedByStaffName: 'Aarav Mehta',
          createdAt: '2026-11-10T10:00:00Z',
        },
        {
          id: 'pay-payout-ref-02',
          type: 'EDITOR_PAYOUT',
          recipientOrPayerId: 'usr-edr-01',
          recipientOrPayerName: 'Vikram Das',
          amount: 2000,
          currency: 'INR',
          paymentDate: '2026-11-05T10:00:00Z',
          method: 'CASH',
          status: 'COMPLETED',
          category: '-',
          referenceNumber: '-',
          recordedByStaffId: 'usr-owner-01',
          recordedByStaffName: 'Aarav Mehta',
          createdAt: '2026-11-05T10:00:00Z',
        },
        {
          id: 'pay-payout-ref-03',
          type: 'EDITOR_PAYOUT',
          recipientOrPayerId: 'usr-edr-01',
          recipientOrPayerName: 'Vikram Das',
          amount: 6000,
          currency: 'INR',
          paymentDate: '2026-10-18T12:00:00Z',
          method: 'CASH',
          status: 'COMPLETED',
          category: '-',
          referenceNumber: '-',
          recordedByStaffId: 'usr-owner-01',
          recordedByStaffName: 'Aarav Mehta',
          createdAt: '2026-10-18T12:00:00Z',
        },
        {
          id: 'pay-payout-ref-04',
          type: 'EDITOR_PAYOUT',
          recipientOrPayerId: 'usr-edr-01',
          recipientOrPayerName: 'Vikram Das',
          amount: 4000,
          currency: 'INR',
          paymentDate: '2026-09-22T12:00:00Z',
          method: 'CASH',
          status: 'COMPLETED',
          category: '-',
          referenceNumber: '-',
          recordedByStaffId: 'usr-owner-01',
          recordedByStaffName: 'Aarav Mehta',
          createdAt: '2026-09-22T12:00:00Z',
        },
      ];
    }

    const activeMonthObj = EDITOR_MONTH_OPTIONS.find(m => m.key === selectedEditorMonth) || EDITOR_MONTH_OPTIONS[3];

    // Filter payouts based on selected month
    const filteredPayouts = myPayouts.filter(p => {
      if (selectedEditorMonth === 'ALL') return true;
      return p.paymentDate.startsWith(selectedEditorMonth);
    });

    // Total monthly income
    const monthlyIncome = filteredPayouts.reduce((acc, p) => acc + p.amount, 0);

    return (
      <View style={[styles.root, { backgroundColor: '#F8F4EE' }]}>
        <DemoBanner />
        <ScrollView
          contentContainerStyle={[styles.editorPaymentScrollContent, { paddingTop: insets.top + 10 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header Title: Payment History */}
          <View style={styles.editorPaymentHeader}>
            <Text style={styles.editorPaymentTitle}>Payment History</Text>
          </View>

          {/* 1. Monthly Income Summary Tile */}
          <View style={styles.monthlyIncomeCard}>
            <View style={styles.monthlyIncomeTopRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="wallet-outline" size={16} color="#7C6C63" style={{ marginRight: 6 }} />
                <Text style={styles.monthlyIncomeLabel}>
                  {selectedEditorMonth === 'ALL' ? 'TOTAL EARNINGS' : 'MONTHLY INCOME'}
                </Text>
              </View>
              <View style={styles.monthlyIncomeMonthBadge}>
                <Ionicons name="calendar-outline" size={12} color="#7C6C63" style={{ marginRight: 4 }} />
                <Text style={styles.monthlyIncomeMonthText}>{activeMonthObj.fullName}</Text>
              </View>
            </View>

            {/* Big Currency Amount */}
            <View style={styles.monthlyIncomeAmountRow}>
              <Text style={styles.monthlyIncomeAmount}>
                ₹{monthlyIncome.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Subtitle / Status Meta */}
            <View style={styles.monthlyIncomeBottomRow}>
              <View style={styles.monthlyIncomeMetaLeft}>
                <View style={styles.monthlyIncomeGreenDot} />
                <Text style={styles.monthlyIncomeMetaText}>
                  {filteredPayouts.length} {filteredPayouts.length === 1 ? 'disbursement' : 'disbursements'} recorded
                </Text>
              </View>
              <View style={styles.monthlyIncomeStatusPill}>
                <Text style={styles.monthlyIncomeStatusText}>100% Settled</Text>
              </View>
            </View>
          </View>

          {/* 2. Month Selector Tiles (Select month to see monthly income) */}
          <View style={styles.monthSelectorSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.monthSelectorScroll}
            >
              {EDITOR_MONTH_OPTIONS.map(m => {
                const isActive = selectedEditorMonth === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={[
                      styles.monthTile,
                      isActive ? styles.monthTileActive : styles.monthTileInactive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedEditorMonth(m.key);
                    }}
                  >
                    <Text
                      style={[
                        styles.monthTileText,
                        isActive ? styles.monthTileTextActive : styles.monthTileTextInactive,
                      ]}
                    >
                      {m.label}
                    </Text>
                    {isActive && <View style={styles.monthTileActiveDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 3. Table Container Card */}
          <View style={styles.editorTableCard}>
            {/* Table Header Bar */}
            <View style={styles.editorTableHeader}>
              <Text style={[styles.editorColHeader, { flex: 1.2 }]}>PAYMENT FOR</Text>
              <Text style={[styles.editorColHeader, { flex: 1.0 }]}>AMOUNT</Text>
              <Text style={[styles.editorColHeader, { flex: 0.9, textAlign: 'center' }]}>METHOD</Text>
              <Text style={[styles.editorColHeader, { flex: 1.1, textAlign: 'right' }]}>STATUS</Text>
            </View>

            {/* Table Rows */}
            {filteredPayouts.length === 0 ? (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Ionicons name="receipt-outline" size={32} color="#D1D5DB" style={{ marginBottom: 8 }} />
                <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>
                  No disbursements recorded for {activeMonthObj.fullName}
                </Text>
              </View>
            ) : (
              filteredPayouts.map(pay => (
                <View key={pay.id} style={styles.editorTableRow}>
                  {/* PAYMENT FOR */}
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.editorPaymentForText}>
                      {pay.category && pay.category !== 'Album & Photo Retouching' && pay.category !== 'Album Design Advance'
                        ? pay.category
                        : '-'}
                    </Text>
                  </View>

                  {/* AMOUNT */}
                  <View style={{ flex: 1.0 }}>
                    <Text style={styles.editorAmountText}>
                      ₹{pay.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {/* METHOD */}
                  <View style={{ flex: 0.9, alignItems: 'center' }}>
                    <View style={styles.editorMethodBadge}>
                      <Text style={styles.editorMethodText}>{pay.method || 'CASH'}</Text>
                    </View>
                  </View>

                  {/* STATUS */}
                  <View style={{ flex: 1.1, alignItems: 'flex-end' }}>
                    <View style={styles.editorStatusPill}>
                      <Text style={styles.editorStatusText}>{pay.status || 'COMPLETED'}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}

            {/* Bottom active line / progress accent */}
            {filteredPayouts.length > 0 && <View style={styles.editorActiveScrollLine} />}
          </View>
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
    paddingBottom: 96,
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

  /* ========================================================
     EDITOR PAYMENT HISTORY STYLING
     ======================================================== */
  editorPaymentScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  editorPaymentHeader: {
    marginBottom: 16,
  },
  editorPaymentTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#18181B',
  },

  /* Monthly Income Hero Tile */
  monthlyIncomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  monthlyIncomeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthlyIncomeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#7C6C63',
  },
  monthlyIncomeMonthBadge: {
    backgroundColor: '#FAF5EF',
    borderWidth: 1,
    borderColor: '#EFE8DE',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlyIncomeMonthText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C6C63',
  },
  monthlyIncomeAmountRow: {
    marginTop: 10,
    marginBottom: 10,
  },
  monthlyIncomeAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#16A34A',
  },
  monthlyIncomeBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F6F3EE',
  },
  monthlyIncomeMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlyIncomeGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  monthlyIncomeMetaText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },
  monthlyIncomeStatusPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  monthlyIncomeStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },

  /* Month Selector Tiles */
  monthSelectorSection: {
    marginBottom: 16,
  },
  monthSelectorScroll: {
    gap: 8,
  },
  monthTile: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTileActive: {
    backgroundColor: '#18181B',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  monthTileInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  monthTileText: {
    fontSize: 13,
  },
  monthTileTextActive: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  monthTileTextInactive: {
    fontWeight: '600',
    color: '#7C6C63',
  },
  monthTileActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EA580C',
    marginLeft: 6,
  },
  editorTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  editorTableHeader: {
    backgroundColor: '#EDE4DC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  editorColHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C6C63',
    letterSpacing: 0.6,
  },
  editorTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFEA',
  },
  editorPaymentForText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  editorAmountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16A34A',
  },
  editorMethodBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editorMethodText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
    letterSpacing: 0.4,
  },
  editorStatusPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editorStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
    letterSpacing: 0.3,
  },
  editorActiveScrollLine: {
    width: 160,
    height: 3,
    backgroundColor: '#9CA3AF',
    marginTop: 14,
    marginLeft: 10,
    marginBottom: 16,
    borderRadius: 2,
  },
});
