import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { StatusBadge, mapOrderStatusToVariant, mapReviewStatusToVariant } from '@/components/common/status-badge';
import { MoneyView, formatCurrency } from '@/components/common/money-view';
import { Button } from '@/components/common/button';
import { StateView } from '@/components/common/state-view';
import { OrderStatus } from '@/types/orders';

type OrderTabKey = 'OVERVIEW' | 'EVENTS' | 'EDITING' | 'ACTIVITIES' | 'MONEY' | 'CLIENT';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, permissions } = useAuth();
  const {
    orders,
    events,
    editingTasks,
    activities,
    updateOrderStatus,
    rescheduleOrder,
    deleteOrder,
    togglePinOrder,
    updateActivityStatus,
    resetClientPin,
  } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  const [activeTab, setActiveTab] = useState<OrderTabKey>('OVERVIEW');
  const [issuedOneTimePin, setIssuedOneTimePin] = useState<string | null>(null);

  const order = orders.find(o => o.id === id || o.tenantOrderNumber === id);

  if (!order) {
    return (
      <ScreenWrapper>
        <StateView
          type="error"
          title="Booking Not Found"
          message="This order record may have been deleted or does not belong to this studio."
          actionTitle="Back to Orders"
          onAction={() => router.back()}
        />
      </ScreenWrapper>
    );
  }

  const orderEvents = events.filter(e => e.orderId === order.id);
  const orderTasks = editingTasks.filter(t => t.orderId === order.id);
  const orderActivities = activities.filter(a => a.orderId === order.id);

  const isOwnerOrAdmin = session?.roles.includes('OWNER') || session?.roles.includes('ADMIN');
  const isManager = session?.roles.includes('MANAGER');
  const canEditBooking = isOwnerOrAdmin || (isManager && permissions.orderSections.client === 'edit');
  const canSeeMoney = permissions.money.revenue !== 'none';
  const canSeeCost = permissions.money.cost !== 'none';
  const canSeeMargin = permissions.money.margin !== 'none';

  // Share Public Link (CLIENT-01, CLIENT-02)
  const handleShareLink = async (type: 'BOOKING' | 'CONTRACT') => {
    try {
      const url =
        type === 'BOOKING'
          ? `https://${session?.studio.subdomain}.wedtrack.com/book/${order.tenantOrderNumber}`
          : `https://${session?.studio.subdomain}.wedtrack.com/client-portal/contract/${order.tenantOrderNumber}`;
      await Share.share({
        title: `${order.title} - ${type === 'BOOKING' ? 'Booking Portal' : 'Contract'}`,
        message: `WedTrack Studio Portal Link: ${url}`,
        url,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  // Reset Client PIN (CLIENT-04)
  const handleResetPin = () => {
    Alert.alert(
      'Reset Client Portal PIN',
      `This will revoke the client's current session and generate a new one-time PIN for ${order.clientName}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate New PIN',
          onPress: () => {
            const pin = resetClientPin(order.id);
            setIssuedOneTimePin(pin);
          },
        },
      ]
    );
  };

  // Change Status (ORD-07)
  const handleChangeStatus = (newStatus: OrderStatus) => {
    Alert.alert('Confirm Status Change', `Move booking ${order.tenantOrderNumber} to ${newStatus}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Proceed',
        onPress: () => updateOrderStatus(order.id, newStatus),
      },
    ]);
  };

  // Reschedule (ORD-08)
  const handleReschedule = () => {
    Alert.prompt
      ? Alert.prompt('Reschedule Booking', 'Enter new date (YYYY-MM-DD):', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: (text?: string) => {
              if (text) rescheduleOrder(order.id, `${text}T18:00:00Z`, true);
            },
          },
        ])
      : rescheduleOrder(order.id, '2026-12-18T18:00:00Z', true);
  };

  // Delete Order (ORD-09)
  const handleDeleteOrder = () => {
    Alert.alert(
      'Remove Order Record',
      `Are you sure you want to permanently delete order ${order.tenantOrderNumber}? Review media and task links will also be removed. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: () => {
            deleteOrder(order.id);
            router.replace('/(tabs)/orders');
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Top Header Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg },
          ]}
        >
          <View style={styles.topRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[typography.headline, { color: colors.textMuted }]}>
                {order.tenantOrderNumber}
              </Text>
              {isOwnerOrAdmin && (
                <TouchableOpacity onPress={() => togglePinOrder(order.id)}>
                  <Ionicons
                    name={order.priority === 'PINNED' ? 'pin' : 'pin-outline'}
                    size={18}
                    color={order.priority === 'PINNED' ? colors.gold : colors.textMuted}
                  />
                </TouchableOpacity>
              )}
            </View>
            <StatusBadge label={order.status} variant={mapOrderStatusToVariant(order.status)} />
          </View>

          <Text style={[typography.title1, { color: colors.textPrimary, marginTop: 4 }]}>
            {order.title}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Client: {order.clientName} · {order.packageName || 'Custom Package'}
          </Text>

          {/* Status Progression Controls */}
          {canEditBooking && (
            <View style={[styles.statusActionsRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.md, paddingTop: spacing.sm }]}>
              {order.status === 'PENDING' && (
                <Button
                  title="Confirm Booking (Uses 3 Credits)"
                  onPress={() => handleChangeStatus('CONFIRMED')}
                  size="sm"
                  variant="primary"
                />
              )}
              {order.status === 'CONFIRMED' && (
                <Button
                  title="Move to In Progress"
                  onPress={() => handleChangeStatus('IN_PROGRESS')}
                  size="sm"
                  variant="primary"
                />
              )}
              {order.status === 'IN_PROGRESS' && (
                <Button
                  title="Mark Completed"
                  onPress={() => handleChangeStatus('COMPLETED')}
                  size="sm"
                  variant="primary"
                />
              )}
              {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                <Button
                  title="Reschedule Date"
                  onPress={handleReschedule}
                  size="sm"
                  variant="outline"
                  style={{ marginLeft: 8 }}
                />
              )}
            </View>
          )}
        </View>

        {/* Section Navigation Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing.md, marginBottom: spacing.xs }}
          contentContainerStyle={{ gap: 6 }}
        >
          {(
            [
              { key: 'OVERVIEW', label: 'Overview' },
              { key: 'EVENTS', label: `Events (${orderEvents.length})` },
              { key: 'EDITING', label: `Editing (${orderTasks.length})` },
              { key: 'ACTIVITIES', label: `Activities (${orderActivities.length})` },
              ...(canSeeMoney ? [{ key: 'MONEY', label: 'Financials' }] : []),
              { key: 'CLIENT', label: 'Client Support' },
            ] as const
          ).map(tab => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as OrderTabKey)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: radii.full,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption1,
                    { color: isSelected ? colors.primaryText : colors.textSecondary, fontWeight: '600' },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <View style={{ marginTop: spacing.sm }}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
              <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
                Client & Event Details
              </Text>

              <View style={styles.detailRow}>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>Event Date:</Text>
                <Text style={[typography.headline, { color: colors.textPrimary }]}>
                  {new Date(order.eventDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>Venue / Location:</Text>
                <Text style={[typography.body, { color: colors.textPrimary }]}>{order.venueLocation || 'TBD'}</Text>
              </View>

              {order.primaryContactName && (
                <View style={styles.detailRow}>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>Primary Contact:</Text>
                  <Text style={[typography.body, { color: colors.textPrimary }]}>
                    {order.primaryContactName} ({order.primaryContactPhone})
                  </Text>
                </View>
              )}

              {order.clientAddress && (
                <View style={styles.detailRow}>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>Client Address:</Text>
                  <Text style={[typography.body, { color: colors.textPrimary }]}>{order.clientAddress}</Text>
                </View>
              )}

              {order.notes && (
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>Special Notes:</Text>
                  <Text style={[typography.body, { color: colors.textPrimary, fontStyle: 'italic' }]}>
                    {order.notes}
                  </Text>
                </View>
              )}
            </View>

            {/* Deliverables Checklist */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.md }]}>
              <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
                Contracted Deliverables ({order.deliverables.length})
              </Text>
              {order.deliverables.map(del => (
                <View key={del.id} style={styles.deliverableItem}>
                  <Ionicons
                    name={del.status === 'COMPLETED' ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={del.status === 'COMPLETED' ? colors.success : colors.textMuted}
                  />
                  <Text style={[typography.body, { color: colors.textPrimary, marginLeft: 8, flex: 1 }]}>
                    {del.title}
                  </Text>
                  <StatusBadge label={del.status} variant={del.status === 'COMPLETED' ? 'success' : 'neutral'} size="sm" />
                </View>
              ))}
            </View>

            {/* Admin Delete Order Action (ORD-09) */}
            {isOwnerOrAdmin && (
              <Button
                title="Permanently Remove Order"
                onPress={handleDeleteOrder}
                variant="destructive"
                size="md"
                style={{ marginTop: spacing.xl }}
              />
            )}
          </View>
        )}

        {/* TAB 2: EVENTS & CREW */}
        {activeTab === 'EVENTS' && (
          <View style={{ marginTop: spacing.sm }}>
            {orderEvents.map(evt => (
              <TouchableOpacity
                key={evt.id}
                onPress={() => router.push(`/events/${evt.id}` as any)}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginBottom: spacing.sm }]}
              >
                <View style={styles.topRow}>
                  <Text style={[typography.headline, { color: colors.textPrimary }]}>{evt.eventTypeName}</Text>
                  <StatusBadge label={evt.status} size="sm" />
                </View>
                <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                  {new Date(evt.startTime).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                  })} · {evt.venueName}
                </Text>

                <View style={[styles.crewAllocBox, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.xs }]}>
                  <Text style={[typography.caption2, { color: colors.textMuted }]}>CREW ALLOCATED:</Text>
                  {evt.assignments.length === 0 ? (
                    <Text style={[typography.footnote, { color: colors.warningText, marginTop: 2 }]}>
                      ⚠️ No crew assigned yet
                    </Text>
                  ) : (
                    evt.assignments.map(a => (
                      <Text key={a.id} style={[typography.caption1, { color: colors.textPrimary, marginTop: 2 }]}>
                        • {a.agentName} ({a.role}{a.isPrimary ? ' · Primary' : ''})
                      </Text>
                    ))
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* TAB 3: EDITING & REVIEW */}
        {activeTab === 'EDITING' && (
          <View style={{ marginTop: spacing.sm }}>
            {orderTasks.map(task => (
              <View
                key={task.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginBottom: spacing.sm }]}
              >
                <View style={styles.topRow}>
                  <Text style={[typography.headline, { color: colors.textPrimary }]}>{task.title}</Text>
                  <StatusBadge label={task.status} size="sm" />
                </View>
                <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                  Assignee: {task.editorName || 'Unassigned'} · Category: {task.category}
                </Text>

                {task.isReviewable && task.reviewItemId && (
                  <View style={{ marginTop: spacing.sm }}>
                    <Button
                      title="Open Review Portal"
                      onPress={() => router.push(`/review/${task.reviewItemId}` as any)}
                      size="sm"
                      variant="primary"
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* TAB 4: ACTIVITIES */}
        {activeTab === 'ACTIVITIES' && (
          <View style={{ marginTop: spacing.sm }}>
            <Text style={[typography.footnote, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
              Standard workflow checklist activities for this booking:
            </Text>
            {orderActivities.map(act => (
              <View
                key={act.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginBottom: spacing.sm }]}
              >
                <View style={styles.topRow}>
                  <Text style={[typography.headline, { color: colors.textPrimary }]}>{act.title}</Text>
                  <StatusBadge
                    label={act.isCompleted ? 'COMPLETED' : act.currentStatus}
                    variant={act.isCompleted ? 'success' : 'info'}
                    size="sm"
                  />
                </View>
                <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
                  Assigned: {act.assignedStaffName || 'Staff'} · {act.description}
                </Text>

                {/* Status progression stepper */}
                <View style={{ flexDirection: 'row', gap: 6, marginTop: spacing.sm }}>
                  {act.statuses.map((st, idx) => (
                    <TouchableOpacity
                      key={st}
                      onPress={() => updateActivityStatus(act.id, idx)}
                      style={[
                        styles.statusStepBtn,
                        {
                          backgroundColor: idx <= act.currentStatusIndex ? colors.primary : colors.surfaceSubtle,
                          borderColor: colors.border,
                          borderRadius: radii.xs,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.caption2,
                          { color: idx <= act.currentStatusIndex ? colors.primaryText : colors.textSecondary },
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 5: FINANCIAL BREAKDOWN (PAY-06) */}
        {activeTab === 'MONEY' && canSeeMoney && order.financials && (
          <View style={{ marginTop: spacing.sm }}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
              <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                Order Financial Ledger
              </Text>

              <View style={styles.detailRow}>
                <Text style={[typography.body, { color: colors.textSecondary }]}>Total Booking Price:</Text>
                <MoneyView amount={order.financials.totalAmount} permission={permissions.money.revenue} />
              </View>

              <View style={styles.detailRow}>
                <Text style={[typography.body, { color: colors.textSecondary }]}>Advance Paid by Client:</Text>
                <MoneyView amount={order.financials.paidAmount} permission={permissions.money.revenue} style={{ color: colors.success }} />
              </View>

              <View style={styles.detailRow}>
                <Text style={[typography.body, { color: colors.textSecondary }]}>Balance Due:</Text>
                <MoneyView
                  amount={order.financials.balanceDue}
                  permission={permissions.money.revenue}
                  style={{ color: (order.financials.balanceDue || 0) > 0 ? colors.warning : colors.success }}
                />
              </View>

              {canSeeCost && (
                <>
                  <View style={[styles.detailRow, { marginTop: spacing.xs }]}>
                    <Text style={[typography.body, { color: colors.textSecondary }]}>Crew Cost:</Text>
                    <MoneyView amount={order.financials.crewCost} permission={permissions.money.cost} />
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[typography.body, { color: colors.textSecondary }]}>Editor Cost:</Text>
                    <MoneyView amount={order.financials.editorCost} permission={permissions.money.cost} />
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[typography.body, { color: colors.textSecondary }]}>Extra / Misc Costs:</Text>
                    <MoneyView amount={order.financials.extraCost} permission={permissions.money.cost} />
                  </View>
                </>
              )}

              {canSeeMargin && (
                <View style={[styles.detailRow, { borderBottomWidth: 0, marginTop: spacing.xs }]}>
                  <Text style={[typography.headline, { color: colors.textPrimary }]}>Estimated Gross Margin:</Text>
                  <MoneyView amount={order.financials.margin} permission={permissions.money.margin} style={[typography.title3, { color: colors.gold }]} />
                </View>
              )}
            </View>
          </View>
        )}

        {/* TAB 6: CLIENT PORTAL & PIN SUPPORT */}
        {activeTab === 'CLIENT' && (
          <View style={{ marginTop: spacing.sm }}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
              <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
                Client Web Portal Links
              </Text>
              <Text style={[typography.caption1, { color: colors.textSecondary, marginBottom: spacing.md }]}>
                Share verified portal links with the client. Staff cannot impersonate or submit client approvals.
              </Text>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  title="Share Booking Link"
                  onPress={() => handleShareLink('BOOKING')}
                  size="sm"
                  variant="outline"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Share Contract Link"
                  onPress={() => handleShareLink('CONTRACT')}
                  size="sm"
                  variant="outline"
                  style={{ flex: 1 }}
                />
              </View>
            </View>

            {/* Client Access State (CLIENT-03) */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.md }]}>
              <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
                Client Sign-In Status
              </Text>

              <View style={styles.detailRow}>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>Account Status:</Text>
                <Text style={[typography.body, { color: order.clientAccess.hasAccount ? colors.success : colors.warning }]}>
                  {order.clientAccess.hasAccount ? 'Account Active' : 'Not Registered Yet'}
                </Text>
              </View>

              {order.clientAccess.maskedPhone && (
                <View style={styles.detailRow}>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>Masked Phone:</Text>
                  <Text style={[typography.body, { color: colors.textPrimary }]}>{order.clientAccess.maskedPhone}</Text>
                </View>
              )}

              {order.clientAccess.pinIssuedAt && (
                <View style={styles.detailRow}>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>Last PIN Issued:</Text>
                  <Text style={[typography.body, { color: colors.textPrimary }]}>
                    {new Date(order.clientAccess.pinIssuedAt).toLocaleDateString('en-IN')}
                  </Text>
                </View>
              )}

              {/* Reset Client PIN (CLIENT-04) */}
              {isOwnerOrAdmin && (
                <View style={{ marginTop: spacing.md }}>
                  <Button
                    title="Reset Client Access PIN"
                    onPress={handleResetPin}
                    size="sm"
                    variant="primary"
                  />
                </View>
              )}

              {/* One-Time Issued PIN Box */}
              {issuedOneTimePin && (
                <View
                  style={[
                    styles.oneTimePinBox,
                    { backgroundColor: colors.goldSubtle, borderColor: colors.gold, borderRadius: radii.md, marginTop: spacing.md },
                  ]}
                >
                  <Text style={[typography.caption2, { color: colors.gold, fontWeight: '700' }]}>
                    NEW CLIENT ACCESS PIN (ONE-TIME DISPLAY)
                  </Text>
                  <Text style={[typography.largeTitle, { color: colors.textPrimary, letterSpacing: 4, marginTop: 4 }]}>
                    {issuedOneTimePin}
                  </Text>
                  <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 4 }]}>
                    Pass this PIN directly to the client. For security, this PIN is never stored in plain text and will not be displayed again.
                  </Text>
                  <Button
                    title="Dismiss"
                    onPress={() => setIssuedOneTimePin(null)}
                    size="sm"
                    variant="outline"
                    style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
                  />
                </View>
              )}
            </View>
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
  card: {
    padding: 16,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  deliverableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  crewAllocBox: {
    borderTopWidth: 1,
  },
  statusStepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  oneTimePinBox: {
    padding: 14,
    borderWidth: 1,
  },
});
