import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Image } from 'react-native';
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
  const [focused, setFocused] = useState(false);

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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.welcomeContent}>
        <View style={styles.welcomeTop}>
          <View style={styles.haloOuter}>
            <View style={styles.haloInner}>
              <View style={styles.logoWrap}>
                <Image source={require('@/assets/icon.png')} style={styles.logoImg} />
              </View>
            </View>
          </View>
          <Text style={styles.appName}>Kosh</Text>
          <Text style={styles.tagline}>Plan · Track · Grow</Text>

          <Text style={styles.welcomeTitle}>Take control of{'\n'}your money</Text>
          <Text style={styles.welcomeSub}>
            Net worth, cards, budgets and expenses — private and on your device.
          </Text>
        </View>

        <View style={styles.featureList}>
          <Feature icon="trending-up" title="Wealth tracking" desc="Assets, loans & net worth" />
          <Feature icon="card" title="Card billing cycles" desc="Never miss a due date" />
          <Feature icon="bulb" title="Smart insights" desc="On-device spending analysis" />
        </View>

        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]} onPress={() => setStep('backup')}>
          <Text style={styles.primaryBtnText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.backupContent}>
      <Pressable style={styles.backBtn} onPress={() => setStep('welcome')} hitSlop={10}>
        <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
      </Pressable>

      <View style={styles.backupTop}>
        <View style={styles.cloudWrap}>
          <Ionicons name="cloud-upload" size={30} color={Colors.primary} />
        </View>
        <Text style={styles.welcomeTitle}>Enable backup</Text>
        <Text style={styles.welcomeSub}>
          Link your Google account so your data can be backed up and restored. Nothing leaves
          your device until you choose to back up.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Gmail address</Text>
        <View style={[styles.inputWrap, focused && styles.inputWrapFocused, !!error && styles.inputWrapError]}>
          <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="you@gmail.com"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            value={email}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChangeText={(t) => { setEmail(t); if (error) setError(''); }}
          />
        </View>
        {!!error && <Text style={styles.errorMsg}>{error}</Text>}

        <Pressable style={({ pressed }) => [styles.googleBtn, pressed && styles.btnPressed]} onPress={linkBackup}>
          <View style={styles.gBadge}>
            <Ionicons name="logo-google" size={16} color="#4285F4" />
          </View>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </Pressable>
      </View>

      <Pressable style={styles.skipBtn} onPress={() => onComplete(null)} hitSlop={8}>
        <Text style={styles.skipText}>Skip for now</Text>
      </Pressable>
    </ScrollView>
  );
}

function Feature({ icon, title, desc }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; desc: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  welcomeContent: { flexGrow: 1, padding: 28, paddingTop: 64, justifyContent: 'space-between' },
  welcomeTop: { alignItems: 'center' },

  haloOuter: {
    width: 108, height: 108, borderRadius: 30,
    backgroundColor: Colors.primary + '14',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  haloInner: {
    width: 88, height: 88, borderRadius: 26,
    backgroundColor: Colors.primary + '22',
    alignItems: 'center', justifyContent: 'center',
  },
  logoWrap: {
    width: 64, height: 64, borderRadius: 20, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  logoImg: { width: 64, height: 64, borderRadius: 20 },
  appName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  tagline: { fontSize: 13, color: Colors.textMuted, marginTop: 4, letterSpacing: 0.5 },

  welcomeTitle: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, marginTop: 30, textAlign: 'center', lineHeight: 34 },
  welcomeSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 12, textAlign: 'center', lineHeight: 21, maxWidth: 300 },

  featureList: { gap: 12, marginVertical: 36 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 16, padding: 14,
  },
  featureIcon: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: Colors.primaryDim + '55',
    alignItems: 'center', justifyContent: 'center',
  },
  featureTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  featureDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 16, paddingVertical: 17,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnPressed: { opacity: 0.85 },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  backupContent: { flexGrow: 1, padding: 28, paddingTop: 60 },
  backBtn: {
    position: 'absolute', top: 24, left: 16,
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  backupTop: { alignItems: 'center', marginBottom: 28 },
  cloudWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: Colors.primaryDim + '55',
    borderWidth: 1, borderColor: Colors.primary + '40',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },

  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 20, padding: 20,
  },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.background,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 13, paddingHorizontal: 14,
  },
  inputWrapFocused: { borderColor: Colors.primary },
  inputWrapError: { borderColor: Colors.danger },
  input: { flex: 1, paddingVertical: 15, color: Colors.textPrimary, fontSize: 16 },
  errorMsg: { fontSize: 13, color: Colors.danger, fontWeight: '600', marginTop: 8 },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: Colors.borderLight,
    borderRadius: 14, paddingVertical: 15,
    marginTop: 18,
  },
  gBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  googleBtnText: { fontSize: 15, fontWeight: '700', color: '#1F1F1F' },

  skipBtn: { alignSelf: 'center', marginTop: 24, paddingVertical: 8 },
  skipText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600', textDecorationLine: 'underline' },
});
