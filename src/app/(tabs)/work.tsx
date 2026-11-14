import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
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
  const { editingTasks, team } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

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
    paddingBottom: 40,
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
});
