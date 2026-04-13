// ============================================================================
// Splash + GPS Check Screen
// Entry point: cek session → cek GPS → arahkan ke halaman yang tepat
// Redesign v2: Polished logo, updated subtitle
// ============================================================================

import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useLocation } from '@/hooks/useLocation';
import { Colors, FontSize, Spacing, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

export default function SplashScreen() {
  const { user, isInitialized } = useAuthStore();
  const {
    hasPermission,
    error: locationError,
    requestPermission,
  } = useLocation();

  // Setelah auth init selesai, routing logic
  useEffect(() => {
    if (!isInitialized) return;

    if (user) {
      // Already logged in → langsung ke main
      router.replace('/(main)');
    }
    // Else tunggu GPS check selesai lalu ke login
  }, [isInitialized, user]);

  // Setelah GPS granted, arahkan ke login
  useEffect(() => {
    if (hasPermission && isInitialized && !user) {
      router.replace('/(auth)/login');
    }
  }, [hasPermission, isInitialized, user]);

  // Loading state
  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>FM</Text>
        </View>
        <Text style={styles.title}>Field Marketing</Text>
        <Text style={styles.subtitle}>Sistem Penagihan & Pelaporan</Text>
        <ActivityIndicator color={Colors.accent} size="large" style={styles.loader} />
      </View>
    );
  }

  // GPS tidak aktif — blocking screen
  if (!hasPermission && !user) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>FM</Text>
        </View>

        <View style={styles.gpsCard}>
          <Text style={styles.gpsBlockIcon}>📍</Text>
          <Text style={styles.gpsBlockTitle}>Lokasi GPS Diperlukan</Text>
          <Text style={styles.gpsBlockDesc}>
            Aplikasi ini membutuhkan akses lokasi GPS untuk memverifikasi
            posisi Anda saat membuat laporan. Aktifkan lokasi untuk melanjutkan.
          </Text>
          {locationError && (
            <Text style={styles.errorText}>{locationError}</Text>
          )}
          <Button
            label="Aktifkan Lokasi"
            onPress={requestPermission}
            fullWidth
            showArrow
            style={styles.gpsButton}
          />
        </View>
      </View>
    );
  }

  // GPS loading
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>FM</Text>
      </View>
      <Text style={styles.title}>Field Marketing</Text>
      <Text style={styles.subtitle}>Memeriksa lokasi GPS...</Text>
      <ActivityIndicator color={Colors.accent} size="large" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.fab,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: Spacing.xl,
  },
  loader: {
    marginTop: Spacing.lg,
  },
  gpsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  gpsBlockIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  gpsBlockTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  gpsBlockDesc: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: '#FCA5A5',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  gpsButton: {
    marginTop: Spacing.sm,
  },
});
