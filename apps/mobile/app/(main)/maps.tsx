// ============================================================================
// Maps Screen — Peta lokasi kunjungan (laporan)
// Menampilkan pin lokasi GPS dari setiap laporan yang sudah disubmit
// ============================================================================

import { useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLaporan, type Laporan } from '@/hooks/useLaporan';
import { useLocationStore } from '@/store/locationStore';
import { Colors, FontSize, Spacing, Shadows, BorderRadius, StatusConfig } from '@/constants/theme';
import { formatRupiah } from '@/lib/formatters';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Default region: Indonesia center
const DEFAULT_REGION = {
  latitude: -2.5,
  longitude: 118,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

type FilterType = 'semua' | 'lunas' | 'sebagian' | 'gagal' | 'pending';

export default function MapsScreen() {
  const insets = useSafeAreaInsets();
  const { laporan, fetchLaporan, loading } = useLaporan();
  const { latitude: userLat, longitude: userLng } = useLocationStore();
  const mapRef = useRef<MapView>(null);
  const [filter, setFilter] = useState<FilterType>('semua');

  useFocusEffect(
    useCallback(() => {
      fetchLaporan();
    }, []),
  );

  // Filter laporan yang punya koordinat GPS
  const laporanWithGPS = laporan.filter(
    (l) => l.lokasi_lat != null && l.lokasi_lng != null,
  );

  // Apply status filter
  const filteredLaporan = filter === 'semua'
    ? laporanWithGPS
    : laporanWithGPS.filter((l) => l.status === filter);

  // Fit map to markers
  const fitToMarkers = useCallback(() => {
    if (filteredLaporan.length === 0) {
      // If no markers, center on user location or default
      if (userLat && userLng) {
        mapRef.current?.animateToRegion({
          latitude: userLat,
          longitude: userLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 500);
      }
      return;
    }

    const coords = filteredLaporan.map((l) => ({
      latitude: l.lokasi_lat!,
      longitude: l.lokasi_lng!,
    }));

    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 40, bottom: 120, left: 40 },
      animated: true,
    });
  }, [filteredLaporan, userLat, userLng]);

  // Get initial region based on data
  const getInitialRegion = () => {
    if (laporanWithGPS.length > 0) {
      const first = laporanWithGPS[0]!;
      return {
        latitude: first.lokasi_lat!,
        longitude: first.lokasi_lng!,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }
    if (userLat && userLng) {
      return {
        latitude: userLat,
        longitude: userLng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return DEFAULT_REGION;
  };

  // Pin color based on status
  const getPinColor = (status: string) => {
    switch (status) {
      case 'lunas': return Colors.success;
      case 'sebagian': return Colors.accent;
      case 'gagal': return Colors.danger;
      case 'pending': return Colors.warning;
      default: return Colors.textMuted;
    }
  };

  const filterOptions: { key: FilterType; label: string; color: string }[] = [
    { key: 'semua', label: 'Semua', color: Colors.textPrimary },
    { key: 'lunas', label: 'Lunas', color: Colors.success },
    { key: 'sebagian', label: 'Sebagian', color: Colors.accent },
    { key: 'gagal', label: 'Gagal', color: Colors.danger },
    { key: 'pending', label: 'Pending', color: Colors.warning },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>🗺️ Peta Kunjungan</Text>
            <Text style={styles.headerSubtitle}>
              {filteredLaporan.length} lokasi{filter !== 'semua' ? ` (${filter})` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.fitBtn}
            onPress={fitToMarkers}
            activeOpacity={0.7}
          >
            <Text style={styles.fitBtnText}>📍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Filter Chips ── */}
      <View style={styles.filterRow}>
        {filterOptions.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.filterChip,
              filter === opt.key && { backgroundColor: opt.color, borderColor: opt.color },
            ]}
            onPress={() => setFilter(opt.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === opt.key && styles.filterChipTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Map ── */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>Memuat peta...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={getInitialRegion()}
            onMapReady={fitToMarkers}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            toolbarEnabled={false}
          >
            {filteredLaporan.map((l) => {
              const cfg = StatusConfig[l.status] || StatusConfig.pending;
              return (
                <Marker
                  key={l.id}
                  coordinate={{
                    latitude: l.lokasi_lat!,
                    longitude: l.lokasi_lng!,
                  }}
                  pinColor={getPinColor(l.status)}
                  title={`${cfg.label} — ${formatRupiah(l.jumlah_tagihan)}`}
                  description={`${new Date(l.tanggal_penagihan).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}${l.keterangan ? ` • ${l.keterangan}` : ''}`}
                />
              );
            })}
          </MapView>
        )}

        {/* ── Stats overlay ── */}
        {!loading && (
          <View style={[styles.statsOverlay, { bottom: 80 + Math.max(insets.bottom, 8) }]}>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.statText}>
                  {laporanWithGPS.filter((l) => l.status === 'lunas').length} Lunas
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: Colors.accent }]} />
                <Text style={styles.statText}>
                  {laporanWithGPS.filter((l) => l.status === 'sebagian').length} Sebagian
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: Colors.danger }]} />
                <Text style={styles.statText}>
                  {laporanWithGPS.filter((l) => l.status === 'gagal').length} Gagal
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: Colors.warning }]} />
                <Text style={styles.statText}>
                  {laporanWithGPS.filter((l) => l.status === 'pending').length} Pending
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  fitBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  fitBtnText: { fontSize: 18 },

  // ── Filter Chips ──
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFF',
  },

  // ── Map ──
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  // ── Stats Overlay ──
  statsOverlay: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
