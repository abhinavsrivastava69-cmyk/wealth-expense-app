import { ScrollView, View, Text, StyleSheet, TouchableOpacity, SectionList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/common/Card';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Badge } from '@/components/common/Badge';
import { formatINR, categoryLabel, currentMonth, monthLabel } from '@/lib/calculations';
import type { Expense } from '@/lib/types';

const categoryIcon: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  groceries: 'basket-outline',
  dining: 'restaurant-outline',
  shopping: 'bag-handle-outline',
  entertainment: 'film-outline',
  travel: 'airplane-outline',
  medical: 'medkit-outline',
  fixed: 'home-outline',
  'one-time': 'star-outline',
  sip: 'trending-up-outline',
  rd: 'save-outline',
  other: 'ellipsis-horizontal-outline',
};

const categoryColor: Record<string, string> = {
  groceries: Colors.success,
  dining: Colors.warning,
  shopping: Colors.primary,
  entertainment: Colors.accent,
  travel: Colors.info,
  medical: Colors.danger,
  fixed: Colors.textSecondary,
  'one-time': Colors.warning,
  sip: Colors.success,
  rd: Colors.success,
  other: Colors.textMuted,
};

export default function ExpensesScreen() {
  const router = useRouter();
  const { expenses, deleteExpense } = useStore();
  const month = currentMonth();

  const monthExpenses = expenses
    .filter(e => e.month === month)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalSpend = monthExpenses
    .filter(e => e.expenseType !== 'deferred-bonus' && !['sip','rd'].includes(e.category as string))
    .reduce((s, e) => s + e.amount, 0);

  const sipRdTotal = monthExpenses
    .filter(e => ['sip','rd'].includes(e.category as string))
    .reduce((s, e) => s + e.amount, 0);

  // Group by date
  const grouped: Record<string, Expense[]> = {};
  for (const e of monthExpenses) {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  }

  const sections = Object.entries(grouped).map(([date, data]) => ({
    title: formatDateLabel(date),
    data,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Spend</Text>
          <Text style={styles.summaryValue}>{formatINR(totalSpend)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>SIP / RD</Text>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>{formatINR(sipRdTotal)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Entries</Text>
          <Text style={styles.summaryValue}>{monthExpenses.length}</Text>
        </View>
      </View>

      {monthExpenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No expenses yet</Text>
          <Text style={styles.emptySubtext}>{monthLabel(month)}</Text>
          <TouchableOpacity
            style={styles.addFirstBtn}
            onPress={() => router.push('/expense-entry')}
          >
            <Text style={styles.addFirstText}>Add First Expense</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionDate}>{section.title}</Text>
          )}
          renderItem={({ item: e }) => (
            <View style={styles.expenseCard}>
              <View style={[styles.expIcon, { backgroundColor: (categoryColor[e.category] ?? Colors.primary) + '22' }]}>
                <Ionicons
                  name={categoryIcon[e.category] ?? 'ellipsis-horizontal-outline'}
                  size={18}
                  color={categoryColor[e.category] ?? Colors.primary}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={styles.expRow}>
                  <Text style={styles.expCategory}>{categoryLabel(e.category as any)}</Text>
                  <Text style={[
                    styles.expAmount,
                    ['sip','rd'].includes(e.category as string) ? { color: Colors.success } : null,
                    e.expenseType === 'deferred-bonus' ? { color: Colors.accent } : null,
                  ]}>
                    {formatINR(e.amount)}
                  </Text>
                </View>
                <View style={styles.expMeta}>
                  <Text style={styles.expCard}>{e.cardId}</Text>
                  <Text style={styles.expPayer}>· {e.paidBy}</Text>
                  {e.note && <Text style={styles.expNote} numberOfLines={1}>· {e.note}</Text>}
                </View>
                {e.expenseType === 'deferred-bonus' && (
                  <Badge label="Deferred to Bonus" variant="default" />
                )}
                {['sip','rd'].includes(e.category as string) && (
                  <Badge label="Adds to Assets" variant="success" />
                )}
              </View>
              <TouchableOpacity onPress={() => deleteExpense(e.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/expense-entry')}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  summaryValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  summaryDivider: { width: 1, backgroundColor: Colors.border },
  listContent: { padding: 16, paddingBottom: 90 },
  sectionDate: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginTop: 12, marginBottom: 6 },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  expRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expCategory: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  expAmount: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  expMeta: { flexDirection: 'row', marginTop: 2, flexWrap: 'wrap' },
  expCard: { fontSize: 11, color: Colors.textMuted },
  expPayer: { fontSize: 11, color: Colors.textMuted },
  expNote: { fontSize: 11, color: Colors.textMuted, flex: 1 },
  deleteBtn: { padding: 6 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 16 },
  emptySubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  addFirstBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 20 },
  addFirstText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
