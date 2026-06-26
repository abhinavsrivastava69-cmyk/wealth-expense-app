import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { SectionHeader } from '@/components/common/SectionHeader';
import { formatINR, formatINRFull } from '@/lib/calculations';
import type { BillingCycle } from '@/lib/types';

function cardColor(name: string): string {
  const map: Record<string, string> = {
    ICICI: Colors.cardICICI,
    HDFC: Colors.cardHDFC,
    Scapia: Colors.cardScapia,
    SBI: Colors.cardSBI,
    IDFC: Colors.cardIDFC,
  };
  return map[name] ?? Colors.primary;
}

function cycleBadge(cycle?: BillingCycle): { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' } {
  if (!cycle) return { label: 'No Cycle', variant: 'default' };
  if (cycle.status === 'paid') return { label: 'Paid', variant: 'success' };
  if (cycle.status === 'rolled') return { label: 'Rolled Over', variant: 'danger' };
  if (cycle.status === 'locked') return { label: 'Bill Due', variant: 'warning' };
  return { label: 'Open', variant: 'info' };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function CardsScreen() {
  const router = useRouter();
  const { cards, billingCycles, expenses } = useStore();

  const totalDebt = billingCycles
    .filter(c => c.status === 'rolled')
    .reduce((sum, c) => sum + (c.totalSpend - (c.amountPaid ?? 0)), 0);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Debt Summary */}
      {totalDebt > 0 && (
        <View style={[styles.debtBanner, { borderColor: Colors.danger }]}>
          <Ionicons name="alert-circle" size={18} color={Colors.danger} />
          <Text style={styles.debtText}>
            Total Rolled-Over Debt: <Text style={{ fontWeight: '800', color: Colors.danger }}>{formatINRFull(totalDebt)}</Text>
          </Text>
        </View>
      )}

      {/* Cards */}
      <SectionHeader title="Your Cards" />
      {cards.map(card => {
        const currentCycle = billingCycles
          .filter(c => c.cardId === card.id && c.status !== 'paid')
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

        const nextCycle = billingCycles
          .filter(c => c.cardId === card.id && c.status === 'open')
          .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[1];

        const badge = cycleBadge(currentCycle);
        const color = card.color ?? cardColor(card.name);

        const cardExpenses = expenses.filter(
          e => e.cardId === card.name && currentCycle && e.cycleId === currentCycle.id
        );
        const recentExpenses = cardExpenses.slice(-3);

        return (
          <Card key={card.id} style={[styles.cardItem, { borderLeftColor: color, borderLeftWidth: 4 }]}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: color + '22' }]}>
                <Ionicons name="card" size={20} color={color} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.cardName}>{card.name}</Text>
                <Text style={styles.cardNetwork}>{card.network}</Text>
              </View>
              <Badge label={badge.label} variant={badge.variant} />
            </View>

            {/* Cycle Info */}
            {currentCycle && (
              <View style={styles.cycleInfo}>
                <View style={styles.cycleDetail}>
                  <Text style={styles.cycleLabel}>Cycle Cuts</Text>
                  <Text style={styles.cycleValue}>{card.cutDate}th</Text>
                </View>
                <View style={styles.cycleDetail}>
                  <Text style={styles.cycleLabel}>Bill Due</Text>
                  <Text style={styles.cycleValue}>{formatDate(currentCycle.billDueDate)}</Text>
                </View>
                <View style={styles.cycleDetail}>
                  <Text style={styles.cycleLabel}>Current Spend</Text>
                  <Text style={[styles.cycleValue, { color }]}>{formatINR(currentCycle.totalSpend)}</Text>
                </View>
              </View>
            )}

            {/* Deferred Spend Note */}
            {nextCycle && nextCycle.totalSpend > 0 && (
              <View style={styles.deferredNote}>
                <Ionicons name="time-outline" size={14} color={Colors.warning} />
                <Text style={styles.deferredText}>
                  Deferred to next bill: {formatINR(nextCycle.totalSpend)}
                </Text>
              </View>
            )}

            {/* Recent Expenses */}
            {recentExpenses.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.recentTitle}>Recent</Text>
                {recentExpenses.map(e => (
                  <View key={e.id} style={styles.expenseRow}>
                    <Text style={styles.expenseNote} numberOfLines={1}>{e.note || e.category}</Text>
                    <Text style={styles.expenseAmount}>{formatINR(e.amount)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Resolve Button for locked cycles */}
            {currentCycle?.status === 'locked' && currentCycle.paymentResolution === 'pending' && (
              <TouchableOpacity
                style={styles.resolveBtn}
                onPress={() => router.push({ pathname: '/rollover', params: { cycleId: currentCycle.id } })}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.warning} />
                <Text style={styles.resolveBtnText}>Resolve Bill Payment</Text>
              </TouchableOpacity>
            )}
          </Card>
        );
      })}

      {/* Billing Cycle Architecture Note */}
      <SectionHeader title="Cycle Reference" />
      <Card elevated>
        <Text style={styles.noteTitle}>How billing cycles work</Text>
        <Text style={styles.noteText}>
          Charges added immediately after your card's cut date won't appear on the next bill — they're deferred to the bill after next. The app tracks this as "deferred spend" and shows it as a pending liability.
        </Text>
        <View style={{ height: 10 }} />
        {cards.map(card => (
          <View key={card.id} style={styles.cycleRefRow}>
            <View style={[styles.dot, { backgroundColor: card.color ?? cardColor(card.name) }]} />
            <Text style={styles.cycleRefName}>{card.name}</Text>
            <Text style={styles.cycleRefText}>Cut: {card.cutDate}th · Due: {card.billDate}th</Text>
          </View>
        ))}
      </Card>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  debtBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerDim,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  debtText: { flex: 1, fontSize: 13, color: Colors.danger },
  cardItem: { marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardNetwork: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  cycleInfo: { flexDirection: 'row', backgroundColor: Colors.background, borderRadius: 10, padding: 10, marginBottom: 8 },
  cycleDetail: { flex: 1, alignItems: 'center' },
  cycleLabel: { fontSize: 10, color: Colors.textMuted, marginBottom: 2 },
  cycleValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  deferredNote: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  deferredText: { fontSize: 12, color: Colors.warning },
  recentSection: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4 },
  recentTitle: { fontSize: 11, color: Colors.textMuted, marginBottom: 6, fontWeight: '600', textTransform: 'uppercase' },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  expenseNote: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  expenseAmount: { fontSize: 12, color: Colors.textPrimary, fontWeight: '600' },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.warningDim,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    justifyContent: 'center',
  },
  resolveBtnText: { color: Colors.warning, fontWeight: '700', fontSize: 13 },
  noteTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  noteText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: 4 },
  cycleRefRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cycleRefName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, width: 60 },
  cycleRefText: { fontSize: 12, color: Colors.textSecondary },
});
