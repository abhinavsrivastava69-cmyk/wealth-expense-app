import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { isoDate } from '@/lib/calculations';
import type { LiabilityType } from '@/lib/types';

export default function LiabilityFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { liabilities, addLiability, updateLiability, deleteLiability } = useStore();
  const existing = id ? liabilities.find(l => l.id === id) : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<LiabilityType>(existing?.type ?? 'short-term');
  const [principal, setPrincipal] = useState(existing?.principalRemaining.toString() ?? '');
  const [emi, setEmi] = useState(existing?.emiAmount.toString() ?? '');
  const [tenure, setTenure] = useState(existing?.tenureMonths.toString() ?? '');

  function handleSave() {
    const principalVal = parseFloat(principal);
    const emiVal = parseFloat(emi);
    const tenureVal = parseInt(tenure) || 0;

    if (!name.trim()) { Alert.alert('Name required'); return; }
    if (isNaN(principalVal) || principalVal < 0) { Alert.alert('Invalid principal'); return; }
    if (isNaN(emiVal) || emiVal < 0) { Alert.alert('Invalid EMI'); return; }

    const data = {
      name,
      type,
      principalRemaining: principalVal,
      emiAmount: emiVal,
      tenureMonths: tenureVal,
      startDate: isoDate(),
    };

    if (existing) {
      updateLiability(existing.id, data);
    } else {
      addLiability(data);
    }
    router.back();
  }

  function handleDelete() {
    Alert.alert('Delete Liability', `Remove "${existing?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteLiability(id!); router.back(); } },
    ]);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Type Toggle */}
      <Text style={styles.label}>Liability Type</Text>
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, type === 'short-term' && styles.toggleActive]}
          onPress={() => setType('short-term')}
        >
          <Text style={[styles.toggleText, type === 'short-term' && styles.toggleTextActive]}>Short-Term (≤ 3 yrs)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, type === 'long-term' && styles.toggleActive]}
          onPress={() => setType('long-term')}
        >
          <Text style={[styles.toggleText, type === 'long-term' && styles.toggleTextActive]}>Long-Term (> 3 yrs)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.typeNote}>
        <Ionicons name="information-circle-outline" size={14} color={Colors.info} />
        <Text style={styles.typeNoteText}>
          {type === 'long-term'
            ? 'Long-term liabilities appear in Full Balance Sheet only, not in Liquid View.'
            : 'Short-term liabilities appear in both balance sheet views.'}
        </Text>
      </View>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Home Loan, Personal Loan…"
        placeholderTextColor={Colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Principal Remaining (₹)</Text>
      <View style={styles.amountRow}>
        <Text style={styles.rupee}>₹</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          value={principal}
          onChangeText={setPrincipal}
        />
      </View>

      <Text style={styles.label}>Monthly EMI (₹)</Text>
      <View style={styles.amountRow}>
        <Text style={styles.rupee}>₹</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          value={emi}
          onChangeText={setEmi}
        />
      </View>

      <Text style={styles.label}>Tenure Remaining (months)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 240"
        placeholderTextColor={Colors.textMuted}
        keyboardType="numeric"
        value={tenure}
        onChangeText={setTenure}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{existing ? 'Update Liability' : 'Add Liability'}</Text>
      </TouchableOpacity>

      {existing && (
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={16} color={Colors.danger} />
          <Text style={styles.deleteBtnText}>Delete Liability</Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 20 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleActive: { backgroundColor: Colors.danger },
  toggleText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: Colors.textPrimary },
  typeNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.infoDim,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  typeNoteText: { flex: 1, fontSize: 12, color: Colors.info, lineHeight: 17 },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 15,
  },
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
  rupee: { fontSize: 24, color: Colors.textSecondary, marginRight: 4 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 12,
  },
  deleteBtnText: { fontSize: 15, color: Colors.danger, fontWeight: '600' },
});
