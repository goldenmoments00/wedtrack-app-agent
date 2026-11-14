import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { DemoBanner } from '@/components/common/demo-banner';
import { StatusBadge, mapOrderStatusToVariant } from '@/components/common/status-badge';
import { MoneyView } from '@/components/common/money-view';
import { Button } from '@/components/common/button';
import { StateView } from '@/components/common/state-view';
import { OrderStatus } from '@/types/orders';

export default function TabOrdersScreen() {
  const { session, permissions } = useAuth();
  const {
    orders,
    events,
    editingTasks,
    submitShootCounts,
    claimTask,
  } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Submissions state for Agent
  const [submittingAsgId, setSubmittingAsgId] = useState<string | null>(null);
  const [photoCountInput, setPhotoCountInput] = useState('450');
  const [videoCountInput, setVideoCountInput] = useState('35');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const workspace = session?.activeWorkspace || 'OPERATIONS';
  const isAgent = workspace === 'SHOOTS';
  const isEditor = workspace === 'EDITING';

  // ----------------------------------------------------
  // AGENT SUBMISSIONS TAB (AGT-03, AGT-04)
  // ----------------------------------------------------
  if (isAgent) {
    const agentId = session?.id || 'usr-agt-01';
    // Find all assignments for this agent
    const agentAssignments: {
      event: (typeof events)[0];
      assignment: (typeof events)[0]['assignments'][0];
    }[] = [];

    events.forEach(e => {
      e.assignments.forEach(a => {
        if (a.agentId === agentId) {
          agentAssignments.push({ event: e, assignment: a });
        }
      });
    });

    const pendingSubmissions = agentAssignments.filter(
      item => item.event.status === 'COMPLETED' && item.assignment.submissionCount === undefined
    );
    const submittedHistory = agentAssignments.filter(
      item => item.assignment.submissionCount !== undefined
    );

    const handleConfirmSubmission = (eventId: string, assignmentId: string, role: any) => {
      submitShootCounts({
        eventId,
        assignmentId,
        role,
        photoCount: role === 'PHOTOGRAPHER' ? parseInt(photoCountInput, 10) || 0 : undefined,
        videoCount: role === 'VIDEOGRAPHER' ? parseInt(videoCountInput, 10) || 0 : undefined,
      });
      setSubmittingAsgId(null);
      Alert.alert('Counts Submitted', 'Your deliverables count has been recorded in the studio log.');
    };

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <DemoBanner />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={[typography.title1, { color: colors.textPrimary }]}>
            Deliverables Submission
          </Text>
          <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
            Submit your captured photo/video counts for completed shoots
          </Text>

          {/* Pending Submissions */}
          <Text style={[typography.title3, { color: colors.textPrimary, marginTop: spacing.lg }]}>
            Pending Submissions ({pendingSubmissions.length})
          </Text>

          {pendingSubmissions.length === 0 ? (
            <StateView
              type="empty"
              title="All Caught Up!"
              message="No outstanding completed shoots awaiting count submission."
            />
          ) : (
            pendingSubmissions.map(({ event, assignment }) => (
              <View
                key={assignment.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.warning, borderRadius: radii.md, marginTop: spacing.sm },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[typography.caption2, { color: colors.textMuted }]}>{event.tenantOrderNumber}</Text>
                  <StatusBadge label="AWAITING COUNTS" variant="warning" size="sm" />
                </View>

                <Text style={[typography.headline, { color: colors.textPrimary, marginTop: 2 }]}>
                  {event.eventTypeName}
                </Text>
                <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                  {event.orderTitle} · Role: {assignment.role}
                </Text>

                {submittingAsgId === assignment.id ? (
                  <View style={[styles.inputBox, { borderTopColor: colors.borderSubtle, marginTop: spacing.md, paddingTop: spacing.md }]}>
                    <Text style={[typography.subhead, { color: colors.textPrimary }]}>
                      Enter {assignment.role === 'PHOTOGRAPHER' ? 'Photo Count' : 'Video Footage Count'}
                    </Text>
                    <TextInput
                      value={assignment.role === 'PHOTOGRAPHER' ? photoCountInput : videoCountInput}
                      onChangeText={assignment.role === 'PHOTOGRAPHER' ? setPhotoCountInput : setVideoCountInput}
                      keyboardType="numeric"
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                          borderRadius: radii.sm,
                          marginTop: 6,
                        },
                      ]}
                    />

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
                      <Button
                        title="Submit Count"
                        onPress={() => handleConfirmSubmission(event.id, assignment.id, assignment.role)}
                        size="sm"
                        variant="primary"
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="Cancel"
                        onPress={() => setSubmittingAsgId(null)}
                        size="sm"
                        variant="outline"
                      />
                    </View>
                  </View>
                ) : (
                  <Button
                    title={`Submit ${assignment.role} Counts`}
                    onPress={() => setSubmittingAsgId(assignment.id)}
                    size="sm"
                    variant="primary"
                    style={{ marginTop: spacing.md }}
                  />
                )}
              </View>
            ))
          )}

          {/* Submitted History (AGT-04) */}
          <Text style={[typography.title3, { color: colors.textPrimary, marginTop: spacing.xl }]}>
            Submitted History ({submittedHistory.length})
          </Text>

          {submittedHistory.map(({ event, assignment }) => (
            <View
              key={assignment.id}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.sm },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[typography.caption2, { color: colors.textMuted }]}>{event.tenantOrderNumber}</Text>
                <StatusBadge label="SUBMITTED" variant="success" size="sm" />
              </View>
              <Text style={[typography.headline, { color: colors.textPrimary, marginTop: 2 }]}>
                {event.eventTypeName}
              </Text>
              <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                {assignment.role}: {assignment.submissionCount} items recorded
              </Text>
              <Text style={[typography.caption2, { color: colors.textMuted, marginTop: 4 }]}>
                Material Receipt: {assignment.materialReceived ? 'Verified by Studio' : 'Pending Verification'}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // ORDER BOOK (Admin / Manager / Editor Claiming)
  // ----------------------------------------------------
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch =
        searchQuery.trim() === '' ||
        o.tenantOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.venueLocation && o.venueLocation.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = selectedStatus === 'ALL' || o.status === selectedStatus;

      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, selectedStatus]);

  const statuses = ['ALL', 'PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  // Unassigned tasks eligible for editor self-claiming (EDR-02)
  const unassignedTasks = editingTasks.filter(t => !t.editorId && t.status === 'PENDING');

  const handleClaim = (task: (typeof editingTasks)[0]) => {
    const editorId = session?.id || 'usr-edr-01';
    const editorName = session?.name || 'Editor';
    const ok = claimTask(task.id, editorId, editorName);
    if (ok) {
      Alert.alert('Task Claimed!', `You have claimed "${task.title}". It is now in your My Work queue.`);
    } else {
      Alert.alert('Unavailable', 'This task was just claimed by another editor.');
    }
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
            <Text style={[typography.title1, { color: colors.textPrimary }]}>Order Book</Text>
            <Text style={[typography.footnote, { color: colors.textSecondary }]}>
              {filteredOrders.length} bookings found
            </Text>
          </View>

          {permissions.destinations.includes('Orders') && workspace === 'OPERATIONS' && (
            <Button
              title="+ New Booking"
              onPress={() => router.push('/orders/create-wedding')}
              size="sm"
              variant="primary"
            />
          )}
        </View>

        {/* Unassigned Tasks Banner for Editors (EDR-02) */}
        {isEditor && unassignedTasks.length > 0 && (
          <View
            style={[
              styles.claimBanner,
              { backgroundColor: colors.infoSubtle, borderColor: colors.info, borderRadius: radii.md, marginTop: spacing.md },
            ]}
          >
            <Text style={[typography.headline, { color: colors.infoText }]}>
              {unassignedTasks.length} Available Tasks to Self-Claim
            </Text>
            <Text style={[typography.footnote, { color: colors.textPrimary, marginTop: 2 }]}>
              The studio has unassigned editing tasks in your category. Tap to claim work into your queue.
            </Text>

            {unassignedTasks.map(task => (
              <View
                key={task.id}
                style={[
                  styles.unassignedRow,
                  { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.sm, marginTop: spacing.xs },
                ]}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[typography.headline, { color: colors.textPrimary }]}>{task.title}</Text>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                    {task.orderTitle} · {task.category}
                  </Text>
                </View>
                <Button
                  title="Claim Task"
                  onPress={() => handleClaim(task)}
                  size="sm"
                  variant="primary"
                />
              </View>
            ))}
          </View>
        )}

        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.md },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by order #, couple name or venue..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter Horizontal Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}
          contentContainerStyle={{ gap: 8 }}
        >
          {statuses.map(st => {
            const isSelected = selectedStatus === st;
            return (
              <TouchableOpacity
                key={st}
                onPress={() => setSelectedStatus(st)}
                style={[
                  styles.filterPill,
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
                  {st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <StateView
            type="filtered-empty"
            onAction={() => {
              setSearchQuery('');
              setSelectedStatus('ALL');
            }}
          />
        ) : (
          filteredOrders.map(order => (
            <TouchableOpacity
              key={order.id}
              onPress={() => router.push(`/orders/${order.id}` as any)}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.sm },
              ]}
            >
              <View style={styles.cardHeader}>
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

              <Text style={[typography.title3, { color: colors.textPrimary, marginTop: 4 }]}>
                {order.title}
              </Text>
              <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                {order.packageName || 'Custom Package'} · {order.eventCount} events
              </Text>

              <View style={[styles.metaRow, { marginTop: 6 }]}>
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
                <Text style={[typography.caption1, { color: colors.textSecondary, marginLeft: 4, flex: 1 }]} numberOfLines={1}>
                  {order.venueLocation || 'Venue TBD'}
                </Text>
              </View>

              {/* Permitted Price / Balance row */}
              {permissions.money.revenue !== 'none' && order.financials && (
                <View style={[styles.priceRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.xs }]}>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>Total / Balance:</Text>
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
          ))
        )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
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
  claimBanner: {
    padding: 14,
    borderWidth: 1,
  },
  unassignedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
  },
  inputBox: {
    borderTopWidth: 1,
  },
  textInput: {
    height: 42,
    paddingHorizontal: 10,
    borderWidth: 1,
    fontSize: 15,
  },
});
