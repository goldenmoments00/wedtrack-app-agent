import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { DemoBanner } from '@/components/common/demo-banner';
import { StatusBadge, mapOrderStatusToVariant, mapReviewStatusToVariant } from '@/components/common/status-badge';
import { MoneyView, formatCurrency } from '@/components/common/money-view';
import { Button } from '@/components/common/button';
import { StateView } from '@/components/common/state-view';

export default function TabIndexScreen() {
  const { session, permissions } = useAuth();
  const {
    orders,
    events,
    editingTasks,
    payroll,
    claimTask,
  } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const workspace = session?.activeWorkspace || 'OPERATIONS';

  // ----------------------------------------------------
  // 1. OPERATIONS DASHBOARD (Admin / Owner / Manager)
  // ----------------------------------------------------
  if (workspace === 'OPERATIONS') {
    const totalBookings = orders.length;
    const pendingBookings = orders.filter(o => o.status === 'PENDING').length;
    const confirmedBookings = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'ASSIGNED').length;
    const inProgressBookings = orders.filter(o => o.status === 'IN_PROGRESS').length;
    const completedBookings = orders.filter(o => o.status === 'COMPLETED').length;

    // Staffing gaps: events that have unassigned status or photographers/videographers needed > assignments
    const staffingGaps = events.filter(e => {
      const pAssigned = e.assignments.filter(a => a.role === 'PHOTOGRAPHER').length;
      const vAssigned = e.assignments.filter(a => a.role === 'VIDEOGRAPHER').length;
      return pAssigned < e.photographersNeeded || vAssigned < e.videographersNeeded;
    });

    // Money totals (only calculate if permissions allow)
    const canSeeRevenue = permissions.money.revenue !== 'none';
    const canSeeCost = permissions.money.cost !== 'none';
    const canSeeMargin = permissions.money.margin !== 'none';

    let totalRevenue = 0;
    let totalPaid = 0;
    let totalCrewCost = 0;
    let totalEditorCost = 0;

    orders.forEach(o => {
      if (o.financials) {
        totalRevenue += o.financials.totalAmount || 0;
        totalPaid += o.financials.paidAmount || 0;
        totalCrewCost += o.financials.crewCost || 0;
        totalEditorCost += o.financials.editorCost || 0;
      }
    });

    const totalCost = totalCrewCost + totalEditorCost;
    const totalMargin = totalRevenue - totalCost;

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <DemoBanner />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header Action Row */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[typography.title1, { color: colors.textPrimary }]}>Studio Overview</Text>
              <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                {session?.studio.name} · {session?.primaryRole}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                title="+ Wedding"
                onPress={() => router.push('/orders/create-wedding')}
                size="sm"
                variant="primary"
              />
              <Button
                title="+ Occasion"
                onPress={() => router.push('/orders/create-occasion')}
                size="sm"
                variant="outline"
              />
            </View>
          </View>

          {/* Money Overview Card (Obeying strict RBAC) */}
          {canSeeRevenue && (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, marginTop: spacing.md },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[typography.headline, { color: colors.textPrimary }]}>
                  Financial Snapshot
                </Text>
                <Text style={[typography.caption2, { color: colors.gold, fontWeight: '700' }]}>
                  AUTHORITATIVE LEDGER
                </Text>
              </View>

              <View style={[styles.statsGrid, { marginTop: spacing.sm }]}>
                <View style={styles.statBox}>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>Total Bookings</Text>
                  <MoneyView amount={totalRevenue} permission={permissions.money.revenue} style={typography.title2} />
                </View>

                <View style={styles.statBox}>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>Collected Advance</Text>
                  <MoneyView amount={totalPaid} permission={permissions.money.revenue} style={[typography.title2, { color: colors.success }]} />
                </View>

                {canSeeCost && (
                  <View style={styles.statBox}>
                    <Text style={[typography.caption1, { color: colors.textSecondary }]}>Estimated Costs</Text>
                    <MoneyView amount={totalCost} permission={permissions.money.cost} style={typography.title2} />
                  </View>
                )}

                {canSeeMargin && (
                  <View style={styles.statBox}>
                    <Text style={[typography.caption1, { color: colors.textSecondary }]}>Gross Margin</Text>
                    <MoneyView amount={totalMargin} permission={permissions.money.margin} style={[typography.title2, { color: colors.gold }]} />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Operational Workflow Counts (OPS-01) */}
          <View style={[styles.statsRow, { marginTop: spacing.md }]}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/orders')}
              style={[styles.countCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}
            >
              <Text style={[typography.largeTitle, { color: colors.primary }]}>{totalBookings}</Text>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>All Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/orders')}
              style={[styles.countCard, { backgroundColor: colors.surface, borderColor: colors.warning, borderRadius: radii.md }]}
            >
              <Text style={[typography.largeTitle, { color: colors.warning }]}>{pendingBookings}</Text>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Pending</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/orders')}
              style={[styles.countCard, { backgroundColor: colors.surface, borderColor: colors.info, borderRadius: radii.md }]}
            >
              <Text style={[typography.largeTitle, { color: colors.info }]}>{inProgressBookings}</Text>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>In Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/orders')}
              style={[styles.countCard, { backgroundColor: colors.surface, borderColor: colors.success, borderRadius: radii.md }]}
            >
              <Text style={[typography.largeTitle, { color: colors.success }]}>{completedBookings}</Text>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Completed</Text>
            </TouchableOpacity>
          </View>

          {/* Staffing Gaps Alert */}
          {staffingGaps.length > 0 && (
            <View
              style={[
                styles.gapCard,
                { backgroundColor: colors.warningSubtle, borderColor: colors.warning, borderRadius: radii.md, marginTop: spacing.md },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="warning-outline" size={20} color={colors.warning} />
                <Text style={[typography.headline, { color: colors.warningText, marginLeft: spacing.xs }]}>
                  {staffingGaps.length} Events Need Crew
                </Text>
              </View>
              <Text style={[typography.footnote, { color: colors.textPrimary, marginTop: 4 }]}>
                Upcoming events have open photographer or videographer slots. Tap below to allocate active crew.
              </Text>
              <Button
                title="Review Staffing Gaps"
                onPress={() => router.push('/(tabs)/schedule')}
                size="sm"
                variant="outline"
                style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
              />
            </View>
          )}

          {/* Active Orders List */}
          <View style={{ marginTop: spacing.lg }}>
            <View style={styles.sectionHeader}>
              <Text style={[typography.title2, { color: colors.textPrimary }]}>Active Bookings</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                <Text style={[typography.footnote, { color: colors.primary, fontWeight: '600' }]}>
                  View All ({orders.length}) →
                </Text>
              </TouchableOpacity>
            </View>

            {orders.slice(0, 3).map(order => (
              <TouchableOpacity
                key={order.id}
                onPress={() => router.push(`/orders/${order.id}` as any)}
                style={[
                  styles.orderCard,
                  { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.sm },
                ]}
              >
                <View style={styles.orderTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[typography.caption2, { color: colors.textMuted }]}>
                      {order.tenantOrderNumber}
                    </Text>
                    {order.priority === 'PINNED' && (
                      <Ionicons name="pin" size={14} color={colors.gold} />
                    )}
                  </View>
                  <StatusBadge label={order.status} variant={mapOrderStatusToVariant(order.status)} size="sm" />
                </View>

                <Text style={[typography.headline, { color: colors.textPrimary, marginTop: 4 }]}>
                  {order.title}
                </Text>

                <View style={styles.orderMetaRow}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                  <Text style={[typography.caption1, { color: colors.textSecondary, marginLeft: 4 }]}>
                    {new Date(order.eventDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={[typography.caption1, { color: colors.textMuted, marginHorizontal: 6 }]}>•</Text>
                  <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                  <Text style={[typography.caption1, { color: colors.textSecondary, marginLeft: 4 }]} numberOfLines={1}>
                    {order.venueLocation || 'Venue TBD'}
                  </Text>
                </View>

                {canSeeRevenue && order.financials && (
                  <View style={[styles.orderPriceRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.xs }]}>
                    <Text style={[typography.caption1, { color: colors.textSecondary }]}>Price / Balance Due:</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <MoneyView amount={order.financials.totalAmount} permission={permissions.money.revenue} />
                      <Text style={[typography.caption1, { color: colors.textMuted }]}>/</Text>
                      <MoneyView
                        amount={order.financials.balanceDue}
                        permission={permissions.money.revenue}
                        style={{ color: (order.financials.balanceDue || 0) > 0 ? colors.warning : colors.success }}
                      />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // 2. AGENT WORKSPACE (My Shoots / Schedule)
  // ----------------------------------------------------
  if (workspace === 'SHOOTS') {
    // Filter events assigned to this agent
    const agentId = session?.id || 'usr-agt-01';
    const myEvents = events.filter(e => e.assignments.some(a => a.agentId === agentId));

    // Completed shoots with pending submissions (AGT-03)
    const pendingSubmissions = myEvents.filter(e => {
      const myAsg = e.assignments.find(a => a.agentId === agentId);
      return e.status === 'COMPLETED' && myAsg && myAsg.submissionCount === undefined;
    });

    const upcomingEvents = myEvents.filter(e => e.status !== 'COMPLETED' && e.status !== 'CANCELLED');
    const completedEvents = myEvents.filter(e => e.status === 'COMPLETED');

    const handleCall = (phone?: string) => {
      if (phone) Linking.openURL(`tel:${phone}`);
    };

    const handleMap = (mapUrl?: string) => {
      if (mapUrl) Linking.openURL(mapUrl);
    };

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <DemoBanner />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={[typography.title1, { color: colors.textPrimary }]}>My Shoots</Text>
              <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                {session?.name} · {session?.agentProfession || 'Crew Member'}
              </Text>
            </View>
          </View>

          {/* Pending Submissions Alert (AGT-03) */}
          {pendingSubmissions.length > 0 && (
            <View
              style={[
                styles.gapCard,
                { backgroundColor: colors.warningSubtle, borderColor: colors.warning, borderRadius: radii.md, marginTop: spacing.md },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="cloud-upload" size={20} color={colors.warning} />
                <Text style={[typography.headline, { color: colors.warningText, marginLeft: spacing.xs }]}>
                  {pendingSubmissions.length} Completed Shoots Awaiting Count Submission
                </Text>
              </View>
              <Text style={[typography.footnote, { color: colors.textPrimary, marginTop: 4 }]}>
                Please enter your final photo/video count so studio managers can mark materials received.
              </Text>
              <Button
                title="Enter Counts Now"
                onPress={() => router.push('/(tabs)/orders')} // Tab 2 is Submissions for Agent
                size="sm"
                variant="primary"
                style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
              />
            </View>
          )}

          {/* Upcoming Shoots */}
          <Text style={[typography.title2, { color: colors.textPrimary, marginTop: spacing.lg }]}>
            Upcoming Assignments ({upcomingEvents.length})
          </Text>

          {upcomingEvents.length === 0 ? (
            <StateView type="empty" title="No Upcoming Shoots" message="You have no pending shoot assignments scheduled." />
          ) : (
            upcomingEvents.map(evt => {
              const myAsg = evt.assignments.find(a => a.agentId === agentId);
              return (
                <View
                  key={evt.id}
                  style={[
                    styles.orderCard,
                    { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.sm },
                  ]}
                >
                  <View style={styles.orderTopRow}>
                    <Text style={[typography.caption2, { color: colors.textMuted }]}>{evt.tenantOrderNumber}</Text>
                    <StatusBadge label={myAsg?.role || 'CREW'} variant="info" size="sm" />
                  </View>

                  <Text style={[typography.title3, { color: colors.textPrimary, marginTop: 2 }]}>
                    {evt.eventTypeName}
                  </Text>
                  <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                    {evt.orderTitle}
                  </Text>

                  <View style={[styles.orderMetaRow, { marginTop: 6 }]}>
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

                  <View style={[styles.orderMetaRow, { marginTop: 4 }]}>
                    <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                    <Text style={[typography.caption1, { color: colors.textSecondary, marginLeft: 4, flex: 1 }]}>
                      {evt.venueName} · {evt.venueAddress}
                    </Text>
                  </View>

                  {/* Contact & Map Action Buttons */}
                  <View style={[styles.actionBtnRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.xs }]}>
                    {evt.contactPhone && (
                      <TouchableOpacity onPress={() => handleCall(evt.contactPhone)} style={styles.iconBtn}>
                        <Ionicons name="call-outline" size={16} color={colors.primary} />
                        <Text style={[typography.caption1, { color: colors.primary, marginLeft: 4 }]}>Call Contact</Text>
                      </TouchableOpacity>
                    )}
                    {evt.venueMapUrl && (
                      <TouchableOpacity onPress={() => handleMap(evt.venueMapUrl)} style={[styles.iconBtn, { marginLeft: spacing.md }]}>
                        <Ionicons name="map-outline" size={16} color={colors.primary} />
                        <Text style={[typography.caption1, { color: colors.primary, marginLeft: 4 }]}>Open Map</Text>
                      </TouchableOpacity>
                    )}

                    {/* Own Assignment Pay */}
                    {myAsg?.assignmentPay && (
                      <View style={{ marginLeft: 'auto' }}>
                        <Text style={[typography.caption2, { color: colors.textMuted }]}>Assignment Pay</Text>
                        <Text style={[typography.headline, { color: colors.textPrimary }]}>
                          {formatCurrency(myAsg.assignmentPay)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // 3. EDITOR WORKSPACE (My Work / Review)
  // ----------------------------------------------------
  if (workspace === 'EDITING') {
    const editorId = session?.id || 'usr-edr-01';
    const myTasks = editingTasks.filter(t => t.editorId === editorId);

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <DemoBanner />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={[typography.title1, { color: colors.textPrimary }]}>My Editing Work</Text>
              <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                {session?.name} · {session?.editorCategories?.join(', ') || 'Editor'}
              </Text>
            </View>
          </View>

          {myTasks.length === 0 ? (
            <StateView
              type="empty"
              title="No Tasks Assigned"
              message="You currently have no editing tasks assigned to your queue."
              actionTitle="Discover Available Work"
              onAction={() => router.push('/(tabs)/orders')}
            />
          ) : (
            myTasks.map(task => (
              <View
                key={task.id}
                style={[
                  styles.orderCard,
                  { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.sm },
                ]}
              >
                <View style={styles.orderTopRow}>
                  <Text style={[typography.caption2, { color: colors.textMuted }]}>{task.tenantOrderNumber}</Text>
                  <StatusBadge label={task.status} variant={task.status === 'COMPLETED' ? 'success' : 'info'} size="sm" />
                </View>

                <Text style={[typography.title3, { color: colors.textPrimary, marginTop: 2 }]}>
                  {task.title}
                </Text>
                <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                  {task.orderTitle} · Category: {task.category}
                </Text>

                {task.description && (
                  <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 4 }]}>
                    {task.description}
                  </Text>
                )}

                {/* Review Portal Connection for Reviewable tasks (ALBUM, FILM, REEL, HIGHLIGHT) */}
                {task.isReviewable && task.reviewItemId && (
                  <View
                    style={[
                      styles.reviewStatusBox,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.borderSubtle,
                        borderRadius: radii.sm,
                        marginTop: spacing.sm,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[typography.caption2, { color: colors.textSecondary, fontWeight: '600' }]}>
                        CLIENT MEDIA REVIEW
                      </Text>
                      <StatusBadge
                        label={task.reviewStatus || 'NOT_UPLOADED'}
                        variant={mapReviewStatusToVariant(task.reviewStatus || '')}
                        size="sm"
                      />
                    </View>

                    <Button
                      title="Open Review & Comments"
                      onPress={() => router.push(`/review/${task.reviewItemId}` as any)}
                      size="sm"
                      variant="primary"
                      style={{ marginTop: spacing.xs }}
                    />
                  </View>
                )}

                {/* Task Pay (Self-access exception) */}
                {task.cost && (
                  <View style={[styles.orderPriceRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.xs }]}>
                    <Text style={[typography.caption1, { color: colors.textSecondary }]}>Task Compensation:</Text>
                    <Text style={[typography.headline, { color: colors.textPrimary }]}>
                      {formatCurrency(task.cost)}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    padding: 16,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countCard: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  gapCard: {
    padding: 14,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderCard: {
    padding: 14,
    borderWidth: 1,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  orderPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewStatusBox: {
    padding: 10,
    borderWidth: 1,
  },
});
