// ============================================================================
// Home Screen — Greeting + status hari ini + CTA buttons
// ============================================================================

import { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useRencana } from '@/hooks/useRencana';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { formatRupiah } from '@/lib/formatters';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { rencanaList, hasRencanaAktif, fetchRencana, loading } = useRencana();

  useEffect(() => {
    fetchRencana();
  }, []);

  const rencanaAktif = rencanaList.find((r) => r.status === 'aktif');

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.nama?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Keluar</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.greeting}>{greeting()},</Text>
        <Text style={styles.userName}>{user?.nama || 'User'}</Text>
        <Text style={styles.nomorInduk}>{user?.nomor_induk}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Rencana Hari Ini */}
        <Text style={styles.sectionTitle}>Status Hari Ini</Text>

        {loading ? (
          <CardSkeleton />
        ) : rencanaAktif ? (
          <Card style={styles.rencanaCard}>
            <View style={styles.rencanaCardHeader}>
              <Text style={styles.rencanaCardLabel}>Rencana Aktif</Text>
              <StatusBadge status="pending" />
            </View>
            <Text style={styles.rencanaTarget}>
              {formatRupiah(rencanaAktif.target_nominal)}
            </Text>
            <Text style={styles.rencanaDesc}>
              {rencanaAktif.deskripsi || 'Tidak ada deskripsi'}
            </Text>
            <Text style={styles.rencanaDate}>
              Target: {new Date(rencanaAktif.tanggal_target).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Belum ada rencana aktif</Text>
            <Text style={styles.emptyDesc}>
              Buat rencana terlebih dahulu sebelum membuat laporan.
            </Text>
          </Card>
        )}

        {/* CTA Buttons */}
        <View style={styles.ctaSection}>
          <Text style={styles.sectionTitle}>Aksi Cepat</Text>

          <View style={styles.ctaGrid}>
            {/* Buat Rencana */}
            <TouchableOpacity
              style={styles.ctaCard}
              onPress={() => router.push('/(main)/rencana')}
            >
              <Text style={styles.ctaIcon}>📋</Text>
              <Text style={styles.ctaLabel}>Buat Rencana</Text>
              <Text style={styles.ctaDesc}>Tambah rencana baru</Text>
            </TouchableOpacity>

            {/* Buat Laporan — disabled jika tidak ada rencana aktif */}
            <TouchableOpacity
              style={[styles.ctaCard, !hasRencanaAktif && styles.ctaCardDisabled]}
              onPress={() => {
                if (!hasRencanaAktif) return;
                router.push('/(main)/laporan/buat');
              }}
              activeOpacity={hasRencanaAktif ? 0.8 : 1}
            >
              <Text style={[styles.ctaIcon, !hasRencanaAktif && styles.ctaIconDisabled]}>
                📝
              </Text>
              <Text style={[styles.ctaLabel, !hasRencanaAktif && styles.ctaLabelDisabled]}>
                Buat Laporan
              </Text>
              <Text style={[styles.ctaDesc, !hasRencanaAktif && styles.ctaDescDisabled]}>
                {hasRencanaAktif ? 'Submit laporan baru' : 'Buat rencana dulu'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rencana Terakhir */}
        {rencanaList.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Rencana Terakhir</Text>
            {rencanaList.slice(0, 3).map((r) => (
              <Card key={r.id} style={styles.recentCard}>
                <View style={styles.recentCardRow}>
                  <View style={styles.recentCardLeft}>
                    <Text style={styles.recentNominal}>{formatRupiah(r.target_nominal)}</Text>
                    <Text style={styles.recentDate}>
                      {new Date(r.tanggal_target).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <StatusBadge
                    status={r.status === 'aktif' ? 'pending' : r.status === 'selesai' ? 'lunas' : 'gagal'}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 52,
    paddingBottom: 28,
    paddingHorizontal: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.lg, fontWeight: '700', color: '#FFF' },
  logoutBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoutText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  greeting: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.7)' },
  userName: { fontSize: FontSize.xl, fontWeight: '700', color: '#FFF', marginTop: 2 },
  nomorInduk: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  content: { flex: 1 },
  contentContainer: { padding: Spacing.lg, paddingBottom: 40 },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  rencanaCard: { marginBottom: Spacing.md },
  rencanaCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rencanaCardLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  rencanaTarget: { fontSize: FontSize['2xl'], fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  rencanaDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  rencanaDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyIcon: { fontSize: 36, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 20 },
  ctaSection: { marginTop: Spacing.sm },
  ctaGrid: { flexDirection: 'row', gap: Spacing.sm },
  ctaCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  ctaCardDisabled: { opacity: 0.5 },
  ctaIcon: { fontSize: 32, marginBottom: 8 },
  ctaIconDisabled: { opacity: 0.4 },
  ctaLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  ctaLabelDisabled: { color: Colors.textMuted },
  ctaDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
  ctaDescDisabled: { color: Colors.textMuted },
  recentSection: { marginTop: Spacing.md },
  recentCard: { marginBottom: Spacing.sm, padding: Spacing.md },
  recentCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentCardLeft: { flex: 1, marginRight: Spacing.sm },
  recentNominal: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  recentDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
});
