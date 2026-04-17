// ============================================================================
// Home Screen — Modern compact header + dashboard-style content
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
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useRencana } from '@/hooks/useRencana';
import { Card } from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Colors, FontSize, Spacing, Shadows, BorderRadius } from '@/constants/theme';
import { formatRupiah } from '@/lib/formatters';

const { width: SCREEN_W } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { rencanaList, hasRencanaAktif, fetchRencana, loading } = useRencana();

  useFocusEffect(
    useCallback(() => {
      fetchRencana();
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

  // Calculate total stats
  const totalTarget = rencanaAktif.reduce((sum, r) => sum + r.target_nominal, 0);
  const totalCollected = rencanaAktif.reduce((sum, r) => sum + (r.total_collected || 0), 0);
  const overallProgress = totalTarget > 0 ? Math.min(Math.round((totalCollected / totalTarget) * 100), 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Compact Header */}
      <View style={styles.header}>
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
        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: Colors.infoSoft }]}>
            <Text style={[styles.statNumber, { color: Colors.accent }]}>
              {rencanaAktif.length}
            </Text>
            <Text style={styles.statLabel}>Aktif</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.successSoft }]}>
            <Text style={[styles.statNumber, { color: Colors.success }]}>
              {rencanaSelesai.length}
            </Text>
            <Text style={styles.statLabel}>Selesai</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.warningSoft }]}>
            <Text style={[styles.statNumber, { color: Colors.warning }]}>
              {overallProgress}%
            </Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>

        {/* Overall Progress Card */}
        {rencanaAktif.length > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Target Aktif</Text>
              <Text style={styles.progressPct}>{overallProgress}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(overallProgress, 100)}%`,
                    backgroundColor: overallProgress >= 100 ? Colors.success : Colors.accent,
                  },
                ]}
              />
            </View>
            <View style={styles.progressAmountsCol}>
              <View style={styles.progressAmountRow}>
                <Text style={styles.progressLabel}>Terkumpul</Text>
                <Text style={styles.progressValue}>{formatRupiah(totalCollected)}</Text>
              </View>
              <View style={styles.progressAmountRow}>
                <Text style={styles.progressLabel}>Target</Text>
                <Text style={styles.progressValue}>{formatRupiah(totalTarget)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* CTA Buttons */}
        <Text style={styles.sectionTitle}>Aksi Cepat</Text>
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

        {/* Rencana Aktif List */}
        {loading ? (
          <>
            <Text style={styles.sectionTitle}>Rencana Aktif</Text>
            <CardSkeleton />
          </>
        ) : rencanaAktif.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Rencana Aktif</Text>
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
                        {formatRupiah(r.total_collected || 0)}
                      </Text>
                    </View>
                    <Text style={styles.rencanaPct}>{pct}%</Text>
                  </View>
                  <View style={styles.miniProgressTrack}>
                    <View style={[styles.miniProgressFill, { width: `${pct}%` }]} />
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

        {/* Bottom padding */}
        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  // ── Header ─────────────────────────────────────────────
  header: {
    backgroundColor: '#0F172A',
    paddingTop: 50,
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
  headerInfo: {
    flex: 1,
  },
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
  // ── Stats ──────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  // ── Progress card ──────────────────────────────────────
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  progressPct: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.accent,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  progressAmountsCol: {
    gap: 4,
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
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  // ── CTA ────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
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
  // ── Rencana list ───────────────────────────────────────
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
  rencanaPct: { fontSize: FontSize.base, fontWeight: '800', color: Colors.accent },
  miniProgressTrack: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  // ── Empty ──────────────────────────────────────────────
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
});
