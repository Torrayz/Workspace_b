// ============================================================================
// History Screen — Laporan milik sendiri, grouped by month
// Redesign v2: Tinted cards, month sections, foto link, modern styling
// ============================================================================

import { useMemo, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useLaporan, type Laporan } from '@/hooks/useLaporan';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { CardSkeleton } from '@/components/ui/Skeleton';
import {
  Colors,
  FontSize,
  Spacing,
  Shadows,
  HeaderStyle,
  StatusConfig,
} from '@/constants/theme';
import { formatRupiah, formatDate } from '@/lib/formatters';

// ── Group by month helper ───────────────────────────────────────────────────
function groupByMonth(items: Laporan[]): { title: string; data: Laporan[] }[] {
  const groups: Record<string, Laporan[]> = {};
  for (const item of items) {
    const monthKey = new Date(item.tanggal_penagihan).toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    }).toUpperCase();
    if (!groups[monthKey]) groups[monthKey] = [];
    groups[monthKey]!.push(item);
  }
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

function LaporanItem({ item }: { item: Laporan }) {
  const statusKey = (item.status as keyof typeof StatusConfig) || 'pending';
  const config = StatusConfig[statusKey] || StatusConfig.pending;

  return (
    <Card
      style={[styles.laporanCard, { backgroundColor: config.softBg }]}
      leftBorderColor={config.borderColor}
    >
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
        <StatusBadge status={statusKey} />
      </View>

      {/* Foto thumbnails */}
      {item.foto_urls && item.foto_urls.length > 0 && (
        <View style={styles.fotoRow}>
          <Text style={styles.fotoCount}>
            📷 {item.foto_urls.length} foto bukti terlampir
          </Text>
        </View>
      )}
    </Card>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { laporan, loading, fetchLaporan } = useLaporan();

  // Fix for React 19 FlashList estimatedItemSize type issue
  const SafeFlashList = FlashList as any;

  // Refresh setiap kali screen mendapat focus
  useFocusEffect(
    useCallback(() => {
      fetchLaporan();
    }, []),
  );

  // Build flat data with month section headers
  const groupedData = useMemo(() => groupByMonth(laporan), [laporan]);
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

  return (
    <View style={styles.container}>
      {/* Header — Rounded bottom, dynamic safe area */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
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
          data={flatData}
          estimatedItemSize={140}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }: any) => {
            if (item.type === 'header') {
              return <SectionHeader title={item.title} />;
            }
            return <LaporanItem item={item} />;
          }}
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
  // ── Header ────────────────────────────────────────────────
  // NOTE: paddingTop is set dynamically via insets.top in the component
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
    ...HeaderStyle,
    ...Shadows.header,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  // ── List ──────────────────────────────────────────────────
  listContainer: { padding: Spacing.lg },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  laporanCard: { marginBottom: Spacing.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, marginRight: Spacing.sm },
  laporanLabel: {
    fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  laporanNominal: {
    fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary,
  },
  laporanDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  keterangan: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 6, lineHeight: 18 },
  fotoRow: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  fotoCount: { fontSize: FontSize.xs, color: Colors.textMuted },
  // ── Empty ─────────────────────────────────────────────────
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
