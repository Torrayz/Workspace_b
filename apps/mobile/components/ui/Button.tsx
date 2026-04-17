import React from 'react';
// ============================================================================
// Button Component — Primary, Secondary, Outline, Ghost, Danger
// Redesign v2: More rounded, arrow suffix support
// ============================================================================

import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Show arrow suffix → */
  showArrow?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: Colors.accent },
    text: { color: '#FFFFFF' },
  },
  secondary: {
    container: { backgroundColor: Colors.primary },
    text: { color: '#FFFFFF' },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: Colors.accent,
    },
    text: { color: Colors.accent },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: Colors.textSecondary },
  },
  danger: {
    container: { backgroundColor: Colors.danger },
    text: { color: '#FFFFFF' },
  },
};

const sizeStyles: Record<Size, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingVertical: 8, paddingHorizontal: 16, minHeight: 36 },
    text: { fontSize: FontSize.sm },
  },
  md: {
    container: { paddingVertical: 14, paddingHorizontal: 24, minHeight: 48 },
    text: { fontSize: FontSize.sm },
  },
  lg: {
    container: { paddingVertical: 18, paddingHorizontal: 32, minHeight: 56 },
    text: { fontSize: FontSize.base },
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  showArrow = false,
  style,
}: ButtonProps) {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        vStyle.container,
        sStyle.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.accent : '#FFFFFF'}
          size="small"
        />
      ) : (
        <View style={styles.labelRow}>
          <Text style={[styles.text, vStyle.text, sStyle.text]}>{label}</Text>
          {showArrow && (
            <Text style={[styles.arrow, vStyle.text, sStyle.text]}> →</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    minWidth: 44,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  arrow: {
    fontWeight: '400',
  },
});
