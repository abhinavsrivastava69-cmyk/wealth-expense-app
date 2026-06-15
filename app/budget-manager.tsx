import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { calculateBudgetDeviations, formatINR, formatINRFull, currentMonth, categoryLabel } from '@/lib/calculations';
import { ProgressBar } from '@/components/common/ProgressBar';
import type { ExpenseCategory } from '@/lib/types';

const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  'groceries','dining','shopping','entertainment','travel','medical','other',
];

export default function BudgetManagerScreen() {
  const { budgets, addBudget, updateBudget, expenses } = useStore();
  const month = currentMonth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const monthBudgets = budgets.filter(b => b.month === month);
  const deviations = calculateBudgetDeviations(month, expenses, budgets);

  const existingCategories = monthBudgets.map(b => b.category);
  const missingCategories = DEFAULT_CATEGORIES.filter(c => !existingCategories.includes(c));

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

  function addMissing(category: ExpenseCategory) {
    addBudget({ category, month, budgetAmount: 5000 });
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.headerText}>Set monthly spending limits per category. Actuals are tracked against these in real time.</Text>

      {monthBudgets.map(b => {
        const dev = deviations.find(d => d.category === b.category);
        const isEditing = editingId === b.id;

        return (
          <View key={b.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={styles.rowHeader}>
                <Text style={styles.rowCategory}>{categoryLabel(b.category)}</Text>
                <View style={styles.rowRight}>
                  {isEditing ? (
                    <View style={styles.editRow}>
                      <Text style={styles.rupee}>₹</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editValue}
                        onChangeText={setEditValue}
                        keyboardType="numeric"
                        autoFocus
                      />
                      <TouchableOpacity onPress={() => saveEdit(b.id)}>
                        <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setEditingId(null)}>
                        <Ionicons name="close-circle" size={22} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.budgetAmt}>{formatINR(b.budgetAmount)}</Text>
                      <TouchableOpacity onPress={() => startEdit(b.id, b.budgetAmount)}>
                        <Ionicons name="pencil-outline" size={16} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>

              {dev && (
                <>
                  <ProgressBar percentage={dev.percentage} height={5} />
                  <View style={styles.devRow}>
                    <Text style={[
                      styles.devText,
                      dev.status === 'exceeded' ? { color: Colors.danger } :
                      dev.status === 'warning' ? { color: Colors.warning } : { color: Colors.success },
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
          </View>
        );
      })}

      {missingCategories.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Add Budget for Category</Text>
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
  headerText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 20 },
  row: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rowCategory: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetAmt: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rupee: { fontSize: 16, color: Colors.textSecondary },
  editInput: {
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.primary,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    minWidth: 60,
    padding: 2,
  },
  devRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  devText: { fontSize: 12, fontWeight: '500' },
  overText: { fontSize: 12, color: Colors.danger, fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginTop: 20, marginBottom: 10 },
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
