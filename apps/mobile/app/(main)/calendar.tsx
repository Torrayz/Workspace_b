// ============================================================================
// Calendar Screen — Kalender visual rencana & laporan
// Custom-built calendar (zero external dependencies)
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
import { useRencana, type Rencana } from '@/hooks/useRencana';
import { useLaporan, type Laporan } from '@/hooks/useLaporan';
import { Card } from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Colors, FontSize, Spacing, Shadows, BorderRadius, StatusConfig } from '@/constants/theme';
import { formatRupiah } from '@/lib/formatters';

// ── Indonesian month/day names ──
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const DAY_HEADERS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

type ViewMode = 'rencana' | 'laporan';

// ── Helper: get days in a month grid ──
function getCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: (number | null)[] = [];

  // Leading empty cells
  for (let i = 0; i < firstDay; i++) grid.push(null);
  // Actual days
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  // Trailing empty cells to fill last row
  while (grid.length % 7 !== 0) grid.push(null);

  return grid;
}

// ── Helper: format date key (YYYY-MM-DD) ──
function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { rencanaList, fetchRencana, loading: rencanaLoading } = useRencana();
  const { laporan, fetchLaporan, loading: laporanLoading } = useLaporan();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('rencana');

  useFocusEffect(
    useCallback(() => {
      fetchRencana();
      fetchLaporan();
    }, []),
  );

  const loading = rencanaLoading || laporanLoading;
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const grid = getCalendarGrid(currentYear, currentMonth);

  // ── Navigate months ──
  const goPrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate('');
  };

  const goNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate('');
  };

  const goToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate('');
  };

  // ── Build dot markers map ──
  const dotMarkers = useMemo(() => {
    const marks: Record<string, { color: string }[]> = {};

    if (viewMode === 'rencana') {
      for (const r of rencanaList) {
        const dateKey = r.tanggal_target?.split('T')[0];
        if (!dateKey) continue;
        const color =
          r.status === 'aktif' ? Colors.accent :
          r.status === 'selesai' ? Colors.success :
          Colors.danger;
        if (!marks[dateKey]) marks[dateKey] = [];
        marks[dateKey].push({ color });
      }
    } else {
      for (const l of laporan) {
        const dateKey = l.tanggal_penagihan?.split('T')[0];
        if (!dateKey) continue;
        const cfg = StatusConfig[l.status] || StatusConfig.pending;
        if (!marks[dateKey]) marks[dateKey] = [];
        marks[dateKey].push({ color: cfg.color });
      }
    }
    return marks;
  }, [rencanaList, laporan, viewMode]);

  // ── Items for selected date ──
  const selectedItems = useMemo(() => {
    if (!selectedDate) return { rencana: [] as Rencana[], laporan: [] as Laporan[] };
    return {
      rencana: rencanaList.filter((r) => r.tanggal_target?.split('T')[0] === selectedDate),
      laporan: laporan.filter((l) => l.tanggal_penagihan?.split('T')[0] === selectedDate),
    };
  }, [selectedDate, rencanaList, laporan]);

  const hasItemsForDate = selectedItems.rencana.length > 0 || selectedItems.laporan.length > 0;

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

        {/* ── Custom Calendar ── */}
        <View style={styles.calendarCard}>
          {/* Month navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goPrev} style={styles.navBtn} activeOpacity={0.6}>
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToday} activeOpacity={0.7}>
              <Text style={styles.monthTitle}>
                {MONTH_NAMES[currentMonth]} {currentYear}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goNext} style={styles.navBtn} activeOpacity={0.6}>
              <Text style={styles.navBtnText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.dayHeaderRow}>
            {DAY_HEADERS.map((d) => (
              <View key={d} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.dayGrid}>
            {grid.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }

              const dateKey = toDateKey(currentYear, currentMonth, day);
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDate;
              const dots = dotMarkers[dateKey] || [];

              return (
                <TouchableOpacity
                  key={dateKey}
                  style={styles.dayCell}
                  onPress={() => setSelectedDate(dateKey)}
                  activeOpacity={0.6}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isToday && styles.dayCircleToday,
                      isSelected && styles.dayCircleSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isToday && styles.dayTextToday,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                  {/* Dot indicators */}
                  {dots.length > 0 && (
                    <View style={styles.dotRow}>
                      {dots.slice(0, 3).map((dot, i) => (
                        <View
                          key={i}
                          style={[styles.dot, { backgroundColor: dot.color }]}
                        />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
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
  contentContainer: { padding: Spacing.md },

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
  toggleTextActive: { color: '#FFF' },

  // ── Calendar Card ──
  calendarCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Shadows.card,
  },

  // Month nav
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    fontSize: 24,
    fontWeight: '300',
    color: Colors.accent,
    marginTop: -2,
  },
  monthTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Day headers
  dayHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },

  // Day grid
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  dayCell: {
    width: '14.285%', // 100% / 7
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 46,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: Colors.infoSoft,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  dayCircleSelected: {
    backgroundColor: Colors.accent,
    borderWidth: 0,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  dayTextToday: {
    color: Colors.accent,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: '#FFF',
    fontWeight: '700',
  },

  // Dot indicators below day number
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 1,
    height: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
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
  detailSection: { marginTop: Spacing.sm },
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
  itemCard: { marginBottom: Spacing.sm },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: { flex: 1, marginRight: Spacing.sm },
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
