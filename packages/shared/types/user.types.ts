// ============================================================================
// User Types — Field Marketing Reporting System
// ============================================================================

/** Role yang tersedia dalam sistem */
export type UserRole = 'superadmin' | 'admin' | 'user';

/** Representasi lengkap user dari database */
export interface User {
  id: string;
  nomor_induk: string;
  nama: string;
  nomor_rekening: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Data user yang dikembalikan setelah login (tanpa field sensitif) */
export interface AuthUser {
  id: string;
  nama: string;
  nomor_induk: string;
  nomor_rekening: string;
  role: UserRole;
}

/** Payload JWT yang disimpan di token */
export interface JWTPayload {
  sub: string; // user.id
  role: UserRole;
  nomor_induk: string;
  iat: number;
  exp: number;
}

/** Data user untuk tabel management (Superadmin view) */
export interface UserListItem {
  id: string;
  nomor_induk: string;
  nama: string;
  nomor_rekening: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

/** Input untuk membuat user baru */
export interface CreateUserInput {
  nomor_induk: string;
  nama: string;
  nomor_rekening: string;
  role: UserRole;
}

/** Input untuk update user */
export interface UpdateUserInput {
  role?: UserRole;
  is_active?: boolean;
}

/** Data dari bulk import Excel per baris */
export interface ExcelImportRow {
  nomor_induk: string;
  nama: string;
  nomor_rekening: string;
  role: string;
}

/** Hasil import Excel */
export interface ExcelImportResult {
  success_rows: number;
  failed_rows: number;
  errors: Array<{ row: number; reason: string }>;
}

/** Record audit log import Excel */
export interface ExcelImportLog {
  id: string;
  uploaded_by: string;
  filename: string;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  error_log: Array<{ row: number; reason: string }>;
  created_at: string;
}
