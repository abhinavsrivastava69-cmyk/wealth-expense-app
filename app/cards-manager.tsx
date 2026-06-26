import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';

const CARD_COLORS = ['#F7941D', '#1565C0', '#7C4DFF', '#004C8F', '#00897B', '#F75555', '#2DCB73', '#6C63FF'];
const NETWORKS = ['Visa/MC', 'Rupay', 'Amex', 'Diners'];

export default function CardsManagerScreen() {
  const { cards, addCard, deleteCard } = useStore();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [network, setNetwork] = useState('Visa/MC');
  const [cutDate, setCutDate] = useState('');
  const [billDate, setBillDate] = useState('');
  const [color, setColor] = useState(CARD_COLORS[0]);

  function reset() {
    setName(''); setNetwork('Visa/MC'); setCutDate(''); setBillDate(''); setColor(CARD_COLORS[0]);
    setAdding(false);
  }

  function handleAdd() {
    const cut = parseInt(cutDate, 10);
    const bill = parseInt(billDate, 10);
    if (!name.trim()) { Alert.alert('Card name required'); return; }
    if (cards.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
      Alert.alert('A card with this name already exists'); return;
    }
    if (isNaN(cut) || cut < 1 || cut > 28) { Alert.alert('Cut date must be 1–28'); return; }
    if (isNaN(bill) || bill < 1 || bill > 28) { Alert.alert('Bill date must be 1–28'); return; }
    addCard({ name: name.trim(), network, cutDate: cut, billDate: bill, color });
    reset();
  }

  function handleDelete(id: string, cardName: string) {
    Alert.alert('Delete Card', `Remove "${cardName}"? Its billing cycles will also be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCard(id) },
    ]);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Your Cards</Text>
      {cards.length === 0 && <Text style={styles.empty}>No cards yet. Add one below.</Text>}
      {cards.map(card => (
        <View key={card.id} style={styles.cardRow}>
          <View style={[styles.cardDot, { backgroundColor: card.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{card.name}</Text>
            <Text style={styles.cardMeta}>{card.network} · Cut {card.cutDate} · Bill {card.billDate}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(card.id, card.name)} hitSlop={10}>
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      ))}

      {!adding ? (
        <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addBtnText}>Add Card</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Card Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Amazon ICICI, Axis Magnus…"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Network</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {NETWORKS.map(n => (
              <TouchableOpacity key={n} style={[styles.chip, network === n && styles.chipActive]} onPress={() => setNetwork(n)}>
                <Text style={[styles.chipText, network === n && styles.chipTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Cut Date</Text>
              <TextInput style={styles.input} placeholder="1–28" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={cutDate} onChangeText={setCutDate} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Bill Date</Text>
              <TextInput style={styles.input} placeholder="1–28" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={billDate} onChangeText={setBillDate} />
            </View>
          </View>

          <Text style={styles.label}>Colour</Text>
          <View style={styles.colorRow}>
            {CARD_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => setColor(c)} style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSwatchActive]}>
                {color === c && <Ionicons name="checkmark" size={16} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
            <Text style={styles.saveBtnText}>Save Card</Text>
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
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  empty: { color: Colors.textSecondary, fontSize: 14, marginBottom: 8 },
  cardRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  cardDot: { width: 12, height: 12, borderRadius: 6 },
  cardName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  cardMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 8 },
  addBtnText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  form: { marginTop: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 16 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontSize: 15 },
  dateRow: { flexDirection: 'row', gap: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim + '44' },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  colorSwatchActive: { borderColor: '#fff' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  cancelBtnText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600' },
});
