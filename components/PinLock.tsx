import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

const PIN_LENGTH = 4;

interface Props {
  mode: 'set' | 'verify';
  onSuccess: () => void;
  onSetPin?: (pin: string) => void;
  storedPin?: string;
}

export function PinLock({ mode, onSuccess, onSetPin, storedPin }: Props) {
  const [digits, setDigits] = useState<string[]>([]);
  const [confirmDigits, setConfirmDigits] = useState<string[]>([]);
  const [phase, setPhase] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [dotError, setDotError] = useState(false);

  const current = phase === 'confirm' ? confirmDigits : digits;
  const setter = phase === 'confirm' ? setConfirmDigits : setDigits;

  useEffect(() => {
    if (current.length < PIN_LENGTH) return;

    if (mode === 'verify') {
      if (current.join('') === storedPin) {
        onSuccess();
      } else {
        showError('Incorrect PIN');
        setTimeout(() => setDigits([]), 500);
      }
    } else {
      if (phase === 'enter') {
        setTimeout(() => setPhase('confirm'), 300);
      } else {
        if (digits.join('') === confirmDigits.join('')) {
          onSetPin?.(digits.join(''));
          onSuccess();
        } else {
          showError('PINs do not match — try again');
          setTimeout(() => {
            setDigits([]);
            setConfirmDigits([]);
            setPhase('enter');
          }, 500);
        }
      }
    }
  }, [current.length]);

  function showError(msg: string) {
    setError(msg);
    setDotError(true);
    setTimeout(() => { setError(''); setDotError(false); }, 2000);
  }

  function press(d: string) {
    setter(prev => prev.length < PIN_LENGTH ? [...prev, d] : prev);
  }

  function del() {
    setter(prev => prev.slice(0, -1));
  }

  const title = mode === 'verify'
    ? 'Welcome back'
    : phase === 'enter' ? 'Set your PIN' : 'Confirm your PIN';

  const subtitle = mode === 'verify'
    ? 'Enter your 4-digit PIN'
    : phase === 'enter' ? 'Choose a 4-digit PIN to protect your data'
      : 'Enter the same PIN again';

  return (
    <View style={styles.root}>

      {/* Logo */}
      <View style={styles.logoWrap}>
        <Text style={styles.logoSymbol}>₹</Text>
      </View>
      <Text style={styles.appName}>Wealth & Expense</Text>
      <Text style={styles.appOwner}>by Abhinav Srivastava</Text>

      <View style={styles.divider} />

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* PIN dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              current.length > i && (dotError ? styles.dotErr : styles.dotFilled),
            ]}
          />
        ))}
      </View>
      <Text style={styles.errorMsg}>{error}</Text>

      {/* Numpad */}
      <View style={styles.pad}>
        {['1','2','3','4','5','6','7','8','9'].map(n => (
          <Pressable key={n} onPress={() => press(n)}
            style={({ pressed }) => [styles.numBtn, pressed && styles.numBtnActive]}>
            <Text style={styles.numText}>{n}</Text>
          </Pressable>
        ))}
        {/* Bottom row */}
        <View style={styles.numBtn} />
        <Pressable onPress={() => press('0')}
          style={({ pressed }) => [styles.numBtn, pressed && styles.numBtnActive]}>
          <Text style={styles.numText}>0</Text>
        </Pressable>
        <Pressable onPress={del}
          style={({ pressed }) => [styles.numBtn, pressed && styles.numBtnActive]}>
          <Ionicons name="backspace-outline" size={24} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {mode === 'set' && (
        <Pressable onPress={() => { onSetPin?.(''); onSuccess(); }} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.primary + '60',
    marginBottom: 14,
  },
  logoSymbol: { fontSize: 40, color: Colors.primary, fontWeight: '800' },
  appName: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  appOwner: { fontSize: 12, color: Colors.textMuted, marginTop: 3, marginBottom: 28 },
  divider: { width: 40, height: 2, backgroundColor: Colors.border, borderRadius: 2, marginBottom: 28 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 28, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 18, marginBottom: 10 },
  dot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: Colors.borderLight,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotErr: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  errorMsg: { height: 18, fontSize: 13, color: Colors.danger, fontWeight: '600', marginBottom: 22 },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: 276,
    justifyContent: 'center',
  },
  numBtn: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  numBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  numText: { fontSize: 26, fontWeight: '400', color: Colors.textPrimary },
  skipBtn: { marginTop: 28 },
  skipText: { fontSize: 13, color: Colors.textMuted, textDecorationLine: 'underline' },
});
