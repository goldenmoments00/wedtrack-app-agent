import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Modal,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { StatusBadge, mapOrderStatusToVariant, mapReviewStatusToVariant } from '@/components/common/status-badge';
import { MoneyView, formatCurrency } from '@/components/common/money-view';
import { Button } from '@/components/common/button';
import { StateView } from '@/components/common/state-view';
import { OrderStatus } from '@/types/orders';
import { EditingCategory, EditingTaskStatus } from '@/types/editing';

type OrderTabKey = 'OVERVIEW' | 'EVENTS' | 'EDITING' | 'ACTIVITIES' | 'MONEY' | 'CLIENT';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, permissions } = useAuth();
  const {
    orders,
    events,
    editingTasks,
    activities,
    team,
    updateOrderStatus,
    rescheduleOrder,
    deleteOrder,
    togglePinOrder,
    updateActivityStatus,
    resetClientPin,
    updateTaskStatus,
    addEditingTask,
    assignEditorToTask,
    deleteEditingTask,
    autoGenerateEditingPipeline,
  } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  const [activeTab, setActiveTab] = useState<OrderTabKey>('OVERVIEW');
  const [issuedOneTimePin, setIssuedOneTimePin] = useState<string | null>(null);

  // Editing Tab State
  const [isAddDeliverableModalVisible, setIsAddDeliverableModalVisible] = useState(false);
  const [reassigningTaskId, setReassigningTaskId] = useState<string | null>(null);

  // New Deliverable Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<EditingCategory>('HIGHLIGHT');
  const [newEditorId, setNewEditorId] = useState<string>('');
  const [newSpec, setNewSpec] = useState('4');
  const [newCost, setNewCost] = useState('12000');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIsReviewable, setNewIsReviewable] = useState(true);

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

  const completedTasksCount = orderTasks.filter(t => t.status === 'COMPLETED').length;
  const inProgressTasksCount = orderTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const inReviewTasksCount = orderTasks.filter(
    t => t.reviewStatus === 'WAITING_FOR_CLIENT' || t.reviewStatus === 'CHANGES_REQUESTED'
  ).length;
  const pendingTasksCount = orderTasks.filter(t => t.status === 'PENDING').length;
  const progressPct =
    orderTasks.length > 0 ? Math.round((completedTasksCount / orderTasks.length) * 100) : 0;

  const availableEditors = team.filter(m => m.capabilities.editing && m.isActive);

  const getCategoryMeta = (cat: EditingCategory) => {
    switch (cat) {
      case 'PHOTO_EDIT':
        return {
          icon: 'image-outline' as const,
          label: 'Photo Editing',
          color: '#0D9488',
          bg: 'rgba(13, 148, 136, 0.12)',
        };
      case 'VIDEO_EDIT':
        return {
          icon: 'film-outline' as const,
          label: 'Video Editing',
          color: '#0D9488',
          bg: 'rgba(13, 148, 136, 0.12)',
        };
      case 'REEL':
        return {
          icon: 'flash-outline' as const,
          label: 'Reel Creation',
          color: '#0D9488',
          bg: 'rgba(13, 148, 136, 0.12)',
        };
      case 'HIGHLIGHT':
        return {
          icon: 'sparkles-outline' as const,
          label: 'Highlight Video',
          color: '#0D9488',
          bg: 'rgba(13, 148, 136, 0.12)',
        };
      case 'ALBUM':
        return {
          icon: 'book-outline' as const,
          label: 'Album Design',
          color: '#0D9488',
          bg: 'rgba(13, 148, 136, 0.12)',
        };
      default:
        return {
          icon: 'film-outline' as const,
          label: 'Editing',
          color: '#0D9488',
          bg: 'rgba(13, 148, 136, 0.12)',
        };
    }
  };

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getReviewStatusLabel = (st?: string) => {
    switch (st) {
      case 'WAITING_FOR_CLIENT':
        return {
          label: 'Waiting for Client Review',
          color: '#8B5CF6',
          bg: '#F5F3FF',
          border: '#DDD6FE',
        };
      case 'CHANGES_REQUESTED':
        return {
          label: 'Revisions Requested',
          color: '#EF4444',
          bg: '#FEF2F2',
          border: '#FECACA',
        };
      case 'APPROVED':
        return {
          label: 'Approved by Client ✓',
          color: '#10B981',
          bg: '#ECFDF5',
          border: '#A7F3D0',
        };
      case 'NOT_UPLOADED':
      default:
        return {
          label: 'Draft Pending Upload',
          color: '#F59E0B',
          bg: '#FFFBEB',
          border: '#FDE68A',
        };
    }
  };

  const handleAutoGenerate = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {}
    autoGenerateEditingPipeline(order);
    Alert.alert('Pipeline Generated', 'Default editing deliverables have been added for this booking.');
  };

  const handleDeleteTask = (taskId: string, title: string) => {
    Alert.alert('Delete Deliverable', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          } catch {}
          deleteEditingTask(taskId);
        },
      },
    ]);
  };

  const handleQuickStatus = (taskId: string, currentStatus: EditingTaskStatus) => {
    Alert.alert('Update Deliverable Status', 'Select the updated production status:', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: '▶ In Progress',
        onPress: () => {
          updateTaskStatus(taskId, 'IN_PROGRESS');
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          } catch {}
        },
      },
      {
        text: '✓ Completed',
        onPress: () => {
          updateTaskStatus(taskId, 'COMPLETED');
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          } catch {}
        },
      },
      {
        text: '⏸ On Hold',
        onPress: () => {
          updateTaskStatus(taskId, 'ON_HOLD');
        },
      },
      {
        text: '⏳ Pending',
        onPress: () => {
          updateTaskStatus(taskId, 'PENDING');
        },
      },
    ]);
  };

  const handleCreateDeliverable = () => {
    if (!newTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a title for this deliverable.');
      return;
    }

    const assignedEditor = availableEditors.find(e => e.id === newEditorId);
    const parsedCost = parseInt(newCost, 10);
    const parsedSpec = parseInt(newSpec, 10);

    const taskType =
      newCategory === 'PHOTO_EDIT'
        ? 'order-photo'
        : newCategory === 'ALBUM'
        ? 'album'
        : newCategory === 'REEL'
        ? 'reel'
        : newCategory === 'HIGHLIGHT'
        ? 'highlight'
        : 'order-video';

    addEditingTask({
      orderId: order.id,
      tenantOrderNumber: order.tenantOrderNumber,
      orderTitle: order.title,
      clientNames: order.clientName,
      taskType,
      category: newCategory,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      status: newEditorId ? 'IN_PROGRESS' : 'PENDING',
      editorId: newEditorId || undefined,
      editorName: assignedEditor?.name,
      cost: !isNaN(parsedCost) ? parsedCost : undefined,
      quantity:
        newCategory === 'PHOTO_EDIT' || newCategory === 'ALBUM'
          ? !isNaN(parsedSpec)
            ? parsedSpec
            : undefined
          : undefined,
      durationMinutes:
        newCategory === 'VIDEO_EDIT' || newCategory === 'HIGHLIGHT' || newCategory === 'REEL'
          ? !isNaN(parsedSpec)
            ? parsedSpec
            : undefined
          : undefined,
      dueDate:
        newDueDate ||
        new Date(new Date(order.eventDate).getTime() + 14 * 86400000).toISOString(),
      venueLocation: order.venueLocation,
      isReviewable: newIsReviewable,
      reviewStatus: newIsReviewable ? 'NOT_UPLOADED' : undefined,
    });

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {}

    setIsAddDeliverableModalVisible(false);
    setNewTitle('');
    setNewDescription('');
    setNewEditorId('');
  };

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

        {/* TAB 3: EDITING & REVIEW (Exact Match to User Reference) */}
        {activeTab === 'EDITING' && (
          <View style={{ marginTop: spacing.sm }}>
            {/* Card Container */}
            <View style={styles.refCardContainer}>
              {/* Top Purple Banner: EDITING TASKS */}
              <View style={styles.refEditingHeaderBar}>
                <Text style={styles.refEditingHeaderText}>EDITING TASKS</Text>
                <TouchableOpacity
                  style={styles.refAddBtn}
                  onPress={() => setIsAddDeliverableModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={15} color="#FFFFFF" />
                  <Text style={styles.refAddBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Tasks List */}
              {orderTasks.length === 0 ? (
                /* Empty State */
                <View style={styles.refEmptyBox}>
                  <Ionicons name="film-outline" size={32} color="#5B50E6" />
                  <Text style={styles.refEmptyTitle}>No Editing Deliverables Configured</Text>
                  <Text style={styles.refEmptySubtext}>
                    Track photo editing, cinematic video, reels, highlights, and album designs.
                  </Text>
                  <View style={{ width: '100%', gap: 8, marginTop: 14 }}>
                    <TouchableOpacity
                      style={styles.refGenPipelineBtn}
                      onPress={handleAutoGenerate}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="flash" size={14} color="#FFFFFF" />
                      <Text style={styles.refGenPipelineText}>Generate Reference Pipeline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.refAddCustomBtn}
                      onPress={() => setIsAddDeliverableModalVisible(true)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.refAddCustomText}>+ Add Custom Deliverable</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                orderTasks.map((task, idx) => {
                  const meta = getCategoryMeta(task.category);
                  const isLast = idx === orderTasks.length - 1;

                  return (
                    <View
                      key={task.id}
                      style={[
                        styles.refTaskItem,
                        !isLast && { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
                      ]}
                    >
                      {/* Row 1: Category Icon + Title on left, Status dropdown pill on right */}
                      <View style={styles.refRow1}>
                        <View style={styles.refTitleBox}>
                          <Ionicons name={meta.icon} size={17} color="#0D9488" />
                          <Text style={styles.refTaskTitle}>{task.title}</Text>
                        </View>

                        {/* Status Dropdown Pill */}
                        <TouchableOpacity
                          style={styles.refDropdownPill}
                          onPress={() => handleQuickStatus(task.id, task.status)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.refDropdownPillText}>
                            {task.status === 'COMPLETED'
                              ? 'Completed'
                              : task.status === 'IN_PROGRESS'
                              ? 'In Progress'
                              : 'Pending'}
                          </Text>
                          <Ionicons name="chevron-down" size={12} color="#78350F" />
                        </TouchableOpacity>
                      </View>

                      {/* Row 2: Assignee Selector (left) & Rate / Correct Rate (right) */}
                      <View style={styles.refRow2}>
                        {/* Assignee Pill */}
                        <TouchableOpacity
                          style={styles.refAssigneePill}
                          onPress={() => setReassigningTaskId(task.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.refAssigneePillText} numberOfLines={1}>
                            {task.editorName || 'Select Editor'}
                          </Text>
                          <Ionicons name="chevron-down" size={12} color="#78350F" />
                        </TouchableOpacity>

                        {/* Rate / Correct Rate */}
                        <View style={styles.refRateBox}>
                          <Text style={styles.refRateAmount}>
                            {task.cost !== undefined && task.cost > 0
                              ? `₹${task.cost.toLocaleString('en-IN')}`
                              : '0'}
                          </Text>
                          <Text style={styles.refRateLabel}>Correct rate</Text>
                        </View>
                      </View>

                      {/* Row 3: Subtitle / Specs (left) & Preview Button (right) */}
                      <View style={styles.refRow3}>
                        <Text style={styles.refSubtext} numberOfLines={2}>
                          {task.description || 'Deliverables and color grade specifications'}
                        </Text>

                        {task.isReviewable && task.reviewItemId ? (
                          <TouchableOpacity
                            style={styles.refPreviewBtn}
                            onPress={() => router.push(`/review/${task.reviewItemId}` as any)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={task.category === 'ALBUM' ? 'book-outline' : 'play-outline'}
                              size={13}
                              color="#78350F"
                            />
                            <Text style={styles.refPreviewBtnText}>Preview</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
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

      {/* ADD DELIVERABLE MODAL */}
      <Modal
        visible={isAddDeliverableModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddDeliverableModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalContentCard,
              { backgroundColor: colors.surface, borderRadius: radii.xl },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={[
                    styles.editingHeaderIconBox,
                    { backgroundColor: 'rgba(255, 85, 0, 0.12)' },
                  ]}
                >
                  <Ionicons name="film-outline" size={18} color="#FF5500" />
                </View>
                <Text style={[typography.title2, { color: colors.textPrimary }]}>
                  Add Deliverable
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddDeliverableModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* Category Picker */}
              <View style={styles.modalFormGroup}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                  DELIVERABLE CATEGORY
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {(
                    [
                      { key: 'HIGHLIGHT', label: '⭐ Highlight' },
                      { key: 'VIDEO_EDIT', label: '🎬 Video Cut' },
                      { key: 'PHOTO_EDIT', label: '📸 Photo Grading' },
                      { key: 'REEL', label: '📱 Reel' },
                      { key: 'ALBUM', label: '📖 Album' },
                    ] as const
                  ).map(cat => {
                    const isSelected = newCategory === cat.key;
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        onPress={() => setNewCategory(cat.key)}
                        style={[
                          styles.categoryPill,
                          {
                            backgroundColor: isSelected ? '#FF5500' : colors.surfaceSubtle,
                            borderColor: isSelected ? '#FF5500' : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryPillText,
                            {
                              color: isSelected ? '#FFFFFF' : colors.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Title Input */}
              <View style={styles.modalFormGroup}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                  DELIVERABLE TITLE *
                </Text>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="e.g. Cinematic Highlights Film (4K)"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                />
              </View>

              {/* Description Input */}
              <View style={styles.modalFormGroup}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                  SCOPE / DESCRIPTION
                </Text>
                <TextInput
                  value={newDescription}
                  onChangeText={setNewDescription}
                  placeholder="e.g. Keynote soundbites, multi-cam switching, color grade..."
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                      height: 60,
                    },
                  ]}
                  multiline
                />
              </View>

              {/* Editor Assignment */}
              <View style={styles.modalFormGroup}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                  ASSIGN EDITOR
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6 }}
                >
                  <TouchableOpacity
                    onPress={() => setNewEditorId('')}
                    style={[
                      styles.categoryPill,
                      {
                        backgroundColor: newEditorId === '' ? '#FF5500' : colors.surfaceSubtle,
                        borderColor: newEditorId === '' ? '#FF5500' : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        {
                          color: newEditorId === '' ? '#FFFFFF' : colors.textPrimary,
                          fontWeight: newEditorId === '' ? '700' : '500',
                        },
                      ]}
                    >
                      Unassigned
                    </Text>
                  </TouchableOpacity>
                  {availableEditors.map(edr => {
                    const isSelected = newEditorId === edr.id;
                    return (
                      <TouchableOpacity
                        key={edr.id}
                        onPress={() => setNewEditorId(edr.id)}
                        style={[
                          styles.categoryPill,
                          {
                            backgroundColor: isSelected ? '#FF5500' : colors.surfaceSubtle,
                            borderColor: isSelected ? '#FF5500' : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryPillText,
                            {
                              color: isSelected ? '#FFFFFF' : colors.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {edr.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Deliverable Spec & Cost Row */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.modalFormGroup, { flex: 1 }]}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                    {newCategory === 'PHOTO_EDIT'
                      ? 'PHOTO COUNT'
                      : newCategory === 'ALBUM'
                      ? 'SPREAD COUNT'
                      : 'DURATION (MINS)'}
                  </Text>
                  <TextInput
                    value={newSpec}
                    onChangeText={setNewSpec}
                    keyboardType="numeric"
                    placeholder="e.g. 4"
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>

                {canSeeCost && (
                  <View style={[styles.modalFormGroup, { flex: 1 }]}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                      AGREED PAY (₹)
                    </Text>
                    <TextInput
                      value={newCost}
                      onChangeText={setNewCost}
                      keyboardType="numeric"
                      placeholder="e.g. 12000"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.modalInput,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                    />
                  </View>
                )}
              </View>

              {/* Reviewable Toggle */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  marginTop: 6,
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={[typography.headline, { color: colors.textPrimary }]}>
                    Client Review Portal
                  </Text>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                    Allow client to review video/album drafts with time-stamped comments
                  </Text>
                </View>
                <Switch
                  value={newIsReviewable}
                  onValueChange={setNewIsReviewable}
                  trackColor={{ false: '#D1D5DB', true: '#FF5500' }}
                />
              </View>
            </ScrollView>

            {/* Modal Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Button
                title="Cancel"
                onPress={() => setIsAddDeliverableModalVisible(false)}
                variant="outline"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Create Deliverable"
                onPress={handleCreateDeliverable}
                variant="primary"
                size="md"
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* REASSIGN / ASSIGN EDITOR MODAL */}
      <Modal
        visible={reassigningTaskId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setReassigningTaskId(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setReassigningTaskId(null)}
        >
          <View
            style={[
              styles.modalContentCard,
              { backgroundColor: colors.surface, borderRadius: radii.xl },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={[
                    styles.editingHeaderIconBox,
                    { backgroundColor: 'rgba(255, 85, 0, 0.12)' },
                  ]}
                >
                  <Ionicons name="person-add-outline" size={18} color="#FF5500" />
                </View>
                <Text style={[typography.title2, { color: colors.textPrimary }]}>
                  Assign Studio Editor
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReassigningTaskId(null)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text
              style={[typography.caption1, { color: colors.textSecondary, marginBottom: 12 }]}
            >
              Select a qualified editor for this deliverable:
            </Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {availableEditors.map(edr => {
                const activeCount = editingTasks.filter(
                  t => t.editorId === edr.id && t.status !== 'COMPLETED'
                ).length;

                return (
                  <TouchableOpacity
                    key={edr.id}
                    style={[
                      styles.editorSelectRow,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.border,
                        borderRadius: radii.md,
                      },
                    ]}
                    onPress={() => {
                      if (reassigningTaskId) {
                        assignEditorToTask(reassigningTaskId, edr.id, edr.name);
                        try {
                          Haptics.notificationAsync(
                            Haptics.NotificationFeedbackType.Success
                          ).catch(() => {});
                        } catch {}
                        setReassigningTaskId(null);
                      }
                    }}
                  >
                    <View style={[styles.editorInitialsCircle, { backgroundColor: '#FF5500' }]}>
                      <Text style={styles.editorInitialsText}>
                        {edr.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[typography.headline, { color: colors.textPrimary }]}>
                        {edr.name}
                      </Text>
                      <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                        {edr.roles.join(', ')} · {edr.phone}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.workloadPill,
                        { backgroundColor: activeCount > 2 ? '#FEF3C7' : '#ECFDF5' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.workloadPillText,
                          { color: activeCount > 2 ? '#B45309' : '#047857' },
                        ]}
                      >
                        {activeCount} active
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Button
              title="Close"
              onPress={() => setReassigningTaskId(null)}
              variant="outline"
              size="sm"
              style={{ marginTop: 12 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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

  /* Editing & Deliverables Section */
  editingOverviewCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  editingHeaderIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addDeliverableMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addDeliverableMiniText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  editingProgressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 12,
  },
  editingProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  editingStatusCapsulesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  statusCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  capsuleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  capsuleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  editingEmptyCard: {
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  editingEmptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 85, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskCard: {
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  taskCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskCategoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  taskSpecsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    paddingVertical: 6,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskEditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
  },
  reassignChipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  reassignChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reviewPortalBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  reviewMetaTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  reviewMetaStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskBottomActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  quickActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  quickActionPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    padding: 20,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalFormGroup: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
  },
  editorSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  editorInitialsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorInitialsText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  workloadPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  workloadPillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Exact Reference Layout Styles */
  refCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  refEditingHeaderBar: {
    backgroundColor: '#5B50E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  refEditingHeaderText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  refAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  refAddBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  refEmptyBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
  },
  refEmptySubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 10,
  },
  refGenPipelineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#5B50E6',
    paddingVertical: 10,
    borderRadius: 8,
  },
  refGenPipelineText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  refAddCustomBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 9,
    borderRadius: 8,
  },
  refAddCustomText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  refTaskItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  refRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  refTaskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F766E',
  },
  refDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  refDropdownPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#78350F',
  },
  refRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  refAssigneePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: '65%',
  },
  refAssigneePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#451A03',
  },
  refPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#78350F',
  },
  refRateBox: {
    alignItems: 'flex-end',
  },
  refRateAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  refRateLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  refRow3: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  refSubtext: {
    fontSize: 11.5,
    color: '#64748B',
    flex: 1,
    lineHeight: 16,
  },
  refPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  refPreviewBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#78350F',
  },
});
