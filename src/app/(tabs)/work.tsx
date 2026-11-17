import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { DemoBanner } from '@/components/common/demo-banner';
import { StatusBadge, mapReviewStatusToVariant } from '@/components/common/status-badge';
import { MoneyView } from '@/components/common/money-view';
import { Button } from '@/components/common/button';
import { StateView } from '@/components/common/state-view';

export default function TabWorkScreen() {
  const { session, permissions } = useAuth();
  const { editingTasks, events, team } = useDemoStore();
  const { colors, typography, spacing, radii, isDark } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    gear1: true,
    gear2: true,
    gear3: false,
    gear4: true,
    gear5: false,
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const workspace = session?.activeWorkspace || 'OPERATIONS';

  // ----------------------------------------------------
  // AGENT WORKSPACE: ASSIGNED WORK CALENDAR (White, Orange & Green Design)
  // ----------------------------------------------------
  if (workspace === 'SHOOTS') {
    const insets = useSafeAreaInsets();
    const agentId = session?.id || 'usr-agt-01';
    const myEvents = events.filter(e => e.assignments.some(a => a.agentId === agentId));

    // Calendar navigation state (defaults to Nov 2026 & next shoot on 18 Nov)
    const [calYear, setCalYear] = useState<number>(2026);
    const [calMonth, setCalMonth] = useState<number>(10); // 10 is November (0-indexed)
    const [selectedDateKey, setSelectedDateKey] = useState<string>('2026-11-18');

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Generate month grid days (Monday-first)
    const getCalendarDays = (year: number, month: number) => {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const totalDays = lastDay.getDate();

      // Monday = 0, Tuesday = 1, ..., Sunday = 6
      let startDayOfWeek = firstDay.getDay() - 1;
      if (startDayOfWeek === -1) startDayOfWeek = 6;

      const prevMonthLastDay = new Date(year, month, 0).getDate();
      const days: { dayNum: number; isCurrentMonth: boolean; dateKey: string }[] = [];

      // Leading previous month days
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const d = prevMonthLastDay - i;
        const prevM = month === 0 ? 12 : month;
        const prevY = month === 0 ? year - 1 : year;
        const dateKey = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({ dayNum: d, isCurrentMonth: false, dateKey });
      }

      // Current month days
      for (let d = 1; d <= totalDays; d++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({ dayNum: d, isCurrentMonth: true, dateKey });
      }

      // Trailing next month days (complete multiples of 7)
      const remaining = (7 - (days.length % 7)) % 7;
      for (let d = 1; d <= remaining; d++) {
        const nextM = month === 11 ? 1 : month + 2;
        const nextY = month === 11 ? year + 1 : year;
        const dateKey = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({ dayNum: d, isCurrentMonth: false, dateKey });
      }

      return days;
    };

    const calendarGrid = getCalendarDays(calYear, calMonth);

    // Compute month summary statistics
    const currentMonthKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
    const monthShoots = myEvents.filter(e => e.startTime.startsWith(currentMonthKey));
    let monthTotalPay = 0;
    monthShoots.forEach(e => {
      const asg = e.assignments.find(a => a.agentId === agentId);
      if (asg?.assignmentPay) monthTotalPay += asg.assignmentPay;
    });

    // Shoots on currently selected date
    const shootsOnSelectedDate = myEvents.filter(e => e.startTime.startsWith(selectedDateKey));

    const handlePrevMonth = () => {
      try {
        Haptics.selectionAsync().catch(() => {});
      } catch {}
      if (calMonth === 0) {
        setCalMonth(11);
        setCalYear(prev => prev - 1);
      } else {
        setCalMonth(prev => prev - 1);
      }
    };

    const handleNextMonth = () => {
      try {
        Haptics.selectionAsync().catch(() => {});
      } catch {}
      if (calMonth === 11) {
        setCalMonth(0);
        setCalYear(prev => prev + 1);
      } else {
        setCalMonth(prev => prev + 1);
      }
    };

    const toggleGear = (key: string) => {
      try {
        Haptics.selectionAsync().catch(() => {});
      } catch {}
      setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleCall = (phone?: string) => {
      if (phone) Linking.openURL(`tel:${phone}`);
    };

    const handleMap = (mapUrl?: string) => {
      if (mapUrl) Linking.openURL(mapUrl);
    };

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
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827', letterSpacing: 0.2 }}>
              Assigned Work Calendar
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#6B7280', marginTop: 2 }}>
              Tap any date to inspect call sheet, crew & agreed pay
            </Text>
          </View>

          {/* Month Navigation Bar */}
          <View
            style={[
              styles.calNavRow,
              {
                backgroundColor: isDark ? 'rgba(35, 23, 27, 0.82)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.09)' : '#E5E7EB',
              },
            ]}
          >
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={styles.calNavBtn}
              accessibilityLabel="Previous Month"
            >
              <Ionicons name="chevron-back" size={20} color={isDark ? '#FFFFFF' : '#111827'} />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.calNavTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {monthNames[calMonth]} {calYear}
              </Text>
              <View style={styles.calNavBadge}>
                <Text style={styles.calNavBadgeText}>
                  {monthShoots.length} Shoots • ₹ {monthTotalPay.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.calNavBtn}
              accessibilityLabel="Next Month"
            >
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#FFFFFF' : '#111827'} />
            </TouchableOpacity>
          </View>

          {/* The Reference Calendar Card (Organic Folder Shape with Neumorphic 3D Tiles) */}
          <View
            style={[
              styles.referenceCalCard,
              {
                backgroundColor: isDark ? 'rgba(32, 21, 26, 0.92)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F0F0F2',
              },
            ]}
          >
            {/* Weekdays Row */}
            <View style={styles.calWeekDaysRow}>
              {weekDays.map((wd, idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.calWeekDayText,
                    { color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#9CA3AF' },
                  ]}
                >
                  {wd}
                </Text>
              ))}
            </View>

            {/* Grid of 3D Squircle Date Tiles (White, Orange & Green Colors) */}
            <View style={styles.calGridContainer}>
              {calendarGrid.map((dayItem) => {
                const isSelected = selectedDateKey === dayItem.dateKey;
                const eventsOnThisDay = myEvents.filter(e => e.startTime.startsWith(dayItem.dateKey));
                const hasAssigned = eventsOnThisDay.some(e => e.status !== 'COMPLETED');
                const hasCompleted = eventsOnThisDay.some(e => e.status === 'COMPLETED');

                // Determine Tile Variant:
                // 1. Green: Completed Shoot
                // 2. Orange: Upcoming Assigned Shoot
                // 3. White: Selected Date
                // 4. Default: Inactive/Normal Date
                let tileBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#F9FAFB';
                let textColor = isDark ? '#FFFFFF' : '#111827';
                let isElevatedTile = false;
                let elevationShadow = {};

                if (hasCompleted) {
                  tileBg = '#10B981'; // Vibrant Green
                  textColor = '#FFFFFF';
                  isElevatedTile = true;
                  elevationShadow = {
                    shadowColor: '#10B981',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.35,
                    shadowRadius: 6,
                    elevation: 4,
                  };
                } else if (hasAssigned) {
                  tileBg = '#FF5500'; // Vibrant Orange
                  textColor = '#FFFFFF';
                  isElevatedTile = true;
                  elevationShadow = {
                    shadowColor: '#FF5500',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.35,
                    shadowRadius: 6,
                    elevation: 4,
                  };
                } else if (isSelected) {
                  tileBg = '#FFFFFF'; // Crisp White
                  textColor = '#111827';
                  isElevatedTile = true;
                  elevationShadow = {
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.22,
                    shadowRadius: 6,
                    elevation: 5,
                  };
                }

                if (!dayItem.isCurrentMonth && !hasAssigned && !hasCompleted && !isSelected) {
                  textColor = isDark ? 'rgba(255, 255, 255, 0.2)' : '#D1D5DB';
                }

                return (
                  <TouchableOpacity
                    key={dayItem.dateKey}
                    style={[
                      styles.calDateTile,
                      { backgroundColor: tileBg },
                      elevationShadow,
                      isSelected && (hasAssigned || hasCompleted) && {
                        borderWidth: 2.5,
                        borderColor: '#FFFFFF',
                      },
                    ]}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync().catch(() => {});
                      } catch {}
                      setSelectedDateKey(dayItem.dateKey);
                      // If user clicked leading/trailing month date, jump to that month
                      const parts = dayItem.dateKey.split('-');
                      const targetY = parseInt(parts[0], 10);
                      const targetM = parseInt(parts[1], 10) - 1;
                      if (targetM !== calMonth) {
                        setCalMonth(targetM);
                        setCalYear(targetY);
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.calDateNum,
                        { color: textColor },
                        (hasAssigned || hasCompleted || isSelected) && { fontWeight: '900' },
                      ]}
                    >
                      {dayItem.dayNum}
                    </Text>

                    {/* Small Dot indicator for assigned / completed shoots */}
                    {hasAssigned && !hasCompleted && (
                      <View style={styles.calTileOrangeDot} />
                    )}
                    {hasCompleted && (
                      <View style={styles.calTileGreenDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Color Legend (White, Orange & Green Calendar) */}
            <View
              style={[
                styles.calLegendRow,
                { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F0F0F2' },
              ]}
            >
              <View style={styles.calLegendItem}>
                <View style={[styles.calLegendSquare, { backgroundColor: '#FF5500' }]} />
                <Text style={[styles.calLegendLabel, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                  Assigned Shoot
                </Text>
              </View>

              <View style={styles.calLegendItem}>
                <View style={[styles.calLegendSquare, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.calLegendLabel, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                  Completed
                </Text>
              </View>

              <View style={styles.calLegendItem}>
                <View style={[styles.calLegendSquare, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB' }]} />
                <Text style={[styles.calLegendLabel, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                  Selected Date
                </Text>
              </View>
            </View>
          </View>

          {/* Shoots on Selected Date Feed */}
          <View style={styles.selectedDateSectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="calendar-outline" size={18} color="#FF5500" />
              <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#FFFFFF' : '#111827' }}>
                Shoots on {new Date(selectedDateKey).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.calShootCountPill}>
              <Text style={styles.calShootCountPillText}>
                {shootsOnSelectedDate.length} {shootsOnSelectedDate.length === 1 ? 'Shoot' : 'Shoots'}
              </Text>
            </View>
          </View>

          {/* Itemized Shoot Cards on Selected Date */}
          {shootsOnSelectedDate.length === 0 ? (
            <View
              style={[
                styles.calEmptyCard,
                {
                  backgroundColor: isDark ? 'rgba(32, 21, 26, 0.82)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
                },
              ]}
            >
              <Ionicons name="sunny-outline" size={32} color="#10B981" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: isDark ? '#FFFFFF' : '#111827', marginTop: 8 }}>
                No Shoots Scheduled
              </Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 4 }}>
                You are currently free and available for booking on this date.
              </Text>
              <TouchableOpacity
                style={styles.calJumpToNextBtn}
                onPress={() => {
                  try {
                    Haptics.selectionAsync().catch(() => {});
                  } catch {}
                  setSelectedDateKey('2026-11-18');
                  setCalMonth(10);
                  setCalYear(2026);
                }}
              >
                <Text style={styles.calJumpToNextBtnText}>Jump to Next Shoot (18 Nov)</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            shootsOnSelectedDate.map((evt) => {
              const myAsg = evt.assignments.find(a => a.agentId === agentId);
              const isCompleted = evt.status === 'COMPLETED';
              const d = new Date(evt.startTime);
              const dayNum = String(d.getDate()).padStart(2, '0');
              const monthShort = monthNames[d.getMonth()].slice(0, 3).toUpperCase();

              return (
                <View
                  key={evt.id}
                  style={[
                    styles.calWorkCard,
                    {
                      backgroundColor: isDark ? 'rgba(32, 21, 26, 0.88)' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.09)' : '#F0F0F2',
                    },
                  ]}
                >
                  {/* Card Header: Date badge, Ceremony name, Status pill */}
                  <View style={styles.calWorkCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={[styles.calWorkDateBadge, { backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255, 85, 0, 0.14)' }]}>
                        <Ionicons name="calendar-outline" size={13} color={isCompleted ? '#10B981' : '#FF5500'} />
                        <Text style={[styles.calWorkDateBadgeText, { color: isCompleted ? '#10B981' : '#FF5500' }]}>
                          {dayNum} {monthShort}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.calWorkTitle,
                            { color: isDark ? '#FFFFFF' : '#111827' },
                          ]}
                          numberOfLines={1}
                        >
                          {evt.eventTypeName.toUpperCase()}
                        </Text>
                        <Text style={styles.calWorkOrder} numberOfLines={1}>
                          {evt.tenantOrderNumber} · {evt.orderTitle}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.calStatusPill,
                        { backgroundColor: isCompleted ? '#10B981' : '#FF5500' },
                      ]}
                    >
                      <Text style={styles.calStatusPillText}>
                        {evt.status}
                      </Text>
                    </View>
                  </View>

                  {/* Call Time & Venue */}
                  <View style={{ marginTop: 4, gap: 4 }}>
                    <View style={styles.calWorkMetaRow}>
                      <Ionicons name="time-outline" size={14} color="#D97706" />
                      <Text style={[styles.calWorkMetaText, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                        Call Time: {formatEventTime(evt.startTime)}
                      </Text>
                    </View>

                    {evt.venueName && (
                      <View style={styles.calWorkMetaRow}>
                        <Ionicons name="location-outline" size={14} color="#6B7280" />
                        <Text
                          style={[styles.calWorkMetaText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}
                          numberOfLines={1}
                        >
                          {evt.venueName} · {evt.venueAddress}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Crew Row */}
                  <View style={styles.calWorkCrewRow}>
                    <Text style={{ fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', marginRight: 2 }}>
                      Crew:
                    </Text>
                    {evt.assignments.map((asg) => {
                      const isSelf = asg.agentId === agentId;
                      return (
                        <View
                          key={asg.id}
                          style={[
                            styles.calCrewChip,
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
                              styles.calCrewChipText,
                              { color: isSelf ? '#FF5500' : isDark ? '#D1D5DB' : '#374151' },
                            ]}
                          >
                            {isSelf ? `You (${asg.role === 'PHOTOGRAPHER' ? 'PHOTO' : 'VIDEO'})` : `${asg.agentName} (${asg.role === 'PHOTOGRAPHER' ? 'PHOTO' : 'VIDEO'})`}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Footer: Agreed Pay + Action Discs */}
                  <View style={styles.calWorkFooter}>
                    <View>
                      <Text style={styles.calPayLabel}>AGREED PAY</Text>
                      <Text style={[styles.calPayAmount, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        {myAsg?.assignmentPay ? `₹${myAsg.assignmentPay.toLocaleString('en-IN')}` : '₹8,000'}
                      </Text>
                    </View>

                    <View style={styles.calActionsRow}>
                      {evt.contactPhone && (
                        <TouchableOpacity
                          style={[
                            styles.calCircularBtn,
                            {
                              backgroundColor: isDark ? 'rgba(46, 28, 33, 0.9)' : '#F8F9FA',
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
                            styles.calCircularBtn,
                            {
                              backgroundColor: isDark ? 'rgba(46, 28, 33, 0.9)' : '#F8F9FA',
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
                        style={styles.calCircularPrimaryBtn}
                        onPress={() => router.push(`/events/${evt.id}`)}
                        accessibilityLabel="View Call Sheet"
                      >
                        <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {/* Pre-Shoot Gear Checklist */}
          <View
            style={[
              styles.referenceCalCard,
              {
                backgroundColor: isDark ? 'rgba(32, 21, 26, 0.92)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F0F0F2',
                marginTop: 18,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Ionicons name="checkbox-outline" size={18} color="#FF5500" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: isDark ? '#FFFFFF' : '#111827' }}>
                Pre-Shoot Gear Checklist
              </Text>
            </View>

            {[
              { id: 'gear1', label: 'Primary camera body (Sony A7 IV / FX3) + backup body' },
              { id: 'gear2', label: '24-70mm f/2.8 & 70-200mm f/2.8 G-Master lenses cleaned' },
              { id: 'gear3', label: '4x Fully charged NP-FZ100 batteries + rapid charger' },
              { id: 'gear4', label: '3x Formatted V90 SD / CFexpress Type A cards' },
              { id: 'gear5', label: 'Wireless lavalier microphone kit & spare audio batteries' },
            ].map(item => {
              const checked = !!checklist[item.id];
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.calChecklistRow}
                  onPress={() => toggleGear(item.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={checked ? '#FF5500' : isDark ? '#6B7280' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.calChecklistLabel,
                      { color: checked ? (isDark ? '#FFFFFF' : '#111827') : (isDark ? '#9CA3AF' : '#6B7280') },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  const categories = ['ALL', 'ALBUM', 'VIDEO_EDIT', 'PHOTO_EDIT', 'REEL', 'HIGHLIGHT'];

  const filteredTasks = editingTasks.filter(t => {
    return selectedCategory === 'ALL' || t.category === selectedCategory;
  });

  const canSeeCost = permissions.money.cost !== 'none';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <DemoBanner />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={[typography.title1, { color: colors.textPrimary }]}>Editing Coordination</Text>
        <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
          Deliverables oversight across albums, films, reels, highlights and photo edits
        </Text>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing.md, marginBottom: spacing.sm }}
          contentContainerStyle={{ gap: 8 }}
        >
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
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
                  {cat.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Workload Distribution summary (EDIT-03) */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.xs },
          ]}
        >
          <Text style={[typography.caption2, { color: colors.textMuted, fontWeight: '700' }]}>
            ACTIVE EDITOR WORKLOAD DISTRIBUTION
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: spacing.sm }}>
            {team
              .filter(m => m.capabilities.editing && m.isActive)
              .map(edr => {
                const count = editingTasks.filter(t => t.editorId === edr.id && t.status !== 'COMPLETED').length;
                return (
                  <View key={edr.id} style={styles.edrWorkloadItem}>
                    <Text style={[typography.headline, { color: colors.textPrimary }]}>{edr.name}</Text>
                    <Text style={[typography.caption1, { color: count > 2 ? colors.warning : colors.textSecondary }]}>
                      {count} active tasks
                    </Text>
                  </View>
                );
              })}
          </View>
        </View>

        {/* Task cards */}
        <Text style={[typography.title3, { color: colors.textPrimary, marginTop: spacing.lg }]}>
          Deliverables Queue ({filteredTasks.length})
        </Text>

        {filteredTasks.length === 0 ? (
          <StateView type="empty" message="No editing tasks in this category." />
        ) : (
          filteredTasks.map(task => (
            <View
              key={task.id}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.sm },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[typography.caption2, { color: colors.textMuted }]}>{task.tenantOrderNumber}</Text>
                <StatusBadge
                  label={task.status}
                  variant={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'info' : 'warning'}
                  size="sm"
                />
              </View>

              <Text style={[typography.title3, { color: colors.textPrimary, marginTop: 2 }]}>
                {task.title}
              </Text>
              <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                {task.orderTitle} · Category: {task.category}
              </Text>

              {/* Assignee Row */}
              <View style={[styles.assigneeRow, { marginTop: 6 }]}>
                <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                <Text style={[typography.caption1, { color: colors.textPrimary, marginLeft: 4 }]}>
                  Assignee: {task.editorName || 'Unassigned (Open)'}
                </Text>
              </View>

              {/* Review Connection */}
              {task.isReviewable && task.reviewItemId && (
                <View
                  style={[
                    styles.reviewBox,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.borderSubtle,
                      borderRadius: radii.sm,
                      marginTop: spacing.sm,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[typography.caption2, { color: colors.textSecondary }]}>
                      Client Review Round {task.reviewStatus || 'Draft'}
                    </Text>
                    <StatusBadge
                      label={task.reviewStatus || 'NOT_UPLOADED'}
                      variant={mapReviewStatusToVariant(task.reviewStatus || '')}
                      size="sm"
                    />
                  </View>

                  <Button
                    title="Open Staff Review"
                    onPress={() => router.push(`/review/${task.reviewItemId}` as any)}
                    size="sm"
                    variant="outline"
                    style={{ marginTop: spacing.xs }}
                  />
                </View>
              )}

              {/* Cost if permitted */}
              {canSeeCost && task.cost && (
                <View style={[styles.priceRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.xs }]}>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>Editor Cost:</Text>
                  <MoneyView amount={task.cost} permission={permissions.money.cost} />
                </View>
              )}
            </View>
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
  edrWorkloadItem: {
    minWidth: 120,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewBox: {
    padding: 10,
    borderWidth: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  checklistLabel: {
    fontSize: 13,
    flex: 1,
  },

  /* Calendar Styles (Inspired by User References) */
  calNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calNavTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  calNavBadge: {
    backgroundColor: 'rgba(255, 85, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  calNavBadgeText: {
    color: '#FF5500',
    fontSize: 10,
    fontWeight: '800',
  },

  /* Reference Calendar Card */
  referenceCalCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  calWeekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  calWeekDayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Grid of Squircle Tiles */
  calGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calDateTile: {
    width: '13.2%',
    aspectRatio: 1,
    margin: '0.54%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calDateNum: {
    fontSize: 13,
    fontWeight: '700',
  },
  calTileOrangeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 3,
  },
  calTileGreenDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 3,
  },

  /* Legend */
  calLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  calLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calLegendSquare: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  calLegendLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Selected Date Section Header */
  selectedDateSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8,
  },
  calShootCountPill: {
    backgroundColor: 'rgba(255, 85, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  calShootCountPillText: {
    color: '#FF5500',
    fontSize: 11,
    fontWeight: '800',
  },

  /* Empty state */
  calEmptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  calJumpToNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF5500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 12,
  },
  calJumpToNextBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Work card on selected date */
  calWorkCard: {
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
  calWorkCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calWorkDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  calWorkDateBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  calWorkTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  calWorkOrder: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF5500',
    marginTop: 1,
  },
  calStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  calStatusPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  calWorkMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calWorkMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  calWorkCrewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.1)',
  },
  calCrewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  calCrewChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  crewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  calWorkFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.1)',
  },
  calPayLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#9CA3AF',
  },
  calPayAmount: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 1,
  },
  calActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calCircularBtn: {
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
  calCircularPrimaryBtn: {
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

  /* Gear checklist row */
  calChecklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    gap: 10,
  },
  calChecklistLabel: {
    fontSize: 13,
    flex: 1,
  },

});
