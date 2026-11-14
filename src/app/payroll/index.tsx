import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { useDemoStore } from '@/context/demo-store-context';
import { useTheme } from '@/hooks/use-theme';
import { ScreenWrapper } from '@/components/common/screen-wrapper';
import { formatCurrency } from '@/components/common/money-view';
import { Button } from '@/components/common/button';
import { StateView } from '@/components/common/state-view';
import { PaymentMethod } from '@/types/money';

export default function PayrollScreen() {
  const { session, permissions } = useAuth();
  const { payroll, recordStaffPayout } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  const [activeTab, setActiveTab] = useState<'AGENTS' | 'EDITORS'>('AGENTS');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<PaymentMethod>('UPI');
  const [notes, setNotes] = useState('');

  const canSeePayroll = permissions.destinations.includes('Payroll') && permissions.money.cost !== 'none';

  if (!canSeePayroll) {
    return (
      <ScreenWrapper>
        <StateView
          type="permission-denied"
          title="Payroll Access Restricted"
          message="Viewing studio payroll requires the Payroll destination and cost permissions."
          actionTitle="Back"
          onAction={() => router.back()}
        />
      </ScreenWrapper>
    );
  }

  const handleOpenPayout = (worker: any) => {
    setSelectedWorker(worker);
    setPayoutAmount(String(worker.balanceDue > 0 ? worker.balanceDue : 5000));
    setModalVisible(true);
  };

  const handleConfirmPayout = () => {
    const amt = parseFloat(payoutAmount);
    if (!amt || amt <= 0 || !selectedWorker) return;

    recordStaffPayout(
      {
        type: selectedWorker.role === 'AGENT' ? 'AGENT_PAYOUT' : 'EDITOR_PAYOUT',
        workerId: selectedWorker.workerId,
        workerName: selectedWorker.workerName,
        amount: amt,
        paymentDate: new Date().toISOString(),
        method: payoutMethod,
        status: 'COMPLETED',
        notes,
      },
      session?.id || 'usr-owner-01',
      session?.name || 'Admin'
    );

    setModalVisible(false);
    Alert.alert('Payout Recorded', `Recorded ${formatCurrency(amt)} payout to ${selectedWorker.workerName}.`);
  };

  // Export CSV (PAY-07)
  const handleExportCsv = async () => {
    const csvRows = [
      'Worker Name,Role,Category,Completed Work,Upcoming Work,Total Earned,Total Paid,Balance Due',
      ...payroll.agentWorkers.map(
        w => `${w.workerName},Agent,"${w.professionOrCategory}",${w.payableCompletedWork},${w.upcomingWorkEstimated},${w.totalEarned},${w.totalPaid},${w.balanceDue}`
      ),
      ...payroll.editorWorkers.map(
        w => `${w.workerName},Editor,"${w.professionOrCategory}",${w.payableCompletedWork},${w.upcomingWorkEstimated},${w.totalEarned},${w.totalPaid},${w.balanceDue}`
      ),
    ];

    const csvContent = csvRows.join('\n');
    try {
      await Share.share({
        title: `WedTrack_Payroll_${payroll.monthYear}.csv`,
        message: csvContent,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const workers = activeTab === 'AGENTS' ? payroll.agentWorkers : payroll.editorWorkers;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[typography.title1, { color: colors.textPrimary }]}>Staff Payroll</Text>
            <Text style={[typography.footnote, { color: colors.textSecondary }]}>
              Period: {payroll.monthYear} (Authoritative Ledger)
            </Text>
          </View>

          <Button
            title="Export CSV"
            onPress={handleExportCsv}
            size="sm"
            variant="outline"
            icon={<Ionicons name="share-outline" size={14} color={colors.primary} />}
          />
        </View>

        {/* Monthly Studio Totals */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg, marginTop: spacing.md },
          ]}
        >
          <Text style={[typography.caption2, { color: colors.textMuted, fontWeight: '700' }]}>
            MONTHLY DISBURSEMENT SUMMARY
          </Text>

          <View style={[styles.statsGrid, { marginTop: spacing.sm }]}>
            <View style={styles.statBox}>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Payable Completed</Text>
              <Text style={[typography.title2, { color: colors.textPrimary }]}>
                {formatCurrency(payroll.totalPayableCompleted)}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Total Paid Out</Text>
              <Text style={[typography.title2, { color: colors.success }]}>
                {formatCurrency(payroll.totalPaid)}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Balance Due</Text>
              <Text style={[typography.title2, { color: colors.warning }]}>
                {formatCurrency(payroll.totalBalanceDue)}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>Upcoming Est.</Text>
              <Text style={[typography.title2, { color: colors.textMuted }]}>
                {formatCurrency(payroll.totalUpcomingEstimated)}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Switcher: Agents vs Editors */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.lg }}>
          <Button
            title={`Shoot Crew (${payroll.agentWorkers.length})`}
            onPress={() => setActiveTab('AGENTS')}
            size="sm"
            variant={activeTab === 'AGENTS' ? 'primary' : 'outline'}
            style={{ flex: 1 }}
          />
          <Button
            title={`Editors (${payroll.editorWorkers.length})`}
            onPress={() => setActiveTab('EDITORS')}
            size="sm"
            variant={activeTab === 'EDITORS' ? 'primary' : 'outline'}
            style={{ flex: 1 }}
          />
        </View>

        {/* Worker Cards */}
        {workers.map(w => (
          <View
            key={w.workerId}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.sm },
            ]}
          >
            <View style={styles.headerRow}>
              <View>
                <Text style={[typography.headline, { color: colors.textPrimary }]}>{w.workerName}</Text>
                <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                  {w.professionOrCategory}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[typography.caption2, { color: colors.textMuted }]}>Balance Due</Text>
                <Text
                  style={[
                    typography.title3,
                    { color: w.balanceDue > 0 ? colors.warning : colors.success },
                  ]}
                >
                  {formatCurrency(w.balanceDue)}
                </Text>
              </View>
            </View>

            <View style={[styles.workerRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.xs }]}>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                Earned: {formatCurrency(w.totalEarned)} · Paid: {formatCurrency(w.totalPaid)}
              </Text>

              {permissions.money.cost === 'edit' && (
                <Button
                  title="Record Payout"
                  onPress={() => handleOpenPayout(w)}
                  size="sm"
                  variant="outline"
                />
              )}
            </View>
          </View>
        ))}

        {/* Modal: Record Payout */}
        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }]}>
              <View style={styles.headerRow}>
                <Text style={[typography.title2, { color: colors.textPrimary }]}>
                  Record Payout for {selectedWorker?.workerName}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.md }]}>
                Payout Amount (₹) *
              </Text>
              <TextInput
                value={payoutAmount}
                onChangeText={setPayoutAmount}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
              />

              <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>Method</Text>
              <ScrollView horizontal style={{ marginTop: 4, marginBottom: 8 }} contentContainerStyle={{ gap: 6 }}>
                {(['UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE'] as PaymentMethod[]).map(m => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setPayoutMethod(m)}
                    style={[
                      styles.methodPill,
                      {
                        backgroundColor: payoutMethod === m ? colors.primary : colors.surfaceSubtle,
                        borderColor: colors.border,
                        borderRadius: radii.sm,
                      },
                    ]}
                  >
                    <Text style={[typography.caption2, { color: payoutMethod === m ? colors.primaryText : colors.textPrimary }]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[typography.subhead, { color: colors.textSecondary }]}>Notes</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Settlement for completed work"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
              />

              <Button
                title="Confirm & Save Payout Record"
                onPress={handleConfirmPayout}
                size="lg"
                variant="primary"
                style={{ marginTop: spacing.lg }}
              />
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
  card: {
    padding: 16,
    borderWidth: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
  },
  workerRow: {
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
    padding: 20,
  },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 15,
    marginTop: 4,
  },
  methodPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
});
