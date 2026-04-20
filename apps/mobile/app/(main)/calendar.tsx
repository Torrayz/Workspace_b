// ============================================================================
// Calendar Screen — Kalender visual rencana & laporan
// Menampilkan tanggal target rencana dan tanggal kunjungan laporan
// ============================================================================

import { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useRencana, type Rencana } from '@/hooks/useRencana';
import { useLaporan, type Laporan } from '@/hooks/useLaporan';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Colors, FontSize, Spacing, Shadows, BorderRadius, StatusConfig } from '@/constants/theme';
import { formatRupiah } from '@/lib/formatters';

// ── Indonesian locale for calendar ──
LocaleConfig.locales['id'] = {
  monthNames: [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ],
  monthNamesShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ],
  dayNames: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  dayNamesShort: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  today: 'Hari Ini',
};
LocaleConfig.defaultLocale = 'id';

type ViewMode = 'rencana' | 'laporan';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { rencanaList, fetchRencana, loading: rencanaLoading } = useRencana();
  const { laporan, fetchLaporan, loading: laporanLoading } = useLaporan();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('rencana');

  useFocusEffect(
    useCallback(() => {
      fetchRencana();
      fetchLaporan();
    }, []),
  );

  const loading = rencanaLoading || laporanLoading;

  // ── Build marked dates ──
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    if (viewMode === 'rencana') {
      // Mark rencana target dates
      for (const r of rencanaList) {
        const dateKey = r.tanggal_target.split('T')[0];
        if (!dateKey) continue;

        const statusColor =
          r.status === 'aktif' ? Colors.accent :
          r.status === 'selesai' ? Colors.success :
          Colors.danger;

        if (!marks[dateKey]) {
          marks[dateKey] = { dots: [], marked: true };
        }
        marks[dateKey].dots.push({ key: r.id, color: statusColor });
      }
    } else {
      // Mark laporan dates
      for (const l of laporan) {
        const dateKey = l.tanggal_penagihan.split('T')[0];
        if (!dateKey) continue;

        const cfg = StatusConfig[l.status] || StatusConfig.pending;

        if (!marks[dateKey]) {
          marks[dateKey] = { dots: [], marked: true };
        }
        marks[dateKey].dots.push({ key: l.id, color: cfg.color });
      }
    }

    // Highlight selected date
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: Colors.accent,
      };
    }

    return marks;
  }, [rencanaList, laporan, selectedDate, viewMode]);

  // ── Items for selected date ──
  const selectedItems = useMemo(() => {
    if (!selectedDate) return { rencana: [] as Rencana[], laporan: [] as Laporan[] };

    const rencanaForDate = rencanaList.filter(
      (r) => r.tanggal_target.split('T')[0] === selectedDate,
    );
    const laporanForDate = laporan.filter(
      (l) => l.tanggal_penagihan.split('T')[0] === selectedDate,
    );

    return { rencana: rencanaForDate, laporan: laporanForDate };
  }, [selectedDate, rencanaList, laporan]);

  const hasItemsForDate = selectedItems.rencana.length > 0 || selectedItems.laporan.length > 0;

  // Today string
  const today = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <Text style={styles.headerTitle}>📅 Kalender</Text>
        <Text style={styles.headerSubtitle}>
          {viewMode === 'rencana' ? 'Tanggal Target Rencana' : 'Tanggal Kunjungan Laporan'}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ── View Mode Toggle ── */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'rencana' && styles.toggleBtnActive]}
            onPress={() => { setViewMode('rencana'); setSelectedDate(''); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, viewMode === 'rencana' && styles.toggleTextActive]}>
              📋 Rencana
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'laporan' && styles.toggleBtnActive]}
            onPress={() => { setViewMode('laporan'); setSelectedDate(''); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, viewMode === 'laporan' && styles.toggleTextActive]}>
              📝 Laporan
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Calendar Component ── */}
        <View style={styles.calendarCard}>
          <Calendar
            current={today}
            onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
            markingType="multi-dot"
            markedDates={markedDates}
            enableSwipeMonths={true}
            theme={{
              backgroundColor: Colors.surface,
              calendarBackground: Colors.surface,
              textSectionTitleColor: Colors.textMuted,
              selectedDayBackgroundColor: Colors.accent,
              selectedDayTextColor: '#FFF',
              todayTextColor: Colors.accent,
              todayBackgroundColor: Colors.infoSoft,
              dayTextColor: Colors.textPrimary,
              textDisabledColor: Colors.borderLight,
              dotColor: Colors.accent,
              selectedDotColor: '#FFF',
              arrowColor: Colors.accent,
              monthTextColor: Colors.textPrimary,
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
          />
        </View>

        {/* ── Legend ── */}
        <View style={styles.legendRow}>
          {viewMode === 'rencana' ? (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
                <Text style={styles.legendText}>Aktif</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.legendText}>Selesai</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
                <Text style={styles.legendText}>Terlambat</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.legendText}>Lunas</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
                <Text style={styles.legendText}>Sebagian</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
                <Text style={styles.legendText}>Gagal</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                <Text style={styles.legendText}>Pending</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Selected Date Details ── */}
        {selectedDate ? (
          <View style={styles.detailSection}>
            <Text style={styles.detailTitle}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>

            {loading ? (
              <CardSkeleton />
            ) : !hasItemsForDate ? (
              <View style={styles.emptyDate}>
                <Text style={styles.emptyDateEmoji}>📭</Text>
                <Text style={styles.emptyDateText}>Tidak ada aktivitas pada tanggal ini</Text>
              </View>
            ) : (
              <>
                {/* Rencana items for this date */}
                {selectedItems.rencana.length > 0 && (
                  <>
                    <Text style={styles.subSectionTitle}>📋 Rencana ({selectedItems.rencana.length})</Text>
                    {selectedItems.rencana.map((r) => {
                      const statusColor =
                        r.status === 'aktif' ? Colors.accent :
                        r.status === 'selesai' ? Colors.success :
                        Colors.danger;
                      return (
                        <Card key={r.id} style={styles.itemCard} leftBorderColor={statusColor}>
                          <View style={styles.itemRow}>
                            <View style={styles.itemLeft}>
                              <Text style={styles.itemName} numberOfLines={1}>
                                {r.deskripsi || 'Rencana Penagihan'}
                              </Text>
                              <Text style={styles.itemMeta}>
                                Target: {formatRupiah(r.target_nominal)}
                              </Text>
                              {r.total_collected > 0 && (
                                <Text style={styles.itemMeta}>
                                  Terkumpul: {formatRupiah(r.total_collected)} ({r.progress}%)
                                </Text>
                              )}
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                              <Text style={[styles.statusText, { color: statusColor }]}>
                                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                              </Text>
                            </View>
                          </View>
                        </Card>
                      );
                    })}
                  </>
                )}

                {/* Laporan items for this date */}
                {selectedItems.laporan.length > 0 && (
                  <>
                    <Text style={styles.subSectionTitle}>📝 Laporan ({selectedItems.laporan.length})</Text>
                    {selectedItems.laporan.map((l) => {
                      const cfg = StatusConfig[l.status] || StatusConfig.pending;
                      return (
                        <Card key={l.id} style={styles.itemCard} leftBorderColor={cfg.color}>
                          <View style={styles.itemRow}>
                            <View style={styles.itemLeft}>
                              <Text style={styles.itemName}>
                                {formatRupiah(l.jumlah_tagihan)}
                              </Text>
                              <Text style={styles.itemMeta}>
                                {cfg.icon} {cfg.label}
                                {l.keterangan ? ` • ${l.keterangan}` : ''}
                              </Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: cfg.softBg }]}>
                              <Text style={[styles.statusText, { color: cfg.color }]}>
                                {cfg.label}
                              </Text>
                            </View>
                          </View>
                        </Card>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </View>
        ) : (
          <View style={styles.hintBox}>
            <Text style={styles.hintEmoji}>👆</Text>
            <Text style={styles.hintText}>Ketuk tanggal untuk melihat detail</Text>
          </View>
        )}

        {/* Bottom padding for tab bar */}
        <View style={{ height: 80 + Math.max(insets.bottom, 8) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // ── Header ──
  header: {
    backgroundColor: '#0F172A',
    paddingBottom: 12,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },

  // ── Content ──
  content: { flex: 1 },
  contentContainer: {
    padding: Spacing.md,
  },

  // ── Toggle ──
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  toggleBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  toggleText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: '#FFF',
  },

  // ── Calendar ──
  calendarCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },

  // ── Legend ──
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },

  // ── Detail Section ──
  detailSection: {
    marginTop: Spacing.sm,
  },
  detailTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  itemCard: {
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Empty / Hint ──
  emptyDate: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyDateEmoji: { fontSize: 28, marginBottom: 6 },
  emptyDateText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  hintBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: Spacing.md,
  },
  hintEmoji: { fontSize: 28, marginBottom: 6 },
  hintText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
