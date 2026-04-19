// ============================================================================
// Rencana Screen — List rencana + modal buat rencana baru
// Redesign v2: Dark navy header with FAB, grouped list with date sections
// ============================================================================

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRencana } from '@/hooks/useRencana';
import { useFocusEffect } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBadge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { CardSkeleton } from '@/components/ui/Skeleton';
import {
  Colors,
  FontSize,
  Spacing,
  Shadows,
  HeaderStyle,
  BorderRadius,
  StatusConfig,
} from '@/constants/theme';
import { formatRupiah, formatDate } from '@/lib/formatters';

// ── Validasi Zod ────────────────────────────────────────────────────────────
const rencanaSchema = z.object({
  target_nominal: z
    .string()
    .min(1, 'Target nominal wajib diisi')
    .transform((v) => Number(v.replace(/\D/g, '')))
    .refine((v) => v >= 1000, 'Minimal Rp 1.000'),
  tanggal_target: z
    .string()
    .min(1, 'Tanggal target wajib diisi')
    .refine((v) => {
      const target = new Date(v);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return target >= yesterday;
    }, 'Tanggal tidak boleh sebelum kemarin'),
  deskripsi: z.string().optional(),
});

type RencanaForm = z.infer<typeof rencanaSchema>;

// ── Currency mask helper ────────────────────────────────────────────────────
function formatCurrencyInput(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  return Number(numbers).toLocaleString('id-ID');
}

function getTomorrowDate(): string {
  const d = new Date();
  return d.toISOString().split('T')[0]!;
}

// ── Group by date helper ────────────────────────────────────────────────────
function groupByDate(items: any[]): { title: string; data: any[] }[] {
  const groups: Record<string, any[]> = {};
  for (const item of items) {
    const dateKey = new Date(item.tanggal_target).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey]!.push(item);
  }
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

