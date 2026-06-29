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
    : phase === 'enter' ? 'Create a PIN' : 'Confirm your PIN';

  const subtitle = mode === 'verify'
    ? 'Enter your PIN to unlock'
    : phase === 'enter' ? 'Set a 4-digit PIN to secure your data'
      : 'Re-enter your PIN to confirm';

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        {/* Logo with halo */}
        <View style={styles.haloOuter}>
          <View style={styles.haloInner}>
            <View style={styles.logoWrap}>
              <Ionicons
                name={mode === 'verify' ? 'lock-closed' : 'shield-checkmark'}
                size={30}
                color={Colors.primary}
              />
            </View>
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* PIN dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const filled = current.length > i;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  filled && (dotError ? styles.dotErr : styles.dotFilled),
                ]}
              />
            );
          })}
        </View>
        <Text style={styles.errorMsg}>{error}</Text>
      </View>

      {/* Numpad */}
      <View style={styles.pad}>
        {['1','2','3','4','5','6','7','8','9'].map(n => (
          <Pressable key={n} onPress={() => press(n)}
            style={({ pressed }) => [styles.numBtn, pressed && styles.numBtnActive]}>
            <Text style={styles.numText}>{n}</Text>
          </Pressable>
        ))}
        <View style={styles.numBtnGhost} />
        <Pressable onPress={() => press('0')}
          style={({ pressed }) => [styles.numBtn, pressed && styles.numBtnActive]}>
          <Text style={styles.numText}>0</Text>
        </Pressable>
        <Pressable onPress={del}
          style={({ pressed }) => [styles.numBtnGhost, pressed && styles.numBtnActive]}>
          <Ionicons name="backspace-outline" size={26} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.footer}>
        <View style={styles.secureNote}>
          <Ionicons name="lock-closed" size={12} color={Colors.textMuted} />
          <Text style={styles.secureText}>Your PIN stays on this device</Text>
        </View>
        {mode === 'set' && (
          <Pressable onPress={() => { onSetPin?.(''); onSuccess(); }} hitSlop={8}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  top: { alignItems: 'center' },
  haloOuter: {
    width: 104, height: 104, borderRadius: 52,
    backgroundColor: Colors.primary + '14',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 22,
  },
  haloInner: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: Colors.primary + '22',
    alignItems: 'center', justifyContent: 'center',
  },
  logoWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.primary + '55',
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 32, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 20, marginBottom: 8 },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: Colors.borderLight,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotErr: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  errorMsg: { height: 20, fontSize: 13, color: Colors.danger, fontWeight: '600', marginTop: 10 },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 18,
    columnGap: 26,
    width: 292,
    justifyContent: 'center',
  },
  numBtn: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  numBtnGhost: {
    width: 72, height: 72,
    borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  numBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  numText: { fontSize: 28, fontWeight: '500', color: Colors.textPrimary },
  footer: { alignItems: 'center', gap: 16 },
  secureNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secureText: { fontSize: 12, color: Colors.textMuted },
  skipText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600', textDecorationLine: 'underline' },
});
