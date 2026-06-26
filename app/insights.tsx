import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { currentMonth } from '@/lib/calculations';
import { generateInsights, type Insight } from '@/lib/insights';

const SEVERITY: Record<Insight['severity'], { color: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  good:    { color: Colors.success, icon: 'checkmark-circle' },
  info:    { color: Colors.info,    icon: 'information-circle' },
  warning: { color: Colors.warning, icon: 'alert-circle' },
  danger:  { color: Colors.danger,  icon: 'warning' },
};

export default function InsightsScreen() {
  const { incomes, expenses, liabilities, billingCycles, cards, settings } = useStore();
  const month = currentMonth();
  const insights = generateInsights({ month, incomes, expenses, liabilities, billingCycles, cards, settings });

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="sparkles" size={22} color={Colors.accent} />
        </View>
        <Text style={styles.heroTitle}>Spending Insights</Text>
        <Text style={styles.heroSub}>On-device engine. Learns from your history — no data leaves your phone.</Text>
      </View>

      {insights.map(ins => {
        const s = SEVERITY[ins.severity];
        return (
          <View key={ins.id} style={[styles.card, { borderLeftColor: s.color }]}>
            <View style={styles.cardHead}>
              <Ionicons name={s.icon} size={18} color={s.color} />
              <Text style={styles.cardTitle}>{ins.title}</Text>
            </View>
            <Text style={styles.cardDetail}>{ins.detail}</Text>
          </View>
        );
      })}

      <Text style={styles.footnote}>Insights evolve as you log more expenses and credits.</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  hero: { alignItems: 'center', marginBottom: 20 },
  heroIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.accent + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  heroSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 6, paddingHorizontal: 12 },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  cardDetail: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  footnote: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 12 },
});
