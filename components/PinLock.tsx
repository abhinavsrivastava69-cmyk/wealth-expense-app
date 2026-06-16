import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
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
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');

  const current = phase === 'confirm' ? confirmDigits : digits;
  const setter = phase === 'confirm' ? setConfirmDigits : setDigits;

  useEffect(() => {
    if (current.length === PIN_LENGTH) {
      if (mode === 'verify') {
        if (current.join('') === storedPin) {
          onSuccess();
        } else {
          triggerError('Incorrect PIN');
          setDigits([]);
        }
      } else {
        // Set mode
        if (phase === 'enter') {
          setTimeout(() => setPhase('confirm'), 200);
        } else {
          // Confirm phase
          if (digits.join('') === confirmDigits.join('')) {
            onSetPin?.(digits.join(''));
            onSuccess();
          } else {
            triggerError('PINs do not match — try again');
            setDigits([]);
            setConfirmDigits([]);
            setPhase('enter');
          }
        }
      }
    }
  }, [current]);

  function triggerError(msg: string) {
    setError(msg);
    setShake(true);
    Vibration.vibrate(400);
    setTimeout(() => setShake(false), 500);
    setTimeout(() => setError(''), 2000);
  }

  function press(d: string) {
    if (current.length < PIN_LENGTH) setter(prev => [...prev, d]);
  }

  function del() {
    setter(prev => prev.slice(0, -1));
  }

  const title = mode === 'verify'
    ? 'Enter PIN'
    : phase === 'enter' ? 'Create PIN' : 'Confirm PIN';

  const subtitle = mode === 'verify'
    ? 'Enter your 4-digit PIN to access the app'
    : phase === 'enter'
      ? 'Choose a 4-digit PIN to secure your data'
      : 'Re-enter the same PIN to confirm';

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="lock-closed" size={38} color={Colors.primary} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* Dot indicator */}
      <View style={[styles.dots, shake && styles.shake]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              current.length > i && styles.dotFilled,
            ]}
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : <View style={{ height: 22 }} />}

      {/* Numpad */}
      <View style={styles.pad}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => {
          if (key === '') return <View key={i} style={styles.padCell} />;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.padCell, key !== '⌫' && styles.padBtn]}
              onPress={() => key === '⌫' ? del() : press(key)}
              activeOpacity={0.6}
            >
              {key === '⌫' ? (
                <Ionicons name="backspace-outline" size={26} color={Colors.textSecondary} />
              ) : (
                <Text style={styles.padText}>{key}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
  dots: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  shake: {
    // React Native doesn't support CSS animations — we toggle opacity instead
    opacity: 0.5,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.primary,
  },
  error: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600',
    height: 22,
    textAlign: 'center',
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 300,
    marginTop: 24,
    gap: 16,
    justifyContent: 'center',
  },
  padCell: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  padText: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
