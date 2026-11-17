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
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
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
  const [refreshing, setRefreshing] = useState(false);

  // Submissions state for Agent
  const [submittingAsgId, setSubmittingAsgId] = useState<string | null>(null);
  const [photoCountInput, setPhotoCountInput] = useState('450');
  const [videoCountInput, setVideoCountInput] = useState('35');

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

    const handleConfirmSubmission = (eventId: string, assignmentId: string, role: any) => {
      submitShootCounts({
        eventId,
        assignmentId,
        role,
        photoCount: role === 'PHOTOGRAPHER' ? parseInt(photoCountInput, 10) || 0 : undefined,
        videoCount: role === 'VIDEOGRAPHER' ? parseInt(videoCountInput, 10) || 0 : undefined,
      });
      setSubmittingAsgId(null);
      Alert.alert(
        'Counts Recorded Successfully',
        `Your ${role.toLowerCase()} count has been recorded in the studio production ledger. Studio management will verify memory card material upon receipt.`
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
            {/* Frosted Glass Luxe Gradient Base */}
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(255, 115, 30, 0.48)', 'rgba(234, 88, 12, 0.28)', 'rgba(38, 22, 28, 0.68)', 'rgba(18, 12, 16, 0.88)']
                  : ['rgba(255, 130, 50, 0.35)', 'rgba(251, 146, 60, 0.22)', 'rgba(255, 255, 255, 0.85)']
              }
              locations={isDark ? [0, 0.32, 0.68, 1.0] : [0, 0.4, 1.0]}
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

              const currentCount = isPhoto ? photoCountInput : videoCountInput;
              const setCount = isPhoto ? setPhotoCountInput : setVideoCountInput;

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

                      {/* Expanded Section: Shows ALL Details ONLY for the open event */}
                      {isExpanded && (
                        <View style={styles.expandedDetailsSection}>
                          {/* Subtle Divider */}
                          <View
                            style={[
                              styles.expandedDivider,
                              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB' },
                            ]}
                          />

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

                          {/* Deliverables Action / Record Box */}
                          <View style={{ marginTop: 6 }}>
                        {isSubmitted ? (
                          /* Display Verified Submitted Record */
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
                        ) : submittingAsgId === assignment.id ? (
                      /* Expanded Ingest Form */
                      <View
                        style={[
                          styles.smartInputCard,
                          {
                            backgroundColor: isDark ? 'rgba(28, 20, 24, 0.95)' : '#F9FAFB',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
                          },
                        ]}
                      >
                        <Text style={[styles.inputHeading, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                          Enter Final {isPhoto ? 'Photo Count' : 'Video Footage Clips'}
                        </Text>

                        {/* Stepper Row */}
                        <View style={styles.stepperRow}>
                          <TouchableOpacity
                            style={[
                              styles.stepperBtn,
                              { backgroundColor: isDark ? 'rgba(46, 28, 33, 0.9)' : '#E5E7EB' },
                            ]}
                            onPress={() => {
                              const val = Math.max(
                                0,
                                (parseInt(currentCount, 10) || 0) - (isPhoto ? 50 : 5)
                              );
                              setCount(String(val));
                            }}
                          >
                            <Ionicons name="remove" size={18} color={isDark ? '#FFFFFF' : '#111827'} />
                          </TouchableOpacity>

                          <TextInput
                            value={currentCount}
                            onChangeText={setCount}
                            keyboardType="numeric"
                            style={[
                              styles.stepperInput,
                              {
                                backgroundColor: isDark ? 'rgba(34, 22, 26, 0.9)' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#D1D5DB',
                                color: isDark ? '#FFFFFF' : '#111827',
                              },
                            ]}
                          />

                          <TouchableOpacity
                            style={[
                              styles.stepperBtn,
                              { backgroundColor: isDark ? 'rgba(46, 28, 33, 0.9)' : '#E5E7EB' },
                            ]}
                            onPress={() => {
                              const val = (parseInt(currentCount, 10) || 0) + (isPhoto ? 50 : 5);
                              setCount(String(val));
                            }}
                          >
                            <Ionicons name="add" size={18} color={isDark ? '#FFFFFF' : '#111827'} />
                          </TouchableOpacity>
                        </View>

                        {/* Quick Presets */}
                        <View style={styles.presetsRow}>
                          {(isPhoto
                            ? ['350', '450', '650', '900']
                            : ['20', '35', '50', '75']
                          ).map(preset => (
                            <TouchableOpacity
                              key={preset}
                              onPress={() => setCount(preset)}
                              style={[
                                styles.presetChip,
                                {
                                  backgroundColor: isDark ? 'rgba(46, 28, 33, 0.7)' : '#F3F4F6',
                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
                                },
                              ]}
                            >
                              <Text style={styles.presetChipText}>
                                {preset} {isPhoto ? 'photos' : 'clips'}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Memory Card Label */}
                        <Text style={[styles.labelSmall, { color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 10 }]}>
                          Memory Card Label / Handover Remarks:
                        </Text>
                        <TextInput
                          value={cardRemarks[assignment.id] || ''}
                          onChangeText={txt =>
                            setCardRemarks(prev => ({ ...prev, [assignment.id]: txt }))
                          }
                          placeholder="e.g. Card A: Sony Tough 128GB, Card B: SD 64GB"
                          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                          style={[
                            styles.remarksInput,
                            {
                              backgroundColor: isDark ? 'rgba(34, 22, 26, 0.9)' : '#FFFFFF',
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#D1D5DB',
                              color: isDark ? '#FFFFFF' : '#111827',
                            },
                          ]}
                        />

                        {/* Action Buttons */}
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                          <TouchableOpacity
                            style={styles.confirmSubmitBtn}
                            onPress={() =>
                              handleConfirmSubmission(event.id, assignment.id, assignment.role)
                            }
                          >
                            <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" />
                            <Text style={styles.confirmSubmitText}>Confirm & Record Ingest</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.cancelSubmitBtn,
                              {
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#D1D5DB',
                              },
                            ]}
                            onPress={() => setSubmittingAsgId(null)}
                          >
                            <Text style={[styles.cancelSubmitText, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                              Cancel
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      /* Action Trigger Button */
                      <TouchableOpacity
                        style={styles.triggerSubmitBtn}
                        onPress={() => setSubmittingAsgId(assignment.id)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="cloud-upload-outline" size={14} color="#FFFFFF" />
                        <Text style={styles.triggerSubmitText}>Submit</Text>
                        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      );
        })
      )}
    </ScrollView>
      </LinearGradient>
    );
  }

  // ----------------------------------------------------
  // ORDER BOOK (Admin / Manager / Editor Claiming)
  // ----------------------------------------------------
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
    backgroundColor: 'rgba(24, 16, 20, 0.65)',
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

  triggerSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FF5500',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  triggerSubmitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
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
});
