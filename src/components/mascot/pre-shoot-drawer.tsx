import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/use-theme';
import { InteractiveBot } from './interactive-bot';

export interface PreShootDrawerProps {
  visible: boolean;
  onClose: () => void;
  eventTitle?: string;
  venueName?: string;
  clientPhone?: string;
  callTime?: string;
}

interface ChecklistItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  isAction?: boolean;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  {
    id: 'battery',
    icon: 'battery-charging',
    title: 'Camera & Gimbal Batteries',
    subtitle: 'All 4x NP-FZ100 at 100% + DJI Ronin charged',
    color: '#10B981',
  },
  {
    id: 'sd_backup',
    icon: 'save-outline',
    title: 'SD Cards & Dual Backup',
    subtitle: 'Dual V90 slots formatted & raw redundancy on',
    color: '#3B82F6',
  },
  {
    id: 'audio_mic',
    icon: 'mic-outline',
    title: 'Wireless Audio Mics',
    subtitle: 'DJI/Rode transmitters synced + fresh lavalier foam',
    color: '#F59E0B',
  },
  {
    id: 'lenses',
    icon: 'aperture-outline',
    title: 'Prime & Zoom Lenses',
    subtitle: 'Glass cleaned, 24-70 GM & 70-200 GM in bag',
    color: '#EC4899',
  },
  {
    id: 'client_contact',
    icon: 'call',
    title: 'Client / Coordinator Contact',
    subtitle: 'Tap to call bride/groom or on-site planner',
    color: '#22C55E',
    isAction: true,
  },
];

export const PreShootDrawer: React.FC<PreShootDrawerProps> = ({
  visible,
  onClose,
  eventTitle = 'BRIDE & GROOM ASHIRBAD',
  venueName = 'Melaghar Lakeview',
  clientPhone = '+91 98300 12345',
  callTime = '6:30 AM',
}) => {
  const { isDark } = useTheme();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    battery: true,
    sd_backup: true,
  });

  const toggleItem = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCall = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {}
    if (clientPhone) {
      Linking.openURL(`tel:${clientPhone}`);
    }
  };

  const handleComplete = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {}
    onClose();
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = DEFAULT_ITEMS.length - 1; // excluding client call action

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#1C151B' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5E7EB',
            },
          ]}
        >
          {/* Top Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header Row with Chhotu and Event Info */}
          <View style={styles.headerRow}>
            <View style={styles.headerMascotBox}>
              <InteractiveBot
                size="sm"
                category="agent_shoot"
                showBubbleByDefault={false}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.badgeRow}>
                <View style={styles.prepBadge}>
                  <Text style={styles.prepBadgeText}>PRE-SHOOT BRIEF</Text>
                </View>
                <Text style={styles.callTimeText}>Call Time: {callTime}</Text>
              </View>

              <Text
                style={[
                  styles.eventTitle,
                  { color: isDark ? '#FFFFFF' : '#111827' },
                ]}
                numberOfLines={1}
              >
                {eventTitle}
              </Text>
              <Text
                style={[
                  styles.venueName,
                  { color: isDark ? '#9CA3AF' : '#6B7280' },
                ]}
                numberOfLines={1}
              >
                📍 {venueName}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
                },
              ]}
              accessibilityLabel="Close pre-shoot checklist"
            >
              <Ionicons
                name="close"
                size={20}
                color={isDark ? '#FFFFFF' : '#374151'}
              />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, (completedCount / totalCount) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {completedCount} of {totalCount} Gear checks done
            </Text>
          </View>

          {/* Checklist Items */}
          <ScrollView
            style={styles.itemsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {DEFAULT_ITEMS.map(item => {
              const isChecked = !!checkedItems[item.id];

              if (item.isAction) {
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.actionCard,
                      {
                        backgroundColor: isDark
                          ? 'rgba(34, 197, 94, 0.12)'
                          : '#ECFDF5',
                        borderColor: isDark
                          ? 'rgba(34, 197, 94, 0.3)'
                          : '#A7F3D0',
                      },
                    ]}
                    onPress={handleCall}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.itemIconBox,
                        { backgroundColor: '#22C55E' },
                      ]}
                    >
                      <Ionicons name="call" size={18} color="#FFFFFF" />
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.itemTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        {item.title}
                      </Text>
                      <Text style={styles.itemSubtitle}>
                        Direct Call: {clientPhone}
                      </Text>
                    </View>

                    <View style={styles.callActionBtn}>
                      <Ionicons name="call" size={14} color="#FFFFFF" />
                      <Text style={styles.callActionBtnText}>Call Now</Text>
                    </View>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.checkItemCard,
                    {
                      backgroundColor: isDark
                        ? isChecked
                          ? 'rgba(255, 85, 0, 0.08)'
                          : 'rgba(255, 255, 255, 0.04)'
                        : isChecked
                        ? '#FFF7ED'
                        : '#F9FAFB',
                      borderColor: isChecked
                        ? '#FF5500'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : '#E5E7EB',
                    },
                  ]}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.itemIconBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : '#F3F4F6',
                      },
                    ]}
                  >
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                    <Text
                      style={[
                        styles.itemTitle,
                        {
                          color: isDark ? '#FFFFFF' : '#111827',
                          textDecorationLine: isChecked ? 'line-through' : 'none',
                          opacity: isChecked ? 0.75 : 1,
                        },
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.itemSubtitle,
                        { color: isDark ? '#9CA3AF' : '#6B7280' },
                      ]}
                    >
                      {item.subtitle}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.checkbox,
                      isChecked && styles.checkboxActive,
                    ]}
                  >
                    {isChecked && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Bottom Action Button */}
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={handleComplete}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>All Checked — Ready for Shoot! 🚀</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '82%',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
    elevation: 20,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(156, 163, 175, 0.4)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerMascotBox: {
    width: 58,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  prepBadge: {
    backgroundColor: '#FF5500',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  prepBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  callTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  venueName: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarWrapper: {
    marginBottom: 16,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF5500',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  itemsList: {
    maxHeight: 340,
  },
  checkItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  itemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  itemSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#FF5500',
    borderColor: '#FF5500',
  },
  callActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#22C55E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doneBtn: {
    backgroundColor: '#FF5500',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#FF5500',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});