// ============================================================================
// User Validation Schema — Field Marketing Reporting System
// ============================================================================

import { z } from 'zod';

/** Role yang bisa dipilih oleh Superadmin saat membuat/mengubah user */
const userRoleEnum = z.enum(['superadmin', 'admin', 'user'], {
  required_error: 'Role wajib dipilih',
  invalid_type_error: 'Role tidak valid',
});

/**
 * Schema validasi untuk membuat user baru (manual via form).
 */
export const createUserSchema = z.object({
  nomor_induk: z
    .string({ required_error: 'Nomor induk wajib diisi' })
    .min(1, 'Nomor induk tidak boleh kosong')
    .max(50, 'Nomor induk maksimal 50 karakter')
    .regex(/^[A-Za-z0-9-]+$/, 'Nomor induk hanya boleh mengandung huruf, angka, dan strip'),

  nama: z
    .string({ required_error: 'Nama wajib diisi' })
    .min(2, 'Nama minimal 2 karakter')
    .max(255, 'Nama maksimal 255 karakter')
    .transform((val) => val.trim()),

  nomor_rekening: z
    .string({ required_error: 'Nomor rekening wajib diisi' })
    .min(1, 'Nomor rekening tidak boleh kosong')
    .max(100, 'Nomor rekening maksimal 100 karakter'),

  role: userRoleEnum,
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;

/**
 * Schema validasi untuk update role user.
 */
export const updateUserRoleSchema = z.object({
  role: userRoleEnum,
});

/**
 * Schema validasi untuk toggle status aktif user.
 */
export const toggleUserStatusSchema = z.object({
  is_active: z.boolean(),
});

/**
 * Schema validasi untuk login via nomor induk.
 */
export const loginSchema = z.object({
  nomor_induk: z
    .string({ required_error: 'Nomor induk wajib diisi' })
    .min(1, 'Nomor induk tidak boleh kosong')
    .max(50, 'Nomor induk maksimal 50 karakter'),
});

export type LoginSchema = z.infer<typeof loginSchema>;

/**
 * Schema validasi untuk baris Excel import.
 * Lebih lenient karena data dari Excel bisa beragam format.
 */
export const excelImportRowSchema = z.object({
  nomor_induk: z.string().min(1, 'Nomor induk kosong'),
  nama: z.string().min(1, 'Nama kosong'),
  nomor_rekening: z.string().min(1, 'Nomor rekening kosong'),
  role: z.enum(['admin', 'user'], {
    errorMap: () => ({ message: 'Role harus "admin" atau "user"' }),
  }),
});

export type ExcelImportRowSchema = z.infer<typeof excelImportRowSchema>;
