import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { PinLock } from '@/components/PinLock';
import { Onboarding } from '@/components/Onboarding';

function readStoredState(): { pin: string | null; onboarded: boolean } {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('wealth-expense-storage');
      const state = raw ? JSON.parse(raw)?.state : null;
      if (!state) return { pin: null, onboarded: false };
      // Existing users (data or a PIN already set) skip the new-user onboarding.
      const hasData =
        (state.assets?.length ?? 0) > 0 ||
        (state.cards?.length ?? 0) > 0 ||
        (state.incomes?.length ?? 0) > 0 ||
        (state.expenses?.length ?? 0) > 0 ||
        state.pin != null;
      return { pin: state.pin ?? null, onboarded: !!state.onboarded || hasData };
    }
  } catch {}
  return { pin: null, onboarded: false };
}

type Phase = 'onboarding' | 'set-pin' | 'verify-pin' | 'unlocked';

function resolvePhase(pin: string | null, onboarded: boolean): Phase {
  if (!onboarded) return 'onboarding';
  // Empty string means user skipped PIN
  if (pin === '') return 'unlocked';
  return pin ? 'verify-pin' : 'set-pin';
}

export default function RootLayout() {
  const setPin = useStore(s => s.setPin);
  const completeOnboarding = useStore(s => s.completeOnboarding);
  const [storedPin] = useState<string | null>(() => readStoredState().pin);

  const [phase, setPhase] = useState<Phase>(() => {
    const { pin, onboarded } = readStoredState();
    return resolvePhase(pin, onboarded);
  });

  // Native only: wait for async storage hydration
  useEffect(() => {
    if (Platform.OS !== 'web') {
      function resolve() {
        const s = useStore.getState();
        setPhase(resolvePhase(s.pin, s.onboarded));
      }
      if (useStore.persist.hasHydrated()) { resolve(); return; }
      const unsub = useStore.persist.onFinishHydration(resolve);
      const t = setTimeout(resolve, 2000);
      return () => { unsub(); clearTimeout(t); };
    }
  }, []);

  if (phase === 'onboarding') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <Onboarding
          onComplete={(email) => {
            completeOnboarding(email);
            setPhase('set-pin');
          }}
        />
      </GestureHandlerRootView>
    );
  }

  if (phase === 'set-pin') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <PinLock
          mode="set"
          onSetPin={(p) => setPin(p)}
          onSuccess={() => setPhase('unlocked')}
        />
      </GestureHandlerRootView>
    );
  }

  if (phase === 'verify-pin') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <PinLock
          mode="verify"
          storedPin={storedPin ?? useStore.getState().pin ?? ''}
          onSuccess={() => setPhase('unlocked')}
        />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: '700', color: Colors.textPrimary },
          contentStyle: { backgroundColor: Colors.background },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="expense-entry" options={{ title: 'Add Expense', presentation: 'modal', headerStyle: { backgroundColor: Colors.surface } }} />
        <Stack.Screen name="asset-form" options={{ title: 'Manage Asset', presentation: 'modal' }} />
        <Stack.Screen name="liability-form" options={{ title: 'Manage Liability', presentation: 'modal' }} />
        <Stack.Screen name="rollover" options={{ title: 'Bill Resolution', presentation: 'modal' }} />
        <Stack.Screen name="bonus-planner" options={{ title: 'Bonus Month Planner' }} />
        <Stack.Screen name="bonus-settings" options={{ title: 'Bonus Cycle Settings' }} />
        <Stack.Screen name="budget-manager" options={{ title: 'Budget Manager' }} />
        <Stack.Screen name="cards-manager" options={{ title: 'Manage Cards', presentation: 'modal' }} />
        <Stack.Screen name="income-manager" options={{ title: 'Income & Credits', presentation: 'modal' }} />
        <Stack.Screen name="insights" options={{ title: 'Spending Insights' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
