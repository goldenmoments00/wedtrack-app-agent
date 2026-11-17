import { AchievementBadge } from '@/components/achievements/achievement-badge';
import { AchievementsModal } from '@/components/achievements/achievements-modal';
import { Button } from '@/components/common/button';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { StateView } from '@/components/common/state-view';
import { StatusBadge } from '@/components/common/status-badge';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { CrewRole } from '@/types/events';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// High-resolution realistic portrait avatars matching reference roster style
const AVATAR_MAP: Record<string, string> = {
  'Karan Malhotra': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces',
  'Ananya Roy': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces',
  'Rahul Joshi': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=faces',
  'Abhishek M.': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=faces',
  'Supradip B.': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=faces',
  'Supam D.': 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=300&fit=crop&crop=faces',
  'Rahul D.': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop&crop=faces',
  'Priya Sharma': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=faces',
  'Aarav Mehta': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=faces',
  'Vikram Das': 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&fit=crop&crop=faces',
  'Arjun Nair': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=faces',
};

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop&crop=faces';

const PHONE_MAP: Record<string, string> = {
  'Karan Malhotra': '+91 98200 77889',
  'Ananya Roy': '+91 98200 88990',
  'Rahul Joshi': '+91 98200 12121',
  'Abhishek M.': '+91 94361 55667',
  'Supradip B.': '+91 94361 77889',
  'Supam D.': '+91 98200 33211',
  'Rahul D.': '+91 98200 44556',
  'Priya Sharma': '+91 98200 33445',
  'Aarav Mehta': '+91 98200 11223',
};

