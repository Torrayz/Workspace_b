// ============================================================================
// Home Screen — KPI Dashboard + Activity Feed + Quick Actions
// Redesign: Rich dashboard inspired by field marketing KPI panels
// ============================================================================

import { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useRencana } from '@/hooks/useRencana';
import { useLaporan} from '@/hooks/useLaporan';
import { Card } from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Colors, FontSize, Spacing, Shadows, BorderRadius, StatusConfig } from '@/constants/theme';
import { formatRupiah } from '@/lib/formatters';

const { width: SCREEN_W } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { rencanaList, hasRencanaAktif, fetchRencana, loading } = useRencana();
  const { laporan, fetchLaporan, loading: laporanLoading } = useLaporan();

  useFocusEffect(
    useCallback(() => {
      fetchRencana();
      fetchLaporan();
    }, []),
  );

  const rencanaAktif = rencanaList.filter((r) => r.status === 'aktif');
  const rencanaSelesai = rencanaList.filter((r) => r.status === 'selesai');

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const todayDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // ── KPI Calculations ──────────────────────────────────
  const totalTarget = rencanaAktif.reduce((sum, r) => sum + r.target_nominal, 0);
  const totalCollected = rencanaAktif.reduce((sum, r) => sum + (r.total_collected || 0), 0);
  const overallProgress = totalTarget > 0 ? Math.min(Math.round((totalCollected / totalTarget) * 100), 100) : 0;

  // Laporan bulan ini
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const laporanBulanIni = laporan.filter((l) => {
    const d = new Date(l.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalDHtertagih = laporan.reduce((sum, l) => sum + (l.jumlah_tagihan || 0), 0);
  const totalDHbulanIni = laporanBulanIni.reduce((sum, l) => sum + (l.jumlah_tagihan || 0), 0);

  const eksekusiPct = rencanaList.length > 0
    ? Math.round((rencanaSelesai.length / rencanaList.length) * 100)
    : 0;

  // 3 laporan terbaru
  const recentLaporan = laporan.slice(0, 5);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.nama?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.greetingText}>{greeting()} 👋</Text>
              <Text style={styles.nameText} numberOfLines={1}>{user?.nama || 'User'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutIcon}>↪</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.dateText}>{todayDate}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >

        {/* ══════════════════════════════════════════════════
            KPI GLOBAL — Card grid
            ══════════════════════════════════════════════════ */}
        <Text style={styles.sectionTitle}>📊  KPI Global</Text>
        <View style={styles.kpiGrid}>
          {/* Row 1 */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderLeftColor: Colors.accent }]}>
              <Text style={styles.kpiIcon}>📋</Text>
              <Text style={[styles.kpiValue, { color: Colors.accent }]}>
                {rencanaList.length}
              </Text>
              <Text style={styles.kpiLabel}>Total Rencana</Text>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: Colors.success }]}>
              <Text style={styles.kpiIcon}>✅</Text>
              <Text style={[styles.kpiValue, { color: Colors.success }]}>
                {rencanaSelesai.length}
              </Text>
              <Text style={styles.kpiLabel}>Rencana Selesai</Text>
            </View>
          </View>
          {/* Row 2 */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderLeftColor: Colors.warning }]}>
              <Text style={styles.kpiIcon}>📝</Text>
              <Text style={[styles.kpiValue, { color: Colors.warning }]}>
                {laporanBulanIni.length}
              </Text>
              <Text style={styles.kpiLabel}>Kunjungan Bulan Ini</Text>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: '#8B5CF6' }]}>
              <Text style={styles.kpiIcon}>📈</Text>
              <Text style={[styles.kpiValue, { color: '#8B5CF6' }]}>
                {eksekusiPct}%
              </Text>
              <Text style={styles.kpiLabel}>% Eksekusi</Text>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════
            TOTAL TERTAGIH — Big highlight card
            ══════════════════════════════════════════════════ */}
        <View style={styles.highlightCard}>
          <View style={styles.highlightRow}>
            <View style={styles.highlightLeft}>
              <Text style={styles.highlightLabel}>Total DH Tertagih</Text>
              <Text style={styles.highlightValue}>
                {formatRupiah(totalDHtertagih)}
              </Text>
              <Text style={styles.highlightSub}>
                Bulan ini: {formatRupiah(totalDHbulanIni)}
              </Text>
            </View>
            <View style={styles.highlightCircle}>
              <Text style={styles.highlightCircleText}>💰</Text>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════
            TARGET PROGRESS — Progress bar card
            ══════════════════════════════════════════════════ */}
        {rencanaAktif.length > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>🎯 Target Aktif</Text>
              <View style={[
                styles.progressBadge,
                {
                  backgroundColor: overallProgress >= 80 ? Colors.successSoft : overallProgress >= 50 ? Colors.warningSoft : Colors.infoSoft,
                },
              ]}>
                <Text style={[
                  styles.progressBadgeText,
                  {
                    color: overallProgress >= 80 ? Colors.success : overallProgress >= 50 ? Colors.warning : Colors.accent,
                  },
                ]}>
                  {overallProgress}%
                </Text>
              </View>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(overallProgress, 100)}%`,
                    backgroundColor: overallProgress >= 100 ? Colors.success : 
                      overallProgress >= 50 ? Colors.warning : Colors.accent,
                  },
                ]}
              />
            </View>
            <View style={styles.progressAmountsCol}>
              <View style={styles.progressAmountRow}>
                <Text style={styles.progressLabel}>Terkumpul</Text>
                <Text style={[styles.progressValue, { color: Colors.success }]}>
                  {formatRupiah(totalCollected)}
                </Text>
              </View>
              <View style={styles.progressAmountRow}>
                <Text style={styles.progressLabel}>Target</Text>
                <Text style={styles.progressValue}>
                  {formatRupiah(totalTarget)}
                </Text>
              </View>
              <View style={styles.progressAmountRow}>
                <Text style={styles.progressLabel}>Sisa</Text>
                <Text style={[styles.progressValue, { color: Colors.danger }]}>
                  {formatRupiah(Math.max(totalTarget - totalCollected, 0))}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════
            AKSI CEPAT — Quick action buttons
            ══════════════════════════════════════════════════ */}
        <Text style={styles.sectionTitle}>⚡  Aksi Cepat</Text>
        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={styles.ctaCard}
            onPress={() => router.push('/(main)/rencana')}
            activeOpacity={0.7}
          >
            <View style={[styles.ctaIconCircle, { backgroundColor: Colors.infoSoft }]}>
              <Text style={styles.ctaIcon}>📋</Text>
            </View>
            <Text style={styles.ctaLabel}>Rencana</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctaCard, !hasRencanaAktif && styles.ctaCardDisabled]}
            onPress={() => {
              if (!hasRencanaAktif) return;
              router.push('/(main)/laporan/buat');
            }}
            activeOpacity={hasRencanaAktif ? 0.7 : 1}
          >
            <View style={[styles.ctaIconCircle, { backgroundColor: hasRencanaAktif ? Colors.successSoft : Colors.surfaceAlt }]}>
              <Text style={styles.ctaIcon}>📝</Text>
            </View>
            <Text style={[styles.ctaLabel, !hasRencanaAktif && { color: Colors.textMuted }]}>Laporan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ctaCard}
            onPress={() => router.push('/(main)/history')}
            activeOpacity={0.7}
          >
            <View style={[styles.ctaIconCircle, { backgroundColor: Colors.warningSoft }]}>
              <Text style={styles.ctaIcon}>📊</Text>
            </View>
            <Text style={styles.ctaLabel}>History</Text>
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════════════
            RENCANA AKTIF LIST
            ══════════════════════════════════════════════════ */}
        {loading ? (
          <>
            <Text style={styles.sectionTitle}>🔥  Rencana Aktif</Text>
            <CardSkeleton />
          </>
        ) : rencanaAktif.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>🔥  Rencana Aktif</Text>
            {rencanaAktif.slice(0, 3).map((r) => {
              const pct = Math.min(r.progress || 0, 100);
              return (
                <Card key={r.id} style={styles.rencanaCard} leftBorderColor={Colors.accent}>
                  <View style={styles.rencanaRow}>
                    <View style={styles.rencanaLeft}>
                      <Text style={styles.rencanaName} numberOfLines={1}>
                        {r.deskripsi || 'Penagihan'}
                      </Text>
                      <Text style={styles.rencanaMeta} numberOfLines={1}>
                        {new Date(r.tanggal_target).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                        {' • '}
                        {formatRupiah(r.total_collected || 0)} / {formatRupiah(r.target_nominal)}
                      </Text>
                    </View>
                    <View style={[
                      styles.rencanaPctBadge,
                      {
                        backgroundColor: pct >= 80 ? Colors.successSoft : pct >= 50 ? Colors.warningSoft : Colors.infoSoft,
                      },
                    ]}>
                      <Text style={[
                        styles.rencanaPctText,
                        {
                          color: pct >= 80 ? Colors.success : pct >= 50 ? Colors.warning : Colors.accent,
                        },
                      ]}>
                        {pct}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.miniProgressTrack}>
                    <View style={[
                      styles.miniProgressFill,
                      {
                        width: `${pct}%`,
                        backgroundColor: pct >= 80 ? Colors.success : pct >= 50 ? Colors.warning : Colors.accent,
                      },
                    ]} />
                  </View>
                </Card>
              );
            })}
          </>
        ) : !loading && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>Belum ada rencana aktif</Text>
            <Text style={styles.emptyDesc}>
              Buat rencana penagihan untuk mulai bekerja
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(main)/rencana')}
            >
              <Text style={styles.emptyBtnText}>+ Buat Rencana</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════════════════════════════════════════════
            AKTIVITAS TERBARU — Recent laporan
            ══════════════════════════════════════════════════ */}
        <Text style={styles.sectionTitle}>🕐  Aktivitas Terbaru</Text>
        {laporanLoading ? (
          <CardSkeleton />
        ) : recentLaporan.length > 0 ? (
          <View style={styles.activityCard}>
            {recentLaporan.map((l, idx) => {
              const cfg = StatusConfig[l.status] || StatusConfig.pending;
              const createdDate = new Date(l.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <View key={l.id}>
                  <View style={styles.activityItem}>
                    <View style={[styles.activityDot, { backgroundColor: cfg.color }]} />
                    <View style={styles.activityContent}>
                      <View style={styles.activityTopRow}>
                        <Text style={styles.activityAmount} numberOfLines={1}>
                          {formatRupiah(l.jumlah_tagihan)}
                        </Text>
                        <View style={[styles.activityBadge, { backgroundColor: cfg.softBg }]}>
                          <Text style={[styles.activityBadgeText, { color: cfg.color }]}>
                            {cfg.icon} {cfg.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.activityDate}>{createdDate}</Text>
                    </View>
                  </View>
                  {idx < recentLaporan.length - 1 && <View style={styles.activityDivider} />}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptySmall}>
            <Text style={styles.emptySmallText}>Belum ada aktivitas</Text>
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

  // ── Header ─────────────────────────────────────────────
  header: {
    backgroundColor: '#0F172A',
    paddingBottom: 16,
    paddingHorizontal: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: '#FFF',
  },
  headerInfo: { flex: 1 },
  greetingText: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.5)',
  },
  nameText: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: '#FFF',
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logoutIcon: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  dateText: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 8,
  },

  // ── Content ────────────────────────────────────────────
  content: { flex: 1 },
  contentContainer: {
    padding: Spacing.md,
    paddingTop: Spacing.md,
  },

  // ── Section Title ─────────────────────────────────────
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },

  // ── KPI Grid ──────────────────────────────────────────
  kpiGrid: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  kpiIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ── Highlight card (total tertagih) ───────────────────
  highlightCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    ...Shadows.header,
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highlightLeft: {
    flex: 1,
  },
  highlightLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  highlightValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  highlightSub: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  highlightCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  highlightCircleText: {
    fontSize: 24,
  },

  // ── Progress card ─────────────────────────────────────
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  progressBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: Colors.borderLight,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: 10,
    borderRadius: 5,
  },
  progressAmountsCol: {
    gap: 6,
  },
  progressAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  progressValue: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },

  // ── CTA ────────────────────────────────────────────────
  ctaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  ctaCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  ctaCardDisabled: { opacity: 0.4 },
  ctaIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  ctaIcon: { fontSize: 20 },
  ctaLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  // ── Rencana list ──────────────────────────────────────
  rencanaCard: { marginBottom: Spacing.sm },
  rencanaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rencanaLeft: { flex: 1, marginRight: Spacing.sm },
  rencanaName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  rencanaMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  rencanaPctBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  rencanaPctText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  miniProgressTrack: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: 4,
    borderRadius: 2,
  },

  // ── Activity Feed ─────────────────────────────────────
  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityAmount: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  activityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginLeft: 8,
  },
  activityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  activityDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  activityDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 22,
  },

  // ── Empty states ──────────────────────────────────────
  emptyBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: Spacing.sm,
  },
  emptyEmoji: { fontSize: 36, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  emptyDesc: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    textAlign: 'center', marginTop: 4, lineHeight: 20,
  },
  emptyBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.accent,
    ...Shadows.fab,
  },
  emptyBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: '#FFF' },
  emptySmall: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptySmallText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
