import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface Props {
  label: string;
  variant?: Variant;
}

const variantMap: Record<Variant, { bg: string; text: string }> = {
  success: { bg: Colors.successDim, text: Colors.success },
  warning: { bg: Colors.warningDim, text: Colors.warning },
  danger:  { bg: Colors.dangerDim,  text: Colors.danger },
  info:    { bg: Colors.infoDim,    text: Colors.info },
  default: { bg: Colors.border,     text: Colors.textSecondary },
};

export function Badge({ label, variant = 'default' }: Props) {
  const { bg, text } = variantMap[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
