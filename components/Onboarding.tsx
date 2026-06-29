import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface Props {
  onComplete: (email: string | null) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState<'welcome' | 'backup'>('welcome');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  function linkBackup() {
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setError('Enter a valid Gmail address');
      return;
    }
    onComplete(value);
  }

  if (step === 'welcome') {
    return (
      <ScrollView contentContainerStyle={styles.root}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoSymbol}>₹</Text>
        </View>
        <Text style={styles.appName}>Wealth & Expense</Text>
        <Text style={styles.appOwner}>Plan. Track. Grow.</Text>

        <View style={styles.divider} />

        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>
          Track your net worth, cards, budgets and expenses — all on your device.
        </Text>

        <View style={styles.featureList}>
          <Feature icon="trending-up" text="Net worth & wealth tracking" />
          <Feature icon="card" text="Credit card billing cycles" />
          <Feature icon="bulb" text="On-device spending insights" />
        </View>

        <Pressable style={styles.primaryBtn} onPress={() => setStep('backup')}>
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.gWrap}>
        <Ionicons name="logo-google" size={34} color={Colors.textPrimary} />
      </View>
      <Text style={styles.title}>Enable backup</Text>
      <Text style={styles.subtitle}>
        Link your Gmail address so your data can be backed up and restored later. Your
        information stays on this device until you back it up.
      </Text>

      <Text style={styles.label}>Gmail address</Text>
      <TextInput
        style={[styles.input, !!error && styles.inputError]}
        placeholder="you@gmail.com"
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        value={email}
        onChangeText={(t) => { setEmail(t); if (error) setError(''); }}
      />
      <Text style={styles.errorMsg}>{error}</Text>

      <Pressable style={styles.primaryBtn} onPress={linkBackup}>
        <Ionicons name="logo-google" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.primaryBtnText}>Continue with Google</Text>
      </Pressable>

      <Pressable style={styles.skipBtn} onPress={() => onComplete(null)}>
        <Text style={styles.skipText}>Skip for now</Text>
      </Pressable>
    </ScrollView>
  );
}

function Feature({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  logoWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.primary + '60',
    marginBottom: 14,
  },
  logoSymbol: { fontSize: 40, color: Colors.primary, fontWeight: '800' },
  gWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  appName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  appOwner: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  divider: { width: 40, height: 2, backgroundColor: Colors.border, borderRadius: 2, marginVertical: 26 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  featureList: { alignSelf: 'stretch', gap: 14, marginBottom: 34, paddingHorizontal: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.primaryDim + '55',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { fontSize: 15, color: Colors.textPrimary, flex: 1 },
  label: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: {
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, padding: 15,
    color: Colors.textPrimary, fontSize: 16,
  },
  inputError: { borderColor: Colors.danger },
  errorMsg: { alignSelf: 'flex-start', height: 18, fontSize: 13, color: Colors.danger, fontWeight: '600', marginTop: 6, marginBottom: 14 },
  primaryBtn: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 6,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  skipBtn: { marginTop: 20, paddingVertical: 8 },
  skipText: { fontSize: 14, color: Colors.textMuted, textDecorationLine: 'underline' },
});
