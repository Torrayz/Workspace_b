import React from 'react';
// ============================================================================
// Form Laporan — Submit laporan dengan foto + GPS auto-capture
// Redesign v2: Matching Form Kunjungan design with colored status chips,
// camera upload area, GPS line, and split bottom buttons
// ============================================================================

import { useEffect, useState, useCallback as useReactCallback } from 'react';
import { useFocusEffect } from 'expo-router';
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
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Colors,
  FontSize,
  Spacing,
  BorderRadius,
  Shadows,
  HeaderStyle,
  StatusConfig,
} from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Photo thumb size: 3 columns with gaps
const PHOTO_GAP = Spacing.sm;
const PHOTO_COLUMNS = 3;
const PHOTO_SIZE = Math.floor((SCREEN_WIDTH - Spacing.lg * 2 - PHOTO_GAP * (PHOTO_COLUMNS - 1)) / PHOTO_COLUMNS);

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

const STATUS_OPTIONS: { value: LaporanForm['status']; label: string; icon: string; color: string; bg: string }[] = [
  { value: 'lunas', label: 'Lunas', icon: '✓', color: Colors.success, bg: Colors.successLight },
  { value: 'pending', label: 'Pending', icon: '⏳', color: Colors.warning, bg: Colors.warningLight },
  { value: 'gagal', label: 'Gagal', icon: '✗', color: Colors.danger, bg: Colors.dangerLight },
  { value: 'sebagian', label: 'Sebagian', icon: '≈', color: Colors.info, bg: Colors.infoLight },
];

function formatCurrencyInput(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  return Number(numbers).toLocaleString('id-ID');
}

