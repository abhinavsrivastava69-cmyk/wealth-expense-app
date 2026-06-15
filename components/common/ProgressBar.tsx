import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface Props {
  percentage: number; // 0–100+
  height?: number;
}

export function ProgressBar({ percentage, height = 6 }: Props) {
  const clamped = Math.min(percentage, 100);
  const color =
    percentage >= 100
      ? Colors.danger
      : percentage >= 75
      ? Colors.warning
      : Colors.success;

  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: color, height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: Colors.border,
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 99,
  },
});
