// ============================================================================
// Rencana Types — Field Marketing Reporting System
// ============================================================================

/** Status siklus hidup rencana */
export type RencanaStatus = 'aktif' | 'selesai' | 'terlambat';

/** Representasi lengkap rencana dari database */
export interface Rencana {
  id: string;
  user_id: string;
  target_nominal: number;
  tanggal_target: string; // ISO date string (YYYY-MM-DD)
  deskripsi: string | null;
  status: RencanaStatus;
  created_at: string;
}

/** Rencana dengan data tambahan user (untuk admin view) */
export interface RencanaWithUser extends Rencana {
  user_nama: string;
  user_nomor_induk: string;
}

/** Input untuk membuat rencana baru */
export interface CreateRencanaInput {
  target_nominal: number;
  tanggal_target: string;
  deskripsi?: string | null;
}

/** Item rencana di dropdown (saat buat laporan) */
export interface RencanaDropdownItem {
  id: string;
  target_nominal: number;
  tanggal_target: string;
  deskripsi: string | null;
}
