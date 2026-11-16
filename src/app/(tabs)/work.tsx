import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { DemoBanner } from '@/components/common/demo-banner';
import { StatusBadge, mapReviewStatusToVariant } from '@/components/common/status-badge';
import { MoneyView } from '@/components/common/money-view';
import { Button } from '@/components/common/button';
import { StateView } from '@/components/common/state-view';

export default function TabWorkScreen() {
  const { session, permissions } = useAuth();
  const { editingTasks, events, team } = useDemoStore();
  const { colors, typography, spacing, radii, isDark } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    gear1: true,
    gear2: true,
    gear3: false,
    gear4: true,
    gear5: false,
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const workspace = session?.activeWorkspace || 'OPERATIONS';

  // ----------------------------------------------------
  // AGENT WORKSPACE: CALL SHEETS & BRIEFINGS INBOX
  // ----------------------------------------------------
  if (workspace === 'SHOOTS') {
    const agentId = session?.id || 'usr-agt-01';
    const myEvents = events.filter(e => e.assignments.some(a => a.agentId === agentId));
    const upcomingShoots = myEvents.filter(e => e.status !== 'COMPLETED' && e.status !== 'CANCELLED');

    const toggleGear = (key: string) => {
      setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <DemoBanner />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[typography.title1, { color: colors.textPrimary }]}>
            Call Sheets & Briefings
          </Text>
          <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
            Production schedules, shot lists, and equipment checklists
          </Text>

          {/* Equipment Pre-Flight Checklist */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, marginTop: spacing.md },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Ionicons name="checkbox-outline" size={18} color="#EA580C" />
              <Text style={[typography.headline, { color: colors.textPrimary }]}>
                Pre-Shoot Gear Checklist
              </Text>
            </View>

            {[
              { id: 'gear1', label: 'Primary camera body (Sony A7 IV / FX3) + backup' },
              { id: 'gear2', label: '24-70mm f/2.8 & 70-200mm f/2.8 lenses cleaned' },
              { id: 'gear3', label: '4x Fully charged NP-FZ100 batteries + charger' },
              { id: 'gear4', label: '3x Formatted V90 SD / CFexpress Type A cards' },
              { id: 'gear5', label: 'Wireless lavalier microphone kit & spare audio AA batteries' },
            ].map(item => {
              const checked = !!checklist[item.id];
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checklistRow}
                  onPress={() => toggleGear(item.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={checked ? '#EA580C' : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.checklistLabel,
                      {
                        color: checked ? colors.textPrimary : colors.textSecondary,
                        textDecorationLine: checked ? 'none' : 'none',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Upcoming Call Sheets */}
          <Text style={[typography.title2, { color: colors.textPrimary, marginTop: spacing.lg }]}>
            Active Call Sheets ({upcomingShoots.length})
          </Text>

          {upcomingShoots.length === 0 ? (
            <StateView
              type="empty"
              title="No Call Sheets"
              message="You have no upcoming shoots scheduled right now."
            />
          ) : (
            upcomingShoots.map(evt => {
              const myAsg = evt.assignments.find(a => a.agentId === agentId);
              return (
                <View
                  key={evt.id}
                  style={[
                    styles.card,
                    { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.sm },
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[typography.caption2, { color: '#EA580C', fontWeight: '700' }]}>
                      CALL SHEET · {evt.tenantOrderNumber}
                    </Text>
                    <StatusBadge label={myAsg?.role || 'CREW'} variant="info" size="sm" />
                  </View>

                  <Text style={[typography.title3, { color: colors.textPrimary, marginTop: 4 }]}>
                    {evt.eventTypeName}
                  </Text>
                  <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                    {evt.orderTitle} · Side: {evt.side}
                  </Text>

                  {/* Call Time */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <Ionicons name="time" size={15} color="#D97706" />
                    <Text style={[typography.subhead, { color: colors.textPrimary, fontWeight: '600' }]}>
                      Call Time: {new Date(evt.startTime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </Text>
                  </View>

                  {/* Venue Address */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Ionicons name="location" size={15} color="#6B7280" />
                    <Text style={[typography.caption1, { color: colors.textSecondary, flex: 1 }]}>
                      {evt.venueName} · {evt.venueAddress}
                    </Text>
                  </View>

                  {/* Client Shooting Brief */}
                  <View
                    style={{
                      backgroundColor: isDark ? 'rgba(234, 88, 12, 0.1)' : '#FFF7ED',
                      padding: 10,
                      borderRadius: 8,
                      marginTop: 10,
                      borderLeftWidth: 3,
                      borderLeftColor: '#EA580C',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#EA580C' }}>
                      STUDIO SHOOTING BRIEF
                    </Text>
                    <Text style={{ fontSize: 12, color: isDark ? '#FED7AA' : '#9A3412', marginTop: 2 }}>
                      {evt.eventTypeName.includes('Sangeet')
                        ? 'Focus on dynamic stage lighting and candid guest reactions during family performances. Multi-angle 60fps slow-motion for couple dance.'
                        : evt.eventTypeName.includes('Haldi')
                        ? 'High-shutter candid photos of marigold flower shower. Waterproof lens cover recommended.'
                        : 'Ceremony rituals require close-up coverage of Sindoor Daan and Saat Phere. Maintain silent shutter mode during mantras.'}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    {evt.contactPhone && (
                      <Button
                        title={`Call Client (${evt.contactName || 'Venue'})`}
                        onPress={() => Linking.openURL(`tel:${evt.contactPhone}`)}
                        size="sm"
                        variant="outline"
                        icon={<Ionicons name="call-outline" size={14} color={colors.primary} />}
                        style={{ flex: 1 }}
                      />
                    )}
                    {evt.venueMapUrl && (
                      <Button
                        title="Directions"
                        onPress={() => Linking.openURL(evt.venueMapUrl!)}
                        size="sm"
                        variant="outline"
                        icon={<Ionicons name="map-outline" size={14} color={colors.primary} />}
                        style={{ flex: 1 }}
                      />
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  }

  const categories = ['ALL', 'ALBUM', 'VIDEO_EDIT', 'PHOTO_EDIT', 'REEL', 'HIGHLIGHT'];

  const filteredTasks = editingTasks.filter(t => {
    return selectedCategory === 'ALL' || t.category === selectedCategory;
  });

  const canSeeCost = permissions.money.cost !== 'none';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <DemoBanner />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={[typography.title1, { color: colors.textPrimary }]}>Editing Coordination</Text>
        <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
          Deliverables oversight across albums, films, reels, highlights and photo edits
        </Text>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing.md, marginBottom: spacing.sm }}
          contentContainerStyle={{ gap: 8 }}
        >
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: radii.full,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption1,
                    { color: isSelected ? colors.primaryText : colors.textSecondary, fontWeight: '600' },
                  ]}
                >
                  {cat.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Workload Distribution summary (EDIT-03) */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.xs },
          ]}
        >
          <Text style={[typography.caption2, { color: colors.textMuted, fontWeight: '700' }]}>
            ACTIVE EDITOR WORKLOAD DISTRIBUTION
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: spacing.sm }}>
            {team
              .filter(m => m.capabilities.editing && m.isActive)
              .map(edr => {
                const count = editingTasks.filter(t => t.editorId === edr.id && t.status !== 'COMPLETED').length;
                return (
                  <View key={edr.id} style={styles.edrWorkloadItem}>
                    <Text style={[typography.headline, { color: colors.textPrimary }]}>{edr.name}</Text>
                    <Text style={[typography.caption1, { color: count > 2 ? colors.warning : colors.textSecondary }]}>
                      {count} active tasks
                    </Text>
                  </View>
                );
              })}
          </View>
        </View>

        {/* Task cards */}
        <Text style={[typography.title3, { color: colors.textPrimary, marginTop: spacing.lg }]}>
          Deliverables Queue ({filteredTasks.length})
        </Text>

        {filteredTasks.length === 0 ? (
          <StateView type="empty" message="No editing tasks in this category." />
        ) : (
          filteredTasks.map(task => (
            <View
              key={task.id}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.sm },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[typography.caption2, { color: colors.textMuted }]}>{task.tenantOrderNumber}</Text>
                <StatusBadge
                  label={task.status}
                  variant={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'info' : 'warning'}
                  size="sm"
                />
              </View>

              <Text style={[typography.title3, { color: colors.textPrimary, marginTop: 2 }]}>
                {task.title}
              </Text>
              <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                {task.orderTitle} · Category: {task.category}
              </Text>

              {/* Assignee Row */}
              <View style={[styles.assigneeRow, { marginTop: 6 }]}>
                <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                <Text style={[typography.caption1, { color: colors.textPrimary, marginLeft: 4 }]}>
                  Assignee: {task.editorName || 'Unassigned (Open)'}
                </Text>
              </View>

              {/* Review Connection */}
              {task.isReviewable && task.reviewItemId && (
                <View
                  style={[
                    styles.reviewBox,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.borderSubtle,
                      borderRadius: radii.sm,
                      marginTop: spacing.sm,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[typography.caption2, { color: colors.textSecondary }]}>
                      Client Review Round {task.reviewStatus || 'Draft'}
                    </Text>
                    <StatusBadge
                      label={task.reviewStatus || 'NOT_UPLOADED'}
                      variant={mapReviewStatusToVariant(task.reviewStatus || '')}
                      size="sm"
                    />
                  </View>

                  <Button
                    title="Open Staff Review"
                    onPress={() => router.push(`/review/${task.reviewItemId}` as any)}
                    size="sm"
                    variant="outline"
                    style={{ marginTop: spacing.xs }}
                  />
                </View>
              )}

              {/* Cost if permitted */}
              {canSeeCost && task.cost && (
                <View style={[styles.priceRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.xs }]}>
                  <Text style={[typography.caption1, { color: colors.textSecondary }]}>Editor Cost:</Text>
                  <MoneyView amount={task.cost} permission={permissions.money.cost} />
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 96,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  edrWorkloadItem: {
    minWidth: 120,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewBox: {
    padding: 10,
    borderWidth: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  checklistLabel: {
    fontSize: 13,
    flex: 1,
  },
});
