// ============================================================================
// Constants — Field Marketing Reporting System
// ============================================================================

import type { LaporanStatus } from '../types/laporan.types';
import type { PerformanceTier } from '../types/dashboard.types';
import type { RencanaStatus } from '../types/rencana.types';

// ─── GPS Bounds Indonesia ──────────────────────────────────────────────────────

/** Batas koordinat GPS yang valid untuk wilayah Indonesia */
export const GPS_BOUNDS_INDONESIA = {
  lat: { min: -11, max: 6 },
  lng: { min: 95, max: 141 },
} as const;

// ─── GPS Tracking ──────────────────────────────────────────────────────────────

/** Interval upsert lokasi GPS ke server (dalam milidetik) */
export const GPS_TRACKING_INTERVAL_MS = 30_000; // 30 detik

/** Durasi idle di background sebelum tracking GPS dihentikan (dalam milidetik) */
export const GPS_BACKGROUND_TIMEOUT_MS = 3_600_000; // 1 jam

// ─── Image Compression ────────────────────────────────────────────────────────

/** Konfigurasi kompresi gambar sisi mobile */
export const IMAGE_COMPRESSION_MOBILE = {
  maxWidth: 1280,
  quality: 0.7,
  format: 'jpeg' as const,
} as const;

/** Konfigurasi kompresi gambar sisi server (web upload) */
export const IMAGE_COMPRESSION_SERVER = {
  maxWidth: 1280,
  quality: 80, // Sharp menggunakan 0-100
  format: 'webp' as const,
} as const;

/** Ukuran maksimum file sebelum kompresi (5MB) */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Magic bytes untuk validasi tipe file */
export const FILE_MAGIC_BYTES = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
} as const;

// ─── Pagination ────────────────────────────────────────────────────────────────

/** Jumlah baris per halaman untuk tabel data */
export const DEFAULT_PAGE_SIZE = 20;

// ─── Rate Limiting ─────────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  /** Login: 5 request per 10 menit per IP */
  login: { maxRequests: 5, windowMs: 10 * 60 * 1000 },
  /** Submit laporan: 20 request per menit per user */
  submitLaporan: { maxRequests: 20, windowMs: 60 * 1000 },
  /** Upload Excel: 10 upload per jam per Superadmin */
  uploadExcel: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  /** Dashboard: 20 request per menit per user */
  dashboard: { maxRequests: 20, windowMs: 60 * 1000 },
} as const;

// ─── Status Labels & Colors ────────────────────────────────────────────────────

/** Label tampilan untuk status laporan */
export const LAPORAN_STATUS_CONFIG: Record<
  LaporanStatus,
  { label: string; color: string; bgColor: string }
> = {
  lunas: { label: 'Lunas', color: '#16A34A', bgColor: '#DCFCE7' },
  sebagian: { label: 'Sebagian', color: '#2563EB', bgColor: '#DBEAFE' },
  gagal: { label: 'Gagal', color: '#DC2626', bgColor: '#FEE2E2' },
  pending: { label: 'Pending', color: '#D97706', bgColor: '#FEF3C7' },
} as const;

/** Label tampilan untuk status rencana */
export const RENCANA_STATUS_CONFIG: Record<
  RencanaStatus,
  { label: string; color: string; bgColor: string }
> = {
  aktif: { label: 'Aktif', color: '#2563EB', bgColor: '#DBEAFE' },
  selesai: { label: 'Selesai', color: '#16A34A', bgColor: '#DCFCE7' },
  terlambat: { label: 'Terlambat', color: '#DC2626', bgColor: '#FEE2E2' },
} as const;

/** Konfigurasi warna dan label untuk tier performa */
export const PERFORMANCE_TIER_CONFIG: Record<
  PerformanceTier,
  { label: string; color: string; bgColor: string; chartColor: string }
> = {
  top: {
    label: 'Top Performer',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    chartColor: '#22C55E',
  },
  on_track: {
    label: 'On Track',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    chartColor: '#3B82F6',
  },
  needs_attention: {
    label: 'Needs Attention',
    color: '#D97706',
    bgColor: '#FEF3C7',
    chartColor: '#F59E0B',
  },
  underperforming: {
    label: 'Underperforming',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    chartColor: '#EF4444',
  },
} as const;

// ─── Design System Tokens ──────────────────────────────────────────────────────

/** Token warna design system (dipakai di tailwind.config.ts & mobile) */
export const COLORS = {
  primary: '#1E3A5F',
  accent: '#2563EB',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  'surface-alt': '#F1F5F9',
  border: '#E2E8F0',
  'text-primary': '#0F172A',
  'text-secondary': '#64748B',
  'text-muted': '#94A3B8',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#2563EB',
} as const;

// ─── Sidebar Config ────────────────────────────────────────────────────────────

/** Dimensi sidebar */
export const SIDEBAR = {
  expandedWidth: 240,
  collapsedWidth: 64,
  breakpoint: 1024,
} as const;

/** Tinggi header */
export const HEADER_HEIGHT = 64;

// ─── Audit Log Actions ─────────────────────────────────────────────────────────

/** Daftar aksi yang dicatat di audit_logs */
export const AUDIT_ACTIONS = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  SUBMIT_LAPORAN: 'submit_laporan',
  CREATE_RENCANA: 'create_rencana',
  CHANGE_ROLE: 'change_role',
  TOGGLE_USER_STATUS: 'toggle_user_status',
  BULK_IMPORT_USERS: 'bulk_import_users',
  DOWNLOAD_REPORT: 'download_report',
} as const;

// ─── Supabase Storage ──────────────────────────────────────────────────────────

/** Nama bucket di Supabase Storage */
export const STORAGE_BUCKETS = {
  LAPORAN_FOTO: 'laporan-foto',
  EXCEL_TEMPLATE: 'excel-template',
} as const;

// ─── Anomaly Detection ─────────────────────────────────────────────────────────

/** Threshold Z-score untuk menandai anomali */
export const ANOMALY_Z_SCORE_THRESHOLD = 2;

// ─── Score Weights ─────────────────────────────────────────────────────────────

/** Bobot kalkulasi skor performa user */
export const PERFORMANCE_SCORE_WEIGHTS = {
  completion_rate: 0.4,
  consistency: 0.35,
  achievement: 0.25,
} as const;
