import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { AgentAchievement, ACHIEVEMENT_CATALOG, AchievementTemplate } from '@/types/achievements';
import { AchievementBadge } from './achievement-badge';

interface AchievementsModalProps {
  visible: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  memberRole?: string;
}

export function AchievementsModal({
  visible,
  onClose,
  memberId,
  memberName,
  memberAvatar,
  memberRole = 'Agent / Crew',
}: AchievementsModalProps) {
  const { session } = useAuth();
  const { team, awardAchievement, revokeAchievement } = useDemoStore();
  const { colors, isDark, radii, typography, spacing } = useTheme();

  const [selectedAchievement, setSelectedAchievement] = useState<AgentAchievement | null>(null);

  // Find latest member record to read dynamic achievements
  const member = team.find(m => m.id === memberId || m.name === memberName);
  const achievements: AgentAchievement[] = member?.achievements || [];

  const isAdmin = session?.roles.includes('ADMIN') || session?.roles.includes('OWNER');

  // Filter catalog for badges this member does NOT have yet
  const availableToAward = ACHIEVEMENT_CATALOG.filter(
    cat => !achievements.some(a => a.code === cat.code)
  );

  const handleAward = (template: AchievementTemplate) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newAchievement: AgentAchievement = {
      id: `ach-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: template.code,
      title: template.title,
      subtitle: template.subtitle,
      description: template.description,
      category: template.category,
      shape: template.shape,
      iconName: template.iconName,
      badgeText: template.badgeText,
      gradient: template.gradient,
      accentColor: template.accentColor,
      ribbonColor: template.ribbonColor,
      awardedAt: new Date().toISOString(),
      awardedBy: `${session?.name || 'Aarav Mehta'} (Admin)`,
    };

    if (awardAchievement && member?.id) {
      awardAchievement(member.id, newAchievement);
      Alert.alert('Honors Conferred!', `"${template.title}" has been officially awarded to ${memberName}.`);
    }
  };

  const handleRevoke = (achievementId: string, title: string) => {
    Alert.alert('Revoke Badge', `Remove "${title}" from ${memberName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: () => {
          if (revokeAchievement && member?.id) {
            revokeAchievement(member.id, achievementId);
            setSelectedAchievement(null);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? '#18141D' : colors.surface,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.border,
            },
          ]}
        >
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Studio Honors</Text>
              <Text style={[styles.headerSubtitle, { color: isDark ? '#A1A1AA' : colors.textSecondary }]}>
                {achievements.length} Verified Achievement{achievements.length === 1 ? '' : 's'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* Member Profile Capsule */}
            <View
              style={[
                styles.memberCapsule,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surfaceSubtle,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
                },
              ]}
            >
              <View style={styles.avatarHolder}>
                <Image
                  source={{
                    uri:
                      memberAvatar ||
                      member?.avatarUrl ||
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces',
                  }}
                  style={styles.avatarImg}
                />
                {achievements.length > 0 && (
                  <View style={styles.topBadgePin}>
                    <AchievementBadge achievement={achievements[0]} size="mini" />
                  </View>
                )}
              </View>

              <View style={styles.memberInfoCol}>
                <Text style={[styles.memberNameText, { color: colors.textPrimary }]}>{memberName}</Text>
                <Text style={[styles.memberRoleText, { color: isDark ? '#9CA3AF' : colors.textSecondary }]}>
                  {memberRole} · {member?.profession || 'Qualified Staff'}
                </Text>
                <View style={styles.verifiedRow}>
                  <Ionicons name="shield-checkmark" size={13} color="#10B981" />
                  <Text style={styles.verifiedLabel}>Studio Verified Professional</Text>
                </View>
              </View>
            </View>

            {/* Earned Badges Showcase */}
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Earned Badges</Text>

            {achievements.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border }]}>
                <Ionicons name="ribbon-outline" size={32} color={isDark ? '#6B7280' : '#9CA3AF'} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Badges Awarded Yet</Text>
                <Text style={[styles.emptySub, { color: isDark ? '#9CA3AF' : colors.textSecondary }]}>
                  {isAdmin
                    ? 'Use the Admin Console below to award this agent their first studio achievement!'
                    : 'The studio admin has not conferred honors to this profile yet.'}
                </Text>
              </View>
            ) : (
              <View style={styles.badgeGrid}>
                {achievements.map(ach => {
                  const isSelected = selectedAchievement?.id === ach.id;
                  return (
                    <TouchableOpacity
                      key={ach.id}
                      style={[
                        styles.badgeCard,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                          borderColor: isSelected
                            ? '#FF5500'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedAchievement(isSelected ? null : ach)}
                      activeOpacity={0.8}
                    >
                      <AchievementBadge achievement={ach} size="md" />
                      <Text style={[styles.badgeTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {ach.title}
                      </Text>
                      <Text style={[styles.badgeSubtitle, { color: isDark ? '#9CA3AF' : colors.textSecondary }]} numberOfLines={1}>
                        {ach.subtitle}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Selected Badge Detail Box */}
            {selectedAchievement && (
              <View
                style={[
                  styles.detailBox,
                  {
                    backgroundColor: isDark ? 'rgba(255, 85, 0, 0.08)' : '#FFF7ED',
                    borderColor: 'rgba(255, 85, 0, 0.3)',
                  },
                ]}
              >
                <View style={styles.detailHeader}>
                  <AchievementBadge achievement={selectedAchievement} size="sm" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>
                      {selectedAchievement.title}
                    </Text>
                    <Text style={styles.detailDate}>
                      Conferred: {new Date(selectedAchievement.awardedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} · {selectedAchievement.awardedBy}
                    </Text>
                  </View>
                  {isAdmin && (
                    <TouchableOpacity
                      onPress={() => handleRevoke(selectedAchievement.id, selectedAchievement.title)}
                      style={styles.revokeBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={[styles.detailDesc, { color: isDark ? '#E4E4E7' : '#374151' }]}>
                  {selectedAchievement.description}
                </Text>
              </View>
            )}

            {/* Admin Console: Award Available Badges */}
            {isAdmin && availableToAward.length > 0 && (
              <View style={styles.adminConsoleContainer}>
                <View style={styles.adminConsoleHeader}>
                  <View style={styles.adminBadgeTag}>
                    <Ionicons name="key-outline" size={12} color="#FF5500" />
                    <Text style={styles.adminBadgeTagText}>ADMIN CONSOLE</Text>
                  </View>
                  <Text style={[styles.adminTitle, { color: colors.textPrimary }]}>Award New Honors</Text>
                  <Text style={[styles.adminSubtitle, { color: isDark ? '#A1A1AA' : colors.textSecondary }]}>
                    Tap any badge below to immediately confer it to {memberName}:
                  </Text>
                </View>

                <View style={styles.catalogGrid}>
                  {availableToAward.map(tpl => (
                    <TouchableOpacity
                      key={tpl.code}
                      style={[
                        styles.catalogItem,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.surfaceSubtle,
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
                        },
                      ]}
                      onPress={() => handleAward(tpl)}
                      activeOpacity={0.7}
                    >
                      <AchievementBadge achievement={tpl} size="sm" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.catalogItemTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                          {tpl.title}
                        </Text>
                        <Text style={[styles.catalogItemSub, { color: isDark ? '#9CA3AF' : colors.textSecondary }]} numberOfLines={2}>
                          {tpl.description}
                        </Text>
                      </View>
                      <View style={styles.plusPill}>
                        <Ionicons name="add" size={16} color="#FF5500" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
  },
  scrollArea: {
    paddingHorizontal: 20,
  },
  memberCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  avatarHolder: {
    position: 'relative',
    width: 58,
    height: 58,
  },
  avatarImg: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  topBadgePin: {
    position: 'absolute',
    top: -4,
    right: -4,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  memberInfoCol: {
    flex: 1,
    marginLeft: 14,
  },
  memberNameText: {
    fontSize: 17,
    fontWeight: '700',
  },
  memberRoleText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedLabel: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  emptyBox: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  badgeCard: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgeTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  badgeSubtitle: {
    fontSize: 9.5,
    marginTop: 2,
    textAlign: 'center',
  },
  detailBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  detailDate: {
    fontSize: 11,
    color: '#FF5500',
    fontWeight: '600',
    marginTop: 2,
  },
  revokeBtn: {
    padding: 6,
  },
  detailDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 8,
  },
  adminConsoleContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
  },
  adminConsoleHeader: {
    marginBottom: 12,
  },
  adminBadgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 85, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginBottom: 6,
  },
  adminBadgeTagText: {
    color: '#FF5500',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  adminSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  catalogGrid: {
    gap: 8,
  },
  catalogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  catalogItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  catalogItemSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  plusPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 85, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
});
