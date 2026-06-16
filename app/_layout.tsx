import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';
import { PinLock } from './pin-lock';

type AppPhase = 'loading' | 'set-pin' | 'verify-pin' | 'unlocked';

export default function RootLayout() {
  const [phase, setPhase] = useState<AppPhase>('loading');
  const { pin, setPin } = useStore();

  useEffect(() => {
    function proceed() {
      const storedPin = useStore.getState().pin;
      setPhase(storedPin ? 'verify-pin' : 'set-pin');
    }

    // Fast path: already hydrated
    if (useStore.persist.hasHydrated()) {
      proceed();
      return;
    }

    // Wait for hydration callback
    const unsub = useStore.persist.onFinishHydration(proceed);

    // Fallback: never get stuck longer than 2 seconds
    const timer = setTimeout(proceed, 2000);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

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
          onSuccess={() => {
            // PIN was just saved via setPin inside the component — navigate to app
            // We use a separate state to track newly-set PIN
            setPhase('unlocked');
          }}
          onSetPin={(newPin) => {
            setPin(newPin);
            setPhase('unlocked');
          }}
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
          storedPin={pin ?? ''}
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
        <Stack.Screen
          name="expense-entry"
          options={{
            title: 'Add Expense',
            presentation: 'modal',
            headerStyle: { backgroundColor: Colors.surface },
          }}
        />
        <Stack.Screen
          name="asset-form"
          options={{ title: 'Manage Asset', presentation: 'modal' }}
        />
        <Stack.Screen
          name="liability-form"
          options={{ title: 'Manage Liability', presentation: 'modal' }}
        />
        <Stack.Screen
          name="rollover"
          options={{ title: 'Bill Resolution', presentation: 'modal' }}
        />
        <Stack.Screen
          name="bonus-planner"
          options={{ title: 'Bonus Month Planner' }}
        />
        <Stack.Screen
          name="budget-manager"
          options={{ title: 'Budget Manager' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
