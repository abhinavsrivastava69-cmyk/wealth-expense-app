import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { calculateBudgetDeviations, formatINR, formatINRFull, currentMonth, categoryLabel } from '@/lib/calculations';
import { confirmDelete } from '@/lib/confirm';
import { ProgressBar } from '@/components/common/ProgressBar';
import type { ExpenseCategory } from '@/lib/types';

const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  'groceries','dining','shopping','entertainment','travel','medical','other',
];

const FIXED_PRESETS = ['EMI', 'SIP', 'Rent', 'Insurance'];

export default function BudgetManagerScreen() {
  const { budgets, addBudget, updateBudget, deleteBudget, expenses, incomes } = useStore();
  const month = currentMonth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Fixed-commitment name editing
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelValue, setLabelValue] = useState('');

  // Fixed-commitment add form
  const [addingFixed, setAddingFixed] = useState(false);
  const [fixedLabel, setFixedLabel] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');

  const monthBudgets = budgets.filter(b => b.month === month);
  const fixedBudgets = monthBudgets.filter(b => b.kind === 'fixed');
  const variableBudgets = monthBudgets.filter(b => b.kind !== 'fixed');
  const deviations = calculateBudgetDeviations(month, expenses, variableBudgets);

  const existingCategories = variableBudgets.map(b => b.category);
  const missingCategories = DEFAULT_CATEGORIES.filter(c => !existingCategories.includes(c));

  const totalFixed = fixedBudgets.reduce((s, b) => s + b.budgetAmount, 0);
  const totalVariableBudget = variableBudgets.reduce((s, b) => s + b.budgetAmount, 0);
  const income = incomes.filter(i => i.month === month).reduce((s, i) => s + i.amount, 0);
  const afterFixed = income - totalFixed;
  const fixedCovered = income > 0 && afterFixed >= 0;

  function startEdit(id: string, current: number) {
    setEditingId(id);
    setEditValue(current.toString());
  }

  function saveEdit(id: string) {
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) {
      Alert.alert('Invalid amount');
      return;
    }
    updateBudget(id, { budgetAmount: val });
    setEditingId(null);
  }

  function startEditLabel(id: string, current: string) {
    setEditingLabelId(id);
    setLabelValue(current);
  }

  function saveLabel(id: string) {
    const v = labelValue.trim();
    if (!v) { Alert.alert('Enter a name'); return; }
    updateBudget(id, { label: v });
    setEditingLabelId(null);
  }

  function addMissing(category: ExpenseCategory) {
    addBudget({ category, month, budgetAmount: 5000, kind: 'variable' });
  }

  function startFixed(preset?: string) {
    setAddingFixed(true);
    setFixedLabel(preset ?? '');
    setFixedAmount('');
  }

  function saveFixed() {
    const val = parseFloat(fixedAmount);
    const label = fixedLabel.trim();
    if (!label) { Alert.alert('Enter a name', 'e.g. EMI, SIP, Rent'); return; }
    if (isNaN(val) || val <= 0) { Alert.alert('Enter a valid amount'); return; }
    addBudget({ category: 'fixed', month, budgetAmount: val, kind: 'fixed', label });
    setAddingFixed(false);
    setFixedLabel('');
    setFixedAmount('');
  }

  function removeFixed(id: string, label: string) {
    confirmDelete('Remove Commitment', `Remove "${label}" from fixed planning?`, () => deleteBudget(id));
  }

  function removeVariable(id: string, label: string) {
    confirmDelete('Remove Budget', `Remove the ${label} budget?`, () => deleteBudget(id));
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Coverage summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={styles.summaryValue}>{formatINRFull(income)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fixed commitments</Text>
          <Text style={[styles.summaryValue, { color: Colors.warning }]}>−{formatINRFull(totalFixed)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryDivider]}>
          <Text style={styles.summaryLabelStrong}>Left for variable</Text>
          <Text style={[styles.summaryValueStrong, { color: afterFixed >= 0 ? Colors.success : Colors.danger }]}>
            {formatINRFull(afterFixed)}
          </Text>
        </View>
        {income > 0 && (
          <Text style={styles.coverageNote}>
            {fixedCovered
              ? `Fixed commitments covered. You've planned ${formatINR(totalVariableBudget)} of ${formatINR(afterFixed)} variable budget.`
              : `Fixed commitments exceed income by ${formatINR(-afterFixed)}. Trim a commitment or add income.`}
          </Text>
        )}
      </View>

      {/* ── Fixed Commitments ─────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Fixed Commitments</Text>
      <Text style={styles.sectionHint}>EMI, SIP, rent, insurance — recurring obligations planned before discretionary spend.</Text>

      {fixedBudgets.length === 0 && (
        <Text style={styles.empty}>No fixed commitments yet. Add EMI, SIP or rent below.</Text>
      )}
      {fixedBudgets.map(b => {
        const isEditingAmt = editingId === b.id;
        const isEditingLabel = editingLabelId === b.id;
        return (
          <View key={b.id} style={styles.fixedRow}>
            <View style={[styles.dot, { backgroundColor: Colors.warning }]} />

            {isEditingLabel ? (
              <View style={[styles.editRow, { flex: 1 }]}>
                <TextInput
                  style={[styles.editInput, { minWidth: 120, fontSize: 15, flex: 1 }]}
                  value={labelValue}
                  onChangeText={setLabelValue}
                  autoFocus
                  selectTextOnFocus
                  placeholder="Name"
                  placeholderTextColor={Colors.textMuted}
                  onSubmitEditing={() => saveLabel(b.id)}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={() => saveLabel(b.id)} style={styles.iconBtn}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingLabelId(null)} style={styles.iconBtn}>
                  <Ionicons name="close-circle" size={24} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.fixedLabelBtn}
                onPress={() => startEditLabel(b.id, b.label ?? '')}
                activeOpacity={0.6}
              >
                <Text style={styles.fixedLabel} numberOfLines={1}>{b.label ?? 'Commitment'}</Text>
                <Ionicons name="create-outline" size={13} color={Colors.textMuted} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            )}

            {!isEditingLabel && (isEditingAmt ? (
              <View style={styles.editRow}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput
                  style={styles.editInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  keyboardType="numeric"
                  autoFocus
                  selectTextOnFocus
                  onSubmitEditing={() => saveEdit(b.id)}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={() => saveEdit(b.id)} style={styles.iconBtn}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingId(null)} style={styles.iconBtn}>
                  <Ionicons name="close-circle" size={24} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.fixedAmtBtn} onPress={() => startEdit(b.id, b.budgetAmount)} activeOpacity={0.6}>
                  <Text style={styles.fixedAmt}>₹{b.budgetAmount.toLocaleString('en-IN')}</Text>
                  <Ionicons name="create-outline" size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeFixed(b.id, b.label ?? 'Commitment')} hitSlop={10} style={{ marginLeft: 10 }}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </>
            ))}
          </View>
        );
      })}

      {addingFixed ? (
        <View style={styles.fixedForm}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Home Loan EMI"
            placeholderTextColor={Colors.textMuted}
            value={fixedLabel}
            onChangeText={setFixedLabel}
          />
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={fixedAmount}
            onChangeText={setFixedAmount}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={saveFixed}>
            <Text style={styles.saveBtnText}>Add Commitment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddingFixed(false)}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.missingWrap}>
          {FIXED_PRESETS.map(p => (
            <TouchableOpacity key={p} style={styles.missingChip} onPress={() => startFixed(p)}>
              <Ionicons name="add" size={14} color={Colors.primary} />
              <Text style={styles.missingText}>{p}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.missingChip} onPress={() => startFixed()}>
            <Ionicons name="add" size={14} color={Colors.primary} />
            <Text style={styles.missingText}>Custom</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Variable Budgets ──────────────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Variable Budgets</Text>
      <Text style={styles.sectionHint}>Tap any amount to edit. Actuals are tracked in real time against logged expenses.</Text>

      {variableBudgets.map(b => {
        const dev = deviations.find(d => d.category === b.category);
        const isEditing = editingId === b.id;

        return (
          <View key={b.id} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowCategory}>{categoryLabel(b.category)}</Text>

              {isEditing ? (
                <View style={styles.editRow}>
                  <Text style={styles.rupee}>₹</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType="numeric"
                    autoFocus
                    selectTextOnFocus
                    onSubmitEditing={() => saveEdit(b.id)}
                    returnKeyType="done"
                  />
                  <TouchableOpacity onPress={() => saveEdit(b.id)} style={styles.iconBtn}>
                    <Ionicons name="checkmark-circle" size={26} color={Colors.success} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingId(null)} style={styles.iconBtn}>
                    <Ionicons name="close-circle" size={26} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    style={styles.amountBtn}
                    onPress={() => startEdit(b.id, b.budgetAmount)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.budgetAmt}>₹{b.budgetAmount.toLocaleString('en-IN')}</Text>
                    <Ionicons name="create-outline" size={15} color={Colors.primary} style={{ marginLeft: 5 }} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeVariable(b.id, categoryLabel(b.category))} hitSlop={8} style={{ marginLeft: 10 }}>
                    <Ionicons name="trash-outline" size={17} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {dev && (
              <>
                <ProgressBar percentage={dev.percentage} height={6} />
                <View style={styles.devRow}>
                  <Text style={[
                    styles.devText,
                    dev.status === 'exceeded' ? { color: Colors.danger } :
                    dev.status === 'warning'  ? { color: Colors.warning } : { color: Colors.success },
                  ]}>
                    {formatINR(dev.actual)} spent ({dev.percentage.toFixed(0)}%)
                  </Text>
                  {dev.actual > dev.budget && (
                    <Text style={styles.overText}>+{formatINR(dev.actual - dev.budget)} over</Text>
                  )}
                </View>
              </>
            )}
          </View>
        );
      })}

      {missingCategories.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Add Category Budget</Text>
          <View style={styles.missingWrap}>
            {missingCategories.map(c => (
              <TouchableOpacity key={c} style={styles.missingChip} onPress={() => addMissing(c)}>
                <Ionicons name="add" size={14} color={Colors.primary} />
                <Text style={styles.missingText}>{categoryLabel(c)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryDivider: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 2, marginBottom: 4 },
  summaryLabel: { fontSize: 13, color: Colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  summaryLabelStrong: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  summaryValueStrong: { fontSize: 16, fontWeight: '800' },
  coverageNote: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginTop: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginBottom: 14 },
  empty: { color: Colors.textSecondary, fontSize: 13, marginBottom: 10 },
  fixedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: 10 },
  fixedLabelBtn: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  fixedLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, flexShrink: 1 },
  fixedAmtBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  fixedAmt: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  fixedForm: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16, marginTop: 4 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontSize: 15 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 2 },
  cancelBtnText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  row: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowCategory: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  amountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDim + '44',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '55',
  },
  budgetAmt: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rupee: { fontSize: 18, color: Colors.textSecondary },
  editInput: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    minWidth: 80,
    padding: 2,
  },
  iconBtn: { padding: 2 },
  devRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  devText: { fontSize: 12, fontWeight: '500' },
  overText: { fontSize: 12, color: Colors.danger, fontWeight: '600' },
  missingWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  missingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDim + '33',
  },
  missingText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
});
