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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const { session, permissions } = useAuth();
  const {
    orders,
    events,
    editingTasks,
    payroll,
    claimTask,
  } = useDemoStore();
  const { colors, typography, spacing, radii, isDark } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('NOV 26');
  const [filterMode, setFilterMode] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED' | 'COMPLETED'>('ALL');
  const [agentFilter, setAgentFilter] = useState<'ALL' | 'UPCOMING' | 'PENDING' | 'COMPLETED'>('ALL');
  const [showFinancials, setShowFinancials] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const workspace = session?.activeWorkspace || 'OPERATIONS';

  // Time helper (shared across Operations and Agent workspaces)
  const formatEventTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      let hours = d.getUTCHours();
      const mins = String(d.getUTCMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${mins} ${ampm}`;
    } catch {
      return '12:00 PM';
    }
  };

  // ----------------------------------------------------
  // 1. OPERATIONS DASHBOARD (Golden Moment.in Event Schedule)
  // ----------------------------------------------------
  if (workspace === 'OPERATIONS') {
    const totalBookings = orders.length;

    // Staffing gaps
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

    // Months carousel
    const months = [
      { key: 'OCT 26', label: 'OCT 26', count: 16 },
      { key: 'NOV 26', label: 'NOV 26', count: 108 },
      { key: 'DEC 26', label: 'DEC 26', count: 93 },
      { key: 'JAN 27', label: 'JAN 27', count: 42 },
      { key: 'FEB 27', label: 'FEB 27', count: 55 },
    ];

    // Filter events by selected status
    const filteredEvents = events.filter(e => {
      const isAssigned = e.status === 'ASSIGNED' || e.assignments.length > 0;
      const isCompleted = e.status === 'COMPLETED';

      if (filterMode === 'ASSIGNED') return isAssigned && !isCompleted;
      if (filterMode === 'UNASSIGNED') return !isAssigned;
      if (filterMode === 'COMPLETED') return isCompleted;
      return true;
    });

    // Group events by Day (e.g. "07 SAT", "08 SUN", "15 SUN", "18 WED")
    const dateGroups: {
      dateKey: string;
      dayNum: string;
      dayOfWeek: string;
      events: typeof events;
    }[] = [];

    filteredEvents.forEach(evt => {
      const d = new Date(evt.startTime);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayNum = String(d.getDate()).padStart(2, '0');
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const dayOfWeek = days[d.getDay()];

      let group = dateGroups.find(g => g.dateKey === dateKey);
      if (!group) {
        group = { dateKey, dayNum, dayOfWeek, events: [] };
        dateGroups.push(group);
      }
      group.events.push(evt);
    });

    // Sort ascending by date
    dateGroups.sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    // Time helper
    const formatEventTime = (isoString: string) => {
      try {
        const d = new Date(isoString);
        let hours = d.getUTCHours();
        const mins = String(d.getUTCMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${mins} ${ampm}`;
      } catch {
        return '12:00 PM';
      }
    };

    return (
      <View style={[styles.root, { backgroundColor: isDark ? colors.background : '#FDF8F5' }]}>
        {/* 1. Golden Moment.in CRM Top Bar */}
        <View
          style={[
            styles.crmHeaderBar,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderBottomColor: isDark ? colors.border : '#F3E8E2',
              paddingTop: Math.max(insets.top, 12),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.brandContainer}
            onPress={() => router.push('/profile')}
            activeOpacity={0.8}
          >
            <View style={styles.brandAvatar}>
              <Text style={styles.brandAvatarText}>G</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
              <Text style={[styles.brandTitle, { color: isDark ? '#FFFFFF' : '#1F2937' }]}>
                Golden Moment.in
              </Text>
              <View style={styles.crmBadge}>
                <Text style={styles.crmBadgeText}>CRM</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRightActions}>
            {/* Credits Wallet Pill */}
            <TouchableOpacity
              style={styles.creditsWalletPill}
              onPress={() => router.push('/billing')}
              activeOpacity={0.8}
            >
              <Ionicons name="wallet-outline" size={15} color="#059669" />
              <Text style={styles.creditsText}>530</Text>
            </TouchableOpacity>

            {/* Light / Dark Mode Toggle */}
            <TouchableOpacity
              style={[styles.themeToggleButton, { borderColor: isDark ? '#374151' : '#E5E7EB' }]}
              onPress={() => Alert.alert('Display Theme', `Current appearance: ${isDark ? 'Dark Mode' : 'Light Mode'}`)}
              activeOpacity={0.7}
            >
              <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={18} color={isDark ? '#F59E0B' : '#4B5563'} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 16, paddingTop: 14 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* 2. Event Months Horizontal Bar */}
          <View style={styles.eventMonthsHeader}>
            <Ionicons name="calendar" size={16} color="#EA580C" />
            <Text style={styles.eventMonthsTitle}>Event Months</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthsCarouselContent}
            style={{ marginTop: 8 }}
          >
            {months.map(m => {
              const isSelected = selectedMonth === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.monthPill,
                    isSelected ? styles.monthPillActive : styles.monthPillInactive,
                    { borderColor: isSelected ? '#EA580C' : isDark ? '#374151' : '#F3E8E2' },
                  ]}
                  onPress={() => setSelectedMonth(m.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.monthLabel, isSelected ? styles.monthLabelActive : styles.monthLabelInactive]}>
                    {m.label}
                  </Text>
                  <View style={[styles.monthBadge, isSelected ? styles.monthBadgeActive : styles.monthBadgeInactive]}>
                    <Text style={[styles.monthBadgeText, isSelected ? styles.monthBadgeTextActive : styles.monthBadgeTextInactive]}>
                      {m.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 3. Month Title & Metric Overview Card */}
          <View style={styles.monthOverviewSection}>
            <Text style={[styles.monthMainTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              November 2026
            </Text>
            <Text style={styles.monthSubtitle}>25 dates with events</Text>

            {/* 3-Column Metrics Card */}
            <View style={[styles.metricsCard, { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#E5E7EB' }]}>
              <View style={styles.metricColumn}>
                <Text style={[styles.metricNumber, { color: '#2563EB' }]}>108</Text>
                <Text style={styles.metricLabel}>Events</Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
              <View style={styles.metricColumn}>
                <Text style={[styles.metricNumber, { color: '#059669' }]}>96</Text>
                <Text style={styles.metricLabel}>Assigned</Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
              <View style={styles.metricColumn}>
                <Text style={[styles.metricNumber, { color: '#EA580C' }]}>12</Text>
                <Text style={styles.metricLabel}>Unassigned</Text>
              </View>
            </View>
          </View>

          {/* 4. Filter Chips Row */}
          <View style={styles.filterRow}>
            <View style={styles.filterLabelBox}>
              <Ionicons name="filter" size={13} color="#4B5563" />
              <Text style={styles.filterLabelText}>FILTER</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filterMode === 'ASSIGNED' ? styles.filterChipBlueActive : styles.filterChipInactive,
                ]}
                onPress={() => setFilterMode(filterMode === 'ASSIGNED' ? 'ALL' : 'ASSIGNED')}
              >
                <Text style={[styles.filterChipText, filterMode === 'ASSIGNED' ? styles.filterChipTextBlueActive : styles.filterChipTextInactive]}>
                  Assigned
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filterMode === 'UNASSIGNED' ? styles.filterChipAmberActive : styles.filterChipInactive,
                ]}
                onPress={() => setFilterMode(filterMode === 'UNASSIGNED' ? 'ALL' : 'UNASSIGNED')}
              >
                <Text style={[styles.filterChipText, filterMode === 'UNASSIGNED' ? styles.filterChipTextAmberActive : styles.filterChipTextInactive]}>
                  Unassigned
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filterMode === 'COMPLETED' ? styles.filterChipGreenActive : styles.filterChipInactive,
                ]}
                onPress={() => setFilterMode(filterMode === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
              >
                <Text style={[styles.filterChipText, filterMode === 'COMPLETED' ? styles.filterChipTextGreenActive : styles.filterChipTextInactive]}>
                  Completed
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* 5. Daily Event Schedule Cards (Grouped by Date) */}
          <View style={{ marginTop: 16 }}>
            {dateGroups.length === 0 ? (
              <StateView
                type="empty"
                title="No Events Found"
                message={`No events match ${filterMode.toLowerCase()} filter for this period.`}
                actionTitle="Reset Filter"
                onAction={() => setFilterMode('ALL')}
              />
            ) : (
              dateGroups.map(group => (
                <View
                  key={group.dateKey}
                  style={[
                    styles.dateGroupContainer,
                    { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#E5E7EB' },
                  ]}
                >
                  {/* Distinctive Orange / Rose Date Header Banner */}
                  <View
                    style={[
                      styles.dateHeaderBanner,
                      {
                        backgroundColor:
                          group.dayOfWeek === 'WED' || group.dayNum === '11' || group.dayNum === '18'
                            ? '#C97A6B'
                            : '#EA580C',
                      },
                    ]}
                  >
                    <Text style={styles.dateHeaderTitle}>
                      {group.dayNum} {group.dayOfWeek} •
                    </Text>
                    <View style={styles.dateEventCountBadge}>
                      <Text style={styles.dateEventCountText}>
                        {group.events.length} {group.events.length === 1 ? 'Event' : 'Events'}
                      </Text>
                    </View>
                  </View>

                  {/* Event Items inside this Date */}
                  {group.events.map((evt, idx) => {
                    const isAssigned = evt.status === 'ASSIGNED' || evt.assignments.length > 0;
                    return (
                      <View key={evt.id}>
                        {idx > 0 && <View style={[styles.eventDivider, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]} />}

                        <TouchableOpacity
                          style={styles.eventRowContainer}
                          onPress={() => router.push(`/events/${evt.id}`)}
                          activeOpacity={0.7}
                        >
                          {/* Left Status Stripe (Teal if assigned, Amber if unassigned) */}
                          <View
                            style={[
                              styles.statusStripe,
                              { backgroundColor: isAssigned ? '#10B981' : '#F59E0B' },
                            ]}
                          />

                          <View style={styles.eventRowBody}>
                            {/* Top Line: #Order, Client Title, Time, Action Icons */}
                            <View style={styles.eventTopLine}>
                              <Text style={styles.tenantOrderTag}>
                                {evt.tenantOrderNumber || `#${evt.id.slice(-3)}`}
                              </Text>

                              <Text
                                style={[styles.clientNameText, { color: isDark ? '#FFFFFF' : '#111827' }]}
                                numberOfLines={1}
                              >
                                {evt.orderTitle}
                              </Text>

                              {/* Time */}
                              <View style={styles.timeTagBox}>
                                <Ionicons name="time-outline" size={13} color="#D97706" />
                                <Text style={styles.timeTagText}>
                                  {formatEventTime(evt.startTime)}
                                </Text>
                              </View>

                              {/* Actions: Assign Crew, Edit, Delete */}
                              <View style={styles.actionIconGroup}>
                                <TouchableOpacity
                                  style={styles.actionIconBtn}
                                  onPress={() => router.push(`/events/${evt.id}`)}
                                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                >
                                  <Ionicons name="person-add-outline" size={16} color="#EA580C" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.actionIconBtn}
                                  onPress={() => router.push(`/events/${evt.id}`)}
                                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                >
                                  <Ionicons name="pencil-outline" size={16} color="#6B7280" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.actionIconBtn}
                                  onPress={() => {
                                    Alert.alert(
                                      'Delete Event',
                                      `Are you sure you want to remove ${evt.eventTypeName}?`,
                                      [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Delete', style: 'destructive' },
                                      ]
                                    );
                                  }}
                                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                >
                                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                </TouchableOpacity>
                              </View>
                            </View>

                            {/* Middle Line: Ceremony Type & Location */}
                            <View style={styles.eventMetaLine}>
                              <View style={styles.ceremonyTagBox}>
                                <Ionicons name="heart-outline" size={13} color="#EA580C" />
                                <Text style={styles.ceremonyText}>
                                  {evt.eventTypeName.toUpperCase()}
                                </Text>
                              </View>

                              {evt.venueName && (
                                <View style={styles.venueTagBox}>
                                  <Ionicons name="location-outline" size={13} color="#6B7280" />
                                  <Text
                                    style={[styles.venueText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}
                                    numberOfLines={1}
                                  >
                                    {evt.venueName}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* Bottom Line: Crew Assignment Chips */}
                            <View style={styles.crewChipRow}>
                              {evt.assignments.length === 0 ? (
                                <View style={styles.unassignedChip}>
                                  <Ionicons name="alert-circle-outline" size={12} color="#D97706" />
                                  <Text style={styles.unassignedChipText}>Needs Crew Assignment</Text>
                                </View>
                              ) : (
                                evt.assignments.slice(0, 3).map(asg => (
                                  <View
                                    key={asg.id}
                                    style={[
                                      styles.crewMemberPill,
                                      { backgroundColor: isDark ? '#374151' : '#F3F4F6' },
                                    ]}
                                  >
                                    <View style={styles.crewDot} />
                                    <Text
                                      style={[
                                        styles.crewMemberName,
                                        { color: isDark ? '#E5E7EB' : '#374151' },
                                      ]}
                                    >
                                      {asg.agentName}
                                    </Text>
                                    <Text style={styles.crewStar}>★</Text>
                                  </View>
                                ))
                              )}

                              {evt.assignments.length > 3 && (
                                <View
                                  style={[
                                    styles.crewMorePill,
                                    { backgroundColor: isDark ? '#374151' : '#F3F4F6' },
                                  ]}
                                >
                                  <Text style={styles.crewMoreText}>+{evt.assignments.length - 3}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </View>

          {/* 6. Expandable Financial Snapshot & Staffing Gaps */}
          <View style={{ marginTop: 24 }}>
            <TouchableOpacity
              style={[
                styles.financialsToggleButton,
                { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#E5E7EB' },
              ]}
              onPress={() => setShowFinancials(!showFinancials)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="bar-chart-outline" size={18} color="#EA580C" />
                <Text style={[styles.financialsToggleText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  Financial Snapshot & Gaps
                </Text>
              </View>
              <Ionicons
                name={showFinancials ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#6B7280"
              />
            </TouchableOpacity>

            {showFinancials && (
              <View style={{ marginTop: 10 }}>
                {canSeeRevenue && (
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg },
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

                {staffingGaps.length > 0 && (
                  <View
                    style={[
                      styles.gapCard,
                      { backgroundColor: colors.warningSubtle, borderColor: colors.warning, borderRadius: radii.md, marginTop: spacing.md },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="alert-circle" size={18} color={colors.warning} />
                      <Text style={[typography.headline, { color: colors.warning }]}>
                        {staffingGaps.length} Events Need Crew Assignments
                      </Text>
                    </View>
                    <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 4 }]}>
                      Resolve staffing allocations before event execution.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // 2. AGENT WORKSPACE (My Shoots / Schedule) (AGT-01 to AGT-05)
  // ----------------------------------------------------
  if (workspace === 'SHOOTS') {
    const agentId = session?.id || 'usr-agt-01';
    const myEvents = events.filter(e => e.assignments.some(a => a.agentId === agentId));

    // Calculate agent metrics
    let totalAssignedPay = 0;
    myEvents.forEach(e => {
      e.assignments.forEach(a => {
        if (a.agentId === agentId && a.assignmentPay) {
          totalAssignedPay += a.assignmentPay;
        }
      });
    });

    const pendingSubmissions = myEvents.filter(e => {
      const myAsg = e.assignments.find(a => a.agentId === agentId);
      return e.status === 'COMPLETED' && myAsg && myAsg.submissionCount === undefined;
    });

    const upcomingEvents = myEvents.filter(e => e.status !== 'COMPLETED' && e.status !== 'CANCELLED');
    const completedEvents = myEvents.filter(e => e.status === 'COMPLETED');

    // Chronological Next Shoot hero card
    const nextShoot = upcomingEvents[0] || myEvents[0];

    // Filter events based on active filter chip
    const displayedEvents = myEvents.filter(e => {
      const myAsg = e.assignments.find(a => a.agentId === agentId);
      if (agentFilter === 'UPCOMING') return e.status !== 'COMPLETED' && e.status !== 'CANCELLED';
      if (agentFilter === 'PENDING') return e.status === 'COMPLETED' && myAsg && myAsg.submissionCount === undefined;
      if (agentFilter === 'COMPLETED') return e.status === 'COMPLETED';
      return true;
    });

    const handleCall = (phone?: string) => {
      if (phone) Linking.openURL(`tel:${phone}`);
    };

    const handleMap = (mapUrl?: string) => {
      if (mapUrl) Linking.openURL(mapUrl);
    };

    return (
      <View style={[styles.root, { backgroundColor: isDark ? '#111216' : '#F9FAFB' }]}>
        {/* Agent Branded CRM Top Bar */}
        <View
          style={[
            styles.crmHeaderBar,
            {
              backgroundColor: isDark ? '#181920' : '#FFFFFF',
              borderBottomColor: isDark ? '#262732' : '#E5E7EB',
              paddingTop: Math.max(insets.top, 10),
            },
          ]}
        >
          <View style={styles.brandContainer}>
            <View style={[styles.brandAvatar, { backgroundColor: '#EA580C' }]}>
              <Text style={styles.brandAvatarText}>
                {session?.name ? session.name.charAt(0) : 'K'}
              </Text>
            </View>
            <View style={{ marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.brandTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {session?.name || 'Karan Malhotra'}
                </Text>
                <View style={[styles.crmBadge, { backgroundColor: '#EA580C' }]}>
                  <Text style={styles.crmBadgeText}>CREW</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 1 }}>
                {session?.agentProfession === 'BOTH'
                  ? '📸 Photographer & 🎥 Videographer'
                  : session?.agentProfession === 'PHOTOGRAPHER'
                  ? '📸 Lead Photographer'
                  : '🎥 Cinematographer'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={[
                styles.creditsWalletPill,
                {
                  backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFEDD5',
                  borderColor: isDark ? 'rgba(234, 88, 12, 0.4)' : '#FDBA74',
                },
              ]}
            >
              <Ionicons name="camera-outline" size={13} color="#EA580C" />
              <Text style={[styles.creditsText, { color: '#EA580C' }]}>
                {myEvents.length} Shoots
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 16, paddingTop: 16 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Pending Deliverables Alert (AGT-03) */}
          {pendingSubmissions.length > 0 && (
            <TouchableOpacity
              style={[
                styles.agentAlertBox,
                { backgroundColor: isDark ? '#2D1F17' : '#FFF7ED', borderColor: '#EA580C' },
              ]}
              onPress={() => router.push('/(tabs)/orders')}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.agentAlertIcon, { backgroundColor: '#EA580C' }]}>
                  <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.agentAlertTitle, { color: isDark ? '#FED7AA' : '#9A3412' }]}>
                    {pendingSubmissions.length} Shoot Awaiting Count Submission
                  </Text>
                  <Text style={[styles.agentAlertDesc, { color: isDark ? '#D1D5DB' : '#7C2D12' }]}>
                    Tap to submit final captured photo/video counts for studio verification
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#EA580C" />
              </View>
            </TouchableOpacity>
          )}

          {/* Hero Card: Next Shoot (AGT-01) */}
          {nextShoot && (
            <View style={{ marginTop: pendingSubmissions.length > 0 ? 14 : 0 }}>
              <View
                style={[
                  styles.agentHeroCard,
                  {
                    backgroundColor: isDark ? '#1A1B22' : '#FFFFFF',
                    borderColor: isDark ? '#2E303E' : '#E5E7EB',
                  },
                ]}
              >
                {/* Hero Top Banner */}
                <View style={styles.agentHeroHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="hourglass-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.agentHeroBannerText}>
                      NEXT SCHEDULED SHOOT
                    </Text>
                  </View>
                  <Text style={styles.agentHeroBannerTime}>
                    {formatEventTime(nextShoot.startTime)}
                  </Text>
                </View>

                <View style={{ padding: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.agentHeroOrderTag, { color: '#EA580C' }]}>
                        {nextShoot.tenantOrderNumber} · {nextShoot.orderTitle}
                      </Text>
                      <Text
                        style={[styles.agentHeroEventName, { color: isDark ? '#FFFFFF' : '#111827' }]}
                        numberOfLines={1}
                      >
                        {nextShoot.eventTypeName}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.agentHeroRoleBadge,
                        { backgroundColor: isDark ? '#2B2C38' : '#F3F4F6' },
                      ]}
                    >
                      <Ionicons name="camera" size={12} color="#EA580C" />
                      <Text style={[styles.agentHeroRoleText, { color: isDark ? '#E5E7EB' : '#374151' }]}>
                        {nextShoot.assignments.find(a => a.agentId === agentId)?.role || 'CREW'}
                      </Text>
                    </View>
                  </View>

                  {/* Venue & Location */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <Ionicons name="location-outline" size={14} color="#EA580C" />
                    <Text
                      style={[styles.agentHeroVenueText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}
                      numberOfLines={1}
                    >
                      {nextShoot.venueName} · {nextShoot.venueAddress}
                    </Text>
                  </View>

                  {/* Client Contact */}
                  {nextShoot.contactName && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Ionicons name="person-outline" size={13} color="#9CA3AF" />
                      <Text style={{ fontSize: 12, color: isDark ? '#9CA3AF' : '#6B7280' }}>
                        Contact: {nextShoot.contactName} ({nextShoot.contactPhone || 'On File'})
                      </Text>
                    </View>
                  )}

                  {/* Quick Action Button Row (AGT-02) */}
                  <View style={styles.agentHeroActionRow}>
                    {nextShoot.contactPhone ? (
                      <TouchableOpacity
                        style={[
                          styles.agentActionBtn,
                          { backgroundColor: isDark ? '#242530' : '#F3F4F6', borderColor: isDark ? '#37384A' : '#E5E7EB' },
                        ]}
                        onPress={() => handleCall(nextShoot.contactPhone)}
                      >
                        <Ionicons name="call-outline" size={14} color="#EA580C" />
                        <Text style={[styles.agentActionBtnText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                          Call Client
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {nextShoot.venueMapUrl ? (
                      <TouchableOpacity
                        style={[
                          styles.agentActionBtn,
                          { backgroundColor: isDark ? '#242530' : '#F3F4F6', borderColor: isDark ? '#37384A' : '#E5E7EB' },
                        ]}
                        onPress={() => handleMap(nextShoot.venueMapUrl)}
                      >
                        <Ionicons name="map-outline" size={14} color="#3B82F6" />
                        <Text style={[styles.agentActionBtnText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                          Directions
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={[
                        styles.agentActionBtn,
                        { backgroundColor: isDark ? '#242530' : '#F3F4F6', borderColor: isDark ? '#37384A' : '#E5E7EB' },
                      ]}
                      onPress={() => router.push(`/events/${nextShoot.id}`)}
                    >
                      <Ionicons name="information-circle-outline" size={14} color="#10B981" />
                      <Text style={[styles.agentActionBtnText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        Call Sheet
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Metrics Summary Row (AGT-01, AGT-05) */}
          <View
            style={[
              styles.metricsCard,
              {
                backgroundColor: isDark ? '#181920' : '#FFFFFF',
                borderColor: isDark ? '#262732' : '#E5E7EB',
                marginTop: 14,
              },
            ]}
          >
            <View style={styles.metricColumn}>
              <Text style={[styles.metricNumber, { color: '#3B82F6' }]}>{myEvents.length}</Text>
              <Text style={[styles.metricLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                My Shoots
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: isDark ? '#262732' : '#E5E7EB' }]} />
            <View style={styles.metricColumn}>
              <Text style={[styles.metricNumber, { color: pendingSubmissions.length > 0 ? '#EA580C' : '#10B981' }]}>
                {pendingSubmissions.length}
              </Text>
              <Text style={[styles.metricLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                Need Counts
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: isDark ? '#262732' : '#E5E7EB' }]} />
            <View style={styles.metricColumn}>
              <Text style={[styles.metricNumber, { color: '#10B981', fontSize: 16 }]}>
                {formatCurrency(totalAssignedPay)}
              </Text>
              <Text style={[styles.metricLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                Assigned Pay
              </Text>
            </View>
          </View>

          {/* Filter Chips (All, Upcoming, Pending Counts, Completed) */}
          <View style={styles.filterChipRow}>
            {(['ALL', 'UPCOMING', 'PENDING', 'COMPLETED'] as const).map((mode) => {
              const isSelected = agentFilter === mode;
              const labels = {
                ALL: 'ALL SHOOTS',
                UPCOMING: 'UPCOMING',
                PENDING: 'NEED COUNTS',
                COMPLETED: 'COMPLETED',
              };
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.filterChip,
                    isSelected
                      ? styles.filterChipActive
                      : { backgroundColor: isDark ? '#1F2026' : '#F3F4F6', borderColor: isDark ? '#2E303E' : '#E5E7EB' },
                  ]}
                  onPress={() => setAgentFilter(mode)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected
                        ? styles.filterChipTextActive
                        : { color: isDark ? '#9CA3AF' : '#6B7280' },
                    ]}
                  >
                    {labels[mode]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Assigned Shoots Feed */}
          <View style={{ marginTop: 14 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitleText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                Assigned Shoots ({displayedEvents.length})
              </Text>
              <Text style={{ fontSize: 11, color: isDark ? '#9CA3AF' : '#6B7280' }}>
                Sorted chronologically
              </Text>
            </View>

            {displayedEvents.length === 0 ? (
              <View style={[styles.agentEmptyCard, { backgroundColor: isDark ? '#1A1B22' : '#FFFFFF', borderColor: isDark ? '#2E303E' : '#E5E7EB' }]}>
                <Ionicons name="calendar-outline" size={32} color="#6B7280" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827', marginTop: 8 }}>
                  No Shoots Found
                </Text>
                <Text style={{ fontSize: 12, color: isDark ? '#9CA3AF' : '#6B7280', textAlign: 'center', marginTop: 4 }}>
                  No shoot assignments match the selected filter.
                </Text>
              </View>
            ) : (
              displayedEvents.map((evt) => {
                const myAsg = evt.assignments.find(a => a.agentId === agentId);
                const isCompleted = evt.status === 'COMPLETED';
                const needsCount = isCompleted && myAsg && myAsg.submissionCount === undefined;

                return (
                  <View
                    key={evt.id}
                    style={[
                      styles.agentEventCard,
                      {
                        backgroundColor: isDark ? '#1A1B22' : '#FFFFFF',
                        borderColor: isDark ? '#2E303E' : '#E5E7EB',
                      },
                    ]}
                  >
                    {/* Orange / Terracotta Date Header Banner */}
                    <View style={styles.agentEventBanner}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="calendar" size={13} color="#FFFFFF" />
                        <Text style={styles.agentEventBannerDate}>
                          {new Date(evt.startTime).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          }).toUpperCase()}
                        </Text>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }}>•</Text>
                        <Text style={styles.agentEventBannerCeremony}>
                          {evt.eventTypeName.toUpperCase()}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.agentStatusPill,
                          {
                            backgroundColor: needsCount
                              ? '#EA580C'
                              : isCompleted
                              ? '#10B981'
                              : '#3B82F6',
                          },
                        ]}
                      >
                        <Text style={styles.agentStatusPillText}>
                          {needsCount ? 'NEED COUNTS' : evt.status}
                        </Text>
                      </View>
                    </View>

                    {/* Card Body */}
                    <View style={{ padding: 14 }}>
                      <Text style={[styles.agentOrderTag, { color: '#EA580C' }]}>
                        {evt.tenantOrderNumber} · {evt.orderTitle}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <Ionicons name="time-outline" size={14} color="#D97706" />
                        <Text style={[styles.agentTimeText, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                          {formatEventTime(evt.startTime)}
                        </Text>
                      </View>

                      {evt.venueName && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <Ionicons name="location-outline" size={14} color="#6B7280" />
                          <Text
                            style={[styles.agentVenueText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}
                            numberOfLines={1}
                          >
                            {evt.venueName} · {evt.venueAddress}
                          </Text>
                        </View>
                      )}

                      {/* Crew & Colleagues Chips (Compensation strictly hidden per AGT-02!) */}
                      <View style={styles.agentCrewRow}>
                        <Text style={{ fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', marginRight: 4 }}>
                          Crew:
                        </Text>
                        {evt.assignments.map((asg) => {
                          const isSelf = asg.agentId === agentId;
                          return (
                            <View
                              key={asg.id}
                              style={[
                                styles.agentCrewMemberPill,
                                {
                                  backgroundColor: isSelf
                                    ? isDark ? 'rgba(234, 88, 12, 0.2)' : '#FFEDD5'
                                    : isDark ? '#262732' : '#F3F4F6',
                                  borderColor: isSelf ? '#EA580C' : 'transparent',
                                },
                              ]}
                            >
                              <View style={[styles.crewDot, { backgroundColor: isSelf ? '#EA580C' : '#9CA3AF' }]} />
                              <Text
                                style={[
                                  styles.agentCrewMemberName,
                                  { color: isSelf ? '#EA580C' : isDark ? '#E5E7EB' : '#374151', fontWeight: isSelf ? '700' : '500' },
                                ]}
                              >
                                {isSelf ? 'You' : asg.agentName} ({asg.role.substring(0, 5)})
                              </Text>
                            </View>
                          );
                        })}
                      </View>

                      {/* Bottom Footer: My Pay + Action Triggers */}
                      <View
                        style={[
                          styles.agentCardFooter,
                          { borderTopColor: isDark ? '#262732' : '#F3F4F6' },
                        ]}
                      >
                        {myAsg?.assignmentPay ? (
                          <View>
                            <Text style={{ fontSize: 10, color: isDark ? '#6B7280' : '#9CA3AF' }}>
                              AGREED PAY
                            </Text>
                            <Text style={[styles.agentPayAmount, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                              {formatCurrency(myAsg.assignmentPay)}
                            </Text>
                          </View>
                        ) : <View />}

                        <View style={{ flexDirection: 'row', gap: 6, marginLeft: 'auto' }}>
                          {needsCount ? (
                            <TouchableOpacity
                              style={[styles.agentSubmitCountBtn, { backgroundColor: '#EA580C' }]}
                              onPress={() => router.push('/(tabs)/orders')}
                            >
                              <Ionicons name="cloud-upload" size={13} color="#FFFFFF" />
                              <Text style={styles.agentSubmitCountBtnText}>Submit Counts</Text>
                            </TouchableOpacity>
                          ) : isCompleted && myAsg?.submissionCount !== undefined ? (
                            <View style={styles.agentSubmittedBadge}>
                              <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                              <Text style={styles.agentSubmittedBadgeText}>
                                {myAsg.submissionCount} Recorded
                              </Text>
                            </View>
                          ) : (
                            <>
                              {evt.contactPhone && (
                                <TouchableOpacity
                                  style={[styles.agentMiniBtn, { backgroundColor: isDark ? '#242530' : '#F3F4F6' }]}
                                  onPress={() => handleCall(evt.contactPhone)}
                                >
                                  <Ionicons name="call-outline" size={14} color="#EA580C" />
                                </TouchableOpacity>
                              )}
                              {evt.venueMapUrl && (
                                <TouchableOpacity
                                  style={[styles.agentMiniBtn, { backgroundColor: isDark ? '#242530' : '#F3F4F6' }]}
                                  onPress={() => handleMap(evt.venueMapUrl)}
                                >
                                  <Ionicons name="map-outline" size={14} color="#3B82F6" />
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity
                                style={[styles.agentMiniBtn, { backgroundColor: isDark ? '#242530' : '#F3F4F6' }]}
                                onPress={() => router.push(`/events/${evt.id}`)}
                              >
                                <Ionicons name="chevron-forward" size={14} color="#6B7280" />
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
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

  /* Golden Moment CRM Header */
  crmHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    fontStyle: 'italic',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  crmBadge: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  crmBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditsWalletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 4,
  },
  creditsText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 13,
  },
  themeToggleButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },

  /* Months Carousel */
  eventMonthsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMonthsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EA580C',
  },
  monthsCarouselContent: {
    gap: 8,
    paddingVertical: 4,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  monthPillActive: {
    backgroundColor: '#EA580C',
  },
  monthPillInactive: {
    backgroundColor: '#FFFFFF',
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  monthLabelActive: {
    color: '#FFFFFF',
  },
  monthLabelInactive: {
    color: '#374151',
  },
  monthBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  monthBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  monthBadgeInactive: {
    backgroundColor: '#FEE2E2',
  },
  monthBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  monthBadgeTextActive: {
    color: '#FFFFFF',
  },
  monthBadgeTextInactive: {
    color: '#EA580C',
  },

  /* Month Overview & Metrics */
  monthOverviewSection: {
    marginTop: 14,
  },
  monthMainTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  monthSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  metricsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 28,
  },

  /* Filter Row */
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  filterLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 0.6,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipBlueActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  filterChipAmberActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  filterChipGreenActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  filterChipInactive: {
    backgroundColor: '#F3F4F6',
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextBlueActive: {
    color: '#2563EB',
  },
  filterChipTextAmberActive: {
    color: '#D97706',
  },
  filterChipTextGreenActive: {
    color: '#059669',
  },
  filterChipTextInactive: {
    color: '#4B5563',
  },

  /* Date Group Cards */
  dateGroupContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
  },
  dateHeaderBanner: {
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dateHeaderTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  dateEventCountBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  dateEventCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  eventDivider: {
    height: 1,
  },
  eventRowContainer: {
    flexDirection: 'row',
  },
  statusStripe: {
    width: 5,
  },
  eventRowBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eventTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tenantOrderTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
  },
  clientNameText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  timeTagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  actionIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 4,
  },
  actionIconBtn: {
    padding: 2,
  },
  eventMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  ceremonyTagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ceremonyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  venueTagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  venueText: {
    fontSize: 11,
  },
  crewChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  crewMemberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  crewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B7280',
  },
  crewMemberName: {
    fontSize: 11,
    fontWeight: '600',
  },
  crewStar: {
    fontSize: 11,
    color: '#F59E0B',
  },
  crewMorePill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  crewMoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  unassignedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  unassignedChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },

  /* Financials Toggle */
  financialsToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  financialsToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Legacy Shared Styles */
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
  gapCard: {
    padding: 14,
    borderWidth: 1,
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

  /* Agent Portal UI Styles */
  filterChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 12,
  },
  filterChipActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '700',
  },
  agentAlertBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  agentAlertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  agentAlertDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  agentHeroCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  agentHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  agentHeroBannerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  agentHeroBannerTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  agentHeroOrderTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  agentHeroEventName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  agentHeroRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  agentHeroRoleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  agentHeroVenueText: {
    fontSize: 13,
    fontWeight: '500',
  },
  agentHeroActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  agentActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  agentActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  agentEmptyCard: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  agentEventCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  agentEventBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  agentEventBannerDate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  agentEventBannerCeremony: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  agentStatusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  agentStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  agentOrderTag: {
    fontSize: 11,
    fontWeight: '700',
  },
  agentTimeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  agentVenueText: {
    fontSize: 12,
  },
  agentCrewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  agentCrewMemberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  agentCrewMemberName: {
    fontSize: 11,
  },
  agentCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  agentPayAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  agentSubmitCountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  agentSubmitCountBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  agentSubmittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  agentSubmittedBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  agentMiniBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
