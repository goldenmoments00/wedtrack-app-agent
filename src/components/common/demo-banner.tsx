import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { DEMO_PERSONAS } from '@/fixtures/personas';
import { WorkspaceMode } from '@/types/auth';

export function DemoBanner() {
  const {
    mode,
    session,
    currentPersona,
    switchDemoPersona,
    switchWorkspace,
    setMode,
  } = useAuth();
  const { colors, typography, spacing, radii } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  if (mode !== 'demo' || !session) {
    return null;
  }

  const handleSelectPersona = (id: string) => {
    switchDemoPersona(id);
    setModalVisible(false);
  };

  return (
    <>
      <View
        style={[
          styles.banner,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.contentRow}>
          <View style={styles.leftCol}>
            <View style={styles.tagRow}>
              <View style={[styles.demoPill, { backgroundColor: colors.goldSubtle, borderColor: colors.gold }]}>
                <Text style={[typography.caption2, { color: colors.gold, fontWeight: '700' }]}>
                  DEMO MODE
                </Text>
              </View>
              <Text
                style={[typography.caption1, { color: colors.textSecondary, marginLeft: spacing.xs }]}
                numberOfLines={1}
              >
                {session.studio.name}
              </Text>
            </View>

            <Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>
              {currentPersona?.label || session.name}
            </Text>
          </View>

          <Pressable
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => [
              styles.switchBtn,
              {
                backgroundColor: pressed ? colors.border : colors.surfaceSubtle,
                borderColor: colors.border,
                borderRadius: radii.sm,
              },
            ]}
          >
            <Text style={[typography.caption1, { color: colors.primary, fontWeight: '600' }]}>
              Switch Role
            </Text>
          </Pressable>
        </View>

        {/* Workspace Switcher if dual role */}
        {session.hasDualCapability && session.availableWorkspaces.length > 1 && (
          <View style={[styles.workspaceRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.xs, paddingTop: spacing.xs }]}>
            <Text style={[typography.caption2, { color: colors.textMuted, marginRight: spacing.sm }]}>
              ACTIVE WORKSPACE:
            </Text>
            {session.availableWorkspaces.map(ws => {
              const isActive = session.activeWorkspace === ws;
              return (
                <TouchableOpacity
                  key={ws}
                  onPress={() => switchWorkspace(ws)}
                  style={[
                    styles.wsPill,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surfaceSubtle,
                      borderColor: isActive ? colors.primary : colors.border,
                      borderRadius: radii.xs,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption2,
                      { color: isActive ? colors.primaryText : colors.textSecondary, fontWeight: '600' },
                    ]}
                  >
                    {ws === 'OPERATIONS' ? 'Operations' : ws === 'EDITING' ? 'Editing Work' : 'My Shoots'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Modal Persona Selector */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[typography.title2, { color: colors.textPrimary }]}>
                  Select Staff Persona
                </Text>
                <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
                  Test complete RBAC and access boundaries in stateful demo mode
                </Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Text style={[typography.body, { color: colors.textSecondary }]}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.personaList} contentContainerStyle={{ paddingBottom: 32 }}>
              {DEMO_PERSONAS.map(p => {
                const isSelected = p.id === currentPersona?.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => handleSelectPersona(p.id)}
                    style={({ pressed }) => [
                      styles.personaCard,
                      {
                        backgroundColor: isSelected
                          ? colors.surfaceSubtle
                          : pressed
                          ? colors.borderSubtle
                          : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderRadius: radii.md,
                        marginBottom: spacing.sm,
                      },
                    ]}
                  >
                    <View style={styles.personaCardHeader}>
                      <Text
                        style={[
                          typography.headline,
                          { color: isSelected ? colors.primary : colors.textPrimary },
                        ]}
                      >
                        {p.label}
                      </Text>
                      {isSelected && (
                        <View style={[styles.activeIndicator, { backgroundColor: colors.success }]}>
                          <Text style={[typography.caption2, { color: '#FFF', fontWeight: '700' }]}>
                            ACTIVE
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        typography.footnote,
                        { color: colors.textSecondary, marginTop: 4 },
                      ]}
                    >
                      {p.description}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1,
    marginRight: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  demoPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderRadius: 4,
  },
  switchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  workspaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  wsPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    marginRight: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  closeBtn: {
    padding: 6,
  },
  personaList: {
    flexGrow: 0,
  },
  personaCard: {
    padding: 14,
    borderWidth: 1,
  },
  personaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
