// ============================================================================
// Badge Component — Status pill dengan warna + icon
// Redesign v2: Slightly bigger, bolder, icon support
// ============================================================================

import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Colors, FontSize, BorderRadius } from '@/constants/theme';
import { StatusConfig } from '@/constants/theme';

type StatusKey = keyof typeof StatusConfig;

interface StatusBadgeProps {
  status: StatusKey;
  style?: ViewStyle;
  /** Show icon prefix (e.g. ✓, ✗) */
  showIcon?: boolean;
}

export function StatusBadge({ status, style, showIcon = false }: StatusBadgeProps) {
  const config = StatusConfig[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <Text style={[styles.text, { color: config.color }]}>
        {showIcon ? `${config.icon} ${config.label}` : config.label}
      </Text>
    </View>
  );
}

interface BadgeProps {
  label: string;
  color: string;
  bg: string;
  style?: ViewStyle;
}

export function Badge({ label, color, bg, style }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
