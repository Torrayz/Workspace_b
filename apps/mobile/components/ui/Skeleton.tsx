import React from 'react';
// ============================================================================
// Skeleton — Animated loading placeholder
// ============================================================================

import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, type ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '@/constants/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

/** Preset untuk Card skeleton */
export function CardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <Skeleton height={16} width="60%" style={{ marginBottom: 8 }} />
      <Skeleton height={32} width="80%" style={{ marginBottom: 8 }} />
      <Skeleton height={12} width="40%" />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.border,
  },
  cardSkeleton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
});
