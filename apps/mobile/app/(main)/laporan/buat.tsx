// ============================================================================
// Form Laporan — Submit laporan dengan foto + GPS auto-capture
// ============================================================================

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { useLaporan } from '@/hooks/useLaporan';
import { useRencana } from '@/hooks/useRencana';
import { useLocation } from '@/hooks/useLocation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

// ── Validasi ────────────────────────────────────────────────────────────────
const laporanSchema = z.object({
  rencana_id: z.string().min(1, 'Pilih rencana terlebih dahulu'),
  jumlah_tagihan: z
    .string()
    .min(1, 'Jumlah tagihan wajib diisi')
    .transform((v) => Number(v.replace(/\D/g, '')))
    .refine((v) => v > 0, 'Jumlah tagihan harus lebih dari 0'),
  tanggal_penagihan: z.string().min(1, 'Tanggal penagihan wajib diisi'),
  keterangan: z.string().optional(),
  status: z.enum(['lunas', 'sebagian', 'gagal', 'pending']),
});

type LaporanForm = z.infer<typeof laporanSchema>;

const STATUS_OPTIONS: { value: LaporanForm['status']; label: string }[] = [
  { value: 'lunas', label: 'Lunas' },
  { value: 'sebagian', label: 'Sebagian' },
  { value: 'pending', label: 'Pending' },
  { value: 'gagal', label: 'Gagal' },
];

function formatCurrencyInput(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  return Number(numbers).toLocaleString('id-ID');
}