export default function RencanaScreen() {
  const insets = useSafeAreaInsets();
  const { rencanaList, loading, fetchRencana, createRencana, requestDeleteRencana } = useRencana();
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Delete request state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; deskripsi: string | null } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RencanaForm>({
    resolver: zodResolver(rencanaSchema) as any,
    defaultValues: {
      target_nominal: '' as any,
      tanggal_target: getTomorrowDate(),
      deskripsi: '',
    },
  });

  // Refresh data setiap kali screen dapat focus
  useFocusEffect(
    useCallback(() => {
      fetchRencana();
    }, []),
  );

  const groupedData = useMemo(() => groupByDate(rencanaList), [rencanaList]);

  const onSubmit = async (data: RencanaForm) => {
    setSubmitting(true);
    const result = await createRencana({
      target_nominal: data.target_nominal as unknown as number,
      tanggal_target: data.tanggal_target,
      deskripsi: data.deskripsi,
    });
    setSubmitting(false);

    if (result.success) {
      setModalVisible(false);
      reset();
      Alert.alert('Berhasil', 'Rencana berhasil dibuat!');
    } else {
      Alert.alert('Gagal', result.error || 'Gagal membuat rencana. Coba lagi.');
    }
  };

  const openDeleteModal = (rencana: { id: string; deskripsi: string | null }) => {
    setDeleteTarget(rencana);
    setDeleteReason('');
    setDeleteModalVisible(true);
  };

  const handleDeleteRequest = async () => {
    if (!deleteTarget) return;
    if (!deleteReason.trim()) {
      Alert.alert('Perhatian', 'Alasan penghapusan wajib diisi.');
      return;
    }
    setDeleting(true);
    const result = await requestDeleteRencana(deleteTarget.id, deleteReason.trim());
    setDeleting(false);
    if (result.success) {
      setDeleteModalVisible(false);
      Alert.alert('Berhasil', 'Permintaan hapus telah dikirim ke Admin untuk disetujui.');
    } else {
      Alert.alert('Gagal', result.error || 'Gagal mengirim permintaan hapus.');
    }
  };

  const statusMap = {
    aktif: 'pending',
    selesai: 'lunas',
    terlambat: 'gagal',
  } as const;

  // Build flat list data with section headers
  const flatData = useMemo(() => {
    const result: any[] = [];
    for (const group of groupedData) {
      result.push({ type: 'header', title: group.title, id: `header-${group.title}` });
      for (const item of group.data) {
        result.push({ type: 'item', ...item });
      }
    }
    return result;
  }, [groupedData]);

  const getStatusKey = (status: string) => {
    return (statusMap[status as keyof typeof statusMap] || 'pending') as keyof typeof StatusConfig;
  };

  return (
    <View style={styles.container}>
      {/* Header — Rounded bottom with inline FAB, dynamic safe area */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Daftar Rencana</Text>
            <Text style={styles.headerSubtitle}>
              {rencanaList.length} rencana terdaftar
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerFab}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.headerFabText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.listContainer}>
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>Belum ada rencana</Text>
              <Text style={styles.emptyDesc}>
                Tap tombol + untuk membuat rencana pertama Anda.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return <SectionHeader title={item.title} />;
            }
            const statusKey = getStatusKey(item.status);
            const config = StatusConfig[statusKey];
            const progressPct = item.progress || 0;
            const progressColor = item.status === 'selesai'
              ? Colors.success
              : item.status === 'terlambat'
                ? Colors.danger
                : Colors.accent;

            return (
              <Card
                style={styles.rencanaCard}
                leftBorderColor={config.borderColor}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.deskripsi || 'Rencana Penagihan'}
                    </Text>
                    <Text style={styles.cardMeta}>
                      Deadline: {formatDate(item.tanggal_target)}
                    </Text>
                  </View>
                  <StatusBadge status={statusKey} />
                </View>

                {/* Progress bar */}
                <View style={styles.progressSection}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressText}>
                      {formatRupiah(item.total_collected || 0)} / {formatRupiah(item.target_nominal)}
                    </Text>
                    <Text style={[styles.progressPct, { color: progressColor }]}>
                      {progressPct}%
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progressPct}%`,
                          backgroundColor: progressColor,
                        },
                      ]}
                    />
                  </View>
                  {item.status === 'aktif' && item.sisa > 0 && (
                    <Text style={styles.sisaText}>
                      Sisa: {formatRupiah(item.sisa)}
                    </Text>
                  )}
                </View>

                {/* Delete request status / button */}
                {item.delete_status === 'pending' ? (
                  <View style={styles.deleteStatusRow}>
                    <Text style={styles.deleteStatusPending}>⏳ Menunggu persetujuan hapus</Text>
                  </View>
                ) : item.delete_status === 'rejected' ? (
                  <View style={styles.deleteStatusRow}>
                    <Text style={styles.deleteStatusRejected}>
                      ❌ Ditolak{item.delete_admin_note ? `: ${item.delete_admin_note}` : ''}
                    </Text>
                    <TouchableOpacity
                      onPress={() => openDeleteModal({ id: item.id, deskripsi: item.deskripsi })}
                      style={styles.retryDeleteBtn}
                    >
                      <Text style={styles.retryDeleteText}>Ajukan ulang</Text>
                    </TouchableOpacity>
                  </View>
                ) : item.delete_status !== 'approved' ? (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => openDeleteModal({ id: item.id, deskripsi: item.deskripsi })}
                  >
                    <Text style={styles.deleteBtnText}>🗑  Hapus Rencana</Text>
                  </TouchableOpacity>
                ) : null}
              </Card>
            );
          }}
        />
      )}

      {/* Modal Alasan Hapus */}
      <Modal
        visible={deleteModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteModalTitle}>Hapus Rencana</Text>
            <Text style={styles.deleteModalDesc}>
              "{deleteTarget?.deskripsi || 'Rencana Penagihan'}" akan dihapus setelah disetujui Admin.
            </Text>
            <Text style={styles.deleteInputLabel}>Alasan Penghapusan *</Text>
            <TextInput
              style={styles.deleteInput}
              placeholder="Contoh: Rencana dibuat salah, nominal tidak sesuai..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              value={deleteReason}
              onChangeText={setDeleteReason}
              textAlignVertical="top"
            />
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.deleteCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmBtn, deleting && { opacity: 0.6 }]}
                onPress={handleDeleteRequest}
                disabled={deleting}
              >
                <Text style={styles.deleteConfirmText}>
                  {deleting ? 'Mengirim...' : 'Kirim Permintaan'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Form Buat Rencana */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Buat Rencana Baru</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Target Nominal */}
            <Controller
              control={control}
              name="target_nominal"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Target Nominal"
                  required
                  placeholder="0"
                  prefix="Rp"
                  value={formatCurrencyInput(String(value || ''))}
                  onChangeText={(text) => onChange(text.replace(/\D/g, '') || '')}
                  error={errors.target_nominal?.message}
                  keyboardType="numeric"
                  hint="Masukkan target nominal tagihan"
                />
              )}
            />

            {/* Tanggal Target */}
            <Controller
              control={control}
              name="tanggal_target"
              render={({ field: { onChange, value } }) => (
                <View style={{ marginBottom: Spacing.md }}>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                    {/* Menggunakan prop style view pointerEvents untuk render input sbg trigger clickable yang tidak menerima text input langsung */} 
                    <View pointerEvents="none">
                      <Input
                        label="Tanggal Target"
                        required
                        placeholder="YYYY-MM-DD"
                        value={value}
                        editable={false}
                        error={errors.tanggal_target?.message}
                        hint={`Minimal H-1 (kemarin atau setelahnya)`}
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
                        setShowDatePicker(Platform.OS === 'ios'); // Di iOS, kita harus atur handle close manual, di android auto hide
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

            {/* Deskripsi */}
            <Controller
              control={control}
              name="deskripsi"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Deskripsi (Opsional)"
                  placeholder="Nama debitur atau catatan rencana..."
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
              )}
            />
          </ScrollView>

          {/* CTA fixed di bottom, respects bottom safe area */}
          <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
            <Button
              label="Batal"
              onPress={() => { setModalVisible(false); reset(); }}
              variant="outline"
              style={styles.modalBtnLeft}
              disabled={submitting}
            />
            <Button
              label="Simpan Rencana"
              onPress={handleSubmit(onSubmit)}
              loading={submitting}
              style={styles.modalBtnRight}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  // ── Header ────────────────────────────────────────────────
  // NOTE: paddingTop is set dynamically via insets.top in the component
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
    ...HeaderStyle,
    ...Shadows.header,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  headerFab: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.fab,
  },
  headerFabText: { fontSize: 24, color: '#FFF', fontWeight: '300', lineHeight: 28 },
  // ── List ──────────────────────────────────────────────────
  listContainer: { padding: Spacing.lg, paddingBottom: 100 },
  rencanaCard: { marginBottom: Spacing.sm },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: { flex: 1, marginRight: Spacing.sm },
  cardName: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  // ── Progress bar ─────────────────────────────────────────
  progressSection: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  progressPct: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%' as any,
    borderRadius: 3,
  },
  sisaText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  // ── Empty state ───────────────────────────────────────────
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  // ── Modal ─────────────────────────────────────────────────
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: FontSize.xl, color: Colors.textMuted, padding: Spacing.xs },
  modalBody: { flex: 1 },
  modalBodyContent: { padding: Spacing.lg },
  modalFooter: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  modalBtnLeft: { flex: 1 },
  modalBtnRight: { flex: 2 },
  // ── Delete request ───────────────────────────────────────
  deleteStatusRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  deleteStatusPending: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: '600',
  },
  deleteStatusRejected: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    fontWeight: '600',
    flex: 1,
  },
  retryDeleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.sm,
  },
  retryDeleteText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: '600',
  },
  deleteBtn: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    fontWeight: '600',
  },
  // ── Delete Modal ─────────────────────────────────────────
  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  deleteModal: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.header,
  },
  deleteModalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  deleteModalDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  deleteInputLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    minHeight: 80,
    marginBottom: Spacing.md,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  deleteCancelText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  deleteConfirmBtn: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.danger,
  },
  deleteConfirmText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#FFF',
  },
});
