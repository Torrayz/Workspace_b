// ============================================================================
// Card Component — Surface card dengan shadow + optional left border
// Redesign v2: Bigger shadows, colored left-border support
// ============================================================================

import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  /** Optional colored left border (e.g. for status indicator) */
  leftBorderColor?: string;
  leftBorderWidth?: number;
}

export function Card({
  children,
  style,
  padding = Spacing.lg,
  leftBorderColor,
  leftBorderWidth = 4,
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        { padding },
        leftBorderColor && {
          borderLeftWidth: leftBorderWidth,
          borderLeftColor: leftBorderColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
});
