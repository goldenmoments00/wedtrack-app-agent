import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { StatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/common/button';
import { StateView } from '@/components/common/state-view';
import { UserRole, Profession, EditingCategory } from '@/types/auth';

export default function TeamDirectoryScreen() {
  const { session } = useAuth();
  const { team, createTeamMember } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  const [activeFilter, setActiveFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [primaryRole, setPrimaryRole] = useState<'AGENT' | 'EDITOR' | 'MANAGER'>('AGENT');
  const [profession, setProfession] = useState<Profession>('BOTH');

  const isOwnerOrAdmin = session?.roles.includes('OWNER') || session?.roles.includes('ADMIN');

  if (!isOwnerOrAdmin) {
    return (
      <ScreenWrapper>
        <StateView
          type="permission-denied"
          title="Team Management Restricted"
          message="Managing studio team members and permissions is restricted to studio administrators."
          actionTitle="Back"
          onAction={() => router.back()}
        />
      </ScreenWrapper>
    );
  }

  const filteredMembers = team.filter(m => {
    if (activeFilter === 'ACTIVE') return m.isActive;
    if (activeFilter === 'INACTIVE') return !m.isActive;
    return true;
  });

  const handleCreateMember = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Required Fields', 'Please enter staff name and email address.');
      return;
    }

    createTeamMember({
      name,
      email,
      phone,
      primaryRole,
      profession: primaryRole === 'AGENT' ? profession : undefined,
      editingCategories: primaryRole === 'EDITOR' ? ['ALBUM', 'PHOTO_EDIT'] : undefined,
    });

    setModalVisible(false);
    setName('');
    setEmail('');
    setPhone('');
    Alert.alert('Member Added', `${name} has been added to the studio roster.`);
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[typography.title1, { color: colors.textPrimary }]}>Team Directory</Text>
            <Text style={[typography.footnote, { color: colors.textSecondary }]}>
              {team.length} crew agents, editors and managers
            </Text>
          </View>
          <Button
            title="+ Add Member"
            onPress={() => setModalVisible(true)}
            size="sm"
            variant="primary"
          />
        </View>

        {/* Filter Pills */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md, marginBottom: spacing.sm }}>
          {(['ACTIVE', 'INACTIVE', 'ALL'] as const).map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: activeFilter === f ? colors.primary : colors.surface,
                  borderColor: activeFilter === f ? colors.primary : colors.border,
                  borderRadius: radii.full,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption1,
                  { color: activeFilter === f ? colors.primaryText : colors.textSecondary, fontWeight: '600' },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Member Cards */}
        {filteredMembers.map(member => (
          <TouchableOpacity
            key={member.id}
            onPress={() => router.push(`/team/${member.id}` as any)}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginBottom: spacing.sm },
            ]}
          >
            <View style={styles.headerRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[typography.headline, { color: colors.textPrimary }]}>{member.name}</Text>
                  {!member.isActive && <StatusBadge label="INACTIVE" variant="danger" size="sm" />}
                  {member.hasDualCapability && (
                    <View style={[styles.dualBadge, { backgroundColor: colors.goldSubtle, borderColor: colors.gold }]}>
                      <Text style={[typography.caption2, { color: colors.gold, fontWeight: '700' }]}>DUAL ROLE</Text>
                    </View>
                  )}
                </View>
                <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                  {member.email} · {member.phone || 'No phone'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>

            <View style={[styles.bottomRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.xs }]}>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                Roles: {member.roles.join(', ')}
                {member.profession ? ` (${member.profession})` : ''}
              </Text>
              <Text style={[typography.caption2, { color: colors.textMuted }]}>
                {member.openAssignmentsCount} shoots · {member.openTasksCount} tasks
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Modal: Add Team Member (TEAM-02) */}
        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }]}>
              <View style={styles.headerRow}>
                <Text style={[typography.title2, { color: colors.textPrimary }]}>Add Team Member</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ marginTop: spacing.md, maxHeight: 420 }}>
                <Text style={[typography.subhead, { color: colors.textSecondary }]}>Full Name *</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Sahil Kapoor"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
                />

                <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>Email Address *</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="sahil@aurastudios.in"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
                />

                <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>Phone Number</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 98200 12345"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
                />

                <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>Primary Roster Role</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 8 }}>
                  {(['AGENT', 'EDITOR', 'MANAGER'] as const).map(r => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setPrimaryRole(r)}
                      style={[
                        styles.rolePill,
                        {
                          backgroundColor: primaryRole === r ? colors.primary : colors.surfaceSubtle,
                          borderColor: colors.border,
                          borderRadius: radii.sm,
                          flex: 1,
                        },
                      ]}
                    >
                      <Text style={[typography.caption2, { color: primaryRole === r ? colors.primaryText : colors.textPrimary, textAlign: 'center' }]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {primaryRole === 'AGENT' && (
                  <>
                    <Text style={[typography.subhead, { color: colors.textSecondary }]}>Shooting Profession</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                      {(['PHOTOGRAPHER', 'VIDEOGRAPHER', 'BOTH'] as Profession[]).map(p => (
                        <TouchableOpacity
                          key={p}
                          onPress={() => setProfession(p)}
                          style={[
                            styles.rolePill,
                            {
                              backgroundColor: profession === p ? colors.primary : colors.surfaceSubtle,
                              borderColor: colors.border,
                              borderRadius: radii.sm,
                              flex: 1,
                            },
                          ]}
                        >
                          <Text style={[typography.caption2, { color: profession === p ? colors.primaryText : colors.textPrimary, textAlign: 'center' }]}>
                            {p}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <Button
                  title="Create Staff Account"
                  onPress={handleCreateMember}
                  size="lg"
                  variant="primary"
                  style={{ marginTop: spacing.lg }}
                />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  dualBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
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
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 15,
    marginTop: 4,
  },
  rolePill: {
    paddingVertical: 8,
    borderWidth: 1,
  },
});
