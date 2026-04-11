// ============================================================================
// Rencana Validation Schema — Field Marketing Reporting System
// ============================================================================

import { z } from 'zod';

/**
 * Schema validasi untuk membuat rencana baru.
 * Dipakai di client (form validation) DAN server (Edge Function).
 */
export const createRencanaSchema = z.object({
  target_nominal: z
    .number({
      required_error: 'Target nominal wajib diisi',
      invalid_type_error: 'Target nominal harus berupa angka',
    })
    .positive('Target nominal harus lebih dari 0')
    .max(999_999_999_999, 'Target nominal terlalu besar'),

  tanggal_target: z
    .string({ required_error: 'Tanggal target wajib diisi' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .refine(
      (val) => {
        const target = new Date(val);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        return target >= yesterday;
      },
      { message: 'Tanggal target minimal H-1 (kemarin)' },
    ),

  deskripsi: z
    .string()
    .max(1000, 'Deskripsi maksimal 1000 karakter')
    .nullable()
    .optional()
    .transform((val) => val?.trim() || null),
});

export type CreateRencanaSchema = z.infer<typeof createRencanaSchema>;
