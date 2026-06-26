import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { PinLock } from '@/components/PinLock';

function readStoredPin(): string | null {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('wealth-expense-storage');
      return raw ? (JSON.parse(raw)?.state?.pin ?? null) : null;
    }
  } catch {}
  return null;
}

type Phase = 'set-pin' | 'verify-pin' | 'unlocked';

export default function RootLayout() {
  const setPin = useStore(s => s.setPin);
  const [storedPin] = useState<string | null>(readStoredPin);

  const [phase, setPhase] = useState<Phase>(() => {
    const pin = readStoredPin();
    // Empty string means user skipped PIN
    if (pin === '') return 'unlocked';
    return pin ? 'verify-pin' : 'set-pin';
  });

  // Native only: wait for async storage hydration
  useEffect(() => {
    if (Platform.OS !== 'web') {
      function resolve() {
        const p = useStore.getState().pin;
        if (p === '') { setPhase('unlocked'); return; }
        setPhase(p ? 'verify-pin' : 'set-pin');
      }
      if (useStore.persist.hasHydrated()) { resolve(); return; }
      const unsub = useStore.persist.onFinishHydration(resolve);
      const t = setTimeout(resolve, 2000);
      return () => { unsub(); clearTimeout(t); };
    }
  }, []);

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
