import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const {
    orders,
    events,
    editingTasks,
    submitShootCounts,
    claimTask,
  } = useDemoStore();
  const { colors, typography, spacing, radii, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'DEFAULT' | 'DATE_DESC' | 'DATE_ASC' | 'ID_DESC'>('DEFAULT');
  const [activeFilterModal, setActiveFilterModal] = useState<'STATUS' | 'MONTH' | 'YEAR' | 'SORT' | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Submissions state for Agent (Smart 1-Tap & Quick Custom Ingest)
  const [submittingAsgId, setSubmittingAsgId] = useState<string | null>(null);
  const [assignmentCounts, setAssignmentCounts] = useState<{ [id: string]: string }>({});
  const [ingestToast, setIngestToast] = useState<string | null>(null);
  const toastFade = useRef(new Animated.Value(0)).current;

  const showSuccessToast = (msg: string) => {
    setIngestToast(msg);
    Animated.sequence([
      Animated.timing(toastFade, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastFade, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start(() => setIngestToast(null));
  };

  // Agent Smart Deliverables State
  const [deliverablesTab, setDeliverablesTab] = useState<'ALL' | 'PENDING' | 'SUBMITTED'>('ALL');
  const [deliverablesSearch, setDeliverablesSearch] = useState('');
  const [policyExpanded, setPolicyExpanded] = useState(false);
  const [cardRemarks, setCardRemarks] = useState<{ [id: string]: string }>({});
  // Single active accordion expansion: only one event can be open at a time
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const filteredOrders = useMemo(() => {
    let result = orders.filter(o => {
      const matchSearch =
        searchQuery.trim() === '' ||
        o.tenantOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.venueLocation && o.venueLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.packageName && o.packageName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        selectedStatus === 'ALL' ||
        o.status === selectedStatus ||
        (selectedStatus === 'IN_PROGRESS' && o.status === 'IN_PROGRESS') ||
        (selectedStatus === 'CONFIRMED' && o.status === 'CONFIRMED');

      let matchMonth = true;
      if (selectedMonth !== 'ALL') {
        const d = new Date(o.eventDate);
        const m = d.toLocaleDateString('en-GB', { month: 'short' });
        matchMonth = selectedMonth.toLowerCase().includes(m.toLowerCase());
      }

      let matchYear = true;
      if (selectedYear !== 'ALL') {
        const y = new Date(o.eventDate).getFullYear().toString();
        matchYear = y === selectedYear;
      }

      return matchSearch && matchStatus && matchMonth && matchYear;
    });

    if (sortOrder === 'DATE_ASC') {
      result = [...result].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    } else if (sortOrder === 'DATE_DESC') {
      result = [...result].sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
    } else if (sortOrder === 'ID_DESC') {
      result = [...result].sort((a, b) => b.tenantOrderNumber.localeCompare(a.tenantOrderNumber));
    }

    return result;
  }, [orders, searchQuery, selectedStatus, selectedMonth, selectedYear, sortOrder]);

  const workspace = session?.activeWorkspace || 'OPERATIONS';
  const isAgent = workspace === 'SHOOTS';
  const isEditor = workspace === 'EDITING';

  // ----------------------------------------------------
  // AGENT SUBMISSIONS TAB (AGT-03, AGT-04)
  // ----------------------------------------------------
  if (isAgent) {
    const agentId = session?.id || 'usr-agt-01';
    const agentAvatar =
      session?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

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

    // Dynamic photo & file calculation for this month
    const totalSubmittedPhotos = submittedHistory
      .filter(item => item.assignment.role === 'PHOTOGRAPHER')
      .reduce((sum, item) => sum + (item.assignment.submissionCount || 0), 0);

    const totalSubmittedVideos = submittedHistory
      .filter(item => item.assignment.role === 'VIDEOGRAPHER')
      .reduce((sum, item) => sum + (item.assignment.submissionCount || 0), 0);

    const totalSubmittedFiles = totalSubmittedPhotos + totalSubmittedVideos;

    const handleConfirmSubmission = (
      eventId: string,
      assignmentId: string,
      role: any,
      customCount?: number
    ) => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch {}

      const isPhotoRole = role === 'PHOTOGRAPHER';
      const countToRecord =
        customCount !== undefined
          ? customCount
          : isPhotoRole
          ? parseInt(assignmentCounts[assignmentId] || '450', 10) || 450
          : parseInt(assignmentCounts[assignmentId] || '35', 10) || 35;

      submitShootCounts({
        eventId,
        assignmentId,
        role,
        photoCount: isPhotoRole ? countToRecord : undefined,
        videoCount: !isPhotoRole ? countToRecord : undefined,
      });

      setSubmittingAsgId(null);
      setExpandedAssignmentId(null);

      showSuccessToast(
        `✓ ${countToRecord.toLocaleString('en-IN')} ${
          isPhotoRole ? 'Photos' : 'Clips'
        } Logged Successfully!`
      );
    };

    const monthsShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const formatEventTime = (isoString: string) => {
      try {
        const d = new Date(isoString);
        let hours = d.getHours();
        const minutes = d.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const strMinutes = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${strMinutes} ${ampm}`;
      } catch {
        return '12:00 PM';
      }
    };

    // Single active accordion expansion: only one event can be open at a time
    const toggleExpand = (assignmentId: string) => {
      try {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      } catch {}
      if (expandedAssignmentId === assignmentId) {
        setExpandedAssignmentId(null);
        setSubmittingAsgId(null);
      } else {
        setExpandedAssignmentId(assignmentId);
        setSubmittingAsgId(null);
      }
    };

    // Filter display items
    const displayItems = (
      deliverablesTab === 'PENDING'
        ? pendingSubmissions
        : deliverablesTab === 'SUBMITTED'
        ? submittedHistory
        : [...pendingSubmissions, ...submittedHistory]
    ).filter(item => {
      if (!deliverablesSearch.trim()) return true;
      const q = deliverablesSearch.toLowerCase();
      return (
        item.event.eventTypeName.toLowerCase().includes(q) ||
        item.event.orderTitle.toLowerCase().includes(q) ||
        item.event.tenantOrderNumber.toLowerCase().includes(q) ||
        (item.event.venueName && item.event.venueName.toLowerCase().includes(q))
      );
    });

    return (
      <LinearGradient
        colors={
          isDark
            ? ['#733723', '#5B2A1F', '#371F1D', '#1C181D', '#151218']
            : ['#F7F8FA', '#F7F8FA', '#F7F8FA']
        }
        locations={isDark ? [0, 0.22, 0.5, 0.8, 1.0] : [0, 0.5, 1.0]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.root}
      >
        <DemoBanner />
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
          {/* Header Bar */}
          <View style={styles.delivHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.delivOverline}>GOLDEN MOMENT · STUDIO INGEST</Text>
              </View>
              <Text style={[styles.delivTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                Deliverables & Ingest
              </Text>
              <Text style={[styles.delivSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                Record captured files & verify memory cards for studio vault
              </Text>
            </View>
          </View>

          {/* 1. Frosted Glass Hero Card */}
          <View style={styles.heroCardGlass}>
            {/* Radiant Orange Gradient Base matching Calfo fresh design system */}
            <LinearGradient
              colors={['#FF5500', '#FF6E1A', '#FF8533']}
              locations={[0, 0.45, 1.0]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Specular Sheen & Glass Reflection Highlight */}
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.32)',
                'rgba(255, 255, 255, 0.10)',
                'rgba(255, 255, 255, 0.0)',
                'rgba(0, 0, 0, 0.20)',
              ]}
              locations={[0, 0.24, 0.60, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Subtle Diagonal Glass Texture / Light Catch */}
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.06)', 'transparent']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Optical Glass Top Rim Reflection */}
            <View style={styles.glassTopEdgeLine} />

            <View style={styles.heroCardInnerContent}>
              {/* Top Row: Metric Label & Month Badge */}
              <View style={styles.heroTopRow}>
                <Text style={styles.heroStatLabel}>THIS MONTH'S TOTAL SUBMITTED</Text>
                <View style={styles.heroMonthBadge}>
                  <Ionicons name="calendar" size={11} color="#FFFFFF" />
                  <Text style={styles.heroMonthText}>November 2026</Text>
                </View>
              </View>

              {/* Central Stat: Total Photos / Files Submitted This Month */}
              <View style={styles.heroStatContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={styles.heroBigNumber}>
                    {totalSubmittedFiles.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.heroBigNumberUnit}>files</Text>
                </View>
                <Text style={styles.heroStatSubtext}>
                  Total RAW photos & 4K video clips ingested into studio vault
                </Text>
              </View>

              {/* Sub-Metrics Row (Capsules for Photos, Videos, and Physical Memory Cards) */}
              <View style={styles.heroCapsulesRow}>
                <View style={styles.heroCapsule}>
                  <Ionicons name="camera" size={13} color="#FFFFFF" />
                  <Text style={styles.heroCapsuleText}>
                    {totalSubmittedPhotos.toLocaleString('en-IN')} Photos
                  </Text>
                </View>

                <View style={styles.heroCapsule}>
                  <Ionicons name="videocam" size={13} color="#FFFFFF" />
                  <Text style={styles.heroCapsuleText}>
                    {totalSubmittedVideos} 4K Clips
                  </Text>
                </View>

                <View style={styles.heroCapsule}>
                  <Ionicons name="hardware-chip" size={13} color="#FFFFFF" />
                  <Text style={styles.heroCapsuleText}>
                    {(submittedHistory.length * 2) || 4} SD Cards
                  </Text>
                </View>
              </View>

              {/* Handover Status Strip */}
              <View style={styles.heroFooterTrack}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View
                    style={[
                      styles.statusDotSmall,
                      { backgroundColor: pendingSubmissions.length > 0 ? '#FEF08A' : '#86EFAC' },
                    ]}
                  />
                  <Text style={styles.heroFooterText}>
                    {pendingSubmissions.length > 0
                      ? `${pendingSubmissions.length} shoot(s) awaiting count submission`
                      : 'All completed shoots logged & verified'}
                  </Text>
                </View>
                <Text style={styles.heroFooterRight}>100% Policy</Text>
              </View>
            </View>
          </View>

          {/* 2. Studio Physical Ingest Policy (Smart Expandable) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setPolicyExpanded(!policyExpanded)}
            style={[
              styles.policyBanner,
              {
                backgroundColor: isDark ? 'rgba(34, 22, 26, 0.75)' : '#EFF6FF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#BFDBFE',
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={styles.policyIconCircle}>
                <Ionicons name="shield-checkmark" size={14} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.policyTitle, { color: isDark ? '#FFFFFF' : '#1E40AF' }]}>
                  Studio Physical Ingest Policy
                </Text>
                <Text
                  style={[styles.policyBrief, { color: isDark ? '#9CA3AF' : '#3B82F6' }]}
                  numberOfLines={policyExpanded ? undefined : 1}
                >
                  {policyExpanded
                    ? 'All memory cards, RAW photos, and 4K footage files must be physically handed over at the studio reception within 24 hours of shoot completion. Dual-slot verification is conducted upon check-in.'
                    : 'Physical memory cards & RAW files are verified at studio desk within 24h.'}
                </Text>
              </View>
              <Ionicons
                name={policyExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={isDark ? '#9CA3AF' : '#3B82F6'}
              />
            </View>
          </TouchableOpacity>

          {/* 3. Filter Segment Tabs & Search */}
          <View style={styles.delivFilterRow}>
            <TouchableOpacity
              onPress={() => setDeliverablesTab('ALL')}
              style={[
                styles.delivFilterTab,
                deliverablesTab === 'ALL' && styles.delivFilterTabActive,
                {
                  backgroundColor:
                    deliverablesTab === 'ALL'
                      ? '#FF5500'
                      : isDark
                      ? 'rgba(34, 22, 26, 0.8)'
                      : '#FFFFFF',
                  borderColor:
                    deliverablesTab === 'ALL'
                      ? '#FF5500'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : '#E5E7EB',
                },
              ]}
            >
              <Text
                style={[
                  styles.delivFilterTabText,
                  { color: deliverablesTab === 'ALL' ? '#FFFFFF' : isDark ? '#D1D5DB' : '#374151' },
                ]}
              >
                All ({agentAssignments.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDeliverablesTab('PENDING')}
              style={[
                styles.delivFilterTab,
                deliverablesTab === 'PENDING' && styles.delivFilterTabActiveRed,
                {
                  backgroundColor:
                    deliverablesTab === 'PENDING'
                      ? '#DC2626'
                      : isDark
                      ? 'rgba(34, 22, 26, 0.8)'
                      : '#FFFFFF',
                  borderColor:
                    deliverablesTab === 'PENDING'
                      ? '#DC2626'
                      : isDark
                      ? 'rgba(239, 68, 68, 0.3)'
                      : '#FECACA',
                },
              ]}
            >
              <View style={styles.redDotMicro} />
              <Text
                style={[
                  styles.delivFilterTabText,
                  {
                    color:
                      deliverablesTab === 'PENDING' ? '#FFFFFF' : isDark ? '#FCA5A5' : '#DC2626',
                  },
                ]}
              >
                Action Needed ({pendingSubmissions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDeliverablesTab('SUBMITTED')}
              style={[
                styles.delivFilterTab,
                deliverablesTab === 'SUBMITTED' && styles.delivFilterTabActiveGreen,
                {
                  backgroundColor:
                    deliverablesTab === 'SUBMITTED'
                      ? '#059669'
                      : isDark
                      ? 'rgba(34, 22, 26, 0.8)'
                      : '#FFFFFF',
                  borderColor:
                    deliverablesTab === 'SUBMITTED'
                      ? '#059669'
                      : isDark
                      ? 'rgba(16, 185, 129, 0.3)'
                      : '#A7F3D0',
                },
              ]}
            >
              <View style={styles.greenDotMicro} />
              <Text
                style={[
                  styles.delivFilterTabText,
                  {
                    color:
                      deliverablesTab === 'SUBMITTED' ? '#FFFFFF' : isDark ? '#6EE7B7' : '#059669',
                  },
                ]}
              >
                Verified ({submittedHistory.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Search Bar */}
          <View
            style={[
              styles.delivSearchBar,
              {
                backgroundColor: isDark ? 'rgba(34, 22, 26, 0.8)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
              },
            ]}
          >
            <Ionicons name="search" size={15} color="#9CA3AF" />
            <TextInput
              value={deliverablesSearch}
              onChangeText={setDeliverablesSearch}
              placeholder="Search ceremony, client, order number..."
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              style={[styles.delivSearchInput, { color: isDark ? '#FFFFFF' : '#111827' }]}
            />
            {deliverablesSearch.length > 0 && (
              <TouchableOpacity onPress={() => setDeliverablesSearch('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Section Heading */}
          <View style={styles.sectionHeadingRow}>
            <Text style={[styles.sectionHeadingTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {deliverablesTab === 'PENDING'
                ? `Pending Ingest Submissions (${displayItems.length})`
                : deliverablesTab === 'SUBMITTED'
                ? `Ingest History (${displayItems.length})`
                : `All Assigned Deliverables (${displayItems.length})`}
            </Text>
            <Text style={styles.sectionHeadingCaption}>Red = Action Required • Green = Ingest Cleared</Text>
          </View>

          {/* 4. Event Cards with Red / Green Color-Coding Under Each Card */}
          {displayItems.length === 0 ? (
            <StateView
              type="empty"
              title={deliverablesSearch ? 'No matching deliverables' : 'No Shoots in this filter'}
              message={
                deliverablesSearch
                  ? 'Try searching with another keyword or order number.'
                  : 'All your shoots are up to date.'
              }
            />
          ) : (
            displayItems.map(({ event, assignment }) => {
              const isPending =
                event.status === 'COMPLETED' && assignment.submissionCount === undefined;
              const isSubmitted = assignment.submissionCount !== undefined;
              const isPhoto = assignment.role === 'PHOTOGRAPHER';

              const d = new Date(event.startTime);
              const dayNum = String(d.getDate()).padStart(2, '0');
              const monthShort = monthsShort[d.getMonth()] || 'NOV';

              const currentCount =
                assignmentCounts[assignment.id] || (isPhoto ? '450' : '35');
              const setCount = (val: string) =>
                setAssignmentCounts(prev => ({ ...prev, [assignment.id]: val }));

              const isExpanded = expandedAssignmentId === assignment.id;

              return (
                <View
                  key={assignment.id}
                  style={[
                    styles.smartEventCard,
                    {
                      backgroundColor: isDark ? 'rgba(34, 22, 26, 0.85)' : '#FFFFFF',
                      borderColor: isPending
                        ? isDark
                          ? 'rgba(239, 68, 68, 0.45)'
                          : '#FCA5A5'
                        : isDark
                        ? 'rgba(16, 185, 129, 0.45)'
                        : '#86EFAC',
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
                    {/* Vertical Date Rail on Left (as marked by user) */}
                    <View
                      style={[
                        styles.verticalDateRail,
                        {
                          backgroundColor: isPending
                            ? isDark
                              ? 'rgba(239, 68, 68, 0.10)'
                              : '#FEF2F2'
                            : isDark
                            ? 'rgba(16, 185, 129, 0.10)'
                            : '#ECFDF5',
                          borderRightColor: isPending
                            ? isDark
                              ? 'rgba(239, 68, 68, 0.22)'
                              : '#FECACA'
                            : isDark
                            ? 'rgba(16, 185, 129, 0.22)'
                            : '#A7F3D0',
                        },
                      ]}
                    >
                      <Ionicons name="calendar-outline" size={13} color="#FF5500" />
                      <Text
                        style={[
                          styles.verticalDateDay,
                          { color: isDark ? '#FFFFFF' : '#111827' },
                        ]}
                      >
                        {dayNum}
                      </Text>
                      <Text style={styles.verticalDateMonth}>{monthShort}</Text>
                    </View>

                    {/* Right Card Content */}
                    <View style={{ flex: 1 }}>
                      {/* Touchable Header Row: Tapping toggles open/collapsed (only 1 open at a time) */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggleExpand(assignment.id)}
                        style={styles.smartCardHeaderTouchable}
                      >
                        <View style={{ flex: 1, marginRight: 4 }}>
                          {/* Top Row: Event Name & Status Pill */}
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 6,
                            }}
                          >
                            <Text
                              style={[
                                styles.smartCardTitle,
                                { color: isDark ? '#FFFFFF' : '#111827', flex: 1 },
                              ]}
                              numberOfLines={1}
                            >
                              {event.eventTypeName.toUpperCase()}
                            </Text>

                            {/* Status Pill */}
                            {isSubmitted ? (
                              <View style={styles.pillRecorded}>
                                <Ionicons name="checkmark-circle" size={11} color="#10B981" />
                                <Text style={styles.pillRecordedText}>VERIFIED</Text>
                              </View>
                            ) : (
                              <View style={styles.pillPendingMini}>
                                <View style={styles.orangeDotMicro} />
                                <Text style={styles.pillPendingMiniText}>PENDING</Text>
                              </View>
                            )}
                          </View>

                          {/* Bottom Row: File Number / Order & Logged Count + Chevron */}
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginTop: 4,
                            }}
                          >
                            <Text style={styles.smartCardOrder} numberOfLines={1}>
                              {event.tenantOrderNumber}
                              {isSubmitted && assignment.submissionCount !== undefined
                                ? ` · ${assignment.submissionCount.toLocaleString('en-IN')} ${isPhoto ? 'Photos' : 'Clips'}`
                                : ' · Awaiting Counts'}
                            </Text>
                            <Ionicons
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={16}
                              color={isDark ? '#9CA3AF' : '#6B7280'}
                            />
                          </View>
                        </View>
                      </TouchableOpacity>

                      {/* Subtle Divider for Pending or Expanded */}
                      {(!isSubmitted || isExpanded) && (
                        <View
                          style={[
                            styles.expandedDivider,
                            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB', marginHorizontal: 10, marginTop: 4 },
                          ]}
                        />
                      )}

                      {/* Details Section: Always shown for Pending, or shown on tap for Submitted */}
                      {(!isSubmitted || isExpanded) && (
                        <View style={[styles.expandedDetailsSection, { paddingTop: 6 }]}>
                          {/* Client & Order Name */}
                          <View style={styles.detailRow}>
                            <Ionicons name="briefcase-outline" size={13} color="#FF5500" />
                            <Text
                              style={[
                                styles.detailText,
                                { color: isDark ? '#E5E7EB' : '#374151', flex: 1 },
                              ]}
                              numberOfLines={1}
                            >
                              {event.orderTitle} ({event.tenantOrderNumber})
                            </Text>
                          </View>

                          {/* Time & Venue */}
                          <View style={styles.detailRow}>
                            <Ionicons name="time-outline" size={13} color="#9CA3AF" />
                            <Text style={[styles.detailText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                              {formatEventTime(event.startTime)}
                            </Text>
                            <Text style={{ color: isDark ? '#4B5563' : '#9CA3AF' }}>•</Text>
                            <Ionicons name="location-outline" size={13} color="#9CA3AF" />
                            <Text
                              style={[
                                styles.detailText,
                                { color: isDark ? '#9CA3AF' : '#6B7280', flex: 1 },
                              ]}
                              numberOfLines={1}
                            >
                              {event.venueName || event.venueAddress || 'Main Studio'}
                            </Text>
                          </View>

                          {/* Assigned Role */}
                          <View style={styles.detailRow}>
                            <Ionicons
                              name={isPhoto ? 'camera-outline' : 'videocam-outline'}
                              size={13}
                              color="#FF5500"
                            />
                            <Text style={[styles.detailText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                              Assigned Role:{' '}
                              <Text style={{ fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827' }}>
                                {assignment.role}
                              </Text>
                            </Text>
                          </View>

                          {/* When Pending: Space for put number + Submit button SIDE BY SIDE in a single row */}
                          {!isSubmitted && (
                            <View style={styles.inlineSubmitRow}>
                              {/* Space for putting number (Direct numeric typing, without +- buttons) */}
                              <View
                                style={[
                                  styles.inlineNumberBox,
                                  {
                                    backgroundColor: isDark ? 'rgba(46, 28, 33, 0.9)' : '#F3F4F6',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5E7EB',
                                  },
                                ]}
                              >
                                <TextInput
                                  value={currentCount}
                                  onChangeText={setCount}
                                  keyboardType="numeric"
                                  selectTextOnFocus
                                  placeholder={isPhoto ? '450' : '35'}
                                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                                  style={[
                                    styles.inlineNumberInput,
                                    { color: isDark ? '#FFFFFF' : '#111827' },
                                  ]}
                                />
                              </View>

                              {/* Submit Button Side by Side in the Row */}
                              <TouchableOpacity
                                style={styles.inlineSubmitBtn}
                                onPress={() =>
                                  handleConfirmSubmission(
                                    event.id,
                                    assignment.id,
                                    assignment.role,
                                    parseInt(currentCount, 10) || (isPhoto ? 450 : 35)
                                  )
                                }
                                activeOpacity={0.85}
                              >
                                <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />
                                <Text style={styles.inlineSubmitText}>Submit</Text>
                                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
                          )}

                          {/* When Submitted: Display Verified Submitted Record */}
                          {isSubmitted && (
                            <View style={{ marginTop: 8 }}>
                              <View style={styles.submittedVerifiedBox}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                    <Text style={[styles.verifiedCountNum, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                                      {assignment.submissionCount} {isPhoto ? 'RAW Photos' : '4K Clips'} Logged
                                    </Text>
                                  </View>
                                  <Text style={styles.verifiedIdText}>
                                    #ING-{assignment.id.slice(-4).toUpperCase()}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          )}
                        </View>
                      )}
            </View>
          </View>
        </View>
      );
        })
      )}
    </ScrollView>

    {/* Floating Success Notification Toast */}
    {ingestToast && (
      <Animated.View
        style={[
          styles.toastBanner,
          { opacity: toastFade, bottom: insets.bottom + 90 },
        ]}
        pointerEvents="none"
      >
        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
        <Text style={styles.toastBannerText}>{ingestToast}</Text>
      </Animated.View>
    )}
  </LinearGradient>
    );
  }

  // ----------------------------------------------------
  // ORDER MANAGEMENT (Exact Match to User Reference)
  // ----------------------------------------------------
  const statuses = ['ALL', 'CONFIRMED', 'IN_PROGRESS', 'PENDING', 'COMPLETED', 'CANCELLED'];
  const months = ['ALL', 'Nov', 'Oct', 'Sep', 'Aug', 'Jul'];
  const years = ['ALL', '2026', '2025'];
  const sortOptions = [
    { label: 'Default (Original)', value: 'DEFAULT' },
    { label: 'Date (Newest First)', value: 'DATE_DESC' },
    { label: 'Date (Oldest First)', value: 'DATE_ASC' },
    { label: 'Order # (High to Low)', value: 'ID_DESC' },
  ];

  const getStatusBadgeColors = (st: string) => {
    switch (st) {
      case 'CONFIRMED':
        return { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' };
      case 'IN_PROGRESS':
        return { bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9' };
      case 'PENDING':
        return { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' };
      case 'COMPLETED':
        return { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' };
      case 'CANCELLED':
        return { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626' };
      default:
        return { bg: '#F3F4F6', border: '#E5E7EB', text: '#4B5563' };
    }
  };

  return (
    <View style={[styles.omRoot, { backgroundColor: '#F8F4EE' }]}>
      <DemoBanner />
      <ScrollView
        contentContainerStyle={[
          styles.omScrollContent,
          {
            paddingTop: Math.max(insets.top, 14) + 6,
            paddingHorizontal: 16,
            paddingBottom: 110,
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Row: Icon + Title + Subtitle */}
        <View style={styles.omHeaderRow}>
          <View style={styles.omHeaderIconBox}>
            <Ionicons name="receipt-outline" size={20} color="#EA580C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.omHeaderTitle}>Order Management</Text>
            <Text style={styles.omHeaderSubtitle}>
              Track bookings, payments, and delivery progress
            </Text>
          </View>
        </View>

        {/* Search & Filter Card */}
        <View style={styles.omSearchCard}>
          {/* Search Input Bar */}
          <View style={styles.omSearchInputRow}>
            <Ionicons name="search-outline" size={17} color="#9CA3AF" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search orders, clients, phone..."
              placeholderTextColor="#9CA3AF"
              style={styles.omSearchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={17} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Filter Control Pills */}
          <View style={styles.omFiltersRow}>
            {/* 1. Sort Pill */}
            <TouchableOpacity
              style={[styles.omFilterPill, sortOrder !== 'DEFAULT' && styles.omFilterPillActive]}
              onPress={() => setActiveFilterModal('SORT')}
              activeOpacity={0.7}
            >
              <Text style={styles.omFilterPillText}>⇅ Sort</Text>
            </TouchableOpacity>

            {/* 2. Statuses Pill */}
            <TouchableOpacity
              style={[styles.omFilterPill, selectedStatus !== 'ALL' && styles.omFilterPillActive]}
              onPress={() => setActiveFilterModal('STATUS')}
              activeOpacity={0.7}
            >
              <Ionicons name="reorder-three-outline" size={14} color="#554238" />
              <Text style={styles.omFilterPillText}>
                {selectedStatus === 'ALL' ? 'All Statuses' : selectedStatus.replace('_', ' ')}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#8A7A72" />
            </TouchableOpacity>

            {/* 3. Months Pill */}
            <TouchableOpacity
              style={[styles.omFilterPill, selectedMonth !== 'ALL' && styles.omFilterPillActive]}
              onPress={() => setActiveFilterModal('MONTH')}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={13} color="#554238" />
              <Text style={styles.omFilterPillText}>
                {selectedMonth === 'ALL' ? 'All Months' : selectedMonth}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#8A7A72" />
            </TouchableOpacity>

            {/* 4. Years Pill */}
            <TouchableOpacity
              style={[styles.omFilterPill, selectedYear !== 'ALL' && styles.omFilterPillActive]}
              onPress={() => setActiveFilterModal('YEAR')}
              activeOpacity={0.7}
            >
              <Text style={styles.omFilterPillText}>
                {selectedYear === 'ALL' ? 'All Years' : selectedYear}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#8A7A72" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Orders Card Container (matching reference with left orange bar) */}
        <View style={styles.omOrdersCardContainer}>
          {/* Left Orange Accent Line along the container */}
          <View style={styles.omLeftOrangeAccent} />

          {filteredOrders.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Ionicons name="search-outline" size={32} color="#D1C7BD" />
              <Text style={[styles.omEmptyText, { marginTop: 8 }]}>
                No orders match your filter criteria.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSelectedStatus('ALL');
                  setSelectedMonth('ALL');
                  setSelectedYear('ALL');
                  setSortOrder('DEFAULT');
                }}
                style={{
                  marginTop: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  backgroundColor: '#FFF3EC',
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: '#EA580C', fontWeight: '700', fontSize: 13 }}>
                  Reset Filters
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredOrders.map((order, idx) => {
              const dateObj = new Date(order.eventDate);
              const day = String(dateObj.getDate()).padStart(2, '0');
              const month = dateObj.toLocaleDateString('en-GB', { month: 'short' });
              const year = String(dateObj.getFullYear()).slice(-2);
              const formattedDate = `${day} ${month} ${year}`;
              const categoryText =
                order.packageName || (order.type === 'WEDDING' ? 'VIVAH —' : 'Occasion —');
              const stStyle = getStatusBadgeColors(order.status);
              const isLast = idx === filteredOrders.length - 1;

              return (
                <TouchableOpacity
                  key={order.id}
                  onPress={() => router.push(`/orders/${order.id}` as any)}
                  activeOpacity={0.75}
                  style={[
                    styles.omOrderItemRow,
                    isLast && { borderBottomWidth: 0 },
                  ]}
                >
                  {/* Top Line: Tag Badge + Pin Icon + Title */}
                  <View style={styles.omOrderTopRow}>
                    <View style={styles.omTagBadge}>
                      <Text style={styles.omTagText}>{order.tenantOrderNumber}</Text>
                    </View>
                    <Ionicons name="pricetag" size={13} color="#F59E0B" style={{ marginLeft: 6 }} />
                    <Text style={styles.omOrderTitle} numberOfLines={1}>
                      {order.title}
                    </Text>
                  </View>

                  {/* Middle Line: Date · Category */}
                  <Text style={styles.omOrderSubline}>
                    {formattedDate} · {categoryText}
                  </Text>

                  {/* Bottom Line: Status Badge + Right Action Icons */}
                  <View style={styles.omOrderBottomRow}>
                    <View
                      style={[
                        styles.omStatusBadge,
                        { backgroundColor: stStyle.bg, borderColor: stStyle.border },
                      ]}
                    >
                      <Text style={[styles.omStatusText, { color: stStyle.text }]}>
                        {order.status === 'IN_PROGRESS' ? 'IN PROGRESS' : order.status}
                      </Text>
                      <Text style={[styles.omStatusDash, { color: stStyle.text }]}> —</Text>
                    </View>

                    <View style={styles.omActionsGroup}>
                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() =>
                          Alert.alert(
                            'Order Document',
                            `Deliverable invoice & contract for ${order.tenantOrderNumber}`
                          )
                        }
                      >
                        <Ionicons name="document-text-outline" size={17} color="#BCAAA4" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() =>
                          Alert.alert(
                            'Financial Summary',
                            `Order ${order.tenantOrderNumber}\nTotal: ₹${(
                              order.financials?.totalAmount || 0
                            ).toLocaleString('en-IN')}\nPaid: ₹${(
                              order.financials?.paidAmount || 0
                            ).toLocaleString('en-IN')}\nBalance: ₹${(
                              order.financials?.balanceDue || 0
                            ).toLocaleString('en-IN')}`
                          )
                        }
                      >
                        <Ionicons name="wallet-outline" size={17} color="#BCAAA4" />
                      </TouchableOpacity>

                      <Ionicons name="chevron-forward" size={17} color="#BCAAA4" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Filter Selection Modal */}
      <Modal
        visible={activeFilterModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveFilterModal(null)}
      >
        <TouchableOpacity
          style={styles.omModalBackdrop}
          activeOpacity={1}
          onPress={() => setActiveFilterModal(null)}
        >
          <View style={styles.omModalSheet}>
            <View style={styles.omModalHeader}>
              <Text style={styles.omModalTitle}>
                {activeFilterModal === 'SORT' && 'Sort Orders'}
                {activeFilterModal === 'STATUS' && 'Filter by Status'}
                {activeFilterModal === 'MONTH' && 'Filter by Month'}
                {activeFilterModal === 'YEAR' && 'Filter by Year'}
              </Text>
              <TouchableOpacity onPress={() => setActiveFilterModal(null)}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {activeFilterModal === 'SORT' &&
                sortOptions.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.omModalOption,
                      sortOrder === opt.value && styles.omModalOptionActive,
                    ]}
                    onPress={() => {
                      setSortOrder(opt.value as any);
                      setActiveFilterModal(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.omModalOptionText,
                        sortOrder === opt.value && styles.omModalOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {sortOrder === opt.value && (
                      <Ionicons name="checkmark" size={18} color="#EA580C" />
                    )}
                  </TouchableOpacity>
                ))}

              {activeFilterModal === 'STATUS' &&
                statuses.map(st => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.omModalOption,
                      selectedStatus === st && styles.omModalOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedStatus(st);
                      setActiveFilterModal(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.omModalOptionText,
                        selectedStatus === st && styles.omModalOptionTextActive,
                      ]}
                    >
                      {st === 'ALL' ? 'All Statuses' : st.replace('_', ' ')}
                    </Text>
                    {selectedStatus === st && (
                      <Ionicons name="checkmark" size={18} color="#EA580C" />
                    )}
                  </TouchableOpacity>
                ))}

              {activeFilterModal === 'MONTH' &&
                months.map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.omModalOption,
                      selectedMonth === m && styles.omModalOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedMonth(m);
                      setActiveFilterModal(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.omModalOptionText,
                        selectedMonth === m && styles.omModalOptionTextActive,
                      ]}
                    >
                      {m === 'ALL' ? 'All Months' : m}
                    </Text>
                    {selectedMonth === m && (
                      <Ionicons name="checkmark" size={18} color="#EA580C" />
                    )}
                  </TouchableOpacity>
                ))}

              {activeFilterModal === 'YEAR' &&
                years.map(y => (
                  <TouchableOpacity
                    key={y}
                    style={[
                      styles.omModalOption,
                      selectedYear === y && styles.omModalOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedYear(y);
                      setActiveFilterModal(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.omModalOptionText,
                        selectedYear === y && styles.omModalOptionTextActive,
                      ]}
                    >
                      {y === 'ALL' ? 'All Years' : y}
                    </Text>
                    {selectedYear === y && (
                      <Ionicons name="checkmark" size={18} color="#EA580C" />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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

  /* ============================================================== */
  /* SMART DELIVERABLES INGEST STYLES (AGT-03 & AGT-04)             */
  /* ============================================================== */
  delivHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  delivOverline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#FF5500',
  },
  delivTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  delivSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  delivAvatarPill: {
    position: 'relative',
  },
  delivHeaderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FF5500',
  },
  delivOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#1C181D',
  },

  /* Frosted Glass Hero Card */
  heroCardGlass: {
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: '#FF5500',
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  glassGlowBlob1: {
    position: 'absolute',
    top: -50,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF5500',
    opacity: 0.40,
  },
  glassGlowBlob2: {
    position: 'absolute',
    bottom: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#D97706',
    opacity: 0.28,
  },
  glassTopEdgeLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    zIndex: 2,
  },
  heroCardInnerContent: {
    padding: 16,
    paddingBottom: 0,
    position: 'relative',
    zIndex: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroAvatarRing: {
    position: 'relative',
  },
  heroAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  heroAchievementPin: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  heroAgentName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroAgentRole: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  heroMonthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
  },
  heroMonthText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroStatContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  heroStatLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: 'rgba(255, 255, 255, 0.90)',
  },
  heroBigNumber: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginTop: 2,
    textShadowColor: 'rgba(255, 85, 0, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroBigNumberUnit: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.90)',
  },
  heroStatSubtext: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.88)',
    fontWeight: '500',
    marginTop: 2,
  },
  heroCapsulesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  heroCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 7.5,
    borderRadius: 14,
  },
  heroCapsuleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroFooterTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.20)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.14)',
  },
  statusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  heroFooterRight: {
    fontSize: 10.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.90)',
    letterSpacing: 0.5,
  },

  /* Policy Banner */
  policyBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  policyIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  policyTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  policyBrief: {
    fontSize: 11,
    marginTop: 1,
    lineHeight: 15,
  },

  /* Filter Tabs */
  delivFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  delivFilterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  delivFilterTabActive: {
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  delivFilterTabActiveRed: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  delivFilterTabActiveGreen: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  delivFilterTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  redDotMicro: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  greenDotMicro: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },

  /* Search Bar */
  delivSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  delivSearchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },

  /* Section Heading */
  sectionHeadingRow: {
    marginBottom: 8,
  },
  sectionHeadingTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeadingCaption: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },

  /* Smart Event Card */
  smartEventCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  smartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
  },
  verticalDateRail: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    paddingVertical: 10,
    gap: 2,
  },
  verticalDateDay: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  verticalDateMonth: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FF5500',
    letterSpacing: 0.8,
  },
  smartDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 85, 0, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  smartDateBadgeText: {
    color: '#FF5500',
    fontSize: 10,
    fontWeight: '800',
  },
  smartCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  smartCardOrder: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#FF5500',
    marginTop: 1,
  },
  pillAwaiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  pillAwaitingText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.3,
  },
  pillRecorded: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  pillRecordedText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.3,
  },
  smartCardHeaderTouchable: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  pillPendingMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 85, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 85, 0, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  pillPendingMiniText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FF5500',
    letterSpacing: 0.3,
  },
  orangeDotMicro: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FF5500',
  },
  expandedDetailsSection: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 2,
  },
  expandedDivider: {
    height: 1,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  detailText: {
    fontSize: 11,
    fontWeight: '500',
  },

  smartMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
  },
  smartMetaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  smartRoleSection: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 2,
  },
  smartRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    marginBottom: 8,
  },
  smartRoleText: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  /* Verified Record Box */
  submittedVerifiedBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.22)',
    padding: 10,
  },
  verifiedCountNum: {
    fontSize: 13,
    fontWeight: '800',
  },
  verifiedIdText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  verifiedSubtext: {
    fontSize: 10.5,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 14,
  },

  /* Form Elements */
  smartInputCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginTop: 4,
  },
  inputHeading: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperInput: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF5500',
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '600',
  },
  remarksInput: {
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 11,
    marginTop: 3,
  },
  confirmSubmitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FF5500',
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmSubmitText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  cancelSubmitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  cancelSubmitText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Side by Side: Number Input Space & Submit Button in a Single Row */
  inlineSubmitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  inlineNumberBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    height: 44,
    minWidth: 88,
    paddingHorizontal: 12,
  },
  inlineNumberInput: {
    minWidth: 64,
    height: 44,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  inlineSubmitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FF5500',
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  inlineSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  triggerSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF5500',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  triggerSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  /* 1-Tap Quick Ingest Bar */
  smartQuickIngestBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  oneTapSubmitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FF5500',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  oneTapSubmitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  adjustCountsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  adjustCountsText: {
    color: '#FF5500',
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* Non-blocking Floating Success Toast */
  toastBanner: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  toastBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },

  /* ============================================================== */
  /* COLOR-CODED STATUS BAR UNDER CARD (USER SPECIFICATION)         */
  /* ============================================================== */
  colorCodeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderTopWidth: 1,
    gap: 6,
  },
  colorCodeBarRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderTopColor: 'rgba(239, 68, 68, 0.3)',
  },
  colorCodeBarGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderTopColor: 'rgba(16, 185, 129, 0.3)',
  },
  colorCodeIndicatorRed: {
    width: 3.5,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },
  colorCodeIndicatorGreen: {
    width: 3.5,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  colorCodeText: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: '700',
  },
  microPillRed: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  microPillTextRed: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  microPillGreen: {
    backgroundColor: '#10B981',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  microPillTextGreen: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  /* Order Management (Reference Layout) */
  omRoot: {
    flex: 1,
  },
  omScrollContent: {
    flexGrow: 1,
  },
  omHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  omHeaderIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF2EB',
    borderWidth: 1,
    borderColor: '#FFE4D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  omHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2B1C16',
    letterSpacing: -0.3,
  },
  omHeaderSubtitle: {
    fontSize: 12.5,
    color: '#8A7A72',
    fontWeight: '400',
    marginTop: 2,
  },
  omSearchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 12,
    marginBottom: 14,
    shadowColor: '#362118',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  omSearchInputRow: {
    backgroundColor: '#F5F4F7',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  omSearchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1F2937',
    paddingVertical: 0,
  },
  omFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  omFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFE9E3',
  },
  omFilterPillActive: {
    backgroundColor: '#FFF2EB',
    borderColor: '#FDBA74',
  },
  omFilterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B3F38',
  },
  omOrdersCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#F2E8E2',
    shadowColor: '#362118',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  omLeftOrangeAccent: {
    position: 'absolute',
    left: 0,
    top: 14,
    bottom: 14,
    width: 3.5,
    backgroundColor: '#FF6B00',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    zIndex: 2,
  },
  omOrderItemRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F7EFE8',
    backgroundColor: '#FFFFFF',
  },
  omOrderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  omTagBadge: {
    backgroundColor: '#FFE8DF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  omTagText: {
    color: '#FF4500',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  omOrderTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2B1C16',
    flex: 1,
    marginLeft: 6,
  },
  omOrderSubline: {
    fontSize: 11.5,
    color: '#8A7A72',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 6,
  },
  omOrderBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  omStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  omStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  omStatusDash: {
    fontSize: 10,
    fontWeight: '800',
  },
  omActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  omEmptyText: {
    fontSize: 13.5,
    color: '#8A7A72',
    fontWeight: '500',
    textAlign: 'center',
  },
  omModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  omModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 36,
  },
  omModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  omModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  omModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  omModalOptionActive: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  omModalOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  omModalOptionTextActive: {
    color: '#EA580C',
    fontWeight: '700',
  },
});
