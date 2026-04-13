// ============================================================================
// Rencana Screen — List rencana + modal buat rencana baru
// Redesign v2: Dark navy header with FAB, grouped list with date sections
// ============================================================================

import { useEffect, useState, useMemo } from 'react';
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
  const { rencanaList, loading, fetchRencana, createRencana } = useRencana();
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const statusMap = {
    aktif: 'pending',
    selesai: 'lunas',
    batal: 'gagal',
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
      {/* Header — Rounded bottom with inline FAB */}
      <View style={styles.header}>
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
                      {formatDate(item.tanggal_target)} • {formatRupiah(item.target_nominal)}
                    </Text>
                  </View>
                  <StatusBadge status={statusKey} />
                </View>
              </Card>
            );
          }}
        />
      )}

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
  // ── Header ────────────────────────────────────────────────
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 52,
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
});
