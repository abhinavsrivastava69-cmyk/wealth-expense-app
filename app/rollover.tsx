import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { formatINR, formatINRFull } from '@/lib/calculations';
import type { PaymentResolution } from '@/lib/types';

const RESOLUTIONS: { value: PaymentResolution; label: string; sublabel: string; icon: React.ComponentProps<typeof Ionicons>['name']; color: string }[] = [
  {
    value: 'paid-full',
    label: 'Paid in Full',
    sublabel: 'Full balance cleared from bank account.',
    icon: 'checkmark-circle',
    color: Colors.success,
  },
  {
    value: 'paid-partial',
    label: 'Partially Paid',
    sublabel: 'Remaining balance carries forward to next month.',
    icon: 'remove-circle',
    color: Colors.warning,
  },
  {
    value: 'rolled',
    label: 'Rolled to Next Month',
    sublabel: 'Full amount deferred. Debt counter incremented. Interest will accrue.',
    icon: 'refresh-circle',
    color: Colors.danger,
  },
  {
    value: 'card-to-card',
    label: 'Paid from Another Card',
    sublabel: '⚠️ This does NOT reduce your debt. The balance is merely shifted.',
    icon: 'swap-horizontal',
    color: Colors.danger,
  },
];

export default function RolloverScreen() {
  const router = useRouter();
  const { cycleId } = useLocalSearchParams<{ cycleId?: string }>();
  const { billingCycles, cards, resolveCyclePayment } = useStore();

  const cycle = cycleId ? billingCycles.find(c => c.id === cycleId) : null;
  const card = cycle ? cards.find(c => c.id === cycle.cardId) : null;

  // Show all unresolved locked cycles if no specific cycleId
  const pendingCycles = billingCycles.filter(
    c => c.status === 'locked' && c.paymentResolution === 'pending'
  );

  const [selectedCycleId, setSelectedCycleId] = useState(cycleId ?? pendingCycles[0]?.id ?? '');
  const [resolution, setResolution] = useState<PaymentResolution | null>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [paidFromCard, setPaidFromCard] = useState('');

  const activeCycle = billingCycles.find(c => c.id === selectedCycleId);
  const activeCard = activeCycle ? cards.find(c => c.id === activeCycle.cardId) : null;

  function handleSave() {
    if (!resolution) { Alert.alert('Select a resolution'); return; }
    if (!selectedCycleId) { Alert.alert('No cycle selected'); return; }

    const paid =
      resolution === 'paid-full'
        ? activeCycle?.totalSpend
        : resolution === 'paid-partial'
        ? parseFloat(amountPaid) || 0
        : 0;

    resolveCyclePayment(selectedCycleId, resolution, paid, paidFromCard || undefined);
    router.back();
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Pending cycles list */}
      {pendingCycles.length > 1 && (
        <>
          <Text style={styles.sectionLabel}>Pending Bills</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {pendingCycles.map(c => {
              const ca = cards.find(ca => ca.id === c.cardId);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.cyclePill, selectedCycleId === c.id && styles.cyclePillActive]}
                  onPress={() => { setSelectedCycleId(c.id); setResolution(null); }}
                >
                  <Text style={[styles.cyclePillText, selectedCycleId === c.id && { color: Colors.textPrimary }]}>
                    {ca?.name ?? '?'}
                  </Text>
                  <Text style={styles.cyclePillAmt}>{formatINR(c.totalSpend)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* Active cycle detail */}
      {activeCycle && activeCard && (
        <View style={styles.cycleCard}>
          <View style={styles.cycleCardHeader}>
            <Text style={styles.cycleCardTitle}>{activeCard.name} Bill</Text>
            <Text style={styles.cycleCardDate}>
              Due: {new Date(activeCycle.billDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
          <Text style={styles.cycleCardAmount}>{formatINRFull(activeCycle.totalSpend)}</Text>
          <Text style={styles.cycleCardSub}>Total billed this cycle</Text>
        </View>
      )}

      {pendingCycles.length === 0 && !cycleId && (
        <View style={styles.allClear}>
          <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
          <Text style={styles.allClearTitle}>All Bills Resolved</Text>
          <Text style={styles.allClearSub}>No pending bill resolutions at this time.</Text>
        </View>
      )}

      {/* Resolution Options */}
      {activeCycle && (
        <>
          <Text style={styles.sectionLabel}>How did you pay?</Text>
          {RESOLUTIONS.map(r => (
            <TouchableOpacity
              key={r.value}
              style={[styles.resOption, resolution === r.value && { borderColor: r.color, backgroundColor: r.color + '11' }]}
              onPress={() => setResolution(r.value)}
            >
              <Ionicons name={r.icon} size={24} color={r.color} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.resLabel, { color: r.color }]}>{r.label}</Text>
                <Text style={styles.resSub}>{r.sublabel}</Text>
              </View>
              {resolution === r.value && (
                <Ionicons name="radio-button-on" size={20} color={r.color} />
              )}
            </TouchableOpacity>
          ))}

          {/* Partial amount */}
          {resolution === 'paid-partial' && (
            <View style={styles.partialSection}>
              <Text style={styles.sectionLabel}>Amount Paid (₹)</Text>
              <View style={styles.amountRow}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={amountPaid}
                  onChangeText={setAmountPaid}
                  autoFocus
                />
              </View>
              {amountPaid && (
                <Text style={styles.carryForward}>
                  Carry forward: {formatINR(activeCycle.totalSpend - (parseFloat(amountPaid) || 0))}
                </Text>
              )}
            </View>
          )}

          {/* Card-to-card source */}
          {resolution === 'card-to-card' && (
            <View style={styles.partialSection}>
              <Text style={styles.sectionLabel}>Paid From Which Card?</Text>
              <View style={styles.cardWrap}>
                {cards.filter(c => c.id !== activeCycle.cardId).map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.cardChip, paidFromCard === c.id && styles.cardChipActive]}
                    onPress={() => setPaidFromCard(c.id)}
                  >
                    <Text style={[styles.cardChipText, paidFromCard === c.id && { color: Colors.danger }]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={16} color={Colors.danger} />
                <Text style={styles.warningText}>
                  This does NOT reduce your total debt. The balance is shifted, not cleared. Both cards will now carry outstanding balances.
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={[styles.saveBtn, !resolution && { opacity: 0.5 }]} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Confirm Resolution</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 16 },
  cyclePill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: 10,
    alignItems: 'center',
  },
  cyclePillActive: { borderColor: Colors.warning, backgroundColor: Colors.warningDim },
  cyclePillText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  cyclePillAmt: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  cycleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Colors.warning,
    marginBottom: 8,
    alignItems: 'center',
  },
  cycleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  cycleCardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cycleCardDate: { fontSize: 13, color: Colors.warning, fontWeight: '600' },
  cycleCardAmount: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary },
  cycleCardSub: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  resOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginBottom: 10,
  },
  resLabel: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  resSub: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  partialSection: {},
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rupee: { fontSize: 24, color: Colors.textSecondary, marginRight: 4 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  carryForward: { fontSize: 13, color: Colors.warning, fontWeight: '600', marginTop: 8 },
  cardWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  cardChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cardChipActive: { borderColor: Colors.danger, backgroundColor: Colors.dangerDim },
  cardChipText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.dangerDim,
    borderRadius: 10,
    padding: 10,
  },
  warningText: { flex: 1, fontSize: 12, color: Colors.danger, lineHeight: 17 },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  allClear: { alignItems: 'center', padding: 48 },
  allClearTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: 16 },
  allClearSub: { fontSize: 14, color: Colors.textMuted, marginTop: 6 },
});
