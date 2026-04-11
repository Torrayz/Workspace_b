// ============================================================================
// Dashboard Types — Field Marketing Reporting System
// ============================================================================

/** Tier performa user yang dihitung oleh calculate_user_scores() */
export type PerformanceTier = 'top' | 'on_track' | 'needs_attention' | 'underperforming';

/** Data KPI card di dashboard utama */
export interface DashboardSummary {
  total_laporan: number;
  total_nominal: number;
  completion_rate: number; // 0-100 (persentase)
  user_aktif: number;
  /** Tren perbandingan vs periode sebelumnya */
  trends: {
    laporan_change: number; // persentase perubahan
    nominal_change: number;
    completion_change: number;
    user_aktif_change: number;
  };
}

/** Data untuk line chart tren nomimal harian */
export interface DailyTrend {
  tanggal: string; // YYYY-MM-DD
  total_nominal: number;
  total_laporan: number;
}

/** Data untuk donut chart distribusi status */
export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

/** Data performa per user dari get_performance_per_user() */
export interface UserPerformance {
  user_id: string;
  user_nama: string;
  user_nomor_induk: string;
  total_laporan: number;
  total_nominal: number;
  completion_rate: number;
  /** Skor komposit: completion 40%, konsistensi 35%, achievement 25% */
  score: number;
  tier: PerformanceTier;
}

/** Data anomali dari detect_anomalies() */
export interface AnomalyRecord {
  user_id: string;
  user_nama: string;
  laporan_id: string;
  jumlah_tagihan: number;
  z_score: number;
  user_average: number;
  user_stddev: number;
}

/** Parameter filter yang dipakai di seluruh dashboard */
export interface DashboardFilter {
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
}

/** Data trend line prediktif (linear regression) */
export interface TrendLinePoint {
  tanggal: string;
  predicted_nominal: number;
  is_prediction: boolean;
}

/** Data dashboard personal user */
export interface PersonalDashboard {
  total_laporan_bulan_ini: number;
  total_nominal_bulan_ini: number;
  rencana_aktif: number;
  daily_trend: DailyTrend[];
}

/** Pagination metadata */
export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/** Response wrapper untuk list dengan pagination */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
