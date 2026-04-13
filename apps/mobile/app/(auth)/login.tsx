// ============================================================================
// Login Screen — Input Nomor Induk → konfirmasi nama → masuk
// Redesign v2: Split dark/white layout, matching design reference
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Dark Navy Header Section */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>FM</Text>
          </View>
          <Text style={styles.title}>Field Marketing</Text>
          <Text style={styles.subtitle}>Sistem Penagihan & Pelaporan</Text>
        </View>

        {/* White Form Section */}
        <View style={styles.formSection}>
          {step === 'input' ? (
            <>
              <Text style={styles.formTitle}>Masuk ke Akun</Text>
              <Text style={styles.formDesc}>
                Masukkan Nomor Induk Karyawan Anda.
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
            // Step konfirmasi identitas
            <>
              <View style={styles.confirmHeader}>
                <View style={styles.confirmDot} />
                <Text style={styles.confirmTitle}>Konfirmasi Identitas</Text>
              </View>

              <View style={styles.infoBox}>
                <InfoRow label="Nama" value={validatedUser?.user.nama || ''} />
                <InfoRow label="No. Induk" value={getValues('nomor_induk')} />
                <InfoRow
                  label="Rekening"
                  value={validatedUser?.user.nomor_rekening || ''}
                  isLast
                />
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
                  label="Ya, Masuk"
                  onPress={onConfirm}
                  loading={loading}
                  style={styles.confirmBtnRight}
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

function InfoRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[infoStyles.row, isLast && infoStyles.rowLast]}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: Spacing.md,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // ── Header (dark navy top) ─────────────────────────────
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 48,
    paddingHorizontal: Spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.fab,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.5)',
  },

  // ── Form section (white bottom) ─────────────────────────
  formSection: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    ...Shadows.header,
  },
  formTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  formDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
    textAlign: 'center',
  },

  // ── Confirm step ────────────────────────────────────────
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  confirmDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginRight: Spacing.sm,
  },
  confirmTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.accent,
  },
  infoBox: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  confirmBtnLeft: {
    flex: 1,
  },
  confirmBtnRight: {
    flex: 1,
  },

  // ── Footer ──────────────────────────────────────────────
  footer: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 18,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
  },
});
