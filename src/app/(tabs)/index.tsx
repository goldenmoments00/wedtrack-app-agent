import { LinearGradient } from 'expo-linear-gradient';
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
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [agentFilterDropdown, setAgentFilterDropdown] = useState<'ALL' | 'ASSIGNED' | 'COMPLETED'>('ASSIGNED');
  const [agentSelectedDate, setAgentSelectedDate] = useState<string>('ALL');
  const [agentMonthTab, setAgentMonthTab] = useState<'ALL' | 'NOV' | 'DEC' | 'COMPLETED'>('ALL');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({
    NOV: true,
    DEC: false,
  });
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
  // 2. AGENT WORKSPACE (Fresh Redesign Inspired by Reference Aesthetics)
  // ----------------------------------------------------
  if (workspace === 'SHOOTS') {
    const agentId = session?.id || 'usr-agt-01';
    const myEvents = events.filter(e => e.assignments.some(a => a.agentId === agentId));

    // Next Event: Prioritize 18 Nov Ashirbad (evt-gm-190-ashirbad) if present, else upcoming
    const ashirbadEvent = myEvents.find(e => e.id === 'evt-gm-190-ashirbad' || e.eventTypeName.toLowerCase().includes('ashirb'));
    const upcomingEvents = myEvents.filter(e => e.status !== 'COMPLETED' && e.status !== 'CANCELLED');
    const completedEvents = myEvents.filter(e => e.status === 'COMPLETED');
    const nextShoot = ashirbadEvent || upcomingEvents[0] || myEvents[0];

    // Compute November Pay and December Pay
    let novPay = 0;
    let decPay = 0;
    let totalMyPay = 0;
    const monthsShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    myEvents.forEach(e => {
      const a = e.assignments.find(asg => asg.agentId === agentId);
      const pay = a?.assignmentPay || 0;
      totalMyPay += pay;
      const m = new Date(e.startTime).getMonth();
      if (m === 10 || e.startTime.includes('2026-11')) novPay += pay;
      if (m === 11 || e.startTime.includes('2026-12')) decPay += pay;
    });

    // Filter events by Search Query, Month Tab, Date Squircle, and Filter Dropdown
    const filteredWorks = myEvents.filter(e => {
      // 1. Month Tab filter
      if (agentMonthTab === 'NOV') {
        const m = new Date(e.startTime).getMonth();
        if (m !== 10 && !e.startTime.includes('2026-11')) return false;
      } else if (agentMonthTab === 'DEC') {
        const m = new Date(e.startTime).getMonth();
        if (m !== 11 && !e.startTime.includes('2026-12')) return false;
      } else if (agentMonthTab === 'COMPLETED') {
        if (e.status !== 'COMPLETED') return false;
      }


      // 3. Dropdown filter
      if (agentFilterDropdown === 'COMPLETED' && e.status !== 'COMPLETED') return false;
      if (agentFilterDropdown === 'ASSIGNED' && e.status === 'COMPLETED') return false;

      // 4. Text Search
      if (agentSearchQuery.trim()) {
        const q = agentSearchQuery.toLowerCase().trim();
        const matchesTitle = e.orderTitle.toLowerCase().includes(q);
        const matchesCeremony = e.eventTypeName.toLowerCase().includes(q);
        const matchesVenue = e.venueName.toLowerCase().includes(q);
        const matchesAddress = e.venueAddress.toLowerCase().includes(q);
        return matchesTitle || matchesCeremony || matchesVenue || matchesAddress;
      }

      return true;
    });

    const handleCall = (phone?: string) => {
      if (phone) Linking.openURL(`tel:${phone}`);
    };

    const handleMap = (mapUrl?: string) => {
      if (mapUrl) Linking.openURL(mapUrl);
    };

    // Render an Assigned Work Card (Fresh Reference Look: elevated card, circular action buttons)
    const renderAssignedWorkCard = (evt: (typeof events)[0]) => {
      const myAsg = evt.assignments.find(a => a.agentId === agentId);
      const isCompleted = evt.status === 'COMPLETED';
      const needsCount = isCompleted && myAsg && myAsg.submissionCount === undefined;
      const d = new Date(evt.startTime);
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthShort = monthsShort[d.getMonth()] || 'NOV';

      return (
        <View
          key={evt.id}
          style={[
            styles.freshWorkCard,
            {
              backgroundColor: isDark ? '#141A22' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F0F0F2',
            },
          ]}
        >
          {/* Header Row: Date badge, Ceremony name, Status pill */}
          <View style={styles.freshWorkCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={styles.freshWorkDateBadge}>
                <Ionicons name="calendar-outline" size={13} color="#FF5500" />
                <Text style={styles.freshWorkDateBadgeText}>
                  {dayNum} {monthShort}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.freshWorkTitle,
                    { color: isDark ? '#FFFFFF' : '#111827' },
                  ]}
                  numberOfLines={1}
                >
                  {evt.eventTypeName.toUpperCase()}
                </Text>
                <Text style={styles.freshWorkOrder} numberOfLines={1}>
                  {evt.tenantOrderNumber} · {evt.orderTitle}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.agentStatusPill,
                {
                  backgroundColor: needsCount
                    ? '#F25C05'
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

          {/* Time and Venue Rows */}
          <View style={{ marginTop: 4, gap: 4 }}>
            <View style={styles.freshWorkMetaRow}>
              <Ionicons name="time-outline" size={14} color="#D97706" />
              <Text style={[styles.freshWorkMetaText, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                {formatEventTime(evt.startTime)}
              </Text>
            </View>

            {evt.venueName && (
              <View style={styles.freshWorkMetaRow}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text
                  style={[styles.freshWorkMetaText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}
                  numberOfLines={1}
                >
                  {evt.venueName} · {evt.venueAddress}
                </Text>
              </View>
            )}
          </View>

          {/* Crew Chips */}
          <View style={styles.freshWorkCrewRow}>
            <Text style={{ fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', marginRight: 2 }}>
              Crew:
            </Text>
            {evt.assignments.map((asg) => {
              const isSelf = asg.agentId === agentId;
              return (
                <View
                  key={asg.id}
                  style={[
                    styles.freshWorkCrewChip,
                    {
                      backgroundColor: isSelf
                        ? isDark ? 'rgba(255, 85, 0, 0.16)' : '#FFF0E6'
                        : isDark ? '#1F2633' : '#F3F4F6',
                      borderColor: isSelf ? '#FF5500' : 'transparent',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.crewDot,
                      { backgroundColor: isSelf ? '#FF5500' : '#6B7280' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.freshWorkCrewChipText,
                      { color: isSelf ? '#FF5500' : isDark ? '#D1D5DB' : '#374151' },
                    ]}
                  >
                    {isSelf ? `You (${asg.role === 'PHOTOGRAPHER' ? 'PHOTO' : 'VIDEO'})` : `${asg.agentName} (${asg.role === 'PHOTOGRAPHER' ? 'PHOTO' : 'VIDEO'})`}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Card Footer: Agreed Pay + Circular Action Buttons */}
          <View style={styles.freshWorkFooter}>
            <View style={styles.freshWorkPayCol}>
              <Text style={styles.freshWorkPayLabel}>AGREED PAY</Text>
              <Text style={[styles.freshWorkPayAmount, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {myAsg?.assignmentPay ? `₹${myAsg.assignmentPay.toLocaleString('en-IN')}` : '₹8,000'}
              </Text>
            </View>

            <View style={styles.freshWorkActionsRow}>
              {evt.contactPhone && (
                <TouchableOpacity
                  style={[
                    styles.freshWorkCircularBtn,
                    {
                      backgroundColor: isDark ? '#1E2530' : '#F8F9FA',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
                    },
                  ]}
                  onPress={() => handleCall(evt.contactPhone)}
                  accessibilityLabel="Call Client"
                >
                  <Ionicons name="call-outline" size={16} color="#FF5500" />
                </TouchableOpacity>
              )}

              {evt.venueMapUrl && (
                <TouchableOpacity
                  style={[
                    styles.freshWorkCircularBtn,
                    {
                      backgroundColor: isDark ? '#1E2530' : '#F8F9FA',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
                    },
                  ]}
                  onPress={() => handleMap(evt.venueMapUrl)}
                  accessibilityLabel="Directions"
                >
                  <Ionicons name="map-outline" size={16} color="#3B82F6" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.freshWorkCircularPrimaryBtn}
                onPress={() => router.push(`/events/${evt.id}`)}
                accessibilityLabel="Open Event Details"
              >
                <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    };

    return (
      <View style={[styles.root, { backgroundColor: isDark ? '#0B0F15' : '#F7F8FA' }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: 16,
              paddingTop: Math.max(insets.top, 14) + 6,
              paddingBottom: 110,
            },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Fresh Top Hero Card (Inspired by Reference Images) */}
          <LinearGradient
            colors={['#FF5500', '#EA580C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.freshHeroCard}
          >
            {/* Top row: Avatar, Name, Role & Month Earnings */}
            <View style={styles.freshHeroTopRow}>
              <View style={styles.freshHeroProfileCol}>
                <View style={styles.freshHeroAvatarCircle}>
                  <Ionicons name="camera" size={24} color="#FF5500" />
                </View>
                <View>
                  <Text style={styles.freshHeroName}>{session?.name || 'Karan Malhotra'}</Text>
                  <Text style={styles.freshHeroRole}>Lead Photographer • Crew</Text>
                </View>
              </View>

              <View style={styles.freshHeroEarningsCol}>
                <Text style={styles.freshHeroEarningsLabel}>THIS MONTH</Text>
                <Text style={styles.freshHeroEarningsAmount}>
                  ₹ {novPay > 0 ? novPay.toLocaleString('en-IN') : '42,000'}
                </Text>
                <View style={styles.freshHeroEarningsBadge}>
                  <Text style={styles.freshHeroEarningsBadgeText}>
                    5 Shoots Confirmed
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom row: Next Event highlight banner */}
            {nextShoot && (
              <TouchableOpacity
                style={styles.freshHeroNextBanner}
                onPress={() => router.push(`/events/${nextShoot.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.freshHeroNextDateBadge}>
                  <Text style={styles.freshHeroNextDateNum}>
                    {new Date(nextShoot.startTime).getDate() || 18}
                  </Text>
                  <Text style={styles.freshHeroNextDateMonth}>
                    {monthsShort[new Date(nextShoot.startTime).getMonth()] || 'NOV'}
                  </Text>
                </View>

                <View style={styles.freshHeroNextInfo}>
                  <Text style={styles.freshHeroNextTag}>NEXT EVENT</Text>
                  <Text style={styles.freshHeroNextTitle} numberOfLines={1}>
                    {nextShoot.eventTypeName.toLowerCase().includes('ashirb')
                      ? 'BRIDE & GROOM ASHIRBD'
                      : nextShoot.orderTitle}
                  </Text>
                  <Text style={styles.freshHeroNextVenue} numberOfLines={1}>
                    {nextShoot.venueName || 'Melaghar Lakeview'}
                  </Text>
                </View>

                <View style={styles.freshHeroNextBtn}>
                  <Ionicons name="arrow-forward" size={17} color="#FF5500" />
                </View>
              </TouchableOpacity>
            )}
          </LinearGradient>

          {/* 2. 2x2 Metric Stat Capsules */}
          <View style={styles.freshStatsGrid}>
            <View
              style={[
                styles.freshStatCard,
                {
                  backgroundColor: isDark ? '#141A22' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F0F0F2',
                },
              ]}
            >
              <View>
                <Text style={[styles.freshStatLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  UPCOMING
                </Text>
                <Text style={[styles.freshStatValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {upcomingEvents.length || 7}
                </Text>
              </View>
              <View style={[styles.freshStatIconBox, { backgroundColor: isDark ? 'rgba(255, 85, 0, 0.15)' : '#FFF0E6' }]}>
                <Ionicons name="calendar-outline" size={18} color="#FF5500" />
              </View>
            </View>

            <View
              style={[
                styles.freshStatCard,
                {
                  backgroundColor: isDark ? '#141A22' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F0F0F2',
                },
              ]}
            >
              <View>
                <Text style={[styles.freshStatLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  THIS MONTH
                </Text>
                <Text style={[styles.freshStatValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  ₹{(novPay / 1000).toFixed(0)}k
                </Text>
              </View>
              <View style={[styles.freshStatIconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
                <Ionicons name="wallet-outline" size={18} color="#10B981" />
              </View>
            </View>

            <View
              style={[
                styles.freshStatCard,
                {
                  backgroundColor: isDark ? '#141A22' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F0F0F2',
                },
              ]}
            >
              <View>
                <Text style={[styles.freshStatLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  COMPLETED
                </Text>
                <Text style={[styles.freshStatValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {completedEvents.length || 1}
                </Text>
              </View>
              <View style={[styles.freshStatIconBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
                <Ionicons name="checkmark-circle-outline" size={19} color="#3B82F6" />
              </View>
            </View>

            <View
              style={[
                styles.freshStatCard,
                {
                  backgroundColor: isDark ? '#141A22' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F0F0F2',
                },
              ]}
            >
              <View>
                <Text style={[styles.freshStatLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  TOTAL SHOOTS
                </Text>
                <Text style={[styles.freshStatValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {myEvents.length || 8}
                </Text>
              </View>
              <View style={[styles.freshStatIconBox, { backgroundColor: isDark ? 'rgba(255, 85, 0, 0.15)' : '#FFF0E6' }]}>
                <Ionicons name="briefcase-outline" size={18} color="#FF5500" />
              </View>
            </View>
          </View>

          {/* 3. Month Selector (Streamlined Month-Only View) */}
          <View style={[styles.freshSectionHeaderRow, { marginTop: 18, marginBottom: 8 }]}>
            <View style={styles.freshSectionTitleGroup}>
              <Ionicons name="calendar" size={18} color="#FF5500" />
              <Text style={[styles.freshSectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                Select Month
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#9CA3AF' }}>
              {agentMonthTab === 'ALL'
                ? `${myEvents.length} Total Shoots`
                : agentMonthTab === 'NOV'
                ? `${myEvents.filter(e => e.startTime.includes('2026-11')).length} Shoots in Nov`
                : agentMonthTab === 'DEC'
                ? `${myEvents.filter(e => e.startTime.includes('2026-12')).length} Shoots in Dec`
                : `${completedEvents.length} Completed`}
            </Text>
          </View>

          {/* Month Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 4, paddingRight: 10 }}
          >
            {[
              { key: 'ALL', label: `All Shoots (${myEvents.length})` },
              { key: 'NOV', label: `November '26 (${myEvents.filter(e => e.startTime.includes('2026-11')).length})` },
              { key: 'DEC', label: `December '26 (${myEvents.filter(e => e.startTime.includes('2026-12')).length})` },
              { key: 'COMPLETED', label: `Completed (${completedEvents.length})` },
            ].map(tab => {
              const isActive = agentMonthTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.freshMonthTab,
                    isActive
                      ? styles.freshMonthTabActive
                      : {
                          backgroundColor: isDark ? '#141A22' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
                        },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setAgentMonthTab(tab.key as any);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.freshMonthTabText,
                      isActive
                        ? styles.freshMonthTabTextActive
                        : { color: isDark ? '#9CA3AF' : '#4B5563' },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 5. Search Bar */}
          <View style={styles.freshSearchRow}>
            <View
              style={[
                styles.freshSearchPill,
                {
                  backgroundColor: isDark ? '#141A22' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
                },
              ]}
            >
              <Ionicons name="search-outline" size={17} color="#9CA3AF" />
              <TextInput
                value={agentSearchQuery}
                onChangeText={setAgentSearchQuery}
                placeholder="Search ceremony, venue, couple..."
                placeholderTextColor="#9CA3AF"
                style={[
                  styles.freshSearchInput,
                  { color: isDark ? '#FFFFFF' : '#111827' },
                ]}
              />
              {agentSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setAgentSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.refFilterPill,
                {
                  height: 46,
                  backgroundColor: isDark ? '#141A22' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAgentFilterDropdown(prev =>
                  prev === 'ASSIGNED' ? 'ALL' : prev === 'ALL' ? 'COMPLETED' : 'ASSIGNED'
                );
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="options-outline" size={15} color={isDark ? '#9CA3AF' : '#4B5563'} />
              <Text style={[styles.refFilterText, { color: isDark ? '#D1D5DB' : '#374151', fontSize: 13 }]}>
                {agentFilterDropdown === 'ALL' ? 'All' : agentFilterDropdown === 'COMPLETED' ? 'Done' : 'Assigned'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={isDark ? '#9CA3AF' : '#4B5563'} />
            </TouchableOpacity>
          </View>

          {/* 6. Section Title: Assigned Shoots */}
          <View style={[styles.freshSectionHeaderRow, { marginTop: 16 }]}>
            <View style={styles.freshSectionTitleGroup}>
              <Ionicons name="layers-outline" size={18} color="#FF5500" />
              <Text style={[styles.freshSectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                Assigned Shoots
              </Text>
              <Text style={styles.freshSectionCount}>
                ({filteredWorks.length})
              </Text>
            </View>

            {agentMonthTab === 'NOV' && (
              <View style={styles.refPayPillOrange}>
                <Text style={styles.refPayPillTextOrange}>₹ {novPay.toLocaleString('en-IN')}</Text>
              </View>
            )}
            {agentMonthTab === 'DEC' && (
              <View style={styles.refPayPillGreen}>
                <Text style={styles.refPayPillTextGreen}>₹ {decPay.toLocaleString('en-IN')}</Text>
              </View>
            )}
            {agentMonthTab === 'ALL' && (
              <View style={styles.refPayPillOrange}>
                <Text style={styles.refPayPillTextOrange}>₹ {totalMyPay.toLocaleString('en-IN')}</Text>
              </View>
            )}
          </View>

          {/* 7. Assigned Works List */}
          <View style={{ marginTop: 4 }}>
            {filteredWorks.length === 0 ? (
              <View
                style={{
                  backgroundColor: isDark ? '#141A22' : '#FFFFFF',
                  borderRadius: 20,
                  padding: 24,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
                }}
              >
                <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827', marginTop: 10 }}>
                  No Shoots Found
                </Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 4 }}>
                  Try selecting another date or clearing your search filters.
                </Text>
              </View>
            ) : (
              filteredWorks.map(evt => renderAssignedWorkCard(evt))
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

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
  agentCardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  agentPayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  agentFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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

  /* Events Page Reference Design Styles */
  refHeroCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  refHeroDateSquircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#F25C05',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  refHeroDateNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  refHeroDateMonth: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  refHeroContentCol: {
    flex: 1,
  },
  refHeroTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F25C05',
    letterSpacing: 0.6,
  },
  refHeroTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  refHeroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  refHeroLocationText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  /* 2x2 Stats Grid */
  refStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  refStatCapsule: {
    width: '48.5%',
    backgroundColor: '#131821',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  refStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B949E',
    letterSpacing: 0.5,
  },
  refStatNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  refStatIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Search & Filter Row */
  refSearchFilterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  refSearchPill: {
    flex: 1,
    height: 48,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  refSearchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  refFilterPill: {
    height: 48,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 6,
  },
  refFilterText: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* Section Title */
  refSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    marginBottom: 12,
  },
  refSectionTitleText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  refSectionCountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B949E',
  },

  /* Monthly Cards */
  refMonthContainer: {
    marginBottom: 12,
  },
  refMonthCardOrange: {
    backgroundColor: '#F25C05',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#F25C05',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  refMonthLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refMonthIconBoxOrange: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refMonthTitleOrange: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  refMonthRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refPayPillOrange: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  refPayPillTextOrange: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  refCountBadgeOrange: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refCountBadgeTextOrange: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Month 2: White Card */
  refMonthCardWhite: {
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  refMonthIconBoxPeach: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refMonthTitleWhite: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  refPayPillGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  refPayPillTextGreen: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '800',
  },
  refCountBadgeGray: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refCountBadgeTextGray: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Assigned Works inside Month */
  refAssignedWorksContainer: {
    marginTop: 10,
    gap: 10,
    paddingLeft: 4,
    paddingRight: 4,
  },

  /* Fresh Events Design Styles */
  freshHeroCard: {
    borderRadius: 26,
    padding: 16,
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  freshHeroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  freshHeroProfileCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  freshHeroAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  freshHeroName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  freshHeroRole: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  freshHeroEarningsCol: {
    alignItems: 'flex-end',
  },
  freshHeroEarningsLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  freshHeroEarningsAmount: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 1,
    letterSpacing: 0.3,
  },
  freshHeroEarningsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 3,
  },
  freshHeroEarningsBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  freshHeroNextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 18,
    padding: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  freshHeroNextDateBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    marginRight: 10,
    minWidth: 46,
  },
  freshHeroNextDateNum: {
    color: '#FF5500',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  freshHeroNextDateMonth: {
    color: '#FF5500',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  freshHeroNextInfo: {
    flex: 1,
  },
  freshHeroNextTag: {
    color: '#FED7AA',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  freshHeroNextTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  freshHeroNextVenue: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  freshHeroNextBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  /* 2x2 Fresh Stat Capsules */
  freshStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  freshStatCard: {
    width: '48.5%',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  freshStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  freshStatValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  freshStatIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Section Header */
  freshSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  freshSectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freshSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  freshSectionCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF5500',
  },

  /* Horizontal Date Strip */
  freshDateStrip: {
    gap: 10,
    paddingVertical: 4,
    paddingRight: 10,
  },
  freshDateCard: {
    width: 62,
    height: 78,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  freshDateCardActive: {
    backgroundColor: '#FF5500',
    borderColor: '#FF5500',
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  freshDateMonth: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  freshDateNum: {
    fontSize: 19,
    fontWeight: '900',
    marginVertical: 1,
  },
  freshDateDay: {
    fontSize: 9,
    fontWeight: '800',
  },
  freshDateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 2,
  },

  /* Month Tabs Row */
  freshMonthTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 4,
  },
  freshMonthTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  freshMonthTabActive: {
    backgroundColor: '#FF5500',
    borderColor: '#FF5500',
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  freshMonthTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  freshMonthTabTextActive: {
    color: '#FFFFFF',
  },

  /* Search Row */
  freshSearchRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  freshSearchPill: {
    flex: 1,
    height: 46,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  freshSearchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },

  /* Fresh Assigned Work Card */
  freshWorkCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  freshWorkCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  freshWorkDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 85, 0, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  freshWorkDateBadgeText: {
    color: '#FF5500',
    fontSize: 11,
    fontWeight: '800',
  },
  freshWorkTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  freshWorkOrder: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF5500',
    marginTop: 1,
  },
  freshWorkMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freshWorkMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  freshWorkCrewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.1)',
  },
  freshWorkCrewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  freshWorkCrewChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  freshWorkFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.1)',
  },
  freshWorkPayCol: {
    justifyContent: 'center',
  },
  freshWorkPayLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#9CA3AF',
  },
  freshWorkPayAmount: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 1,
  },
  freshWorkActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freshWorkCircularBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  freshWorkCircularPrimaryBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FF5500',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },

});
