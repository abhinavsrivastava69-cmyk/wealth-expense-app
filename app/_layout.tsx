import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { PinLock } from './pin-lock';

export default function RootLayout() {
  // Read pin synchronously from already-hydrated store (localStorage on web is sync)
  const { pin, setPin } = useStore();
  const [unlocked, setUnlocked] = useState(false);
  const [pinReady, setPinReady] = useState(false);

  useEffect(() => {
    // On native: wait for async hydration; on web this fires immediately
    if (useStore.persist.hasHydrated()) {
      setPinReady(true);
      return;
    }
    const unsub = useStore.persist.onFinishHydration(() => setPinReady(true));
    const fallback = setTimeout(() => setPinReady(true), 1500);
    return () => { unsub(); clearTimeout(fallback); };
  }, []);

  const currentPin = useStore(s => s.pin);
  const needsPin = pinReady && !unlocked;

  if (needsPin && !currentPin) {
    // First launch: create a PIN
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <PinLock
          mode="set"
          onSuccess={() => setUnlocked(true)}
          onSetPin={(p) => { setPin(p); setUnlocked(true); }}
        />
      </GestureHandlerRootView>
    );
  }

  if (needsPin && currentPin && !unlocked) {
    // Returning user: verify PIN
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <PinLock
          mode="verify"
          storedPin={currentPin}
          onSuccess={() => setUnlocked(true)}
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
        <Stack.Screen
          name="expense-entry"
          options={{
            title: 'Add Expense',
            presentation: 'modal',
            headerStyle: { backgroundColor: Colors.surface },
          }}
        />
        <Stack.Screen name="asset-form" options={{ title: 'Manage Asset', presentation: 'modal' }} />
        <Stack.Screen name="liability-form" options={{ title: 'Manage Liability', presentation: 'modal' }} />
        <Stack.Screen name="rollover" options={{ title: 'Bill Resolution', presentation: 'modal' }} />
        <Stack.Screen name="bonus-planner" options={{ title: 'Bonus Month Planner' }} />
        <Stack.Screen name="budget-manager" options={{ title: 'Budget Manager' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
