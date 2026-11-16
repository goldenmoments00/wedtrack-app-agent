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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';

export interface AgentProfileViewProps {
  onBack?: () => void;
  showBack?: boolean;
}

export function AgentProfileView({ onBack, showBack = true }: AgentProfileViewProps) {
  const insets = useSafeAreaInsets();
  const { session, updateProfile, signOut, mode } = useAuth();
  const { events } = useDemoStore();

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
    <View style={styles.container}>
      {/* Background Gradient: Deep Sage & Teal Glass Atmosphere */}
      <LinearGradient
        colors={['#2A3831', '#1D2A24', '#131C18']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* Top Glass Navigation Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 14),
          },
        ]}
      >
        {showBack ? (
          <TouchableOpacity
            style={styles.circleGlassBtn}
            onPress={onBack || (() => router.back())}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}

        <Text style={styles.topBarTitle}>Profile</Text>

        <TouchableOpacity
          style={styles.circleGlassBtn}
          onPress={() => setEditModalVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel="Edit profile"
        >
          <Ionicons name="create-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Hero Card (Frosted Glass with 3 Metrics) */}
        <View style={styles.heroGlassCard}>
          {/* Top Row: Avatar & Name */}
          <View style={styles.heroTopRow}>
            {/* Avatar Photo with Subtle Border */}
            <View style={styles.avatarBorder}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
                }}
                style={styles.avatarImg}
              />
            </View>

            <View style={styles.heroInfoCol}>
              <Text style={styles.heroNameText} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.heroSubtitleText} numberOfLines={1}>
                {location}
              </Text>
              <Text style={styles.heroRolePillText} numberOfLines={1}>
                {session?.agentProfession === 'BOTH'
                  ? '📸 Lead Photographer & Cinematographer'
                  : '📸 Lead Photographer'}
              </Text>
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
                <View style={styles.metricPill}>
                  <Text style={styles.metricLabel}>Age</Text>
                  <View style={styles.metricValueRow}>
                    <Text style={styles.metricValueNum}>{age}</Text>
                    <Text style={styles.metricUnit}>y.o</Text>
                  </View>
                </View>

                {/* Pill 2: Height */}
                <View style={styles.metricPill}>
                  <Text style={styles.metricLabel}>Height</Text>
                  <View style={styles.metricValueRow}>
                    <Text style={styles.metricValueNum}>{height}</Text>
                    <Text style={styles.metricUnit}>cm</Text>
                  </View>
                </View>

                {/* Pill 3: Weight */}
                <View style={styles.metricPill}>
                  <Text style={styles.metricLabel}>Weight</Text>
                  <View style={styles.metricValueRow}>
                    <Text style={styles.metricValueNum}>{weight}</Text>
                    <Text style={styles.metricUnit}>kg</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Pill 1: Shoots */}
                <View style={styles.metricPill}>
                  <Text style={styles.metricLabel}>Shoots</Text>
                  <View style={styles.metricValueRow}>
                    <Text style={styles.metricValueNum}>{myShootsCount || 5}</Text>
                    <Text style={styles.metricUnit}>evts</Text>
                  </View>
                </View>

                {/* Pill 2: Rating */}
                <View style={styles.metricPill}>
                  <Text style={styles.metricLabel}>Rating</Text>
                  <View style={styles.metricValueRow}>
                    <Text style={styles.metricValueNum}>4.9</Text>
                    <Text style={styles.metricUnit}>★</Text>
                  </View>
                </View>

                {/* Pill 3: Experience */}
                <View style={styles.metricPill}>
                  <Text style={styles.metricLabel}>Experience</Text>
                  <View style={styles.metricValueRow}>
                    <Text style={styles.metricValueNum}>4+</Text>
                    <Text style={styles.metricUnit}>yrs</Text>
                  </View>
                </View>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.statsToggleHint}>
            Tap pills to switch between physical & crew stats
          </Text>
        </View>

        {/* Section 1: Account settings */}
        <Text style={styles.sectionTitle}>Account settings</Text>

        <View style={styles.sectionGlassCard}>
          {/* Item 1: Personal Information */}
          <TouchableOpacity
            style={styles.capsuleRow}
            onPress={() => setActiveSubModal('PERSONAL')}
            activeOpacity={0.7}
          >
            <View style={styles.capsuleIconBox}>
              <Ionicons name="person-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.capsuleRowTitle}>Personal Information</Text>
            <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>

          {/* Item 2: Remainder (Shoot Reminders & Call Sheets) */}
          <TouchableOpacity
            style={styles.capsuleRow}
            onPress={() => router.push('/(tabs)/work')}
            activeOpacity={0.7}
          >
            <View style={styles.capsuleIconBox}>
              <Ionicons name="list-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.capsuleRowTitle}>Remainder</Text>
            <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>

          {/* Item 3: Sound (with Signature Inverted Toggle Switch) */}
          <TouchableOpacity
            style={styles.capsuleRow}
            onPress={handleToggleSound}
            activeOpacity={0.8}
          >
            <View style={styles.capsuleIconBox}>
              <Ionicons name="volume-medium-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.capsuleRowTitle}>Sound</Text>

            {/* Signature Switch: White pill track with dark circular thumb on right */}
            <View style={[styles.switchTrack, soundEnabled ? styles.switchTrackOn : styles.switchTrackOff]}>
              <View
                style={[
                  styles.switchThumb,
                  soundEnabled ? styles.switchThumbRight : styles.switchThumbLeft,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 2: Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.sectionGlassCard}>
          {/* Gear Locker */}
          <TouchableOpacity
            style={styles.capsuleRow}
            onPress={() => setActiveSubModal('GEAR')}
            activeOpacity={0.7}
          >
            <View style={styles.capsuleIconBox}>
              <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.capsuleRowTitle}>Camera Kit & Gear Locker</Text>
              <Text style={styles.capsuleRowSubtitle} numberOfLines={1}>{gearKit}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>

          {/* Bank & UPI Payments */}
          <TouchableOpacity
            style={styles.capsuleRow}
            onPress={() => setActiveSubModal('UPI')}
            activeOpacity={0.7}
          >
            <View style={styles.capsuleIconBox}>
              <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.capsuleRowTitle}>Payout UPI & Settlement</Text>
              <Text style={styles.capsuleRowSubtitle} numberOfLines={1}>{upiId}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>

          {/* Studio Affiliation */}
          <View style={styles.capsuleRow}>
            <View style={styles.capsuleIconBox}>
              <Ionicons name="business-outline" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.capsuleRowTitle}>Studio Affiliation</Text>
              <Text style={styles.capsuleRowSubtitle}>Golden Moment.in · Verified Crew</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>PRO</Text>
            </View>
          </View>

          {/* Sign Out */}
          <TouchableOpacity
            style={[styles.capsuleRow, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={[styles.capsuleIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.25)' }]}>
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
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Information</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalInputLabel}>Full Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.modalInput}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />

              <Text style={styles.modalInputLabel}>Location</Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                style={styles.modalInput}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />

              <Text style={styles.modalInputLabel}>Contact Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={styles.modalInput}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />

              {/* Physical Stats */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalInputLabel}>Age</Text>
                  <TextInput
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    style={styles.modalInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalInputLabel}>Height (cm)</Text>
                  <TextInput
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    style={styles.modalInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalInputLabel}>Weight (kg)</Text>
                  <TextInput
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    style={styles.modalInput}
                  />
                </View>
              </View>

              <Text style={styles.modalInputLabel}>Primary Camera Kit</Text>
              <TextInput
                value={gearKit}
                onChangeText={setGearKit}
                style={styles.modalInput}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />

              <Text style={styles.modalInputLabel}>Payout UPI ID</Text>
              <TextInput
                value={upiId}
                onChangeText={setUpiId}
                style={styles.modalInput}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />

              <TouchableOpacity
                style={styles.saveBtn}
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
            <View style={styles.subModalCard} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {activeSubModal === 'PERSONAL'
                    ? 'Personal Information'
                    : activeSubModal === 'GEAR'
                    ? 'Camera Kit & Gear Locker'
                    : 'Payout UPI Details'}
                </Text>
                <TouchableOpacity onPress={() => setActiveSubModal(null)}>
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {activeSubModal === 'PERSONAL' && (
                <View style={{ gap: 8 }}>
                  <Text style={styles.subModalText}>• Name: {name}</Text>
                  <Text style={styles.subModalText}>• Location: {location}</Text>
                  <Text style={styles.subModalText}>• Phone: {phone}</Text>
                  <Text style={styles.subModalText}>• Studio Email: {session?.email}</Text>
                  <Text style={styles.subModalText}>• Role: {session?.primaryRole} (Staff Crew)</Text>
                </View>
              )}

              {activeSubModal === 'GEAR' && (
                <View style={{ gap: 8 }}>
                  <Text style={styles.subModalText}>• Primary Camera: Sony FX3 Cinema Line</Text>
                  <Text style={styles.subModalText}>• Backup Body: Sony A7 IV</Text>
                  <Text style={styles.subModalText}>• Lenses: 24-70mm f/2.8 GM II, 70-200mm f/2.8 GM</Text>
                  <Text style={styles.subModalText}>• Audio: DJI Mic 2 Wireless Transmitters</Text>
                  <Text style={styles.subModalText}>• Lighting: Godox V1S Speedlite + Softbox</Text>
                </View>
              )}

              {activeSubModal === 'UPI' && (
                <View style={{ gap: 8 }}>
                  <Text style={styles.subModalText}>• UPI ID: {upiId}</Text>
                  <Text style={styles.subModalText}>• Payee Name: {name}</Text>
                  <Text style={styles.subModalText}>• Settlement Mode: Monthly Bank Transfer</Text>
                  <Text style={styles.subModalText}>• Status: Verified with Studio Accounts Desk</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, { marginTop: 16 }]}
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
  },
  circleGlassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },

  /* Hero Card */
  heroGlassCard: {
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
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
    borderColor: 'rgba(255, 255, 255, 0.45)',
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
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  heroSubtitleText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 2,
  },
  heroRolePillText: {
    fontSize: 11,
    color: '#93C5FD',
    fontWeight: '600',
    marginTop: 4,
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
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
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
    color: '#FFFFFF',
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsToggleHint: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: 10,
  },

  /* Section Styles */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 22,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  sectionGlassCard: {
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 12,
    gap: 10,
  },
  capsuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.11)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  capsuleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capsuleRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  capsuleRowSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 1,
  },
  verifiedBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Signature Inverted Switch: White Track with Dark Thumb on Right */
  switchTrack: {
    width: 48,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: '#FFFFFF',
  },
  switchTrackOff: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  switchThumbRight: {
    backgroundColor: '#1C2923',
    alignSelf: 'flex-end',
  },
  switchThumbLeft: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1E2C25',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    maxHeight: '85%',
  },
  subModalCard: {
    margin: 24,
    backgroundColor: '#1E2C25',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
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
    color: '#FFFFFF',
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#059669',
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
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
});
