import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface Props {
  label: string;
  value: string;
  valueColor?: string;
  small?: boolean;
}

export function StatRow({ label, value, valueColor, small }: Props) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, small && styles.small]}>{label}</Text>
      <Text style={[styles.value, small && styles.small, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  small: {
    fontSize: 12,
  },
});
