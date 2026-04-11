// ============================================================================
// RealtimeMap — Google Maps + Supabase Realtime user location tracking
// ============================================================================

'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, RefreshCw } from 'lucide-react';

interface MapMarkerData {
  user_id: string;
  user_nama: string;
  lat: number;
  lng: number;
  updated_at: string;
  has_reported_today: boolean;
  last_report_summary?: {
    jumlah_tagihan: number;
    status: string;
    created_at: string;
  };
}

interface RealtimeMapProps {
  markers: MapMarkerData[];
  loading?: boolean;
  onRefresh?: () => void;
}

export function RealtimeMap({ markers, loading, onRefresh }: RealtimeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError] = useState<string | null>(null);

  // Fallback: tampilkan tabel lokasi jika Google Maps belum terkonfigurasi
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-card-title text-text-primary dark:text-gray-100">
            <MapPin className="inline mr-2" size={20} />
            Lokasi User Realtime
          </h3>
          {onRefresh && (
            <button onClick={onRefresh} className="btn-ghost !p-1.5">
              <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="skeleton h-[400px] w-full rounded-lg" />
        ) : (
          <>
            <p className="text-xs text-text-muted mb-4">
              Google Maps API key belum dikonfigurasi. Menampilkan data lokasi dalam format tabel.
            </p>
            <div className="overflow-x-auto rounded-lg border border-border dark:border-dark-border">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama User</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Status Hari Ini</th>
                    <th>Terakhir Update</th>
                  </tr>
                </thead>
                <tbody>
                  {markers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-text-muted">
                        Belum ada data lokasi
                      </td>
                    </tr>
                  ) : (
                    markers.map((m) => (
                      <tr key={m.user_id}>
                        <td className="font-medium">{m.user_nama}</td>
                        <td className="text-text-secondary font-mono text-xs">{m.lat.toFixed(6)}</td>
                        <td className="text-text-secondary font-mono text-xs">{m.lng.toFixed(6)}</td>
                        <td>
                          <span
                            className={cn(
                              'badge',
                              m.has_reported_today ? 'badge-success' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
                            )}
                          >
                            {m.has_reported_today ? 'Sudah Laporan' : 'Belum Laporan'}
                          </span>
                        </td>
                        <td className="text-text-secondary text-xs">
                          {new Date(m.updated_at).toLocaleTimeString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  }

  // Google Maps implementation
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-card-title text-text-primary dark:text-gray-100">
          <MapPin className="inline mr-2" size={20} />
          Lokasi User Realtime
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="text-[10px] text-text-secondary">Sudah Laporan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-gray-400" />
            <span className="text-[10px] text-text-secondary">Belum Laporan</span>
          </div>
          {onRefresh && (
            <button onClick={onRefresh} className="btn-ghost !p-1.5">
              <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-[400px] w-full rounded-lg" />
      ) : (
        <div
          ref={mapRef}
          className="h-[400px] w-full rounded-lg border border-border overflow-hidden dark:border-dark-border"
        >
          {mapError && (
            <div className="flex h-full items-center justify-center text-text-muted">
              <p>{mapError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
