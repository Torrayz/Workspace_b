// ============================================================================
// History Screen — FlashList laporan milik sendiri
// ============================================================================

import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLaporan, type Laporan } from '@/hooks/useLaporan';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { formatRupiah, formatDate } from '@/lib/formatters';

function LaporanItem({ item }: { item: Laporan }) {
  return (
    <Card style={styles.laporanCard}>
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Text style={styles.laporanLabel}>Jumlah Tagihan</Text>
          <Text style={styles.laporanNominal}>{formatRupiah(item.jumlah_tagihan)}</Text>
          <Text style={styles.laporanDate}>{formatDate(item.tanggal_penagihan)}</Text>
          {item.keterangan && (
            <Text style={styles.keterangan} numberOfLines={2}>
              {item.keterangan}
            </Text>
          )}
        </View>
        <StatusBadge status={item.status} />
      </View>

      {/* Foto thumbnails */}
      {item.foto_urls && item.foto_urls.length > 0 && (
        <View style={styles.fotoRow}>
          <Text style={styles.fotoCount}>
            📷 {item.foto_urls.length} foto
          </Text>
        </View>
      )}
    </Card>
  );
}

export default function HistoryScreen() {
  const { laporan, loading, fetchLaporan } = useLaporan();

  // Fix for React 19 FlashList estimatedItemSize type issue
  const SafeFlashList = FlashList as any;

  useEffect(() => {
    fetchLaporan();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History Laporan</Text>
        <Text style={styles.headerSubtitle}>{laporan.length} laporan dikirim</Text>
      </View>

      {loading ? (
        <View style={styles.listContainer}>
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </View>
      ) : laporan.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyTitle}>Belum ada laporan</Text>
          <Text style={styles.emptyDesc}>
            Laporan yang Anda kirim akan muncul di sini.
          </Text>
        </View>
      ) : (
        <SafeFlashList
          data={laporan}
          estimatedItemSize={120}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }: any) => <LaporanItem item={item} />}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchLaporan}
          refreshing={loading}
        />
      )}
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
  listContainer: { padding: Spacing.lg },
  listContent: { padding: Spacing.lg, paddingBottom: 80 },
  laporanCard: { marginBottom: Spacing.sm, padding: Spacing.md },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, marginRight: Spacing.sm },
  laporanLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  laporanNominal: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  laporanDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  keterangan: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  fotoRow: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  fotoCount: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
