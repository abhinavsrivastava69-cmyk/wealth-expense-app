import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { PinLock } from '@/components/PinLock';

type Phase = 'loading' | 'set-pin' | 'verify-pin' | 'unlocked';

export default function RootLayout() {
  const [phase, setPhase] = useState<Phase>('loading');
  const setPin = useStore(s => s.setPin);

  useEffect(() => {
    function resolve() {
      const p = useStore.getState().pin;
      setPhase(p ? 'verify-pin' : 'set-pin');
    }

    if (useStore.persist.hasHydrated()) {
      resolve();
    } else {
      const unsub = useStore.persist.onFinishHydration(resolve);
      const fallback = setTimeout(resolve, 1500);
      return () => { unsub(); clearTimeout(fallback); };
    }
  }, []);

  // Always block the app until PIN is resolved
  if (phase === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
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
    const storedPin = useStore.getState().pin ?? '';
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <PinLock
          mode="verify"
          storedPin={storedPin}
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
        <Stack.Screen name="budget-manager" options={{ title: 'Budget Manager' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
