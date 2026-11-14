import React, { useState, useMemo } from 'react';
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
import { formatCurrency } from '@/components/common/money-view';
import { Button } from '@/components/common/button';
import { StateView } from '@/components/common/state-view';
import { PaymentType, PaymentMethod } from '@/types/money';

export default function PaymentsScreen() {
  const { session, permissions } = useAuth();
  const { payments, orders, recordClientReceipt, deletePaymentRecord } = useDemoStore();
  const { colors, typography, spacing, radii } = useTheme();

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [modalVisible, setModalVisible] = useState(false);
  const [amountInput, setAmountInput] = useState('50000');
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || '');
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [refInput, setRefInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const isOwnerOrAdmin = session?.roles.includes('OWNER') || session?.roles.includes('ADMIN');

  if (!isOwnerOrAdmin) {
    return (
      <ScreenWrapper>
        <StateView
          type="permission-denied"
          title="Payment Administration Restricted"
          message="Client payment administration is restricted to studio owners and administrators (PAY-01)."
          actionTitle="Back"
          onAction={() => router.back()}
        />
      </ScreenWrapper>
    );
  }

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (selectedType === 'ALL') return true;
      return p.type === selectedType;
    });
  }, [payments, selectedType]);

  const handleRecordReceipt = () => {
    const amt = parseFloat(amountInput);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a positive payment amount.');
      return;
    }
    const targetOrder = orders.find(o => o.id === selectedOrderId);
    if (!targetOrder) return;

    recordClientReceipt(
      {
        orderId: targetOrder.id,
        tenantOrderNumber: targetOrder.tenantOrderNumber,
        amount: amt,
        paymentDate: new Date().toISOString(),
        method,
        status: 'COMPLETED',
        referenceNumber: refInput || `REF-${Date.now().toString().slice(-6)}`,
        notes: notesInput,
      },
      session?.id || 'usr-owner-01',
      session?.name || 'Admin'
    );

    setModalVisible(false);
    Alert.alert('Receipt Recorded', `Successfully recorded ${formatCurrency(amt)} against ${targetOrder.tenantOrderNumber}.`);
  };

  const handleDelete = (paymentId: string) => {
    Alert.alert('Delete Payment', 'Permanently remove this payment record from the ledger? This does not initiate a bank gateway refund.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePaymentRecord(paymentId) },
    ]);
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[typography.title1, { color: colors.textPrimary }]}>Payment Ledger</Text>
            <Text style={[typography.footnote, { color: colors.textSecondary }]}>
              {filteredPayments.length} transactions recorded
            </Text>
          </View>
          <Button
            title="+ Record Receipt"
            onPress={() => setModalVisible(true)}
            size="sm"
            variant="primary"
          />
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing.md, marginBottom: spacing.sm }}
          contentContainerStyle={{ gap: 8 }}
        >
          {['ALL', 'CLIENT_RECEIPT', 'AGENT_PAYOUT', 'EDITOR_PAYOUT'].map(t => {
            const isSelected = selectedType === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setSelectedType(t)}
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
                  {t === 'CLIENT_RECEIPT'
                    ? 'Client Receipts'
                    : t === 'AGENT_PAYOUT'
                    ? 'Agent Payouts'
                    : t === 'EDITOR_PAYOUT'
                    ? 'Editor Payouts'
                    : 'All Payments'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* List of Payments */}
        {filteredPayments.map(pay => (
          <View
            key={pay.id}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, marginBottom: spacing.sm },
            ]}
          >
            <View style={styles.headerRow}>
              <View>
                <Text style={[typography.caption2, { color: colors.textMuted }]}>
                  {new Date(pay.paymentDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {pay.tenantOrderNumber ? ` · ${pay.tenantOrderNumber}` : ''}
                </Text>
                <Text style={[typography.headline, { color: colors.textPrimary, marginTop: 2 }]}>
                  {pay.recipientOrPayerName}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={[
                    typography.title2,
                    { color: pay.type === 'CLIENT_RECEIPT' ? colors.success : colors.textPrimary },
                  ]}
                >
                  {pay.type === 'CLIENT_RECEIPT' ? '+' : '-'}{formatCurrency(pay.amount)}
                </Text>
                <StatusBadge label={pay.method} size="sm" />
              </View>
            </View>

            <View style={[styles.bottomRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.sm, paddingTop: spacing.xs }]}>
              <Text style={[typography.caption1, { color: colors.textSecondary, flex: 1 }]}>
                Ref: {pay.referenceNumber || 'N/A'} {pay.notes ? `· ${pay.notes}` : ''}
              </Text>
              <TouchableOpacity onPress={() => handleDelete(pay.id)}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Modal: Record Client Receipt */}
        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }]}>
              <View style={styles.headerRow}>
                <Text style={[typography.title2, { color: colors.textPrimary }]}>Record Client Receipt</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ marginTop: spacing.md, maxHeight: 400 }}>
                <Text style={[typography.subhead, { color: colors.textSecondary }]}>Select Booking *</Text>
                <ScrollView horizontal style={{ marginTop: 4, marginBottom: 8 }} contentContainerStyle={{ gap: 6 }}>
                  {orders.map(o => (
                    <TouchableOpacity
                      key={o.id}
                      onPress={() => setSelectedOrderId(o.id)}
                      style={[
                        styles.orderPickerPill,
                        {
                          backgroundColor: selectedOrderId === o.id ? colors.primary : colors.surfaceSubtle,
                          borderColor: colors.border,
                          borderRadius: radii.sm,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.caption2,
                          { color: selectedOrderId === o.id ? colors.primaryText : colors.textPrimary },
                        ]}
                      >
                        {o.tenantOrderNumber} ({o.clientName})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[typography.subhead, { color: colors.textSecondary }]}>Receipt Amount (₹) *</Text>
                <TextInput
                  value={amountInput}
                  onChangeText={setAmountInput}
                  keyboardType="numeric"
                  style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
                />

                <Text style={[typography.subhead, { color: colors.textSecondary, marginTop: spacing.sm }]}>Payment Method</Text>
                <ScrollView horizontal style={{ marginTop: 4, marginBottom: 8 }} contentContainerStyle={{ gap: 6 }}>
                  {(['UPI', 'BANK_TRANSFER', 'CARD', 'CASH', 'CHEQUE'] as PaymentMethod[]).map(m => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setMethod(m)}
                      style={[
                        styles.orderPickerPill,
                        {
                          backgroundColor: method === m ? colors.primary : colors.surfaceSubtle,
                          borderColor: colors.border,
                          borderRadius: radii.sm,
                        },
                      ]}
                    >
                      <Text style={[typography.caption2, { color: method === m ? colors.primaryText : colors.textPrimary }]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[typography.subhead, { color: colors.textSecondary }]}>Reference # / UTR</Text>
                <TextInput
                  value={refInput}
                  onChangeText={setRefInput}
                  placeholder="e.g. UPI982736412"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textPrimary, borderRadius: radii.sm }]}
                />

                <Button
                  title="Confirm & Add to Ledger"
                  onPress={handleRecordReceipt}
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
  orderPickerPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
});
