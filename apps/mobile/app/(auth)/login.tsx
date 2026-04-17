// ============================================================================
// Login Screen — Modern glassmorphism design with compact layout
// ============================================================================

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { useLocation } from '@/hooks/useLocation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Shadows, BorderRadius } from '@/constants/theme';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || '';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || '';

const loginSchema = z.object({
  nomor_induk: z
    .string()
    .trim()
    .min(1, 'Nomor induk wajib diisi')
    .min(3, 'Nomor induk tidak valid'),
});

type LoginForm = z.infer<typeof loginSchema>;

interface ValidationResult {
  token: string;
  user: {
    id: string;
    nama: string;
    nomor_induk: string;
    nomor_rekening: string;
    role: string;
  };
}

export default function LoginScreen() {
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [validatedUser, setValidatedUser] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const { startTracking } = useLocation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { nomor_induk: '' },
  });

  const onValidate = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/validate-nomor-induk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ nomor_induk: data.nomor_induk }),
      });

      const result = await res.json();

      if (!res.ok) {
        Alert.alert('Login Gagal', result.error || 'Nomor induk tidak ditemukan.');
        return;
      }

      // Block admin/superadmin dari mobile
      const userRole = (result as ValidationResult).user.role;
      if (userRole === 'admin' || userRole === 'superadmin') {
        Alert.alert(
          'Akses Ditolak',
          'Akun Admin dan Superadmin hanya bisa mengakses Dashboard Web.\n\nGunakan browser untuk login di dashboard.',
        );
        return;
      }

      setValidatedUser(result as ValidationResult);
      setStep('confirm');
    } catch {
      Alert.alert('Koneksi Error', 'Gagal terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = async () => {
    if (!validatedUser) return;
    setLoading(true);

    try {
      await setAuth(
        {
          id: validatedUser.user.id,
          nama: validatedUser.user.nama,
          nomor_induk: validatedUser.user.nomor_induk,
          nomor_rekening: validatedUser.user.nomor_rekening,
          role: validatedUser.user.role,
        },
        validatedUser.token,
      );

      // Mulai GPS tracking background setelah login
      await startTracking();

      router.replace('/(main)');
    } catch {
      Alert.alert('Error', 'Gagal menyimpan sesi login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0F172A', '#1E3A5F', '#1E40AF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Logo + Branding */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoInner}>
              <Text style={styles.logoText}>FM</Text>
            </View>
          </View>
          <Text style={styles.brandTitle}>Field Marketing</Text>
          <Text style={styles.brandSub}>Sistem Penagihan & Pelaporan</Text>
        </View>

        {/* Glass Card Form */}
        <View style={styles.glassCard}>
          {step === 'input' ? (
            <>
              <Text style={styles.formTitle}>Masuk</Text>
              <Text style={styles.formDesc}>
                Masukkan Nomor Induk Karyawan
              </Text>

              <Controller
                control={control}
                name="nomor_induk"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Nomor Induk"
                    required
                    placeholder="USR001"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.nomor_induk?.message}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onValidate)}
                  />
                )}
              />

              <Button
                label="Lanjut"
                onPress={handleSubmit(onValidate)}
                loading={loading}
                fullWidth
                showArrow
                size="lg"
              />
            </>
          ) : (
            <>
              <View style={styles.confirmBadge}>
                <Text style={styles.confirmBadgeText}>Konfirmasi</Text>
              </View>

              <View style={styles.profileSection}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>
                    {validatedUser?.user.nama?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
                <Text style={styles.profileName}>{validatedUser?.user.nama}</Text>
                <Text style={styles.profileId}>{getValues('nomor_induk')}</Text>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Rekening</Text>
                  <Text style={styles.infoValue}>{validatedUser?.user.nomor_rekening || '-'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Role</Text>
                  <Text style={styles.infoValue}>{validatedUser?.user.role || '-'}</Text>
                </View>
              </View>

              <View style={styles.confirmButtons}>
                <Button
                  label="Bukan Saya"
                  onPress={() => setStep('input')}
                  variant="outline"
                  style={styles.confirmBtnLeft}
                  disabled={loading}
                />
                <Button
                  label="Masuk"
                  onPress={onConfirm}
                  loading={loading}
                  style={styles.confirmBtnRight}
                  showArrow
                />
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Hanya karyawan terdaftar yang dapat mengakses.{'\n'}
          Hubungi Superadmin jika belum ada akun.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    paddingTop: 80,
    paddingBottom: 40,
  },
  // ── Decorative circles ─────────────────────────────────
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    top: -80,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
    bottom: 100,
    left: -60,
  },
  circle3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    top: '40%' as any,
    right: 30,
  },
  // ── Branding ───────────────────────────────────────────
  brandSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  logoInner: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.fab,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
  brandTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 4,
  },
  // ── Glass Card ─────────────────────────────────────────
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.cardHover,
  },
  formTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  formDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  // ── Confirm step ───────────────────────────────────────
  confirmBadge: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.infoSoft,
    marginBottom: Spacing.md,
  },
  confirmBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.fab,
  },
  profileAvatarText: {
    fontSize: FontSize['2xl'],
    fontWeight: '700',
    color: '#FFF',
  },
  profileName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  profileId: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  infoItem: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  confirmBtnLeft: { flex: 1 },
  confirmBtnRight: { flex: 1 },
  // ── Footer ──────────────────────────────────────────────
  footer: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.lg,
  },
});
