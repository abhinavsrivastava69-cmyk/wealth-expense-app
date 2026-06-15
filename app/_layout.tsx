import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore } from '@/lib/store';
import { Colors } from '@/constants/colors';

export default function RootLayout() {
  const { assets, seedInitialData } = useStore();

  useEffect(() => {
    if (assets.length === 0) {
      seedInitialData();
    }
  }, []);

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
