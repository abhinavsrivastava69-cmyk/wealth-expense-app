import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { currentMonth, monthLabel, formatINRFull } from '@/lib/calculations';
import type { Earner, IncomeType } from '@/lib/types';

const EARNERS: Earner[] = ['Abhinav', 'Manasvi'];
const TYPES: { value: IncomeType; label: string; color: string }[] = [
  { value: 'salary', label: 'Salary', color: Colors.success },
  { value: 'credit', label: 'Credit / Gift', color: Colors.accent },
  { value: 'bonus',  label: 'Bonus',  color: Colors.warning },
];

export default function IncomeManagerScreen() {
  const { incomes, addIncome, updateIncome, deleteIncome } = useStore();
  const month = currentMonth();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [earner, setEarner] = useState<Earner>('Abhinav');
  const [type, setType] = useState<IncomeType>('salary');
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');

  const monthIncomes = incomes.filter(i => i.month === month);
  const total = monthIncomes.reduce((s, i) => s + i.amount, 0);
  const formOpen = adding || editingId !== null;

  function reset() {
    setEarner('Abhinav'); setType('salary'); setAmount(''); setLabel('');
    setAdding(false); setEditingId(null);
  }

  function startEdit(inc: typeof monthIncomes[number]) {
    setEditingId(inc.id);
    setAdding(false);
    setEarner(inc.earner);
    setType(inc.type);
    setAmount(String(inc.amount));
    setLabel(inc.label ?? '');
  }

  function handleSave() {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) { Alert.alert('Enter a valid amount'); return; }
    const data = {
      earner,
      month,
      amount: val,
      type,
      ...(type === 'credit' && label.trim() ? { label: label.trim() } : {}),
    };
    if (editingId) {
      // Clear label when type is no longer credit
      updateIncome(editingId, { ...data, label: type === 'credit' && label.trim() ? label.trim() : undefined });
    } else {
      addIncome(data);
    }
    reset();
  }

  function handleDelete(id: string) {
    Alert.alert('Delete Entry', 'Remove this income entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteIncome(id) },
    ]);
  }

  function typeMeta(t: IncomeType) {
    return TYPES.find(x => x.value === t) ?? TYPES[0];
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>{monthLabel(month)} Income</Text>
        <Text style={styles.totalValue}>{formatINRFull(total)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Entries</Text>
      {monthIncomes.length === 0 && <Text style={styles.empty}>No income recorded this month.</Text>}
      {monthIncomes.map(inc => {
        const m = typeMeta(inc.type);
        const active = editingId === inc.id;
        return (
          <TouchableOpacity
            key={inc.id}
            activeOpacity={0.7}
            onPress={() => startEdit(inc)}
            style={[styles.row, active && styles.rowEditing]}
          >
            <View style={[styles.dot, { backgroundColor: m.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{inc.label ?? m.label} · {inc.earner}</Text>
              <Text style={styles.rowMeta}>{m.label}</Text>
            </View>
            <Text style={styles.rowAmount}>{formatINRFull(inc.amount)}</Text>
            <TouchableOpacity onPress={() => startEdit(inc)} hitSlop={10} style={{ marginLeft: 10 }}>
              <Ionicons name="pencil-outline" size={17} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(inc.id)} hitSlop={10} style={{ marginLeft: 12 }}>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })}

      {!formOpen ? (
        <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addBtnText}>Add Income / Credit</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editingId ? 'Edit Entry' : 'New Entry'}</Text>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {TYPES.map(t => (
              <TouchableOpacity key={t.value} style={[styles.typeChip, type === t.value && { borderColor: t.color, backgroundColor: t.color + '22' }]} onPress={() => setType(t.value)}>
                <Text style={[styles.typeChipText, type === t.value && { color: t.color, fontWeight: '700' }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Earner</Text>
          <View style={styles.typeRow}>
            {EARNERS.map(e => (
              <TouchableOpacity key={e} style={[styles.typeChip, earner === e && styles.chipActive]} onPress={() => setEarner(e)}>
                <Text style={[styles.typeChipText, earner === e && styles.chipTextActive]}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {type === 'credit' && (
            <>
              <Text style={styles.label}>Label (optional)</Text>
              <TextInput style={styles.input} placeholder="e.g. Gift money, Freelance" placeholderTextColor={Colors.textMuted} value={label} onChangeText={setLabel} />
            </>
          )}

          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={amount} onChangeText={setAmount} />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>{editingId ? 'Update' : 'Save'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={reset}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  totalCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 13, color: Colors.textSecondary },
  totalValue: { fontSize: 30, fontWeight: '800', color: Colors.success, marginTop: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  empty: { color: Colors.textSecondary, fontSize: 14, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  rowEditing: { borderColor: Colors.primary },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  rowMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 8 },
  addBtnText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  form: { marginTop: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16 },
  formTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontSize: 15 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  typeChipText: { fontSize: 14, color: Colors.textSecondary },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim + '44' },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  cancelBtnText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600' },
});
