import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { formatINR, formatINRFull, currentMonth, monthLabel } from '@/lib/calculations';

export default function BonusPlannerScreen() {
  const { incomes, expenses, deferredExpenses, addIncome, updateIncome, removeDeferredExpense } = useStore();

  const month = currentMonth();
  const [bonusAmount, setBonusAmount] = useState('');

  const bonusIncome = incomes.find(
    i => i.month === month && i.type === 'bonus'
  );
  const deferredThisMonth = deferredExpenses.filter(d => d.targetBonusMonth === month);
  const totalDeferred = deferredThisMonth.reduce((s, d) => s + d.amount, 0);
  const expectedBonus = bonusIncome?.amount ?? 0;
  const diff = expectedBonus - totalDeferred;

  const deferredExpenseDetails = deferredThisMonth.map(d => {
    const exp = expenses.find(e => e.id === d.expenseId);
    return { deferred: d, expense: exp };
  });

  function saveBonus() {
    const val = parseFloat(bonusAmount);
    if (isNaN(val) || val <= 0) { Alert.alert('Enter valid bonus amount'); return; }

    if (bonusIncome) {
      updateIncome(bonusIncome.id, { amount: val });
    } else {
      addIncome({
        earner: 'Abhinav',
        month,
        amount: val,
        type: 'bonus',
        isBonusMonth: true,
      });
    }
    setBonusAmount('');
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Plan large or discretionary expenses against your expected quarterly bonus. Deferred expenses are excluded from current cashflow until the bonus month arrives.
      </Text>

      {/* Bonus Income */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expected Bonus — {monthLabel(month)}</Text>
        <View style={styles.bonusCard}>
          {bonusIncome ? (
            <>
              <Text style={styles.bonusLabel}>Planned Bonus</Text>
              <Text style={styles.bonusAmount}>{formatINRFull(bonusIncome.amount)}</Text>
            </>
          ) : (
            <Text style={styles.noBonusText}>No bonus planned for {monthLabel(month)}</Text>
          )}
          <View style={styles.bonusInputRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.bonusInput}
              placeholder={bonusIncome ? 'Update bonus amount' : 'Enter expected bonus'}
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={bonusAmount}
              onChangeText={setBonusAmount}
            />
            <TouchableOpacity style={styles.bonusSaveBtn} onPress={saveBonus}>
              <Text style={styles.bonusSaveBtnText}>{bonusIncome ? 'Update' : 'Set'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Summary */}
      {(totalDeferred > 0 || expectedBonus > 0) && (
        <View style={[styles.summaryCard, { borderColor: diff < 0 ? Colors.danger : Colors.success }]}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Expected Bonus</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>{formatINR(expectedBonus)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Deferred Obligations</Text>
            <Text style={[styles.summaryValue, { color: Colors.warning }]}>{formatINR(totalDeferred)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowTotal]}>
            <Text style={styles.summaryLabel}>Net Position</Text>
            <Text style={[styles.summaryValue, { color: diff >= 0 ? Colors.success : Colors.danger, fontSize: 18 }]}>
              {diff >= 0 ? '+' : ''}{formatINR(diff)}
            </Text>
          </View>
          <View style={styles.statusNote}>
            <Ionicons
              name={diff >= 0 ? 'checkmark-circle' : 'alert-circle'}
              size={16}
              color={diff >= 0 ? Colors.success : Colors.danger}
            />
            <Text style={[styles.statusText, { color: diff >= 0 ? Colors.success : Colors.danger }]}>
              {diff >= 0
                ? `Bonus covers all deferred expenses with ${formatINR(diff)} to spare.`
                : `You are ${formatINR(Math.abs(diff))} over the expected bonus. Review deferred expenses.`}
            </Text>
          </View>
        </View>
      )}

      {/* Deferred Expenses */}
      <Text style={styles.sectionTitle}>Deferred Expenses</Text>
      {deferredExpenseDetails.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={36} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No expenses deferred to this month.</Text>
          <Text style={styles.emptySubtext}>
            When logging an expense, select "Defer to Bonus Month" to plan it against your quarterly bonus.
          </Text>
        </View>
      ) : (
        deferredExpenseDetails.map(({ deferred, expense }) => (
          <View key={deferred.id} style={styles.deferredItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.deferredDesc}>{expense?.note || expense?.category || 'Expense'}</Text>
              <Text style={styles.deferredMeta}>{expense?.cardId} · {expense?.paidBy}</Text>
            </View>
            <Text style={styles.deferredAmount}>{formatINR(deferred.amount)}</Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert('Remove Deferred', 'Move this expense back to current cashflow?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', onPress: () => removeDeferredExpense(deferred.id) },
                ])
              }
              style={styles.removeBtn}
            >
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* How it works */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How Bonus Month Planning Works</Text>
        <Text style={styles.infoText}>
          {`1. Set your expected quarterly bonus amount above.\n2. When adding expenses, mark them as "Deferred to Bonus Month."\n3. Deferred expenses are removed from current cashflow.\n4. The planner warns you if deferred obligations exceed your bonus.\n5. Once the bonus arrives, tick off expenses as they're paid.`}
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  intro: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  bonusCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  bonusLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  bonusAmount: { fontSize: 28, fontWeight: '800', color: Colors.success, marginBottom: 12 },
  noBonusText: { fontSize: 14, color: Colors.textMuted, marginBottom: 12 },
  bonusInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12 },
  rupee: { fontSize: 18, color: Colors.textSecondary, marginRight: 4 },
  bonusInput: { flex: 1, fontSize: 18, color: Colors.textPrimary, fontWeight: '600', paddingVertical: 10 },
  bonusSaveBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  bonusSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryRowTotal: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 6, paddingTop: 12 },
  summaryLabel: { fontSize: 14, color: Colors.textSecondary },
  summaryValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  statusNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 10 },
  statusText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '500' },
  deferredItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  deferredDesc: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  deferredMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  deferredAmount: { fontSize: 15, fontWeight: '700', color: Colors.accent },
  removeBtn: { padding: 4 },
  emptyCard: { alignItems: 'center', padding: 32, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  emptyText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  infoCard: { backgroundColor: Colors.surfaceElevated, borderRadius: 14, padding: 16, marginTop: 8 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  infoText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
