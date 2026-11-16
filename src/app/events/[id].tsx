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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { StatusBadge } from '@/components/common/status-badge';
import { MoneyView, formatCurrency } from '@/components/common/money-view';
import { Button } from '@/components/common/button';
import { StateView } from '@/components/common/state-view';
import { CrewRole } from '@/types/events';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, permissions } = useAuth();
  const { events, team, assignCrew, removeCrew, updateMaterialReceipt } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

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
    const defaultPay =
      selectedRole === 'PHOTOGRAPHER' ? 8000 : 9000;
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

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Header Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg },
          ]}
        >
          <View style={styles.topRow}>
            <Text style={[typography.caption2, { color: colors.textMuted }]}>{event.tenantOrderNumber}</Text>
            <StatusBadge label={event.status} size="sm" />
          </View>

          <Text style={[typography.title1, { color: colors.textPrimary, marginTop: 4 }]}>
            {event.eventTypeName}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {event.orderTitle} · Side: {event.side}
          </Text>

          <View style={[styles.metaRow, { marginTop: spacing.md }]}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={[typography.subhead, { color: colors.textPrimary, marginLeft: 6 }]}>
              {new Date(event.startTime).toLocaleString('en-IN', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </Text>
          </View>

          <View style={[styles.metaRow, { marginTop: 6 }]}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={[typography.subhead, { color: colors.textPrimary, marginLeft: 6, flex: 1 }]}>
              {event.venueName} · {event.venueAddress}
            </Text>
          </View>

          {/* Quick Phone & Maps Triggers */}
          <View style={[styles.actionRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.md, paddingTop: spacing.sm }]}>
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

        {/* Crew Staffing Section (EVT-03, EVT-04, EVT-05) */}
        <View style={{ marginTop: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.title2, { color: colors.textPrimary }]}>Crew Assignments</Text>
            {canAssignCrew && (
              <Button
                title="+ Assign Crew"
                onPress={() => setAssignModalVisible(true)}
                size="sm"
                variant="primary"
              />
            )}
          </View>

          <Text style={[typography.footnote, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
            Requirement: {event.photographersNeeded} Photographer(s) · {event.videographersNeeded} Videographer(s)
          </Text>

          {event.assignments.length === 0 ? (
            <StateView
              type="empty"
              title="No Crew Assigned"
              message="Tap '+ Assign Crew' above to select eligible active staff for this shoot."
            />
          ) : (
            event.assignments.map(asg => (
              <View
                key={asg.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginBottom: spacing.sm },
                ]}
              >
                <View style={styles.topRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[typography.headline, { color: colors.textPrimary }]}>{asg.agentName}</Text>
                    {asg.isPrimary && (
                      <View style={[styles.primaryBadge, { backgroundColor: colors.goldSubtle, borderColor: colors.gold }]}>
                        <Text style={[typography.caption2, { color: colors.gold, fontWeight: '700' }]}>PRIMARY</Text>
                      </View>
                    )}
                  </View>
                  <StatusBadge label={asg.role} variant="info" size="sm" />
                </View>

                {asg.agentPhone && (
                  <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
                    Phone: {asg.agentPhone}
                  </Text>
                )}

                {/* Submissions & Material Receipt Status (EVT-05) */}
                <View style={[styles.receiptRow, { backgroundColor: colors.surfaceSubtle, borderRadius: radii.sm, marginTop: spacing.sm }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                      Photo/Video Counts: {asg.submissionCount !== undefined ? `${asg.submissionCount} submitted` : 'Pending'}
                    </Text>
                    <Text style={[typography.caption2, { color: asg.materialReceived ? colors.success : colors.warningText, fontWeight: '600', marginTop: 2 }]}>
                      {asg.materialReceived ? '✓ Material Received by Studio' : '⏳ Awaiting Studio Receipt'}
                    </Text>
                  </View>

                  {canAssignCrew && (
                    <TouchableOpacity
                      onPress={() => handleToggleReceipt(asg.id, asg.materialReceived)}
                      style={[styles.toggleReceiptBtn, { borderColor: colors.border }]}
                    >
                      <Text style={[typography.caption2, { color: colors.primary, fontWeight: '600' }]}>
                        {asg.materialReceived ? 'Mark Unreceived' : 'Confirm Received'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Assignment Pay & Remove Action */}
                <View style={[styles.priceRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.xs }]}>
                  {((canSeeCost || asg.agentId === session?.id) && asg.assignmentPay) ? (
                    <View>
                      <Text style={[typography.caption2, { color: colors.textMuted }]}>
                        {asg.agentId === session?.id ? 'My Agreed Shoot Pay:' : 'Authorized Pay:'}
                      </Text>
                      <Text style={[typography.headline, { color: colors.textPrimary }]}>
                        {formatCurrency(asg.assignmentPay)}
                      </Text>
                    </View>
                  ) : <View />}

                  {canAssignCrew && (
                    <TouchableOpacity onPress={() => handleRemoveAssignment(asg.id, asg.agentName)}>
                      <Text style={[typography.footnote, { color: colors.danger, fontWeight: '600' }]}>
                        Remove Assignment
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
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
            <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }]}>
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
                        { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, borderRadius: radii.md, marginBottom: spacing.xs },
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
    marginBottom: 4,
  },
  primaryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderRadius: 4,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  toggleReceiptBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 4,
  },
  priceRow: {
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