function getCrewBrief(name: string, role: string, isPrimary: boolean): string {
  if (role === 'PHOTOGRAPHER') {
    return isPrimary
      ? 'Lead photographer handling bride & groom portraits, ceremony rituals, and high-res raw backup.'
      : 'Second candid photographer covering guest reactions, décor aesthetics & family group portraits.';
  }
  return isPrimary
    ? 'Lead cinematographer capturing 4K gimbal walkthroughs, audio feeds & cinematic highlight reels.'
    : 'Second videographer focusing on drone aerials, guest snippets & secondary ceremony angles.';
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, permissions } = useAuth();
  const { events, team, assignCrew, removeCrew, updateMaterialReceipt } = useDemoStore();
  const { colors, typography, spacing, radii, isDark } = useTheme();

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CrewRole>('PHOTOGRAPHER');
  const [achievementsModalVisible, setAchievementsModalVisible] = useState(false);
  const [selectedMemberForAchievements, setSelectedMemberForAchievements] = useState<{
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  } | null>(null);

  const handleOpenAchievements = (agentId: string, agentName: string, avatarUri: string, role: string) => {
    setSelectedMemberForAchievements({
      id: agentId,
      name: agentName,
      avatar: avatarUri,
      role,
    });
    setAchievementsModalVisible(true);
  };

  const event = events.find(e => e.id === id);

  if (!event) {
    return (
      <ScreenWrapper>
        <StateView
          type="error"
          title="Event Not Found"
          message="This event record may have been deleted or rescheduled."
          actionTitle="Back to Schedule"
          onAction={() => router.back()}
        />
      </ScreenWrapper>
    );
  }

  const isOwnerOrAdmin = session?.roles.includes('OWNER') || session?.roles.includes('ADMIN');
  const isManager = session?.roles.includes('MANAGER');
  const canAssignCrew = isOwnerOrAdmin || (isManager && permissions.orderSections.crew === 'edit');
  const canSeeCost = permissions.money.cost !== 'none';

  // Eligible crew members: must be ACTIVE and have shooting capability matching slot
  const eligibleCrew = team.filter(m => {
    if (!m.isActive || !m.capabilities.shooting) return false;
    if (m.profession === 'BOTH') return true;
    return m.profession === selectedRole;
  });

  const handleSelectCrew = (member: (typeof team)[0]) => {
    const defaultPay = selectedRole === 'PHOTOGRAPHER' ? 8000 : 9000;
    assignCrew(event.id, member.id, selectedRole, false, defaultPay);
    setAssignModalVisible(false);
    Alert.alert('Crew Allocated', `${member.name} has been assigned as ${selectedRole}.`);
  };

  const handleToggleReceipt = (assignmentId: string, current: boolean) => {
    updateMaterialReceipt(event.id, assignmentId, !current);
  };

  const handleRemoveAssignment = (assignmentId: string, agentName: string) => {
    Alert.alert('Remove Crew', `Unassign ${agentName} from this event?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeCrew(event.id, assignmentId) },
    ]);
  };

  const handleCall = (phone?: string, name?: string) => {
    if (!phone) {
      Alert.alert('Phone Not Available', `No phone number on record for ${name || 'crew member'}.`);
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Unable to Call', `Could not initiate call to ${cleanPhone}.`);
    });
  };

  const handleWhatsApp = (phone?: string, name?: string) => {
    if (!phone) {
      Alert.alert('Phone Not Available', `No phone number on record for ${name || 'crew member'}.`);
      return;
    }
    const cleanDigits = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleanDigits}&text=Hi ${name || 'there'}, regarding the ${event.eventTypeName} shoot...`).catch(() => {
      Linking.openURL(`https://wa.me/${cleanDigits}`);
    });
  };

  const handleSms = (phone?: string, name?: string) => {
    if (!phone) {
      Alert.alert('Phone Not Available', `No phone number on record for ${name || 'crew member'}.`);
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`sms:${cleanPhone}`).catch(() => {
      Alert.alert('Unable to Message', 'Could not open SMS application.');
    });
  };

  return (
    <ScreenWrapper>
      {/* Warm roasted dark gradient background */}
      <LinearGradient
        colors={isDark ? ['#733723', '#402119', '#24161B', '#16131B', '#131118'] : [colors.background, colors.background]}
        locations={isDark ? [0, 0.22, 0.48, 0.75, 1] : [0, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Header Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(34, 22, 28, 0.88)' : colors.surface,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.09)' : colors.border,
              borderRadius: radii.lg,
            },
          ]}
        >
          <View style={styles.topRow}>
            <View style={styles.orderBadge}>
              <Text style={styles.orderBadgeText}>{event.tenantOrderNumber}</Text>
            </View>
            <StatusBadge label={event.status} size="sm" />
          </View>

          <Text style={[typography.title1, { color: colors.textPrimary, marginTop: 8 }]}>
            {event.eventTypeName}
          </Text>
          <Text style={[typography.body, { color: isDark ? '#D4D4D8' : colors.textSecondary, marginTop: 2 }]}>
            {event.orderTitle} · Side: {event.side}
          </Text>

          <View style={[styles.metaRow, { marginTop: 8 }]}>
            <Ionicons name="time-outline" size={13.5} color="#FF5500" />
            <Text style={[styles.metaText, { color: isDark ? '#D4D4D8' : colors.textSecondary, marginLeft: 6 }]}>
              {new Date(event.startTime).toLocaleString('en-IN', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </Text>
          </View>

          <View style={[styles.metaRow, { marginTop: 4 }]}>
            <Ionicons name="location-outline" size={13.5} color="#FF5500" />
            <Text style={[styles.metaText, { color: isDark ? '#D4D4D8' : colors.textSecondary, marginLeft: 6, flex: 1 }]} numberOfLines={1}>
              {event.venueName} · {event.venueAddress}
            </Text>
          </View>

          {/* Client & Venue Action Icons Row */}
          <View
            style={[
              styles.actionRow,
              {
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.borderSubtle,
                marginTop: spacing.md,
                paddingTop: spacing.sm,
                justifyContent: 'space-between',
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 10 }}>
              <Ionicons name="person-circle-outline" size={20} color="#FF5500" />
              <View style={{ flex: 1 }}>
                <Text style={[typography.subhead, { color: colors.textPrimary, fontWeight: '700' }]} numberOfLines={1}>
                  {event.contactName || 'Client Contact'}
                </Text>
                {event.contactPhone && (
                  <Text style={[typography.caption2, { color: isDark ? '#A1A1AA' : colors.textSecondary }]}>
                    {event.contactPhone}
                  </Text>
                )}
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Client Call Icon Button */}
              {event.contactPhone && (
                <TouchableOpacity
                  style={styles.clientCallBtn}
                  onPress={() => Linking.openURL(`tel:${event.contactPhone}`)}
                  activeOpacity={0.75}
                  accessibilityLabel={`Call ${event.contactName || 'Client'}`}
                >
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              {/* Venue Google Maps Icon Button */}
              {event.venueMapUrl && (
                <TouchableOpacity
                  style={[
                    styles.clientSocialBtn,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.surfaceSubtle,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : colors.border,
                    },
                  ]}
                  onPress={() => Linking.openURL(event.venueMapUrl!)}
                  activeOpacity={0.75}
                  accessibilityLabel="Open Venue in Google Maps"
                >
                  <Ionicons name="map-outline" size={16} color={isDark ? '#F4F4F5' : colors.textPrimary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Crew Staffing Section (EVT-03, EVT-04, EVT-05) matching reference roster */}
        <View style={{ marginTop: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[typography.title2, { color: colors.textPrimary }]}>Crew Assignments</Text>
              <Text style={[styles.sectionSubtitle, { color: isDark ? '#A1A1AA' : colors.textSecondary }]}>
                These professionals work on making this shoot best.
              </Text>
            </View>
            {canAssignCrew && (
              <Button
                title="+ Assign Crew"
                onPress={() => setAssignModalVisible(true)}
                size="sm"
                variant="primary"
              />
            )}
          </View>

          <View style={[styles.reqBar, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surfaceSubtle }]}>
            <Ionicons name="people-outline" size={15} color="#FF5500" />
            <Text style={[styles.reqBarText, { color: isDark ? '#D4D4D8' : colors.textSecondary }]}>
              Requirement: {event.photographersNeeded} Photographer(s) · {event.videographersNeeded} Videographer(s)
            </Text>
          </View>

          {event.assignments.length === 0 ? (
            <StateView
              type="empty"
              title="No Crew Assigned"
              message="Tap '+ Assign Crew' above to select eligible active staff for this shoot."
            />
          ) : (
            event.assignments.map(asg => {
              const avatarUri = asg.agentAvatar || AVATAR_MAP[asg.agentName] || DEFAULT_AVATAR;
              const memberPhone = asg.agentPhone || PHONE_MAP[asg.agentName] || team.find(m => m.id === asg.agentId || m.name === asg.agentName)?.phone || '+91 98200 77889';
              const memberData = team.find(m => m.id === asg.agentId || m.name === asg.agentName);
              const memberAchievements = memberData?.achievements || [];
              const topAchievement = memberAchievements[0];

              return (
                <View
                  key={asg.id}
                  style={[
                    styles.crewCard,
                    {
                      backgroundColor: isDark ? 'rgba(34, 22, 28, 0.92)' : colors.surface,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.09)' : colors.border,
                    },
                  ]}
                >
                  <View style={styles.crewCardInner}>
                    {/* Left Column: Circular Portrait Avatar with DP Achievement Pin & Lead Glow Ring */}
                    <TouchableOpacity
                      style={styles.avatarWrapper}
                      onPress={() => handleOpenAchievements(asg.agentId, asg.agentName, avatarUri, asg.role)}
                      activeOpacity={0.8}
                      accessibilityLabel={`View ${asg.agentName}'s achievements and honors`}
                    >
                      <View
                        style={[
                          styles.avatarCircleRing,
                          asg.isPrimary
                            ? { borderColor: '#FF5500', shadowColor: '#FF5500', shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 }
                            : { borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : colors.border },
                        ]}
                      >
                        <Image
                          source={{ uri: avatarUri }}
                          style={styles.avatarImage}
                          resizeMode="cover"
                        />
                      </View>

                      {/* Achievement Badge Pin directly attached to DP bubble */}
                      {topAchievement && (
                        <View style={styles.dpAchievementPin}>
                          <AchievementBadge achievement={topAchievement} size="mini" />
                        </View>
                      )}

                      {asg.isPrimary && (
                        <View style={styles.primaryPillMini}>
                          <Text style={styles.primaryPillMiniText}>LEAD</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Right Column: Name, Role, Divider, Responsibility Brief, Action Discs */}
                    <View style={styles.crewInfoBlock}>
                      {/* Name & Role Tag Row */}
                      <View style={styles.crewNameRow}>
                        <Text style={[styles.crewName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {asg.agentName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View
                            style={[
                              styles.roleTag,
                              {
                                backgroundColor: asg.role === 'PHOTOGRAPHER' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                                borderColor: asg.role === 'PHOTOGRAPHER' ? 'rgba(59, 130, 246, 0.35)' : 'rgba(168, 85, 247, 0.35)',
                              },
                            ]}
                            accessibilityLabel={asg.role === 'PHOTOGRAPHER' ? 'Photographer' : 'Videographer'}
                          >
                            <Ionicons
                              name={asg.role === 'PHOTOGRAPHER' ? 'camera' : 'videocam'}
                              size={14}
                              color={asg.role === 'PHOTOGRAPHER' ? '#60A5FA' : '#C084FC'}
                            />
                          </View>

                          {canAssignCrew && (
                            <TouchableOpacity
                              onPress={() => handleRemoveAssignment(asg.id, asg.agentName)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              accessibilityLabel={`Remove ${asg.agentName}`}
                            >
                              <Ionicons name="trash-outline" size={15} color={colors.danger} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {/* Role Subtitle */}
                      <Text style={[styles.crewRoleSubtitle, { color: isDark ? '#A1A1AA' : colors.textSecondary }]}>
                        {asg.isPrimary
                          ? asg.role === 'PHOTOGRAPHER' ? 'Lead Photographer' : 'Lead Cinematographer'
                          : asg.role === 'PHOTOGRAPHER' ? 'Candid Photographer' : 'Second Cinematographer'}
                      </Text>

                      {/* Action Discs Row: Dedicated Call Button + WhatsApp */}
                      <View style={styles.actionDiscsRow}>
                        {/* 1. Dedicated One-Tap CALL BUTTON for All Crew */}
                        <TouchableOpacity
                          style={styles.callDiscBtn}
                          onPress={() => handleCall(memberPhone, asg.agentName)}
                          activeOpacity={0.75}
                          accessibilityLabel={`Call ${asg.agentName}`}
                        >
                          <Ionicons name="call" size={13} color="#FFFFFF" />
                          <Text style={styles.callDiscLabel}>Call</Text>
                        </TouchableOpacity>

                        {/* 2. WhatsApp Button */}
                        <TouchableOpacity
                          style={[
                            styles.socialDiscBtn,
                            {
                              backgroundColor: isDark ? 'rgba(37, 211, 102, 0.16)' : '#E8F5E9',
                              borderColor: 'rgba(37, 211, 102, 0.32)',
                            },
                          ]}
                          onPress={() => handleWhatsApp(memberPhone, asg.agentName)}
                          activeOpacity={0.75}
                          accessibilityLabel={`WhatsApp ${asg.agentName}`}
                        >
                          <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Modal: Select Eligible Crew */}
        <Modal
          visible={assignModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setAssignModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1F1A24' : colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[typography.title2, { color: colors.textPrimary }]}>Assign Crew Member</Text>
                  <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
                    Select slot role and choose from eligible active crew
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Role Toggle */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
                <Button
                  title="Photographer Slot"
                  onPress={() => setSelectedRole('PHOTOGRAPHER')}
                  size="sm"
                  variant={selectedRole === 'PHOTOGRAPHER' ? 'primary' : 'outline'}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Videographer Slot"
                  onPress={() => setSelectedRole('VIDEOGRAPHER')}
                  size="sm"
                  variant={selectedRole === 'VIDEOGRAPHER' ? 'primary' : 'outline'}
                  style={{ flex: 1 }}
                />
              </View>

              <ScrollView style={{ maxHeight: 360 }}>
                {eligibleCrew.length === 0 ? (
                  <StateView type="empty" message="No active crew members found with this qualification." />
                ) : (
                  eligibleCrew.map(m => (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => handleSelectCrew(m)}
                      style={[
                        styles.crewPickerItem,
                        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surfaceSubtle, borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.border, borderRadius: radii.md, marginBottom: spacing.xs },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.headline, { color: colors.textPrimary }]}>{m.name}</Text>
                        <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                          Qualified: {m.profession} · {m.openAssignmentsCount} active shoots
                        </Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal: View & Award Agent Achievements */}
        {selectedMemberForAchievements && (
          <AchievementsModal
            visible={achievementsModalVisible}
            onClose={() => setAchievementsModalVisible(false)}
            memberId={selectedMemberForAchievements.id}
            memberName={selectedMemberForAchievements.name}
            memberAvatar={selectedMemberForAchievements.avatar}
            memberRole={selectedMemberForAchievements.role}
          />
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderBadge: {
    backgroundColor: 'rgba(255, 85, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 85, 0, 0.3)',
  },
  orderBadgeText: {
    color: '#FF5500',
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  reqBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 8,
    marginTop: 2,
  },
  reqBarText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  crewCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  crewCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrapper: {
    alignItems: 'center',
    width: 48,
    position: 'relative',
  },
  dpAchievementPin: {
    position: 'absolute',
    top: -4,
    right: -4,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 4,
  },
  achievementHonorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  achievementHonorChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    maxWidth: 130,
  },
  avatarCircleRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#1E1E24',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  primaryPillMini: {
    marginTop: -6,
    backgroundColor: '#FF5500',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  primaryPillMiniText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  crewInfoBlock: {
    flex: 1,
  },
  crewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  crewName: {
    fontSize: 14.5,
    fontWeight: '700',
    flex: 1,
  },
  roleTag: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientCallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  clientSocialBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  crewRoleSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 1,
  },
  crewDivider: {
    height: 1,
    marginVertical: 7,
  },
  crewBriefText: {
    fontSize: 12,
    lineHeight: 17,
  },
  actionDiscsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  callDiscBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    gap: 5,
    shadowColor: '#22C55E',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  callDiscLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  socialDiscBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  operationalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  receiptStatusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  phoneNote: {
    fontSize: 11,
    marginTop: 2,
  },
  toggleReceiptBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  toggleReceiptBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 8,
  },
  payLabel: {
    fontSize: 10.5,
  },
  payValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 1,
  },
  removeBtn: {
    paddingVertical: 4,
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  crewPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
  },
});
