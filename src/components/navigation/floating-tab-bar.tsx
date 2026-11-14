import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Modal,
  Pressable,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { WorkspaceMode } from '@/types/auth';

export interface FloatingTabBarProps {
  state: any;
  descriptors: any;
  navigation?: any;
  navigateToTab?: (routeKey: string) => void;
  emitter?: any;
  insets?: any;
}

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
  navigateToTab,
  emitter,
}: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const {
    session,
    permissions,
    switchWorkspace,
    mode,
  } = useAuth();
  const router = useRouter();

  // Quick Action Hub modal state
  const [hubVisible, setHubVisible] = useState(false);

  // Measure tab dimensions for dynamic animated curve
  const [tabBarWidth, setTabBarWidth] = useState(Dimensions.get('window').width - 28);
  const [tabLayouts, setTabLayouts] = useState<{ [key: number]: { x: number; width: number } }>({});

  // Animated position for the glowing arch indicator
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  // Filter visible routes (exclude href: null)
  const visibleRoutes = state.routes.filter((route: any) => {
    const { options } = descriptors[route.key];
    return options?.href !== null;
  });

  // Determine current active index within visible routes
  const currentRoute = state.routes[state.index];
  const activeVisibleIndex = Math.max(
    0,
    visibleRoutes.findIndex((r: any) => r.key === currentRoute?.key)
  );

  // Update animated indicator when active index or layout changes
  useEffect(() => {
    const activeLayout = tabLayouts[activeVisibleIndex];
    if (activeLayout) {
      const targetCenter = activeLayout.x + activeLayout.width / 2;
      Animated.spring(indicatorAnim, {
        toValue: targetCenter,
        damping: 18,
        mass: 0.8,
        stiffness: 160,
        useNativeDriver: false,
      }).start();
    }
  }, [activeVisibleIndex, tabLayouts]);

  const handleTabPress = (route: any, isFocused: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let defaultPrevented = false;
    if (emitter) {
      const event = emitter.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      defaultPrevented = !!event?.defaultPrevented;
    } else if (navigation) {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      defaultPrevented = !!event?.defaultPrevented;
    }

    if (!isFocused && !defaultPrevented) {
      if (navigateToTab) {
        navigateToTab(route.key);
      } else if (navigation) {
        navigation.navigate(route.name, route.params);
      }
    }
  };

  const handleHubPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHubVisible(true);
  };

  // Check if a tab should display a notification badge dot
  const hasBadge = (routeName: string) => {
    if (routeName === 'orders' && session?.activeWorkspace === 'SHOOTS') {
      return true; // Agent has pending deliverables to submit
    }
    if (routeName === 'work' && session?.activeWorkspace === 'EDITING') {
      return true; // Editor has review revisions pending
    }
    return false;
  };

  // SVG Wave Path calculation matching reference design:
  // Bar Height = 68.
  // Base line = 59 (running cleanly below all text labels).
  // Arch top = 5 (arching gracefully over the active tab).
  // Arch half-width = 33.
  const barHeight = 68;
  const baselineY = 59;
  const archTopY = 5;
  const archHalfWidth = 33;

  // Active center X
  const activeLayout = tabLayouts[activeVisibleIndex];
  const activeCenterX = activeLayout ? activeLayout.x + activeLayout.width / 2 : 100;

  const leftEdge = Math.max(54, activeCenterX - archHalfWidth);
  const rightEdge = Math.min(tabBarWidth - 12, activeCenterX + archHalfWidth);

  // Smooth continuous Bézier wave curve:
  // Starts at left of arch (54..leftEdge), curves smoothly up to (activeCenterX, archTopY),
  // curves smoothly down to rightEdge, then runs horizontally across the bottom under Search, Create, Inbox, Saved!
  const curvePath = `
    M 54 ${baselineY}
    L ${leftEdge} ${baselineY}
    C ${activeCenterX - 18} ${baselineY}, ${activeCenterX - 15} ${archTopY}, ${activeCenterX} ${archTopY}
    C ${activeCenterX + 15} ${archTopY}, ${activeCenterX + 18} ${baselineY}, ${rightEdge} ${baselineY}
    L ${tabBarWidth - 14} ${baselineY}
  `;

  return (
    <>
      <View
        style={[
          styles.floatingWrapper,
          { bottom: Math.max(insets.bottom, 12) + 6 },
        ]}
        pointerEvents="box-none"
      >
        <View
          style={styles.pillContainer}
          onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}
        >
          {/* Matte charcoal background matching reference */}
          <LinearGradient
            colors={['#1F2026', '#14151A']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          {/* SVG Glowing Red Wave / Arch Overlay */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width="100%" height={barHeight}>
              <Defs>
                <SvgGradient id="redGlowLine" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#E60023" stopOpacity="0.7" />
                  <Stop offset="0.2" stopColor="#FF2A54" stopOpacity="1" />
                  <Stop offset="0.7" stopColor="#FF2A54" stopOpacity="0.9" />
                  <Stop offset="0.95" stopColor="#FF2A54" stopOpacity="0.35" />
                  <Stop offset="1" stopColor="#FF2A54" stopOpacity="0.0" />
                </SvgGradient>
                <SvgGradient id="ambientGlow" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FF2A54" stopOpacity="0.28" />
                  <Stop offset="0.7" stopColor="#FF2A54" stopOpacity="0.06" />
                  <Stop offset="1" stopColor="#FF2A54" stopOpacity="0.0" />
                </SvgGradient>
              </Defs>

              {/* Soft ambient under-glow along the wave path */}
              <Path
                d={curvePath}
                fill="none"
                stroke="#FF2A54"
                strokeWidth={5}
                strokeOpacity={0.22}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Crisp glowing highlight red line */}
              <Path
                d={curvePath}
                fill="none"
                stroke="url(#redGlowLine)"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Ambient soft glow fill directly inside the active arch dome */}
              <Path
                d={`
                  M ${leftEdge} ${baselineY}
                  C ${activeCenterX - 18} ${baselineY}, ${activeCenterX - 14} ${archTopY}, ${activeCenterX} ${archTopY}
                  C ${activeCenterX + 14} ${archTopY}, ${activeCenterX + 18} ${baselineY}, ${rightEdge} ${baselineY}
                  Z
                `}
                fill="url(#ambientGlow)"
              />
            </Svg>
          </View>

          {/* Far Left: Circular 3D Brand Button with Red Monogram Logo */}
          <TouchableOpacity
            style={styles.hubButton}
            onPress={handleHubPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Staff Hub and Workspace Switcher"
          >
            <LinearGradient
              colors={['#2B2C36', '#181920']}
              style={styles.hubInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Authentic Red Pinterest / Monogram Emblem */}
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Path
                  d="M12 0a12 12 0 0 0-4.37 23.17c-.07-.63-.13-1.6.03-2.29l1.1-4.66s-.28-.56-.28-1.39c0-1.3.76-2.28 1.7-2.28.8 0 1.19.6 1.19 1.33 0 .81-.51 2.01-.78 3.13-.22.94.47 1.7 1.4 1.7 1.68 0 2.97-1.77 2.97-4.33 0-2.26-1.63-3.85-3.95-3.85-2.69 0-4.27 2.02-4.27 4.1 0 .81.31 1.68.7 2.16.08.1.09.18.06.28l-.26 1.07c-.04.18-.15.22-.34.14-1.28-.6-2.07-2.46-2.07-3.96 0-3.22 2.34-6.18 6.75-6.18 3.54 0 6.3 2.53 6.3 5.9 0 3.52-2.22 6.35-5.3 6.35-1.03 0-2.01-.54-2.34-1.17l-.64 2.43c-.23.89-.86 2-1.28 2.69A12 12 0 1 0 12 0z"
                  fill="#E60023"
                />
              </Svg>
            </LinearGradient>
          </TouchableOpacity>

          {/* Tab Items Container: Home, Search, Create, Inbox, Saved */}
          <View style={styles.tabsContainer}>
            {visibleRoutes.map((route: any, index: number) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === state.routes.findIndex((r: any) => r.key === route.key);

              // 5 exact tabs matching reference design
              let label = 'Home';
              let iconName: any = 'home-outline';
              let activeIconName: any = 'home';
              let showNotificationDot = false;
              let isPlusIcon = false;

              if (route.name === 'index') {
                label = 'Home';
                iconName = 'home-outline';
                activeIconName = 'home';
              } else if (route.name === 'orders') {
                label = 'Search';
                iconName = 'search-outline';
                activeIconName = 'search';
              } else if (route.name === 'schedule') {
                label = 'Create';
                iconName = 'add';
                activeIconName = 'add';
                isPlusIcon = true;
              } else if (route.name === 'work') {
                label = 'Inbox';
                iconName = 'chatbubble-outline';
                activeIconName = 'chatbubble';
                showNotificationDot = true; // Red badge on top-right of Inbox
              } else if (route.name === 'more') {
                label = 'Saved';
                iconName = 'person-outline';
                activeIconName = 'person';
              }

              return (
                <TouchableOpacity
                  key={route.key}
                  style={styles.tabItem}
                  onPress={() => handleTabPress(route, isFocused)}
                  onLayout={(e) => {
                    const { x, width } = e.nativeEvent.layout;
                    // Add offset of circular button (54pt)
                    setTabLayouts((prev) => ({
                      ...prev,
                      [index]: { x: x + 54, width },
                    }));
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isFocused }}
                >
                  <View style={styles.tabContent}>
                    {/* Icon wrapper */}
                    <View style={styles.iconWrapper}>
                      <Ionicons
                        name={isFocused ? activeIconName : iconName}
                        size={isPlusIcon ? 25 : isFocused ? 21 : 20}
                        color={isFocused ? '#FF2A54' : '#9E9EA7'}
                      />
                      {/* Notification Red Dot on Inbox */}
                      {showNotificationDot && (
                        <View style={styles.notificationDot} />
                      )}
                    </View>

                    {/* Small Illuminated Red Dot directly below active Home icon */}
                    {isFocused ? (
                      <View style={styles.activeDot} />
                    ) : (
                      <View style={styles.inactiveDotSpacer} />
                    )}

                    {/* Label */}
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.tabLabel,
                        isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Quick Hub Modal (Triggered by Circular Logo Button) */}
      <Modal
        visible={hubVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHubVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setHubVisible(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.hubIconModal}>
                <Ionicons name="sparkles" size={24} color="#FF2D55" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalTitle}>WedTrack Staff Hub</Text>
                <Text style={styles.modalSubtitle}>
                  {session?.studio.name || 'Studio'} • {session?.name} ({session?.primaryRole})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setHubVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Workspace Switcher */}
              <Text style={styles.modalSectionTitle}>ACTIVE WORKSPACE</Text>
              <View style={styles.workspaceRow}>
                {(['OPERATIONS', 'SHOOTS', 'EDITING'] as WorkspaceMode[]).map((ws) => {
                  const isCurrent = session?.activeWorkspace === ws;
                  const icons: Record<WorkspaceMode, any> = {
                    OPERATIONS: 'business-outline',
                    SHOOTS: 'camera-outline',
                    EDITING: 'film-outline',
                  };
                  const labels: Record<WorkspaceMode, string> = {
                    OPERATIONS: 'Operations',
                    SHOOTS: 'Shoots',
                    EDITING: 'Editing',
                  };

                  return (
                    <TouchableOpacity
                      key={ws}
                      style={[
                        styles.workspaceChip,
                        isCurrent && styles.workspaceChipActive,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        switchWorkspace(ws);
                        setHubVisible(false);
                      }}
                    >
                      <Ionicons
                        name={icons[ws]}
                        size={16}
                        color={isCurrent ? '#FFFFFF' : '#9CA3AF'}
                      />
                      <Text
                        style={[
                          styles.workspaceChipText,
                          isCurrent && styles.workspaceChipTextActive,
                        ]}
                      >
                        {labels[ws]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quick Actions */}
              <Text style={[styles.modalSectionTitle, { marginTop: 18 }]}>QUICK ACTIONS</Text>

              {permissions.destinations.includes('Orders') && (
                <>
                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => {
                      setHubVisible(false);
                      router.push('/orders/create-wedding');
                    }}
                  >
                    <View style={[styles.actionIconBox, { backgroundColor: 'rgba(225, 29, 72, 0.15)' }]}>
                      <Ionicons name="heart" size={18} color="#FF2D55" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.actionTitle}>New Wedding Booking</Text>
                      <Text style={styles.actionDesc}>Comprehensive multi-day wedding package</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#6B7280" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => {
                      setHubVisible(false);
                      router.push('/orders/create-occasion');
                    }}
                  >
                    <View style={[styles.actionIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <Ionicons name="calendar" size={18} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.actionTitle}>New Occasion Booking</Text>
                      <Text style={styles.actionDesc}>Single-event engagement, reception or birthday</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#6B7280" />
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => {
                  setHubVisible(false);
                  router.push('/gaps');
                }}
              >
                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Ionicons name="construct" size={18} color="#F59E0B" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.actionTitle}>Integration Gap Register</Text>
                  <Text style={styles.actionDesc}>Inspect technical gaps G1–G10 & requirements</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#6B7280" />
              </TouchableOpacity>

              {/* Demo Mode Notice */}
              {mode === 'demo' && (
                <View style={styles.demoNotice}>
                  <Ionicons name="flask-outline" size={16} color="#10B981" />
                  <Text style={styles.demoNoticeText}>
                    Running in Demo Environment with synthetic studio fixtures.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 999,
  },
  pillContainer: {
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1B1C22',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 10,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.5)',
      },
    }),
  },
  hubButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  hubInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#2D2E38',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    height: '100%',
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    minWidth: 40,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 22,
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E60023',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E60023',
    marginTop: 3,
    marginBottom: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#E60023',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
      },
    }),
  },
  inactiveDotSpacer: {
    width: 4,
    height: 9,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabLabelInactive: {
    color: '#9E9EA7',
    fontWeight: '500',
  },

  /* Quick Hub Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1C1C22',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 38,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  hubIconModal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#262630',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#383848',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  modalSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  workspaceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  workspaceChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#262630',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  workspaceChipActive: {
    backgroundColor: '#E11D48',
    borderColor: '#FF2D55',
  },
  workspaceChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  workspaceChipTextActive: {
    color: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#24242C',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  demoNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#10B981',
  },
});
