import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/common/Card';
import { StatRow } from '@/components/common/StatRow';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ProgressBar } from '@/components/common/ProgressBar';
import { NudgeCard } from '@/components/common/NudgeCard';
import {
  calculateMonthlySnapshot,
  calculatePayingCapacity,
  calculateBudgetDeviations,
  generateGuidanceNudges,
  formatINR,
  formatINRFull,
  currentMonth,
  monthLabel,
  categoryLabel,
} from '@/lib/calculations';

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const store = useStore();
  const month = currentMonth();

  const snapshot = calculateMonthlySnapshot(
    month,
    store.incomes,
    store.expenses,
    store.liabilities,
    store.billingCycles,
    store.deferredExpenses
  );

  const monthExpenses = store.expenses.filter(e => e.month === month);
  const capacity = calculatePayingCapacity(
    snapshot.totalIncome,
    store.liabilities,
    monthExpenses
  );

  const deviations = calculateBudgetDeviations(month, store.expenses, store.budgets);

  const bonusIncome = store.incomes
    .filter(i => i.month === month && i.type === 'bonus')
    .reduce((s, i) => s + i.amount, 0);

  const nudges = generateGuidanceNudges(
    snapshot,
    deviations,
    store.billingCycles,
    store.deferredExpenses,
    bonusIncome || undefined
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const surplusColor = snapshot.surplus >= 0 ? Colors.success : Colors.danger;

  const isNewUser =
    store.assets.length === 0 &&
    store.liabilities.length === 0 &&
    store.incomes.length === 0 &&
    store.expenses.length === 0 &&
    store.cards.length === 0 &&
    store.budgets.length === 0;

  const setupSteps: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; desc: string; route: string }[] = [
    { icon: 'trending-up', label: 'Add your assets & loans', desc: 'Build your net worth picture', route: '/(tabs)/wealth' },
    { icon: 'cash', label: 'Record income', desc: 'Salary, credits & gifts', route: '/income-manager' },
    { icon: 'card', label: 'Add your cards', desc: 'Track billing cycles', route: '/cards-manager' },
    { icon: 'pie-chart', label: 'Set budgets', desc: 'Fixed commitments & limits', route: '/budget-manager' },
    { icon: 'add-circle', label: 'Log an expense', desc: 'Start tracking spend', route: '/expense-entry' },
  ];

  if (isNewUser) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome</Text>
            <Text style={styles.subgreeting}>Let&apos;s set up your finances</Text>
          </View>
        </View>

        <Card style={styles.heroCard}>
          <Text style={styles.heroLabel}>Net Worth</Text>
          <Text style={styles.heroValue}>{formatINRFull(0)}</Text>
          <Text style={styles.emptyHint}>
            Your dashboard is empty. Add your details below and your numbers will appear here.
          </Text>
        </Card>

        <SectionHeader title="Get Started" />
        {setupSteps.map((s, i) => (
          <TouchableOpacity key={s.route} onPress={() => router.push(s.route as any)}>
            <Card style={styles.setupRow}>
              <View style={[styles.setupIcon, { backgroundColor: Colors.primaryDim + '55' }]}>
                <Ionicons name={s.icon} size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.setupLabel}>{`${i + 1}. ${s.label}`}</Text>
                <Text style={styles.setupDesc}>{s.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Card>
          </TouchableOpacity>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Financial Dashboard</Text>
          <Text style={styles.subgreeting}>{monthLabel(month)}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/expense-entry')}
        >
          <Ionicons name="add" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Net Worth Hero */}
      <Card style={styles.heroCard}>
        <Text style={styles.heroLabel}>Net Worth</Text>
        <Text style={styles.heroValue}>
          {formatINRFull(
            store.assets.reduce((s, a) => s + a.value, 0) -
            store.liabilities.reduce((s, l) => s + l.principalRemaining, 0)
          )}
        </Text>
        <View style={styles.heroRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Assets</Text>
            <Text style={[styles.heroStatValue, { color: Colors.success }]}>
              {formatINR(store.assets.reduce((s, a) => s + a.value, 0))}
            </Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Liabilities</Text>
            <Text style={[styles.heroStatValue, { color: Colors.danger }]}>
              {formatINR(store.liabilities.reduce((s, l) => s + l.principalRemaining, 0))}
            </Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Surplus</Text>
            <Text style={[styles.heroStatValue, { color: surplusColor }]}>
              {formatINR(snapshot.surplus)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Monthly Overview */}
      <SectionHeader title="Monthly Overview" />
      <Card>
        <StatRow label="Total Income" value={formatINR(snapshot.totalIncome)} />
        <View style={styles.divider} />
        <StatRow
          label="Fixed Obligations"
          value={`-${formatINR(snapshot.fixedObligations)}`}
          valueColor={Colors.warning}
        />
        <StatRow
          label="Variable Spend"
          value={`-${formatINR(snapshot.variableSpend)}`}
          valueColor={Colors.warning}
        />
        <View style={styles.divider} />
        <StatRow
          label="Surplus / Deficit"
          value={formatINR(snapshot.surplus)}
          valueColor={surplusColor}
        />
        <StatRow
          label="Savings Rate"
          value={`${snapshot.savingsRate.toFixed(1)}%`}
          valueColor={snapshot.savingsRate > 20 ? Colors.success : Colors.warning}
        />
        {snapshot.debtPosition > 0 && (
          <StatRow
            label="Rolled-Over Debt"
            value={formatINR(snapshot.debtPosition)}
            valueColor={Colors.danger}
          />
        )}
      </Card>

      {/* Paying Capacity */}
      <SectionHeader title="Paying Capacity" />
      <Card>
        <View style={styles.capacityRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.capacityLabel}>Available for Variable</Text>
            <Text style={styles.capacityValue}>{formatINR(capacity.availableForVariable)}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.capacityLabel}>Committed</Text>
            <Text style={[styles.capacityValue, { color: capacity.isBreached ? Colors.danger : Colors.textPrimary }]}>
              {formatINR(capacity.currentVariableCommitted)}
            </Text>
          </View>
        </View>
        <View style={{ marginTop: 10 }}>
          <ProgressBar
            percentage={(capacity.currentVariableCommitted / Math.max(capacity.availableForVariable, 1)) * 100}
            height={8}
          />
        </View>
        <View style={styles.bufferRow}>
          <Ionicons
            name={capacity.buffer >= 0 ? 'shield-checkmark' : 'shield-outline'}
            size={16}
            color={capacity.buffer >= 0 ? Colors.success : Colors.danger}
          />
          <Text style={[styles.bufferText, { color: capacity.buffer >= 0 ? Colors.success : Colors.danger }]}>
            {capacity.buffer >= 0
              ? `Buffer: ${formatINR(capacity.buffer)}`
              : `Overspent by ${formatINR(Math.abs(capacity.buffer))}`}
          </Text>
        </View>
      </Card>

      {/* Budget Deviations */}
      {deviations.length > 0 && (
        <>
          <SectionHeader
            title="Budget Tracker"
            action="Manage"
            onAction={() => router.push('/budget-manager')}
          />
          <Card>
            {deviations.map((d, i) => (
              <View key={d.category} style={[styles.budgetRow, i < deviations.length - 1 && { marginBottom: 12 }]}>
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetCategory}>{categoryLabel(d.category)}</Text>
                  <Text style={[
                    styles.budgetPct,
                    d.status === 'exceeded' ? { color: Colors.danger } :
                    d.status === 'warning' ? { color: Colors.warning } : { color: Colors.success }
                  ]}>
                    {d.percentage.toFixed(0)}%
                  </Text>
                </View>
                <ProgressBar percentage={d.percentage} height={5} />
                <View style={styles.budgetAmounts}>
                  <Text style={styles.budgetActual}>{formatINR(d.actual)}</Text>
                  <Text style={styles.budgetTotal}>of {formatINR(d.budget)}</Text>
                </View>
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Guidance Nudges */}
      {nudges.length > 0 && (
        <>
          <SectionHeader title="Smart Guidance" />
          {nudges.map((nudge, i) => (
            <NudgeCard key={i} nudge={nudge} />
          ))}
        </>
      )}

      {/* Quick Actions */}
      <SectionHeader title="Quick Actions" />
      <View style={styles.quickActions}>
        <QuickAction icon="add-circle" label="Add Expense" color={Colors.primary} onPress={() => router.push('/expense-entry')} />
        <QuickAction icon="card" label="Cards" color={Colors.cardHDFC} onPress={() => router.push('/(tabs)/cards')} />
        <QuickAction icon="trending-up" label="Wealth" color={Colors.success} onPress={() => router.push('/(tabs)/wealth')} />
        <QuickAction icon="calendar" label="Bonus Plan" color={Colors.accent} onPress={() => router.push('/bonus-planner')} />
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function QuickAction({ icon, label, color, onPress }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.qaBtn} onPress={onPress}>
      <View style={[styles.qaIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.qaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  subgreeting: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    marginBottom: 20,
    borderColor: Colors.primaryDim,
    borderWidth: 1.5,
  },
  heroLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  heroValue: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 },
  emptyHint: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  setupRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  setupIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  setupLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  setupDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  heroStatValue: { fontSize: 16, fontWeight: '700' },
  heroDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  capacityRow: { flexDirection: 'row', marginBottom: 4 },
  capacityLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  capacityValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  bufferRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  bufferText: { fontSize: 13, fontWeight: '600' },
  budgetRow: {},
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  budgetCategory: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  budgetPct: { fontSize: 12, fontWeight: '700' },
  budgetAmounts: { flexDirection: 'row', gap: 4, marginTop: 3 },
  budgetActual: { fontSize: 11, color: Colors.textPrimary },
  budgetTotal: { fontSize: 11, color: Colors.textMuted },
  quickActions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  qaBtn: { alignItems: 'center', width: '22%' },
  qaIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  qaLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
});