export default function BuatLaporanScreen() {
  const [fotoUris, setFotoUris] = useState<string[]>([]);
  const [rencanaAktifList, setRencanaAktifList] = useState<any[]>([]);
  const { submitLaporan, loading, uploadProgress } = useLaporan();
  const { fetchRencanaAktif } = useRencana();
  const { latitude, longitude, getCurrentLocation } = useLocation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LaporanForm>({
    resolver: zodResolver(laporanSchema) as any,
    defaultValues: {
      rencana_id: '',
      jumlah_tagihan: '' as any,
      tanggal_penagihan: new Date().toISOString().split('T')[0],
      keterangan: '',
      status: 'lunas',
    },
  });

  const selectedStatus = watch('status');
  const selectedRencanaId = watch('rencana_id');

  useEffect(() => {
    fetchRencanaAktif().then(setRencanaAktifList);
    getCurrentLocation(); // Update GPS saat form dibuka
  }, []);

  // ── Ambil foto ────────────────────────────────────────────────────────────
  const pickPhoto = async () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Batal', 'Kamera', 'Galeri'],
          cancelButtonIndex: 0,
        },
        async (index) => {
          if (index === 1) await openCamera();
          if (index === 2) await openGaleri();
        },
      );
    } else {
      Alert.alert('Pilih Foto', 'Pilih sumber foto', [
        { text: 'Kamera', onPress: openCamera },
        { text: 'Galeri', onPress: openGaleri },
        { text: 'Batal', style: 'cancel' },
      ]);
    }
  };

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Izin Diperlukan', 'Izin kamera diperlukan untuk mengambil foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setFotoUris((prev) => [...prev, result.assets[0]!.uri]);
    }
  };

  const openGaleri = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setFotoUris((prev) => [...prev, ...newUris]);
    }
  };

  const removePhoto = (uri: string) => {
    setFotoUris((prev) => prev.filter((u) => u !== uri));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: LaporanForm) => {
    if (fotoUris.length === 0) {
      Alert.alert('Foto Diperlukan', 'Upload minimal 1 foto bukti laporan.');
      return;
    }

    const result = await submitLaporan({
      rencana_id: data.rencana_id,
      jumlah_tagihan: data.jumlah_tagihan as unknown as number,
      tanggal_penagihan: data.tanggal_penagihan,
      foto_uris: fotoUris,
      keterangan: data.keterangan,
      status: data.status,
    });

    if (result.success) {
      Alert.alert('Berhasil! ✅', 'Laporan berhasil dikirim.', [
        { text: 'OK', onPress: () => router.replace('/(main)/history') },
      ]);
    } else {
      Alert.alert('Gagal', result.error || 'Terjadi kesalahan saat mengirim laporan.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat Laporan</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Pilih Rencana */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Rencana</Text>
            {rencanaAktifList.length === 0 ? (
              <View style={styles.emptyRencana}>
                <Text style={styles.emptyRencanaText}>Tidak ada rencana aktif</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.rencanaChips}>
                  {rencanaAktifList.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => setValue('rencana_id', r.id)}
                      style={[
                        styles.rencanaChip,
                        selectedRencanaId === r.id && styles.rencanaChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rencanaChipText,
                          selectedRencanaId === r.id && styles.rencanaChipTextActive,
                        ]}
                      >
                        {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(r.target_nominal)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
            {errors.rencana_id && (
              <Text style={styles.errorText}>{errors.rencana_id.message}</Text>
            )}
          </View>

          {/* Jumlah Tagihan */}
          <Controller
            control={control}
            name="jumlah_tagihan"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Jumlah Tagihan"
                prefix="Rp"
                placeholder="0"
                value={formatCurrencyInput(String(value || ''))}
                onChangeText={(text) => onChange(text.replace(/\D/g, '') || '')}
                error={errors.jumlah_tagihan?.message}
                keyboardType="numeric"
              />
            )}
          />

          {/* Tanggal Penagihan */}
          <Controller
            control={control}
            name="tanggal_penagihan"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Tanggal Penagihan"
                placeholder="YYYY-MM-DD"
                value={value}
                onChangeText={onChange}
                error={errors.tanggal_penagihan?.message}
              />
            )}
          />

          {/* Status */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Status</Text>
            <View style={styles.statusOptions}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setValue('status', opt.value)}
                  style={[
                    styles.statusChip,
                    selectedStatus === opt.value && styles.statusChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      selectedStatus === opt.value && styles.statusChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Upload Foto */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Foto Bukti (wajib min. 1)</Text>

            <View style={styles.fotoGrid}>
              {fotoUris.map((uri) => (
                <View key={uri} style={styles.fotoThumb}>
                  <Image source={{ uri }} style={styles.fotoImage} />
                  <TouchableOpacity
                    onPress={() => removePhoto(uri)}
                    style={styles.fotoRemove}
                  >
                    <Text style={styles.fotoRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.fotoAdd} onPress={pickPhoto}>
                <Text style={styles.fotoAddIcon}>📷</Text>
                <Text style={styles.fotoAddText}>Tambah Foto</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Keterangan */}
          <Controller
            control={control}
            name="keterangan"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Keterangan (Opsional)"
                placeholder="Catatan tambahan..."
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            )}
          />

          {/* GPS Info */}
          <View style={styles.gpsInfo}>
            <Text style={styles.gpsLabel}>📍 Lokasi GPS</Text>
            <Text style={styles.gpsCoords}>
              {latitude && longitude
                ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                : 'Memuat lokasi...'}
            </Text>
          </View>

          {/* Upload progress */}
          {loading && uploadProgress > 0 && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Mengupload foto... {Math.round(uploadProgress)}%
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${uploadProgress}%` as any }]}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Submit fixed di bottom */}
        <View style={styles.footer}>
          <Button
            label={loading ? 'Mengirim laporan...' : 'Kirim Laporan'}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: Spacing.lg,
  },
  backBtn: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm, fontWeight: '500' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: '#FFF' },
  body: { flex: 1 },
  bodyContent: { padding: Spacing.lg, paddingBottom: 40 },
  fieldContainer: { marginBottom: Spacing.md },
  fieldLabel: {
    fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  emptyRencana: {
    padding: Spacing.md, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border,
  },
  emptyRencanaText: { fontSize: FontSize.sm, color: Colors.textMuted },
  rencanaChips: { flexDirection: 'row', gap: Spacing.sm },
  rencanaChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  rencanaChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '15' },
  rencanaChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  rencanaChipTextActive: { color: Colors.accent },
  errorText: { fontSize: FontSize.xs, color: Colors.danger, marginTop: 4 },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statusChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  statusChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accent },
  statusChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  statusChipTextActive: { color: '#FFF' },
  fotoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  fotoThumb: { position: 'relative', width: 88, height: 88 },
  fotoImage: { width: 88, height: 88, borderRadius: BorderRadius.sm },
  fotoRemove: {
    position: 'absolute', top: -8, right: -8,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  fotoRemoveText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  fotoAdd: {
    width: 88, height: 88, borderRadius: BorderRadius.sm,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  fotoAddIcon: { fontSize: 24 },
  fotoAddText: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  gpsInfo: {
    padding: Spacing.md, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  gpsLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  gpsCoords: { fontSize: FontSize.sm, color: Colors.textPrimary, fontFamily: 'monospace' },
  progressContainer: { marginBottom: Spacing.md },
  progressText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 6 },
  progressBar: {
    height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  footer: {
    padding: Spacing.lg, backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
});
