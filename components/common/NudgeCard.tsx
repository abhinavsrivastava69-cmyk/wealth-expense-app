import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { GuidanceNudge } from '@/lib/types';

interface Props {
  nudge: GuidanceNudge;
}

const severityMap = {
  info:    { bg: Colors.infoDim,    border: Colors.info,    icon: 'information-circle' as const, color: Colors.info },
  warning: { bg: Colors.warningDim, border: Colors.warning, icon: 'warning'             as const, color: Colors.warning },
  danger:  { bg: Colors.dangerDim,  border: Colors.danger,  icon: 'alert-circle'        as const, color: Colors.danger },
};

export function NudgeCard({ nudge }: Props) {
  const { bg, border, icon, color } = severityMap[nudge.severity];
  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }]}>
      <Ionicons name={icon} size={18} color={color} style={styles.icon} />
      <Text style={[styles.text, { color }]}>{nudge.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  icon: {
    marginTop: 1,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
