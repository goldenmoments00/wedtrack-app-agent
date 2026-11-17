import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';

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
  const { session, switchWorkspace, switchDemoPersona } = useAuth();
  const router = useRouter();

  const workspace = session?.activeWorkspace || 'SHOOTS';
  const isAgent = workspace === 'SHOOTS';
  const isEditor = workspace === 'EDITING';

  // Floating Dock Layout Measurements
  const dockHeight = 60;
  const topY = 24;
  const totalBoxHeight = topY + dockHeight + 8;
  const dockMarginH = 14;
  const dockBottom = Math.max(insets.bottom, 10) + 6;

  // Corner radius & slot distribution
  const r = 18; // Pill corner radius
  const sidePadding = 24; // Inset so edge slots (0 and 4) are safely within flat top line

  // Screen width measurement: bar width is screen width minus horizontal margins
  const screenWidth = Dimensions.get('window').width;
  const [barWidth, setBarWidth] = useState(screenWidth - dockMarginH * 2);

  // Calculate active slot based on workspace and current route
  const getSlotFromRoute = (routeName?: string, isEditorMode?: boolean) => {
    if (isEditorMode) {
      if (routeName === 'orders') return 0;
      if (routeName === 'index') return 1;
      if (routeName === 'schedule') return 3;
      if (routeName === 'more') return 4;
      return 0;
    }
    if (routeName === 'index') return 0;
    if (routeName === 'orders') return 1;
    if (routeName === 'work') return 3;
    if (routeName === 'more') return 4;
    return 0;
  };

  const [activeSlot, setActiveSlot] = useState<number>(() => {
    const curRoute = state.routes[state.index]?.name;
    return getSlotFromRoute(curRoute, isEditor);
  });

  // Keep activeSlot in sync with navigation state and workspace
  useEffect(() => {
    const curRoute = state.routes[state.index]?.name;
    setActiveSlot(getSlotFromRoute(curRoute, isEditor));
  }, [state.index, isEditor]);

  // Toast notification on mode switch
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastFade = useRef(new Animated.Value(0)).current;

  // Persona Switcher modal
  const [hubVisible, setHubVisible] = useState(false);

  // Slot calculations: 5 slots distributed inside the dock with side padding
  const availableSlotWidth = Math.max(0, barWidth - sidePadding * 2);
  const slotWidth = availableSlotWidth / 5;
  const getSlotCenterX = (slot: number) => sidePadding + slotWidth * (slot + 0.5);

  // Animated X position for the liquid drop scoop and floating active circle
  const notchAnim = useRef(new Animated.Value(getSlotCenterX(activeSlot))).current;
  const [currentNotchX, setCurrentNotchX] = useState(getSlotCenterX(activeSlot));

  useEffect(() => {
    const targetX = getSlotCenterX(activeSlot);
    Animated.spring(notchAnim, {
      toValue: targetX,
      damping: 15,
      mass: 0.75,
      stiffness: 165,
      useNativeDriver: false,
    }).start();
  }, [activeSlot, barWidth]);

  useEffect(() => {
    const listenerId = notchAnim.addListener(({ value }) => {
      setCurrentNotchX(value);
    });
    return () => notchAnim.removeListener(listenerId);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastFade, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastFade, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  };

  const handleSwitchMode = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}
    setActiveSlot(2);

    if (isAgent) {
      if (switchDemoPersona) {
        await switchDemoPersona('editor-default');
      } else {
        await switchWorkspace('EDITING');
      }
      showToast('Switched to Editor Mode (Vikram Das)');
    } else {
      if (switchDemoPersona) {
        await switchDemoPersona('agent-standard');
      } else {
        await switchWorkspace('SHOOTS');
      }
      showToast('Switched to Agent Mode (Karan Malhotra)');
    }
  };

  const navigateTo = (routeName: string, slotIndex: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    setActiveSlot(slotIndex);

    const targetRoute = state.routes.find((r: any) => r.name === routeName);
    if (!targetRoute) return;

    if (navigateToTab) {
      navigateToTab(targetRoute.key);
    } else if (navigation) {
      navigation.navigate(targetRoute.name, targetRoute.params);
    }
  };

  // Determine active icon for floating circular button
  let activeIcon: keyof typeof Ionicons.glyphMap = 'apps';
  if (isEditor) {
    if (activeSlot === 0) activeIcon = 'document-text';
    else if (activeSlot === 1) activeIcon = 'briefcase';
    else if (activeSlot === 2) activeIcon = 'swap-horizontal';
    else if (activeSlot === 3) activeIcon = 'wallet';
    else if (activeSlot === 4) activeIcon = 'person';
  } else {
    if (activeSlot === 0) activeIcon = 'apps';
    else if (activeSlot === 1) activeIcon = 'list';
    else if (activeSlot === 2) activeIcon = 'swap-horizontal';
    else if (activeSlot === 3) activeIcon = 'calendar';
    else if (activeSlot === 4) activeIcon = 'person';
  }

  // Saturated Vibrant Orange Color
  const vibrantOrange = '#FF5500';

  // Liquid "Drop Effect" Curve Calculations (matching user reference)
  const scoopDepth = 30; // Cradle depth where circle sits
  const scoopSpan = 38; // Half-span of the drop scoop (generous white space clearance)
  const cradleY = topY + scoopDepth;

  const leftShoulder = Math.max(r, currentNotchX - scoopSpan);
  const rightShoulder = Math.min(barWidth - r, currentNotchX + scoopSpan);

  const leftArm = Math.max(1, currentNotchX - leftShoulder);
  const rightArm = Math.max(1, rightShoulder - currentNotchX);

  const cp1X = leftShoulder + leftArm * 0.45;
  const cp2X = currentNotchX - leftArm * 0.45;
  const cp3X = currentNotchX + rightArm * 0.45;
  const cp4X = rightShoulder - rightArm * 0.45;

  const bottomY = topY + dockHeight;

  // Closed Path for Floating Smoked Dark Dock with the Dynamic Liquid Drop Scoop
  const liquidDropDockPath = `
    M 0 ${topY + r}
    A ${r} ${r} 0 0 1 ${r} ${topY}
    L ${leftShoulder} ${topY}
    C ${cp1X} ${topY}, ${cp2X} ${cradleY}, ${currentNotchX} ${cradleY}
    C ${cp3X} ${cradleY}, ${cp4X} ${topY}, ${rightShoulder} ${topY}
    L ${barWidth - r} ${topY}
    A ${r} ${r} 0 0 1 ${barWidth} ${topY + r}
    L ${barWidth} ${bottomY - r}
    A ${r} ${r} 0 0 1 ${barWidth - r} ${bottomY}
    L ${r} ${bottomY}
    A ${r} ${r} 0 0 1 0 ${bottomY - r}
    Z
  `;

  // Top Edge Optical Glass Specular Highlight Wave
  const topSpecularWavePath = `
    M ${r} ${topY}
    L ${leftShoulder} ${topY}
    C ${cp1X} ${topY}, ${cp2X} ${cradleY}, ${currentNotchX} ${cradleY}
    C ${cp3X} ${cradleY}, ${cp4X} ${topY}, ${rightShoulder} ${topY}
    L ${barWidth - r} ${topY}
  `;

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastFade,
              bottom: dockBottom + totalBoxHeight + 12,
              backgroundColor: '#1E2530',
              borderColor: vibrantOrange,
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="sync-circle" size={20} color={vibrantOrange} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* Ambient Bottom Gradient Scrim: softly fades scrolling cards behind floating dock */}
      <LinearGradient
        colors={[
          'rgba(248, 249, 250, 0)',
          'rgba(248, 249, 250, 0.65)',
          'rgba(248, 249, 250, 0.92)',
          '#F8F9FA',
        ]}
        locations={[0, 0.4, 0.75, 1.0]}
        style={styles.bottomScrim}
        pointerEvents="none"
      />

      {/* Floating Island Dock Container */}
      <View
        style={[
          styles.dockContainer,
          {
            left: dockMarginH,
            right: dockMarginH,
            bottom: dockBottom,
            height: totalBoxHeight,
          },
        ]}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        pointerEvents="box-none"
      >
        {/* Smoked Dark Glass Floating Dock with Dynamic Liquid Drop Notch */}
        <Svg
          width={barWidth}
          height={totalBoxHeight}
          style={StyleSheet.absoluteFill}
        >
          {/* 1. Smoked Dark Glass Base Fill with Transparent Liquid Scoop Cutout */}
          <Path
            d={liquidDropDockPath}
            fill="rgba(18, 20, 26, 0.96)"
            stroke="rgba(255, 255, 255, 0.16)"
            strokeWidth={1.2}
          />

          {/* 2. Optical Glass Specular Rim Highlight along the drop curve */}
          <Path
            d={topSpecularWavePath}
            fill="none"
            stroke="rgba(255, 255, 255, 0.32)"
            strokeWidth={1.5}
          />
        </Svg>

        {/* Floating Radiant Orange Circular Button Nestled in the Drop Cradle with Generous White Space */}
        <Animated.View
          style={[
            styles.floatingCircle,
            {
              left: Animated.subtract(notchAnim, 22),
              top: 2, // Emerges 22px above dock top line (24) and leaves 8px bottom clearance to cradleY (54)
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons name={activeIcon} size={21} color="#FFFFFF" />
        </Animated.View>

        {/* Interactive Clickable Tabs Row (5 slots) */}
        <View
          style={[
            styles.tabsRow,
            {
              top: topY,
              height: dockHeight,
              paddingHorizontal: sidePadding,
            },
          ]}
        >
          {/* Slot 0: Editor -> Orders / Agent -> Events */}
          <TouchableOpacity
            style={styles.slotBtn}
            onPress={() => navigateTo(isEditor ? 'orders' : 'index', 0)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={isEditor ? 'Orders' : 'Events'}
          >
            {activeSlot !== 0 && (
              <Ionicons
                name={isEditor ? 'document-text-outline' : 'apps-outline'}
                size={22}
                color="#CBD5E1"
              />
            )}
          </TouchableOpacity>

          {/* Slot 1: Editor -> Work / Agent -> Deliverables */}
          <TouchableOpacity
            style={styles.slotBtn}
            onPress={() => navigateTo(isEditor ? 'index' : 'orders', 1)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={isEditor ? 'Work' : 'Deliverables'}
          >
            {activeSlot !== 1 && (
              <Ionicons
                name={isEditor ? 'briefcase-outline' : 'list-outline'}
                size={23}
                color="#CBD5E1"
              />
            )}
          </TouchableOpacity>

          {/* Slot 2 (Center): Switch Button (Opposing Arrows Icon) */}
          <TouchableOpacity
            style={styles.slotBtn}
            onPress={handleSwitchMode}
            onLongPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
              } catch {}
              setHubVisible(true);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isEditor ? 'Switch to Agent Mode' : 'Switch to Editor Mode'}
          >
            {activeSlot !== 2 && (
              <Ionicons name="swap-horizontal" size={23} color="#CBD5E1" />
            )}
          </TouchableOpacity>

          {/* Slot 3: Editor -> Payment / Agent -> Assigned Work Calendar */}
          <TouchableOpacity
            style={styles.slotBtn}
            onPress={() => navigateTo(isEditor ? 'schedule' : 'work', 3)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={isEditor ? 'Payment' : 'Assigned Work Calendar'}
          >
            {activeSlot !== 3 && (
              <Ionicons
                name={isEditor ? 'wallet-outline' : 'calendar-outline'}
                size={22}
                color="#CBD5E1"
              />
            )}
          </TouchableOpacity>

          {/* Slot 4: Profile (Person Silhouette Icon) */}
          <TouchableOpacity
            style={styles.slotBtn}
            onPress={() => navigateTo('more', 4)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel="Profile"
          >
            {activeSlot !== 4 && (
              <Ionicons name="person-outline" size={22} color="#CBD5E1" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Staff Persona Modal (Accessible via Long Press on Center Switch) */}
      <Modal
        visible={hubVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHubVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setHubVisible(false)}>
          <Pressable style={styles.hubSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.hubHeader}>
              <View>
                <Text style={styles.hubTitle}>Staff Persona Switcher</Text>
                <Text style={styles.hubSubtitle}>Select role to test workflow boundaries</Text>
              </View>
              <TouchableOpacity onPress={() => setHubVisible(false)} style={{ padding: 6 }}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.personaCard, isAgent && styles.personaCardActive]}
                onPress={async () => {
                  if (switchDemoPersona) {
                    await switchDemoPersona('agent-standard');
                  } else {
                    await switchWorkspace('SHOOTS');
                  }
                  setHubVisible(false);
                  showToast('Switched to Agent Mode (Karan Malhotra)');
                }}
              >
                <Text style={styles.personaEmoji}>📸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.personaName}>Karan Malhotra (Agent / Crew)</Text>
                  <Text style={styles.personaRole}>Shoots, Call Sheets & Deliverables Ingest</Text>
                </View>
                {isAgent && <Ionicons name="checkmark-circle" size={22} color={vibrantOrange} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.personaCard, isEditor && styles.personaCardActive]}
                onPress={async () => {
                  if (switchDemoPersona) {
                    await switchDemoPersona('editor-default');
                  } else {
                    await switchWorkspace('EDITING');
                  }
                  setHubVisible(false);
                  showToast('Switched to Editor Mode (Vikram Das)');
                }}
              >
                <Text style={styles.personaEmoji}>🎬</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.personaName}>Vikram Das (Editor)</Text>
                  <Text style={styles.personaRole}>My Work queue, Deliverables & Task Claims</Text>
                </View>
                {isEditor && <Ionicons name="checkmark-circle" size={22} color={vibrantOrange} />}
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    zIndex: 998,
  },
  dockContainer: {
    position: 'absolute',
    zIndex: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },
  floatingCircle: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF5500',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
    shadowColor: '#FF5500',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  tabsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
  },
  slotBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Toast */
  toastContainer: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 1003,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  hubSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 36,
  },
  hubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  hubTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  hubSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  personaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
    gap: 12,
  },
  personaCardActive: {
    borderColor: '#FF5500',
    backgroundColor: '#FFF7ED',
  },
  personaEmoji: {
    fontSize: 22,
  },
  personaName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  personaRole: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});
