// ============================================================================
// Login Screen — Input Nomor Induk → konfirmasi nama → masuk
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
import { Card } from '@/components/ui/Card';
import { Colors, FontSize, Spacing } from '@/constants/theme';
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
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>FM</Text>
          </View>
          <Text style={styles.title}>Field Marketing</Text>
          <Text style={styles.subtitle}>Sistem Pelaporan</Text>
        </View>

        {/* Form Card */}
        <Card style={styles.card}>
          {step === 'input' ? (
            <>
              <Text style={styles.cardTitle}>Masuk ke Akun</Text>
              <Text style={styles.cardDesc}>
                Masukkan Nomor Induk Karyawan Anda untuk melanjutkan.
              </Text>

              <Controller
                control={control}
                name="nomor_induk"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Nomor Induk"
                    placeholder="Contoh: USR001"
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
              />
            </>
          ) : (
            // Step konfirmasi identitas
            <>
              <Text style={styles.cardTitle}>Konfirmasi Identitas</Text>
              <Text style={styles.cardDesc}>
                Pastikan informasi berikut adalah milik Anda:
              </Text>

              <View style={styles.infoBox}>
                <InfoRow label="Nama" value={validatedUser?.user.nama || ''} />
                <InfoRow label="Nomor Induk" value={getValues('nomor_induk')} />
                <InfoRow
                  label="Nomor Rekening"
                  value={validatedUser?.user.nomor_rekening || ''}
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
        </Card>

        {/* Footer */}
        <Text style={styles.footer}>
          Hanya karyawan terdaftar yang dapat mengakses.{'\n'}
          Hubungi Superadmin jika belum memiliki akun.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    paddingHorizontal: Spacing.lg,
    paddingTop: 80,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 24,
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
    color: 'rgba(255,255,255,0.6)',
  },
  card: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
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
  footer: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
