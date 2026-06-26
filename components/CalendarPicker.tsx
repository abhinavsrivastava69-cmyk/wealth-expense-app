import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export function CalendarPicker({
  visible,
  value,         // ISO "YYYY-MM-DD"
  maxDate,       // ISO, optional upper bound (inclusive)
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: string;
  maxDate?: string;
  onSelect: (iso: string) => void;
  onClose: () => void;
}) {
  const initial = new Date(value + 'T00:00:00');
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function isDisabled(d: number): boolean {
    if (!maxDate) return false;
    return toIso(viewYear, viewMonth, d) > maxDate;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
          <View style={styles.header}>
            <TouchableOpacity onPress={prevMonth} hitSlop={10} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={10} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={styles.weekday}>{w}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((d, i) => {
              if (d === null) return <View key={i} style={styles.cell} />;
              const iso = toIso(viewYear, viewMonth, d);
              const selected = iso === value;
              const disabled = isDisabled(d);
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.cell}
                  disabled={disabled}
                  onPress={() => { onSelect(iso); onClose(); }}
                >
                  <View style={[styles.dayInner, selected && styles.daySelected]}>
                    <Text style={[styles.dayText, selected && styles.dayTextSelected, disabled && styles.dayDisabled]}>{d}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.todayBtn} onPress={() => {
            const now = new Date();
            const iso = toIso(now.getFullYear(), now.getMonth(), now.getDate());
            if (!maxDate || iso <= maxDate) { onSelect(iso); onClose(); }
            else { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); }
          }}>
            <Text style={styles.todayText}>Today</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 360, backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, color: Colors.textMuted, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayInner: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: Colors.primary },
  dayText: { fontSize: 14, color: Colors.textPrimary },
  dayTextSelected: { color: '#fff', fontWeight: '800' },
  dayDisabled: { color: Colors.textMuted, opacity: 0.4 },
  todayBtn: { marginTop: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.background, borderRadius: 12 },
  todayText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
});
