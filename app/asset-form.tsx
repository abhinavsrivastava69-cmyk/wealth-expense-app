import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { isoDate } from '@/lib/calculations';
import type { AssetClass } from '@/lib/types';

const ASSET_CLASSES: { value: AssetClass; label: string; color: string }[] = [
  { value: 'market-linked', label: 'Market-Linked', color: Colors.primary },
  { value: 'commodity',     label: 'Commodity',     color: Colors.warning },
  { value: 'fixed-income',  label: 'Fixed Income',  color: Colors.success },
  { value: 'liquid',        label: 'Liquid',         color: Colors.info },
  { value: 'custom',        label: 'Custom',         color: Colors.accent },
];

const PLATFORMS = ['Groww MF', 'Groww Stocks', 'Paytm Gold', 'HDFC Bank', 'SBI Bank', 'Zerodha', 'Other'];

export default function AssetFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { assets, addAsset, updateAsset, deleteAsset } = useStore();
  const existing = id ? assets.find(a => a.id === id) : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [platform, setPlatform] = useState(existing?.platform ?? '');
  const [value, setValue] = useState(existing?.value.toString() ?? '');
  const [assetClass, setAssetClass] = useState<AssetClass>(existing?.assetClass ?? 'liquid');

  function handleSave() {
    const val = parseFloat(value);
    if (!name.trim()) { Alert.alert('Name required'); return; }
    if (isNaN(val) || val < 0) { Alert.alert('Invalid value'); return; }

    if (existing) {
      updateAsset(existing.id, { name, platform, value: val, assetClass, updatedAt: isoDate() });
    } else {
      addAsset({ name, platform, value: val, assetClass, updatedAt: isoDate() });
    }
    router.back();
  }

  function handleDelete() {
    Alert.alert('Delete Asset', `Remove "${existing?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteAsset(id!); router.back(); } },
    ]);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Asset Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Mutual Funds, Digital Gold…"
        placeholderTextColor={Colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Platform</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {PLATFORMS.map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, platform === p && styles.chipActive]}
            onPress={() => setPlatform(p)}
          >
            <Text style={[styles.chipText, platform === p && styles.chipTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TextInput
        style={[styles.input, { marginTop: 8 }]}
        placeholder="Or type platform name"
        placeholderTextColor={Colors.textMuted}
        value={platform}
        onChangeText={setPlatform}
      />

      <Text style={styles.label}>Current Value (₹)</Text>
      <View style={styles.amountRow}>
        <Text style={styles.rupee}>₹</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          value={value}
          onChangeText={setValue}
        />
      </View>

      <Text style={styles.label}>Asset Class</Text>
      {ASSET_CLASSES.map(ac => (
        <TouchableOpacity
          key={ac.value}
          style={[styles.classRow, assetClass === ac.value && { borderColor: ac.color, backgroundColor: ac.color + '11' }]}
          onPress={() => setAssetClass(ac.value)}
        >
          <View style={[styles.classDot, { backgroundColor: ac.color }]} />
          <Text style={[styles.classLabel, assetClass === ac.value && { color: ac.color }]}>{ac.label}</Text>
          {assetClass === ac.value && <Ionicons name="checkmark-circle" size={18} color={ac.color} style={{ marginLeft: 'auto' }} />}
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{existing ? 'Update Asset' : 'Add Asset'}</Text>
      </TouchableOpacity>

      {existing && (
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={16} color={Colors.danger} />
          <Text style={styles.deleteBtnText}>Delete Asset</Text>
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
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim + '44' },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginBottom: 8,
    gap: 10,
  },
  classDot: { width: 10, height: 10, borderRadius: 5 },
  classLabel: { fontSize: 15, color: Colors.textPrimary },
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
