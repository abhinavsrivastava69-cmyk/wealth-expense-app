import { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
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

  const [phase, setPhase] = useState<Phase>(() => {
    // Synchronous init on web — no loading screen needed
    const pin = readStoredPin();
    return pin ? 'verify-pin' : 'set-pin';
  });

  const [storedPin] = useState<string | null>(readStoredPin);

  // On native: wait for async hydration to determine phase
  useEffect(() => {
    if (Platform.OS === 'web') return;
    function resolve() {
      const p = useStore.getState().pin;
      setPhase(p ? 'verify-pin' : 'set-pin');
    }
    if (useStore.persist.hasHydrated()) {
      resolve();
    } else {
      const unsub = useStore.persist.onFinishHydration(resolve);
      const fallback = setTimeout(resolve, 2000);
      return () => { unsub(); clearTimeout(fallback); };
    }
  }, []);

  const showPin = phase !== 'unlocked';

  return (
    // Single GestureHandlerRootView at the very top — fixes touch events on web
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
        <Stack.Screen name="budget-manager" options={{ title: 'Budget Manager' }} />
      </Stack>

      {/* PIN overlay — sits above the Stack, inside the gesture root */}
      {showPin && (
        <View style={StyleSheet.absoluteFill}>
          <PinLock
            mode={phase === 'set-pin' ? 'set' : 'verify'}
            storedPin={storedPin ?? ''}
            onSetPin={(p) => setPin(p)}
            onSuccess={() => setPhase('unlocked')}
          />
        </View>
      )}
    </GestureHandlerRootView>
  );
}
