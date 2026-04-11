-- ============================================================================
-- Migration 004 — Seed Initial Superadmin
-- Field Marketing Reporting System
-- ============================================================================
-- PENTING: Ganti nomor_induk, nama, dan nomor_rekening sesuai data asli
-- superadmin perusahaan sebelum menjalankan migration ini.
-- ============================================================================

INSERT INTO users (nomor_induk, nama, nomor_rekening, role, is_active)
VALUES ('SA001', 'Super Admin', '0000000000', 'superadmin', true)
ON CONFLICT (nomor_induk) DO NOTHING;
