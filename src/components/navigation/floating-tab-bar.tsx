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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
  const dockHeight = 62;
  const dockMarginH = 16;
  const dockPaddingH = 8;
  const circleSize = 44;
  const circleRadius = circleSize / 2;
  const dockBottom = Math.max(insets.bottom, 12) + 8;

  // Screen width measurement: bar width is screen width minus margins
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

  // Slot calculations: 5 evenly spaced slots across the floating pill with padding
  const usableWidth = barWidth - dockPaddingH * 2;
  const slotWidth = usableWidth / 5;
  const getSlotCenterX = (slot: number) => dockPaddingH + slotWidth * (slot + 0.5);

  // Animated X position for the floating active circle
  const notchAnim = useRef(new Animated.Value(getSlotCenterX(activeSlot))).current;

  useEffect(() => {
    const targetX = getSlotCenterX(activeSlot);
    Animated.spring(notchAnim, {
      toValue: targetX,
      damping: 20,
      mass: 0.7,
      stiffness: 180,
      useNativeDriver: false,
    }).start();
  }, [activeSlot, barWidth]);

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

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastFade,
              bottom: dockBottom + dockHeight + 16,
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

      {/* Floating Island Dock Container */}
      <View
        style={[
          styles.dockContainer,
          {
            left: dockMarginH,
            right: dockMarginH,
            bottom: dockBottom,
            height: dockHeight,
          },
        ]}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        pointerEvents="box-none"
      >
        {/* Frosted Glass Rounded Capsule Pill */}
        <View style={styles.dockPill}>
          {/* Native Hardware Blur Effect */}
          <BlurView
            intensity={85}
            tint="light"
            style={StyleSheet.absoluteFill}
          />

          {/* Luminous Translucent Porcelain Glass Sheen */}
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.90)',
              'rgba(255, 255, 255, 0.74)',
              'rgba(248, 250, 252, 0.68)',
            ]}
            locations={[0, 0.55, 1.0]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Optical Glass Specular Rim Highlight */}
          <View style={styles.specularRim} />
        </View>

        {/* Floating Radiant Orange Circular Button gliding between slots */}
        <Animated.View
          style={[
            styles.floatingCircle,
            {
              left: Animated.subtract(notchAnim, circleRadius),
              top: (dockHeight - circleSize) / 2,
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons name={activeIcon} size={22} color="#FFFFFF" />
        </Animated.View>

        {/* Interactive Clickable Tabs Row (5 slots) */}
        <View style={styles.tabsRow}>
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
                color="#64748B"
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
                color="#64748B"
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
              <Ionicons name="swap-horizontal" size={23} color="#64748B" />
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
                color="#64748B"
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
              <Ionicons name="person-outline" size={22} color="#64748B" />
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
  dockContainer: {
    position: 'absolute',
    zIndex: 999,
  },
  dockPill: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.90)',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  specularRim: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.42,
    shadowRadius: 9,
    elevation: 8,
  },
  tabsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
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
