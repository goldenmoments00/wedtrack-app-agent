import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';

export interface AgentProfileViewProps {
  onBack?: () => void;
  showBack?: boolean;
}

export function AgentProfileView({ onBack, showBack = true }: AgentProfileViewProps) {
  const insets = useSafeAreaInsets();
  const { session, updateProfile, signOut, mode } = useAuth();
  const { events } = useDemoStore();
  const { isDark } = useTheme();

  // Exact Colors Extracted from User References:
  // Night Mode reference: media_1794850244491_0e838404.png
  // Day Mode reference:   media_1794850384669_ab8d54f4.png
  const themeColors = isDark
    ? {
        bg: '#0E1319',                 // Deep Obsidian Slate (sampled #0E1319)
        bgCard: '#151B22',             // Elevated Dark Surface Slate (sampled #151B22)
        bgSubtle: '#1E2530',           // Metric Pill / Inner Container (sampled #1E2530)
        border: '#1E2530',             // Subtle Border / Divider line
        borderCard: 'rgba(255, 255, 255, 0.08)', // Card Outer Border
        accent: '#F47730',             // Vibrant Terracotta Orange (sampled #F47730 / #F67027)
        accentBox: '#2B1F1A',          // Warm Terracotta Dark Container (sampled #2B1F1A)
        accentText: '#F47730',         // Terracotta Text
        textPrimary: '#FFFFFF',        // Primary Heading White
        textSecondary: '#8B949E',      // Muted Secondary Text
        textMuted: '#6E7681',          // Hint / Subtext
        switchTrack: '#FFFFFF',        // Signature Inverted Switch Track
        switchThumb: '#0E1319',        // Dark Thumb on Right
        btnGlass: '#151B22',
        badgeBg: 'rgba(244, 119, 48, 0.15)',
        badgeText: '#F47730',
      }
    : {
        bg: '#F9F4EE',                 // Warm Creamy Linen Paper (sampled #F9F4EE)
        bgCard: '#FFFFFF',             // Pure White Card Surface (sampled #FFFFFF)
        bgSubtle: '#FAF4ED',           // Soft Warm Pill Surface (sampled #FAF2EA)
        border: '#E8E2D9',             // Warm Soft Divider Line (sampled #E8E2D9)
        borderCard: '#EDE5DC',         // Card Outer Border
        accent: '#AB4831',             // Rustic Burnt Terracotta Brick (sampled #AB4831 / #B2604B)
        accentBox: '#F3DED5',          // Soft Warm Peach-Terracotta Tint (sampled #F3DED5)
        accentText: '#AB4831',         // Terracotta Text
        textPrimary: '#1F2937',        // Deep Charcoal Slate Text
        textSecondary: '#7C7267',      // Warm Muted Gray
        textMuted: '#9CA3AF',          // Hint / Subtext
        switchTrack: '#AB4831',        // Terracotta Switch Track
        switchThumb: '#FFFFFF',        // Clean White Thumb
        btnGlass: '#FFFFFF',
        badgeBg: '#F3DED5',
        badgeText: '#AB4831',
      };

  // State for toggles and editable fields
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statsMode, setStatsMode] = useState<'PHYSICAL' | 'CREW'>('PHYSICAL');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [activeSubModal, setActiveSubModal] = useState<string | null>(null);

  // Profile data
  const [name, setName] = useState(session?.name || 'Karan Malhotra');
  const [location, setLocation] = useState('Mumbai, India');
  const [phone, setPhone] = useState(session?.phone || '+91 98200 77889');
  const [age, setAge] = useState('27');
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('52');
  const [gearKit, setGearKit] = useState('Sony FX3 · 24-70 GM · 70-200 GM');
  const [upiId, setUpiId] = useState('karan.shoots@okhdfcbank');

  // Count agent events
  const agentId = session?.id || 'usr-agt-01';
  const myShootsCount = events.filter(e => e.assignments.some(a => a.agentId === agentId)).length;

  const handleToggleSound = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSoundEnabled(prev => !prev);
  };

  const handleToggleStats = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStatsMode(prev => (prev === 'PHYSICAL' ? 'CREW' : 'PHYSICAL'));
  };

  const handleSaveProfile = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (updateProfile) {
      await updateProfile(name, phone);
    }
    setEditModalVisible(false);
    Alert.alert('Profile Saved', 'Your agent profile and equipment details have been updated.');
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of WedTrack?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* Top Glass Navigation Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 14),
            borderBottomColor: themeColors.border,
          },
        ]}
      >
        {showBack ? (
          <TouchableOpacity
            style={[
              styles.circleGlassBtn,
              {
                backgroundColor: themeColors.btnGlass,
                borderColor: themeColors.border,
              },
            ]}
            onPress={onBack || (() => router.back())}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={themeColors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}

        <Text style={[styles.topBarTitle, { color: themeColors.textPrimary }]}>Profile</Text>

        <TouchableOpacity
          style={[
            styles.circleGlassBtn,
            {
              backgroundColor: themeColors.btnGlass,
              borderColor: themeColors.border,
            },
          ]}
          onPress={() => setEditModalVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel="Edit profile"
        >
          <Ionicons name="create-outline" size={20} color={themeColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Hero Card (Using exact reference layout and colors) */}
        <View
          style={[
            styles.heroGlassCard,
            {
              backgroundColor: themeColors.bgCard,
              borderColor: themeColors.borderCard,
            },
          ]}
        >
          {/* Top Row: Avatar & Name */}
          <View style={styles.heroTopRow}>
            {/* Avatar Photo with Subtle Border */}
            <View style={[styles.avatarBorder, { borderColor: themeColors.border }]}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
                }}
                style={styles.avatarImg}
              />
            </View>

            <View style={styles.heroInfoCol}>
              <Text style={[styles.heroNameText, { color: themeColors.textPrimary }]} numberOfLines={1}>
                {name}
              </Text>
              <Text style={[styles.heroSubtitleText, { color: themeColors.textSecondary }]} numberOfLines={1}>
                {location}
              </Text>
              <View
                style={[
                  styles.roleBadgeContainer,
                  { backgroundColor: themeColors.badgeBg },
                ]}
              >
                <Text style={[styles.heroRolePillText, { color: themeColors.badgeText }]} numberOfLines={1}>
                  {session?.agentProfession === 'BOTH'
                    ? '📸 Lead Photographer & Cinematographer'
                    : '📸 Lead Photographer'}
                </Text>
              </View>
            </View>
          </View>

          {/* 3 Metric Stat Pills */}
          <TouchableOpacity
            style={styles.statPillsRow}
            onPress={handleToggleStats}
            activeOpacity={0.85}
          >
            {statsMode === 'PHYSICAL' ? (
              <>
                {/* Pill 1: Age */}
                <View
                  style={[
                    styles.metricPill,
                    {
                      backgroundColor: themeColors.bgSubtle,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Age</Text>
                  <View style={styles.metricValueRow}>
                    <Text style={[styles.metricValueNum, { color: themeColors.textPrimary }]}>{age}</Text>
                    <Text style={[styles.metricUnit, { color: themeColors.textSecondary }]}>y.o</Text>
                  </View>
                </View>

                {/* Pill 2: Height */}
                <View
                  style={[
                    styles.metricPill,
                    {
                      backgroundColor: themeColors.bgSubtle,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Height</Text>
                  <View style={styles.metricValueRow}>
                    <Text style={[styles.metricValueNum, { color: themeColors.textPrimary }]}>{height}</Text>
                    <Text style={[styles.metricUnit, { color: themeColors.textSecondary }]}>cm</Text>
                  </View>
                </View>

                {/* Pill 3: Weight */}
                <View
                  style={[
                    styles.metricPill,
                    {
                      backgroundColor: themeColors.bgSubtle,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Weight</Text>
                  <View style={styles.metricValueRow}>
                    <Text style={[styles.metricValueNum, { color: themeColors.textPrimary }]}>{weight}</Text>
                    <Text style={[styles.metricUnit, { color: themeColors.textSecondary }]}>kg</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Pill 1: Shoots */}
                <View
                  style={[
                    styles.metricPill,
                    {
                      backgroundColor: themeColors.bgSubtle,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Shoots</Text>
                  <View style={styles.metricValueRow}>
                    <Text style={[styles.metricValueNum, { color: themeColors.textPrimary }]}>{myShootsCount || 5}</Text>
                    <Text style={[styles.metricUnit, { color: themeColors.textSecondary }]}>evts</Text>
                  </View>
                </View>

                {/* Pill 2: Rating */}
                <View
                  style={[
                    styles.metricPill,
                    {
                      backgroundColor: themeColors.bgSubtle,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Rating</Text>
                  <View style={styles.metricValueRow}>
                    <Text style={[styles.metricValueNum, { color: themeColors.textPrimary }]}>4.9</Text>
                    <Text style={[styles.metricUnit, { color: themeColors.textSecondary }]}>★</Text>
                  </View>
                </View>

                {/* Pill 3: Experience */}
                <View
                  style={[
                    styles.metricPill,
                    {
                      backgroundColor: themeColors.bgSubtle,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: themeColors.textSecondary }]}>Experience</Text>
                  <View style={styles.metricValueRow}>
                    <Text style={[styles.metricValueNum, { color: themeColors.textPrimary }]}>4+</Text>
                    <Text style={[styles.metricUnit, { color: themeColors.textSecondary }]}>yrs</Text>
                  </View>
                </View>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.statsToggleHint, { color: themeColors.textMuted }]}>
            Tap pills to switch between physical & crew stats
          </Text>
        </View>

        {/* Section 1: Account settings (using sampled colors) */}
        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Account settings</Text>

        <View
          style={[
            styles.sectionGlassCard,
            {
              backgroundColor: themeColors.bgCard,
              borderColor: themeColors.borderCard,
            },
          ]}
        >
          {/* Item 1: Personal Information (Highlighted with signature Terracotta accent box) */}
          <TouchableOpacity
            style={[styles.capsuleRow, { backgroundColor: themeColors.bgSubtle }]}
            onPress={() => setActiveSubModal('PERSONAL')}
            activeOpacity={0.7}
          >
            <View style={[styles.capsuleIconBox, { backgroundColor: themeColors.accentBox }]}>
              <Ionicons name="person-outline" size={18} color={themeColors.accent} />
            </View>
            <Text style={[styles.capsuleRowTitle, { color: themeColors.textPrimary }]}>Personal Information</Text>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textSecondary} />
          </TouchableOpacity>

          {/* Item 2: Remainder */}
          <TouchableOpacity
            style={[styles.capsuleRow, { backgroundColor: themeColors.bgSubtle }]}
            onPress={() => router.push('/(tabs)/work')}
            activeOpacity={0.7}
          >
            <View style={[styles.capsuleIconBox, { backgroundColor: isDark ? '#151B22' : '#EDE5DC' }]}>
              <Ionicons name="list-outline" size={18} color={themeColors.textSecondary} />
            </View>
            <Text style={[styles.capsuleRowTitle, { color: themeColors.textPrimary }]}>Remainder</Text>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textSecondary} />
          </TouchableOpacity>

          {/* Item 3: Sound (with Signature Inverted Toggle Switch) */}
          <TouchableOpacity
            style={[styles.capsuleRow, { backgroundColor: themeColors.bgSubtle }]}
            onPress={handleToggleSound}
            activeOpacity={0.8}
          >
            <View style={[styles.capsuleIconBox, { backgroundColor: isDark ? '#151B22' : '#EDE5DC' }]}>
              <Ionicons name="volume-medium-outline" size={18} color={themeColors.textSecondary} />
            </View>
            <Text style={[styles.capsuleRowTitle, { color: themeColors.textPrimary }]}>Sound</Text>

            {/* Signature Switch: Pill track with round thumb */}
            <View
              style={[
                styles.switchTrack,
                {
                  backgroundColor: soundEnabled
                    ? themeColors.switchTrack
                    : (isDark ? '#262F3D' : '#D5CEC7'),
                },
              ]}
            >
              <View
                style={[
                  styles.switchThumb,
                  {
                    backgroundColor: soundEnabled
                      ? themeColors.switchThumb
                      : (isDark ? '#8B949E' : '#FFFFFF'),
                  },
                  soundEnabled ? styles.switchThumbRight : styles.switchThumbLeft,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 2: Preferences */}
        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Preferences</Text>

        <View
          style={[
            styles.sectionGlassCard,
            {
              backgroundColor: themeColors.bgCard,
              borderColor: themeColors.borderCard,
            },
          ]}
        >
          {/* Gear Locker */}
          <TouchableOpacity
            style={[styles.capsuleRow, { backgroundColor: themeColors.bgSubtle }]}
            onPress={() => setActiveSubModal('GEAR')}
            activeOpacity={0.7}
          >
            <View style={[styles.capsuleIconBox, { backgroundColor: isDark ? '#151B22' : '#EDE5DC' }]}>
              <Ionicons name="camera-outline" size={18} color={themeColors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.capsuleRowTitle, { color: themeColors.textPrimary }]}>Camera Kit & Gear Locker</Text>
              <Text style={[styles.capsuleRowSubtitle, { color: themeColors.textSecondary }]} numberOfLines={1}>{gearKit}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textSecondary} />
          </TouchableOpacity>

          {/* Bank & UPI Payments */}
          <TouchableOpacity
            style={[styles.capsuleRow, { backgroundColor: themeColors.bgSubtle }]}
            onPress={() => setActiveSubModal('UPI')}
            activeOpacity={0.7}
          >
            <View style={[styles.capsuleIconBox, { backgroundColor: isDark ? '#151B22' : '#EDE5DC' }]}>
              <Ionicons name="wallet-outline" size={18} color={themeColors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.capsuleRowTitle, { color: themeColors.textPrimary }]}>Payout UPI & Settlement</Text>
              <Text style={[styles.capsuleRowSubtitle, { color: themeColors.textSecondary }]} numberOfLines={1}>{upiId}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textSecondary} />
          </TouchableOpacity>

          {/* Studio Affiliation */}
          <View style={[styles.capsuleRow, { backgroundColor: themeColors.bgSubtle }]}>
            <View style={[styles.capsuleIconBox, { backgroundColor: isDark ? '#151B22' : '#EDE5DC' }]}>
              <Ionicons name="business-outline" size={18} color={themeColors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.capsuleRowTitle, { color: themeColors.textPrimary }]}>Studio Affiliation</Text>
              <Text style={[styles.capsuleRowSubtitle, { color: themeColors.textSecondary }]}>Golden Moment.in · Verified Crew</Text>
            </View>
            <View style={[styles.verifiedBadge, { backgroundColor: themeColors.badgeBg }]}>
              <Text style={[styles.verifiedBadgeText, { color: themeColors.badgeText }]}>PRO</Text>
            </View>
          </View>

          {/* Sign Out */}
          <TouchableOpacity
            style={[styles.capsuleRow, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2' }]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={[styles.capsuleIconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FECACA' }]}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            </View>
            <Text style={[styles.capsuleRowTitle, { color: '#EF4444' }]}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setEditModalVisible(false)}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: themeColors.bgCard,
                borderColor: themeColors.border,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>Edit Profile Information</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalInputLabel, { color: themeColors.textSecondary }]}>Full Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: themeColors.bgSubtle,
                    borderColor: themeColors.border,
                    color: themeColors.textPrimary,
                  },
                ]}
                placeholderTextColor={themeColors.textMuted}
              />

              <Text style={[styles.modalInputLabel, { color: themeColors.textSecondary }]}>Location</Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: themeColors.bgSubtle,
                    borderColor: themeColors.border,
                    color: themeColors.textPrimary,
                  },
                ]}
                placeholderTextColor={themeColors.textMuted}
              />

              <Text style={[styles.modalInputLabel, { color: themeColors.textSecondary }]}>Contact Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: themeColors.bgSubtle,
                    borderColor: themeColors.border,
                    color: themeColors.textPrimary,
                  },
                ]}
                placeholderTextColor={themeColors.textMuted}
              />

              {/* Physical Stats */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalInputLabel, { color: themeColors.textSecondary }]}>Age</Text>
                  <TextInput
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: themeColors.bgSubtle,
                        borderColor: themeColors.border,
                        color: themeColors.textPrimary,
                      },
                    ]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalInputLabel, { color: themeColors.textSecondary }]}>Height (cm)</Text>
                  <TextInput
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: themeColors.bgSubtle,
                        borderColor: themeColors.border,
                        color: themeColors.textPrimary,
                      },
                    ]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalInputLabel, { color: themeColors.textSecondary }]}>Weight (kg)</Text>
                  <TextInput
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: themeColors.bgSubtle,
                        borderColor: themeColors.border,
                        color: themeColors.textPrimary,
                      },
                    ]}
                  />
                </View>
              </View>

              <Text style={[styles.modalInputLabel, { color: themeColors.textSecondary }]}>Primary Camera Kit</Text>
              <TextInput
                value={gearKit}
                onChangeText={setGearKit}
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: themeColors.bgSubtle,
                    borderColor: themeColors.border,
                    color: themeColors.textPrimary,
                  },
                ]}
                placeholderTextColor={themeColors.textMuted}
              />

              <Text style={[styles.modalInputLabel, { color: themeColors.textSecondary }]}>Payout UPI ID</Text>
              <TextInput
                value={upiId}
                onChangeText={setUpiId}
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: themeColors.bgSubtle,
                    borderColor: themeColors.border,
                    color: themeColors.textPrimary,
                  },
                ]}
                placeholderTextColor={themeColors.textMuted}
              />

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: themeColors.accent }]}
                onPress={handleSaveProfile}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>Save Profile</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Sub Modals (Personal Info, Gear Locker, UPI) */}
      {activeSubModal && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveSubModal(null)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setActiveSubModal(null)}
          >
            <View
              style={[
                styles.subModalCard,
                {
                  backgroundColor: themeColors.bgCard,
                  borderColor: themeColors.border,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
                  {activeSubModal === 'PERSONAL'
                    ? 'Personal Information'
                    : activeSubModal === 'GEAR'
                    ? 'Camera Kit & Gear Locker'
                    : 'Payout UPI Details'}
                </Text>
                <TouchableOpacity onPress={() => setActiveSubModal(null)}>
                  <Ionicons name="close" size={22} color={themeColors.textPrimary} />
                </TouchableOpacity>
              </View>

              {activeSubModal === 'PERSONAL' && (
                <View style={{ gap: 8 }}>
                  <Text style={[styles.subModalText, { color: themeColors.textPrimary }]}>• Name: {name}</Text>
                  <Text style={[styles.subModalText, { color: themeColors.textPrimary }]}>• Location: {location}</Text>
                  <Text style={[styles.subModalText, { color: themeColors.textPrimary }]}>• Phone: {phone}</Text>
                  <Text style={[styles.subModalText, { color: themeColors.textPrimary }]}>• Studio Email: {session?.email}</Text>
                  <Text style={[styles.subModalText, { color: themeColors.textPrimary }]}>• Role: {session?.primaryRole} (Staff Crew)</Text>
                </View>
              )}

              {activeSubModal === 'GEAR' && (
                <View style={{ gap: 8 }}>
                  <Text style={[styles.subModalText, { color: themeColors.textPrimary }]}>• Primary Camera: Sony FX3 Cinema Line</Text>
                  <Text style={[styles.subModalText, { color: themeColors.textPrimary }]}>• Backup Body: Sony A7 IV</Text>
                  <Text style={[styles.subModalText, { color: themeColors.textPrimary }]}>• Lenses: 24-70mm f/2.8 GM II, 70-200mm f/2.8 GM</Text>
                  <Text style={[styles.subModalText, { color: themeColors.textPrimary }]}>• Audio: DJI Mic 2 Wireless Transmitters</Text>
                  <Text style={[styles.subModalText, { color: themeColors.textPrimary }]}>• Lighting: Godox V1S Speedlite + Softbox</Text>
                </View>
              )}

              {activeSubModal === 'UPI' && (
                <View style={{ gap: 8 }}>
                  <Text style={[styles.subModalText, { color: themeColors.textPrimary }]}>• UPI ID: {upiId}</Text>
                  <Text style={[styles.subModalText, { color: themeColors.textPrimary }]}>• Payee Name: {name}</Text>
                  <Text style={[styles.subModalText, { color: themeColors.textPrimary }]}>• Settlement Mode: Monthly Bank Transfer</Text>
                  <Text style={[styles.subModalText, { color: themeColors.textPrimary }]}>• Status: Verified with Studio Accounts Desk</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: themeColors.accent, marginTop: 16 }]}
                onPress={() => setActiveSubModal(null)}
              >
                <Text style={styles.saveBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  circleGlassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },

  /* Hero Card */
  heroGlassCard: {
    borderRadius: 28,
    borderWidth: 1.2,
    padding: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBorder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  heroInfoCol: {
    flex: 1,
  },
  heroNameText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  heroSubtitleText: {
    fontSize: 13,
    marginTop: 2,
  },
  roleBadgeContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 5,
  },
  heroRolePillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Metric Stat Pills */
  statPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  metricPill: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 4,
  },
  metricValueNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsToggleHint: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
  },

  /* Section Styles */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 22,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  sectionGlassCard: {
    borderRadius: 26,
    borderWidth: 1.2,
    padding: 12,
    gap: 10,
  },
  capsuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  capsuleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capsuleRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  capsuleRowSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  verifiedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  /* Signature Inverted Switch: Pill track with round thumb */
  switchTrack: {
    width: 48,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  switchThumbRight: {
    alignSelf: 'flex-end',
  },
  switchThumbLeft: {
    alignSelf: 'flex-start',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    borderWidth: 1,
    maxHeight: '85%',
  },
  subModalCard: {
    margin: 24,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.2,
    alignSelf: 'center',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  subModalText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
