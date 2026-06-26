import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useStore } from '@/lib/store';
import { PinLock } from '@/components/PinLock';

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route: string;
  color?: string;
  badge?: string;
}

const MENU: MenuSection[] = [
  {
    title: 'Smart Engine',
    items: [
      { label: 'Spending Insights', icon: 'sparkles-outline', route: '/insights', color: Colors.accent },
    ],
  },
  {
    title: 'Wealth',
    items: [
      { label: 'Asset Manager', icon: 'bar-chart-outline', route: '/asset-form', color: Colors.success },
      { label: 'Liability Manager', icon: 'trending-down-outline', route: '/liability-form', color: Colors.danger },
      { label: 'Income & Credits', icon: 'cash-outline', route: '/income-manager', color: Colors.success },
    ],
  },
  {
    title: 'Planning',
    items: [
      { label: 'Budget Manager', icon: 'pie-chart-outline', route: '/budget-manager', color: Colors.primary },
      { label: 'Bonus Month Planner', icon: 'calendar-outline', route: '/bonus-planner', color: Colors.accent },
      { label: 'Bonus Cycle Settings', icon: 'sync-outline', route: '/bonus-settings', color: Colors.accent },
    ],
  },
  {
    title: 'Credit Cards',
    items: [
      { label: 'Manage Cards', icon: 'card-outline', route: '/cards-manager', color: Colors.primary },
      { label: 'Bill Resolution', icon: 'checkmark-circle-outline', route: '/rollover', color: Colors.warning },
    ],
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const { pin, setPin } = useStore();
  const [changingPin, setChangingPin] = useState(false);

  function handleChangePin() {
    Alert.alert(
      pin ? 'Change PIN' : 'Set PIN',
      pin ? 'This will let you set a new 4-digit PIN.' : 'Protect the app with a 4-digit PIN.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => setChangingPin(true) },
      ]
    );
  }

  function handleRemovePin() {
    Alert.alert('Remove PIN', 'Are you sure you want to remove PIN protection?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setPin(null) },
    ]);
  }

  if (changingPin) {
    return (
      <PinLock
        mode="set"
        onSuccess={() => setChangingPin(false)}
        onSetPin={(newPin) => { setPin(newPin); setChangingPin(false); }}
      />
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.appName}>Wealth & Expense</Text>
        <Text style={styles.appSub}>Made & owned by Abhinav Srivastava</Text>
      </View>

      {MENU.map(section => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCard}>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={item.route}
                style={[
                  styles.menuItem,
                  i < section.items.length - 1 && styles.menuItemBordered,
                ]}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.menuIcon, { backgroundColor: (item.color ?? Colors.primary) + '22' }]}>
                  <Ionicons name={item.icon} size={20} color={item.color ?? Colors.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Security */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity style={[styles.menuItem, styles.menuItemBordered]} onPress={handleChangePin}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.primary + '22' }]}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>{pin ? 'Change PIN' : 'Set PIN'}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          {pin && (
            <TouchableOpacity style={styles.menuItem} onPress={handleRemovePin}>
              <View style={[styles.menuIcon, { backgroundColor: Colors.danger + '22' }]}>
                <Ionicons name="lock-open-outline" size={20} color={Colors.danger} />
              </View>
              <Text style={[styles.menuLabel, { color: Colors.danger }]}>Remove PIN</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Wealth & Expense v1.0.0</Text>
        <Text style={styles.footerSub}>© Abhinav Srivastava</Text>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
  },
  appName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  appSub: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  menuItemBordered: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  footer: { alignItems: 'center', marginTop: 16 },
  footerText: { fontSize: 13, color: Colors.textMuted },
  footerSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});
