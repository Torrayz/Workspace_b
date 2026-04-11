// ============================================================================
// Laporan Types — Field Marketing Reporting System
// ============================================================================

/** Status laporan penagihan */
export type LaporanStatus = 'lunas' | 'sebagian' | 'gagal' | 'pending';

/** Representasi lengkap laporan dari database */
export interface Laporan {
  id: string;
  user_id: string;
  rencana_id: string;
  jumlah_tagihan: number;
  tanggal_penagihan: string; // ISO date string (YYYY-MM-DD)
  foto_urls: string[];
  lokasi_lat: number;
  lokasi_lng: number;
  lokasi_alamat: string;
  keterangan: string | null;
  status: LaporanStatus;
  created_at: string;
}

/** Laporan dengan data relasi user dan rencana (untuk admin table view) */
export interface LaporanWithDetails extends Laporan {
  user_nama: string;
  user_nomor_induk: string;
  rencana_target_nominal: number;
  rencana_tanggal_target: string;
  /** Flag anomali dari detect_anomalies RPC — Z-score > 2 */
  is_anomaly?: boolean;
}

/** Input untuk membuat laporan baru */
export interface CreateLaporanInput {
  rencana_id: string;
  jumlah_tagihan: number;
  tanggal_penagihan: string;
  foto_urls: string[];
  lokasi_lat: number;
  lokasi_lng: number;
  lokasi_alamat: string;
  keterangan?: string | null;
  status: LaporanStatus;
}

/** Lokasi user untuk tracking realtime */
export interface UserLocation {
  user_id: string;
  lat: number;
  lng: number;
  updated_at: string;
}

/** Data marker di peta (join user_locations + users + status laporan hari ini) */
export interface MapMarkerData extends UserLocation {
  user_nama: string;
  user_nomor_induk: string;
  /** Sudah submit laporan hari ini? */
  has_reported_today: boolean;
  /** Ringkasan laporan terakhir */
  last_report_summary?: {
    jumlah_tagihan: number;
    status: LaporanStatus;
    created_at: string;
  };
}

/** Record audit log */
export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}