export default function BuatLaporanScreen() {
  const insets = useSafeAreaInsets();
  const [fotoUris, setFotoUris] = useState<string[]>([]);
  const [rencanaAktifList, setRencanaAktifList] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
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
  const watchJumlah = watch('jumlah_tagihan');
  const watchTgl = watch('tanggal_penagihan');

  // Get selected rencana for header subtitle
  const selectedRencana = rencanaAktifList.find((r) => r.id === selectedRencanaId);

  // Auto calculate status form
  useEffect(() => {
    if (selectedRencana) {
      const dh = Number(String(watchJumlah).replace(/\D/g, '') || 0);
      const target = selectedRencana.target_nominal;
      const tgl = watchTgl;
      const deadline = selectedRencana.tanggal_target;

      if (dh >= target) {
        setValue('status', 'lunas');
      } else if (tgl > deadline && dh === 0) {
        setValue('status', 'gagal');
      } else if (dh > 0) {
        setValue('status', 'sebagian');
      } else {
        setValue('status', 'pending');
      }
    }
  }, [watchJumlah, watchTgl, selectedRencanaId, rencanaAktifList]);

  // Refresh rencana setiap kali screen ini dapat focus (termasuk navigasi balik)
  useFocusEffect(
    useReactCallback(() => {
      fetchRencanaAktif().then(setRencanaAktifList);
      getCurrentLocation();
    }, []),
  );

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
      {/* Header — Rounded bottom, dynamic safe area */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backArea}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Form Kunjungan</Text>
          {selectedRencana && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {selectedRencana.deskripsi || 'Rencana'} — {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedRencana.target_nominal)}
            </Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingBottom: 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Pilih Rencana */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Login ID *</Text>
            {rencanaAktifList.length === 0 ? (
              <View style={styles.emptyRencana}>
                <Text style={styles.emptyRencanaText}>Tidak ada rencana aktif</Text>
              </View>
            ) : (
              <View style={styles.dropdownWrapper}>
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
                          numberOfLines={1}
                        >
                          {r.deskripsi || new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(r.target_nominal)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
            {errors.rencana_id && (
              <Text style={styles.errorText}>{errors.rencana_id.message}</Text>
            )}
          </View>

          {/* Tanggal Penagihan */}
          <Controller
            control={control}
            name="tanggal_penagihan"
            render={({ field: { onChange, value } }) => (
              <View style={{ marginBottom: Spacing.md }}>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                  <View pointerEvents="none">
                    <Input
                      label="Tanggal Penagihan"
                      required
                      placeholder="YYYY-MM-DD"
                      value={value}
                      editable={false}
                      error={errors.tanggal_penagihan?.message}
                    />
                  </View>
                  <View style={{ position: 'absolute', right: Spacing.md, top: 38 }}>
                    <Text style={{ fontSize: 20 }}>📅</Text>
                  </View>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={new Date(value || Date.now())}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (event.type === 'set' && selectedDate) {
                        const dateString = selectedDate.toISOString().split('T')[0];
                        if (dateString) {
                          onChange(dateString);
                        }
                        if (Platform.OS === 'android') {
                          setShowDatePicker(false);
                        }
                      } else if (event.type === 'dismissed') {
                        setShowDatePicker(false);
                      }
                    }}
                  />
                )}
                {Platform.OS === 'ios' && showDatePicker && (
                  <Button 
                    label="Pilih Tanggal" 
                    onPress={() => setShowDatePicker(false)} 
                    size="sm" 
                    style={{ marginBottom: Spacing.xs, alignSelf: 'flex-end', minWidth: 100 }} 
                  />
                )}
              </View>
            )}
          />

          {/* Status */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Status Hasil</Text>
            <View style={styles.statusOptions}>
              {STATUS_OPTIONS.map((opt) => {
                const isActive = selectedStatus === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setValue('status', opt.value)}
                    style={[
                      styles.statusChip,
                      isActive && { backgroundColor: opt.bg, borderColor: opt.color },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        isActive && { color: opt.color, fontWeight: '700' },
                      ]}
                    >
                      {opt.icon} {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* DH Tertagih / Jumlah Tagihan */}
          <Controller
            control={control}
            name="jumlah_tagihan"
            render={({ field: { onChange, value } }) => (
              <Input
                label="DH Tertagih"
                required
                prefix="Rp"
                placeholder="0.00"
                value={formatCurrencyInput(String(value || ''))}
                onChangeText={(text) => onChange(text.replace(/\D/g, '') || '')}
                error={errors.jumlah_tagihan?.message}
                keyboardType="numeric"
              />
            )}
          />

          {/* Keterangan / Hasil Kunjungan */}
          <Controller
            control={control}
            name="keterangan"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Hasil Kunjungan"
                placeholder="Catatan hasil kunjungan..."
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            )}
          />

          {/* Upload Foto Kunjungan */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Foto Kunjungan</Text>

            {/* Camera upload area — always on top */}
            <TouchableOpacity style={styles.fotoUploadArea} onPress={pickPhoto}>
              <View style={styles.fotoUploadCircle}>
                <Text style={styles.fotoUploadIcon}>📷</Text>
              </View>
              <Text style={styles.fotoUploadText}>
                Tap untuk ambil foto ({fotoUris.length} foto terpilih)
              </Text>
            </TouchableOpacity>

            {/* Photo thumbnails — responsive grid below upload area */}
            {fotoUris.length > 0 && (
              <View style={styles.fotoGrid}>
                {fotoUris.map((uri) => (
                  <View key={uri} style={styles.fotoThumb}>
                    <Image source={{ uri }} style={styles.fotoImage} resizeMode="cover" />
                    <TouchableOpacity
                      onPress={() => removePhoto(uri)}
                      style={styles.fotoRemove}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.fotoRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* GPS Info */}
          <View style={styles.gpsInfo}>
            <View style={styles.gpsRow}>
              <View style={styles.gpsDot} />
              <Text style={styles.gpsCoords}>
                {latitude && longitude
                  ? `${latitude.toFixed(5)},  ${longitude.toFixed(5)}`
                  : 'Memuat lokasi...'}
              </Text>
            </View>
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

        {/* Footer — Batal + Simpan Kunjungan, respects bottom safe area */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <Button
            label="Batal"
            onPress={() => router.back()}
            variant="outline"
            style={styles.footerBtnLeft}
            disabled={loading}
          />
          <Button
            label="Simpan Kunjungan"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.footerBtnRight}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  // ── Header ────────────────────────────────────────────────
  // NOTE: paddingTop is set dynamically via insets.top in the component
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingBottom: 16,
    paddingHorizontal: Spacing.lg,
    ...HeaderStyle,
    ...Shadows.header,
  },
  backArea: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    color: '#FFFFFF',
    fontSize: FontSize.xl,
    fontWeight: '500',
  },
  headerCenter: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  // ── Body ──────────────────────────────────────────────────
  body: { flex: 1 },
  bodyContent: { padding: Spacing.lg },
  fieldContainer: { marginBottom: Spacing.md },
  fieldLabel: {
    fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  // ── Rencana selector ──────────────────────────────────────
  dropdownWrapper: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  emptyRencana: {
    padding: Spacing.md, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
  },
  emptyRencanaText: { fontSize: FontSize.sm, color: Colors.textMuted },
  rencanaChips: { flexDirection: 'row', gap: Spacing.sm },
  rencanaChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  rencanaChipActive: { borderColor: Colors.accent, backgroundColor: Colors.infoSoft },
  rencanaChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  rencanaChipTextActive: { color: Colors.accent },
  errorText: { fontSize: FontSize.xs, color: Colors.danger, marginTop: 4 },
  // ── Status chips (colored) ────────────────────────────────
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statusChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  statusChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  // ── Foto upload ───────────────────────────────────────────
  fotoGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: PHOTO_GAP, marginTop: Spacing.sm,
  },
  fotoThumb: {
    position: 'relative',
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
  },
  fotoImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md,
  },
  fotoRemove: {
    position: 'absolute', top: 4, right: 4,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.card,
  },
  fotoRemoveText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  fotoUploadArea: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    minHeight: 100,
  },
  fotoUploadCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fotoUploadIcon: { fontSize: 22 },
  fotoUploadText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  // ── GPS ───────────────────────────────────────────────────
  gpsInfo: {
    padding: Spacing.md, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginRight: Spacing.sm,
  },
  gpsCoords: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '500',
  },
  // ── Progress ──────────────────────────────────────────────
  progressContainer: { marginBottom: Spacing.md },
  progressText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 6 },
  progressBar: {
    height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  // ── Footer ────────────────────────────────────────────────
  // NOTE: paddingBottom is set dynamically via insets.bottom in the component
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  footerBtnLeft: { flex: 1 },
  footerBtnRight: { flex: 2 },
});
