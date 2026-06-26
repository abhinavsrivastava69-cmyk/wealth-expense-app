import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { monthLabel } from '@/lib/calculations';
import { nextBonusMonth } from '@/lib/insights';

const QUARTERS = [
  { label: 'JFM', endMonth: 2 },
  { label: 'AMJ', endMonth: 5 },
  { label: 'JAS', endMonth: 8 },
  { label: 'OND', endMonth: 11 },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const OFFSETS = [0, 1, 2, 3];

export default function BonusSettingsScreen() {
  const { settings, updateSettings } = useStore();
  const offset = settings.bonusPayoutOffsetMonths;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="sync-outline" size={22} color={Colors.accent} />
        </View>
        <Text style={styles.heroTitle}>Bonus Cycle</Text>
        <Text style={styles.heroSub}>When do you receive your quarterly bonus, relative to the quarter end?</Text>
      </View>

      <Text style={styles.label}>Payout Offset</Text>
      {OFFSETS.map(o => (
        <TouchableOpacity
          key={o}
          style={[styles.row, offset === o && styles.rowActive]}
          onPress={() => updateSettings({ bonusPayoutOffsetMonths: o })}
        >
          <Text style={[styles.rowTitle, offset === o && { color: Colors.accent }]}>
            {o === 0 ? 'Same month as quarter end' : `${o} month${o > 1 ? 's' : ''} after quarter end`}
          </Text>
          {offset === o && <Ionicons name="checkmark-circle" size={20} color={Colors.accent} style={{ marginLeft: 'auto' }} />}
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Payout Schedule</Text>
      <View style={styles.scheduleCard}>
        {QUARTERS.map(q => {
          const payoutMonth = (q.endMonth + offset) % 12;
          return (
            <View key={q.label} style={styles.scheduleRow}>
              <Text style={styles.qLabel}>{q.label}</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
              <Text style={styles.qPayout}>{MONTH_NAMES[payoutMonth]}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.nextCard}>
        <Text style={styles.nextLabel}>Next bonus expected</Text>
        <Text style={styles.nextValue}>{monthLabel(nextBonusMonth(settings))}</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  hero: { alignItems: 'center', marginBottom: 16 },
  heroIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.accent + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  heroSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 6, paddingHorizontal: 12 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 24 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, marginBottom: 8 },
  rowActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '11' },
  rowTitle: { fontSize: 15, color: Colors.textPrimary },
  scheduleCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 8 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12 },
  qLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, width: 48 },
  qPayout: { fontSize: 14, color: Colors.accent, fontWeight: '600' },
  nextCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 20, alignItems: 'center', marginTop: 24 },
  nextLabel: { fontSize: 13, color: Colors.textSecondary },
  nextValue: { fontSize: 24, fontWeight: '800', color: Colors.accent, marginTop: 6 },
});
