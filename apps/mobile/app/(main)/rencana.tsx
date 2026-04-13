// ============================================================================
// Rencana Screen — List rencana + modal buat rencana baru
// ============================================================================

import { useEffect, useState } from 'react';
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
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRencana } from '@/hooks/useRencana';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Colors, FontSize, Spacing } from '@/constants/theme';
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

export default function RencanaScreen() {
  const { rencanaList, loading, fetchRencana, createRencana } = useRencana();
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    fetchRencana();
  }, []);

  const onSubmit = async (data: RencanaForm) => {
    setSubmitting(true);
    const success = await createRencana({
      target_nominal: data.target_nominal as unknown as number,
      tanggal_target: data.tanggal_target,
      deskripsi: data.deskripsi,
    });
    setSubmitting(false);

    if (success) {
      setModalVisible(false);
      reset();
      Alert.alert('Berhasil', 'Rencana berhasil dibuat!');
    } else {
      Alert.alert('Gagal', 'Gagal membuat rencana. Coba lagi.');
    }
  };

  const statusMap = {
    aktif: 'pending',
    selesai: 'lunas',
    batal: 'gagal',
  } as const;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rencana</Text>
        <Text style={styles.headerSubtitle}>{rencanaList.length} rencana dibuat</Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.listContainer}>
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={rencanaList}
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
          renderItem={({ item }) => (
            <Card style={styles.rencanaCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.labelNominal}>Target Nominal</Text>
                <StatusBadge status={statusMap[item.status] || 'pending'} />
              </View>
              <Text style={styles.nominal}>{formatRupiah(item.target_nominal)}</Text>
              {item.deskripsi && (
                <Text style={styles.deskripsi}>{item.deskripsi}</Text>
              )}
              <Text style={styles.tanggal}>
                🗓 Target: {formatDate(item.tanggal_target)}
              </Text>
              <Text style={styles.createdAt}>
                Dibuat: {formatDate(item.created_at)}
              </Text>
            </Card>
          )}
        />
      )}

      {/* FAB — Tambah Rencana */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

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
                <Input
                  label="Tanggal Target"
                  placeholder="YYYY-MM-DD"
                  value={value}
                  onChangeText={onChange}
                  error={errors.tanggal_target?.message}
                  hint={`Minimal H-1 (kemarin atau setelahnya)`}
                />
              )}
            />

            {/* Deskripsi */}
            <Controller
              control={control}
              name="deskripsi"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Deskripsi (Opsional)"
                  placeholder="Catatan rencana..."
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
              )}
            />
          </ScrollView>

          {/* CTA fixed di bottom */}
          <View style={styles.modalFooter}>
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
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  listContainer: { padding: Spacing.lg, paddingBottom: 100 },
  rencanaCard: { marginBottom: Spacing.sm, padding: Spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  labelNominal: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  nominal: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  deskripsi: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  tanggal: { fontSize: FontSize.xs, color: Colors.textMuted },
  createdAt: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  fab: {
    position: 'absolute', bottom: 90, right: Spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  fabText: { fontSize: 28, color: '#FFF', fontWeight: '300', lineHeight: 32 },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  modalClose: { fontSize: FontSize.xl, color: Colors.textMuted },
  modalBody: { flex: 1 },
  modalBodyContent: { padding: Spacing.lg },
  modalFooter: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  modalBtnLeft: { flex: 1 },
  modalBtnRight: { flex: 2 },
});
