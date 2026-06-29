import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { currentMonth, isoDate, categoryLabel } from '@/lib/calculations';
import { CalendarPicker } from '@/components/CalendarPicker';
import type { ExpenseCategory, ExpenseType, Earner, PaymentMethod } from '@/lib/types';

const CATEGORIES: ExpenseCategory[] = [
  'groceries','dining','shopping','entertainment','travel','medical','one-time','other',
];
// SIP and RD treated as special categories
const INVESTMENT_CATS = ['sip', 'rd'] as const;

const EXPENSE_TYPES: { value: ExpenseType; label: string }[] = [
  { value: 'regular', label: 'Regular' },
  { value: 'surprise', label: 'Surprise / One-time' },
  { value: 'deferred-bonus', label: 'Defer to Bonus Month' },
];

function Chip({
  label,
  selected,
  onPress,
  color,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && { backgroundColor: (color ?? Colors.primary) + '33', borderColor: color ?? Colors.primary },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && { color: color ?? Colors.primary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function displayDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  if (diff === 0) return `Today · ${label}`;
  if (diff === -1) return `Yesterday · ${label}`;
  return label;
}

export default function ExpenseEntryScreen() {
  const router = useRouter();
  const store = useStore();
  const month = currentMonth();

  // Support pre-fill via URL params (for iOS Shortcuts integration)
  const params = useLocalSearchParams<{ amount?: string; note?: string; category?: string }>();

  const [entryMode, setEntryMode] = useState<'expense' | 'credit'>('expense');
  const [creditLabel, setCreditLabel] = useState('');
  const [amount, setAmount] = useState(params.amount ?? '');
  const [category, setCategory] = useState<string>(params.category ?? 'groceries');
  const [card, setCard] = useState<PaymentMethod>('UPI');
  const [paidBy, setPaidBy] = useState<Earner>('Abhinav');
  const [expenseType, setExpenseType] = useState<ExpenseType>('regular');
  const [note, setNote] = useState(params.note ?? '');
  const [date, setDate] = useState(isoDate());
  const [showCalendar, setShowCalendar] = useState(false);
  const [sipAssetId, setSipAssetId] = useState<string>('');

  const isInvestment = category === 'sip' || category === 'rd';

  // Payment methods: user's cards (incl. custom) + UPI / Cash
  const paymentMethods: PaymentMethod[] = [
    ...store.cards.map(c => c.name),
    'UPI',
    'Cash',
  ];

  function handleSubmit() {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive amount.');
      return;
    }

    // Credit / money received (gift, freelance, reimbursement…)
    if (entryMode === 'credit') {
      store.addIncome({
        earner: paidBy,
        month: date.slice(0, 7),
        amount: amt,
        type: 'credit',
        ...(creditLabel.trim() ? { label: creditLabel.trim() } : {}),
      });
      router.back();
      return;
    }

    // Add expense
    store.addExpense({
      amount: amt,
      category: category as ExpenseCategory,
      cardId: card,
      paidBy,
      date,
      expenseType: isInvestment ? 'regular' : expenseType,
      note,
      month,
    });

    // If SIP/RD, also update the corresponding asset value
    if (isInvestment && sipAssetId) {
      const asset = store.assets.find(a => a.id === sipAssetId);
      if (asset) {
        store.updateAsset(sipAssetId, {
          value: asset.value + amt,
          updatedAt: isoDate(),
        });
      }
    } else if (isInvestment && !sipAssetId) {
      // Auto-create or find matching asset
      const existingAsset = store.assets.find(a =>
        category === 'sip'
          ? a.assetClass === 'market-linked' && a.name.toLowerCase().includes('mutual')
          : a.assetClass === 'fixed-income' && a.name.toLowerCase().includes('deposit')
      );
      if (existingAsset) {
        store.updateAsset(existingAsset.id, {
          value: existingAsset.value + amt,
          updatedAt: isoDate(),
        });
      } else {
        store.addAsset({
          name: category === 'sip' ? 'SIP Investments' : 'Recurring Deposits',
          platform: category === 'sip' ? 'Groww MF' : 'Bank / NBFC',
          value: amt,
          assetClass: category === 'sip' ? 'market-linked' : 'fixed-income',
          updatedAt: isoDate(),
        });
      }
    }

    router.back();
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Mode: Expense vs Money In (credit) */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, entryMode === 'expense' && styles.modeActiveOut]}
          onPress={() => setEntryMode('expense')}
        >
          <Ionicons name="arrow-up-circle" size={17} color={entryMode === 'expense' ? Colors.danger : Colors.textMuted} />
          <Text style={[styles.modeText, entryMode === 'expense' && { color: Colors.danger }]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, entryMode === 'credit' && styles.modeActiveIn]}
          onPress={() => setEntryMode('credit')}
        >
          <Ionicons name="arrow-down-circle" size={17} color={entryMode === 'credit' ? Colors.success : Colors.textMuted} />
          <Text style={[styles.modeText, entryMode === 'credit' && { color: Colors.success }]}>Money In</Text>
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <Text style={styles.label}>Amount (₹)</Text>
      <View style={styles.amountRow}>
        <Text style={styles.rupee}>₹</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          autoFocus
        />
      </View>

      {/* Credit-only: From / Reason */}
      {entryMode === 'credit' && (
        <>
          <Text style={styles.label}>From / Reason</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="e.g. Gift from Dad, Freelance, Reimbursement"
            placeholderTextColor={Colors.textMuted}
            value={creditLabel}
            onChangeText={setCreditLabel}
          />
        </>
      )}

      {/* Category */}
      {entryMode === 'expense' && (
      <>
      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {CATEGORIES.map(c => (
          <Chip key={c} label={categoryLabel(c)} selected={category === c} onPress={() => setCategory(c)} />
        ))}
        <Chip label="SIP" selected={category === 'sip'} onPress={() => setCategory('sip')} color={Colors.success} />
        <Chip label="RD" selected={category === 'rd'} onPress={() => setCategory('rd')} color={Colors.success} />
      </ScrollView>

      {/* SIP/RD Asset Picker */}
      {isInvestment && (
        <View style={styles.investmentNote}>
          <Ionicons name="trending-up" size={16} color={Colors.success} />
          <Text style={styles.investmentText}>
            This amount will be counted as an expense AND automatically added to your assets.
          </Text>
        </View>
      )}
      {isInvestment && store.assets.length > 0 && (
        <>
          <Text style={styles.label}>Link to Asset (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <Chip label="Auto" selected={sipAssetId === ''} onPress={() => setSipAssetId('')} />
            {store.assets.map(a => (
              <Chip
                key={a.id}
                label={a.name}
                selected={sipAssetId === a.id}
                onPress={() => setSipAssetId(a.id)}
                color={Colors.success}
              />
            ))}
          </ScrollView>
        </>
      )}

      {/* Payment Method */}
      <Text style={styles.label}>Paid Via</Text>
      <View style={styles.chipWrap}>
        {paymentMethods.map(m => (
          <Chip key={m} label={m} selected={card === m} onPress={() => setCard(m)} />
        ))}
      </View>
      </>
      )}

      {/* Paid By / Received By */}
      <Text style={styles.label}>{entryMode === 'credit' ? 'Received By' : 'Paid By'}</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.earnerBtn, paidBy === 'Abhinav' && styles.earnerActive]}
          onPress={() => setPaidBy('Abhinav')}
        >
          <Ionicons name="person" size={16} color={paidBy === 'Abhinav' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.earnerText, paidBy === 'Abhinav' && { color: Colors.primary }]}>Abhinav</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.earnerBtn, paidBy === 'Manasvi' && styles.earnerActive]}
          onPress={() => setPaidBy('Manasvi')}
        >
          <Ionicons name="person" size={16} color={paidBy === 'Manasvi' ? Colors.accent : Colors.textMuted} />
          <Text style={[styles.earnerText, paidBy === 'Manasvi' && { color: Colors.accent }]}>Manasvi</Text>
        </TouchableOpacity>
      </View>

      {/* Expense Type */}
      {entryMode === 'expense' && !isInvestment && (
        <>
          <Text style={styles.label}>Expense Type</Text>
          <View style={styles.chipWrap}>
            {EXPENSE_TYPES.map(t => (
              <Chip key={t.value} label={t.label} selected={expenseType === t.value} onPress={() => setExpenseType(t.value)} />
            ))}
          </View>
          {expenseType === 'deferred-bonus' && (
            <View style={styles.deferNote}>
              <Ionicons name="calendar" size={14} color={Colors.accent} />
              <Text style={styles.deferText}>
                This expense will be removed from current month cashflow and tracked in the Bonus Month Planner.
              </Text>
            </View>
          )}
        </>
      )}

      {/* Date */}
      <Text style={styles.label}>Date</Text>
      <TouchableOpacity style={styles.dateDisplay} onPress={() => setShowCalendar(true)}>
        <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
        <Text style={styles.dateText}>{displayDate(date)}</Text>
        <Ionicons name="chevron-down" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      <CalendarPicker
        visible={showCalendar}
        value={date}
        maxDate={isoDate()}
        onSelect={setDate}
        onClose={() => setShowCalendar(false)}
      />

      {/* Note */}
      {entryMode === 'expense' && (
        <>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="e.g. Monthly groceries, Zomato dinner…"
            placeholderTextColor={Colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
          />
        </>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, entryMode === 'credit' && { backgroundColor: Colors.success }]}
        onPress={handleSubmit}
      >
        <Ionicons name="checkmark-circle" size={20} color="#fff" />
        <Text style={styles.submitText}>{entryMode === 'credit' ? 'Log Credit' : 'Log Expense'}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeActiveOut: { borderColor: Colors.danger, backgroundColor: Colors.danger + '1A' },
  modeActiveIn: { borderColor: Colors.success, backgroundColor: Colors.success + '1A' },
  modeText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 20 },
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
  rupee: { fontSize: 28, color: Colors.textSecondary, marginRight: 4 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '800', color: Colors.textPrimary },
  chipScroll: { flexDirection: 'row', marginBottom: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    marginBottom: 4,
  },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 12 },
  earnerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  earnerActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim + '44' },
  earnerText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  deferNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.accent + '22',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  deferText: { flex: 1, fontSize: 12, color: Colors.accent, lineHeight: 17 },
  investmentNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.successDim,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  investmentText: { flex: 1, fontSize: 12, color: Colors.success, lineHeight: 17 },
  noteInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  dateText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 24,
  },
  submitText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
