import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { StatusBadge } from '@/components/common/status-badge';
import { formatCurrency } from '@/components/common/money-view';
import { Button } from '@/components/common/button';
import { StateView } from '@/components/common/state-view';
import { CrewRole } from '@/types/events';

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

          <View style={[styles.metaRow, { marginTop: spacing.md }]}>
            <Ionicons name="time-outline" size={16} color="#FF5500" />
            <Text style={[typography.subhead, { color: colors.textPrimary, marginLeft: 6 }]}>
              {new Date(event.startTime).toLocaleString('en-IN', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </Text>
          </View>

          <View style={[styles.metaRow, { marginTop: 6 }]}>
            <Ionicons name="location-outline" size={16} color="#FF5500" />
            <Text style={[typography.subhead, { color: colors.textPrimary, marginLeft: 6, flex: 1 }]}>
              {event.venueName} · {event.venueAddress}
            </Text>
          </View>

          {/* Quick Phone & Maps Triggers */}
          <View style={[styles.actionRow, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.borderSubtle, marginTop: spacing.md, paddingTop: spacing.sm }]}>
            {event.contactPhone && (
              <Button
                title={`Call (${event.contactName || 'Venue'})`}
                onPress={() => Linking.openURL(`tel:${event.contactPhone}`)}
                size="sm"
                variant="outline"
                icon={<Ionicons name="call-outline" size={14} color={colors.primary} />}
              />
            )}
            {event.venueMapUrl && (
              <Button
                title="Google Maps"
                onPress={() => Linking.openURL(event.venueMapUrl!)}
                size="sm"
                variant="outline"
                style={{ marginLeft: 8 }}
                icon={<Ionicons name="map-outline" size={14} color={colors.primary} />}
              />
            )}
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
                    {/* Left Column: Circular Portrait Avatar with Lead Glow Ring */}
                    <View style={styles.avatarWrapper}>
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
                      {asg.isPrimary && (
                        <View style={styles.primaryPillMini}>
                          <Text style={styles.primaryPillMiniText}>LEAD</Text>
                        </View>
                      )}
                    </View>

                    {/* Right Column: Name, Role, Divider, Responsibility Brief, Action Discs */}
                    <View style={styles.crewInfoBlock}>
                      {/* Name & Role Tag Row */}
                      <View style={styles.crewNameRow}>
                        <Text style={[styles.crewName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {asg.agentName}
                        </Text>
                        <View
                          style={[
                            styles.roleTag,
                            {
                              backgroundColor: asg.role === 'PHOTOGRAPHER' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                              borderColor: asg.role === 'PHOTOGRAPHER' ? 'rgba(59, 130, 246, 0.35)' : 'rgba(168, 85, 247, 0.35)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleTagText,
                              { color: asg.role === 'PHOTOGRAPHER' ? '#60A5FA' : '#C084FC' },
                            ]}
                          >
                            {asg.role}
                          </Text>
                        </View>
                      </View>

                      {/* Role Subtitle */}
                      <Text style={[styles.crewRoleSubtitle, { color: isDark ? '#A1A1AA' : colors.textSecondary }]}>
                        {asg.isPrimary
                          ? asg.role === 'PHOTOGRAPHER' ? 'Lead Photographer' : 'Lead Cinematographer'
                          : asg.role === 'PHOTOGRAPHER' ? 'Candid Photographer' : 'Second Cinematographer'}
                      </Text>

                      {/* Subtle Horizontal Divider Line */}
                      <View style={[styles.crewDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.borderSubtle }]} />

                      {/* Shoot Brief / Responsibility Text */}
                      <Text style={[styles.crewBriefText, { color: isDark ? '#D4D4D8' : colors.textSecondary }]}>
                        {getCrewBrief(asg.agentName, asg.role, asg.isPrimary)}
                      </Text>

                      {/* Action Discs Row: Dedicated Call Button + WhatsApp + SMS + Status */}
                      <View style={styles.actionDiscsRow}>
                        {/* 1. Dedicated One-Tap CALL BUTTON for All Crew */}
                        <TouchableOpacity
                          style={styles.callDiscBtn}
                          onPress={() => handleCall(memberPhone, asg.agentName)}
                          activeOpacity={0.75}
                          accessibilityLabel={`Call ${asg.agentName}`}
                        >
                          <Ionicons name="call" size={15} color="#FFFFFF" />
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
                          <Ionicons name="logo-whatsapp" size={17} color="#25D366" />
                        </TouchableOpacity>

                        {/* 3. SMS Message Button */}
                        <TouchableOpacity
                          style={[
                            styles.socialDiscBtn,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.surfaceSubtle,
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.border,
                            },
                          ]}
                          onPress={() => handleSms(memberPhone, asg.agentName)}
                          activeOpacity={0.75}
                          accessibilityLabel={`Message ${asg.agentName}`}
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={16} color={isDark ? '#E4E4E7' : colors.textPrimary} />
                        </TouchableOpacity>

                        {/* 4. Material Receipt Status Disc */}
                        <TouchableOpacity
                          style={[
                            styles.socialDiscBtn,
                            {
                              backgroundColor: asg.materialReceived ? 'rgba(16, 185, 129, 0.16)' : 'rgba(245, 158, 11, 0.16)',
                              borderColor: asg.materialReceived ? 'rgba(16, 185, 129, 0.32)' : 'rgba(245, 158, 11, 0.32)',
                            },
                          ]}
                          onPress={() => {
                            if (canAssignCrew) {
                              handleToggleReceipt(asg.id, asg.materialReceived);
                            } else {
                              Alert.alert(
                                'Material Status',
                                asg.materialReceived
                                  ? 'All photo/video raw dumps have been verified and received by the studio.'
                                  : 'Awaiting raw dumps and media submission to the studio workstation.'
                              );
                            }
                          }}
                          activeOpacity={0.75}
                        >
                          <Ionicons
                            name={asg.materialReceived ? 'checkmark-done' : 'hourglass-outline'}
                            size={16}
                            color={asg.materialReceived ? '#10B981' : '#F59E0B'}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Operational Status & Material Receipt Row */}
                      <View
                        style={[
                          styles.operationalBar,
                          {
                            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.28)' : colors.surfaceSubtle,
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.borderSubtle,
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.receiptStatusText, { color: asg.materialReceived ? '#10B981' : '#F59E0B' }]}>
                            {asg.materialReceived ? '✓ Material Received by Studio' : '⏳ Awaiting Studio Receipt'}
                          </Text>
                          <Text style={[styles.phoneNote, { color: isDark ? '#A1A1AA' : colors.textMuted }]}>
                            {memberPhone} · {asg.submissionCount !== undefined ? `${asg.submissionCount} submitted` : 'Pending dumps'}
                          </Text>
                        </View>

                        {canAssignCrew && (
                          <TouchableOpacity
                            onPress={() => handleToggleReceipt(asg.id, asg.materialReceived)}
                            style={[styles.toggleReceiptBtn, { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : colors.border }]}
                          >
                            <Text style={[styles.toggleReceiptBtnText, { color: colors.primary }]}>
                              {asg.materialReceived ? 'Undo' : 'Mark Recv'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Pay & Manager Actions */}
                      <View style={[styles.priceRow, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.borderSubtle }]}>
                        {((canSeeCost || asg.agentId === session?.id) && asg.assignmentPay) ? (
                          <View>
                            <Text style={[styles.payLabel, { color: isDark ? '#71717A' : colors.textMuted }]}>
                              {asg.agentId === session?.id ? 'My Agreed Shoot Pay:' : 'Authorized Pay:'}
                            </Text>
                            <Text style={[styles.payValue, { color: colors.textPrimary }]}>
                              {formatCurrency(asg.assignmentPay)}
                            </Text>
                          </View>
                        ) : <View />}

                        {canAssignCrew && (
                          <TouchableOpacity onPress={() => handleRemoveAssignment(asg.id, asg.agentName)} style={styles.removeBtn}>
                            <Text style={[styles.removeBtnText, { color: colors.danger }]}>
                              Remove Assignment
                            </Text>
                          </TouchableOpacity>
                        )}
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  reqBarText: {
    fontSize: 12,
    fontWeight: '500',
  },
  crewCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  crewCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarWrapper: {
    alignItems: 'center',
    width: 64,
  },
  avatarCircleRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#1E1E24',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  primaryPillMini: {
    marginTop: -8,
    backgroundColor: '#FF5500',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  primaryPillMiniText: {
    fontSize: 9,
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
    fontSize: 16.5,
    fontWeight: '700',
    flex: 1,
  },
  roleTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  crewRoleSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
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
    gap: 8,
    marginTop: 10,
  },
  callDiscBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5500',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    gap: 6,
    shadowColor: '#FF5500',
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  callDiscLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  socialDiscBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
