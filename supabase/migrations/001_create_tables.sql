-- ============================================================================
-- Migration 001 — Create Tables & Indexes
-- Field Marketing Reporting System
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- ─── Enable Extensions ─────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Custom Types ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rencana_status AS ENUM ('aktif', 'selesai', 'terlambat');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── Table: users ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nomor_induk   VARCHAR(50)  NOT NULL UNIQUE,
  nama          VARCHAR(255) NOT NULL,
  nomor_rekening VARCHAR(100) NOT NULL,
  role          user_role    NOT NULL DEFAULT 'user',
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Semua akun karyawan. Admin tidak "memiliki" user tertentu.';
COMMENT ON COLUMN users.nomor_induk IS 'Identitas login, wajib unik';
COMMENT ON COLUMN users.is_active IS 'Soft delete — nonaktifkan tanpa hapus data historis';

CREATE INDEX IF NOT EXISTS idx_users_nomor_induk ON users (nomor_induk);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ─── Table: rencana ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rencana (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID           NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  target_nominal  NUMERIC(15,2)  NOT NULL CHECK (target_nominal > 0),
  tanggal_target  DATE           NOT NULL,
  deskripsi       TEXT,
  status          rencana_status NOT NULL DEFAULT 'aktif',
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  -- Tanggal target minimal H-1
  CONSTRAINT chk_tanggal_target_min CHECK (tanggal_target >= CURRENT_DATE - INTERVAL '1 day')
);

COMMENT ON TABLE rencana IS 'Rencana penagihan — user WAJIB buat rencana sebelum submit laporan';
COMMENT ON COLUMN rencana.tanggal_target IS 'Deadline penagihan, minimal H-1';

CREATE INDEX IF NOT EXISTS idx_rencana_user_id ON rencana (user_id);
CREATE INDEX IF NOT EXISTS idx_rencana_status ON rencana (status);
CREATE INDEX IF NOT EXISTS idx_rencana_tanggal_target ON rencana (tanggal_target);
CREATE INDEX IF NOT EXISTS idx_rencana_user_status ON rencana (user_id, status);

-- ─── Table: laporan ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS laporan (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID           NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rencana_id        UUID           NOT NULL REFERENCES rencana(id) ON DELETE RESTRICT,
  jumlah_tagihan    NUMERIC(15,2)  NOT NULL CHECK (jumlah_tagihan >= 0),
  tanggal_penagihan DATE           NOT NULL,
  foto_urls         TEXT[]         NOT NULL CHECK (array_length(foto_urls, 1) >= 1),
  lokasi_lat        NUMERIC(10,8)  NOT NULL,
  lokasi_lng        NUMERIC(11,8)  NOT NULL,
  lokasi_alamat     TEXT           NOT NULL,
  keterangan        TEXT,
  status            VARCHAR(50)    NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE laporan IS 'Hasil penagihan — immutable setelah submit, tidak bisa diubah/dihapus';
COMMENT ON COLUMN laporan.foto_urls IS 'Array URL foto bukti di Supabase Storage, min 1 foto';
COMMENT ON COLUMN laporan.lokasi_lat IS 'Latitude GPS saat submit, range -11 s.d. 6 (Indonesia)';
COMMENT ON COLUMN laporan.lokasi_lng IS 'Longitude GPS saat submit, range 95 s.d. 141 (Indonesia)';

CREATE INDEX IF NOT EXISTS idx_laporan_user_id ON laporan (user_id);
CREATE INDEX IF NOT EXISTS idx_laporan_rencana_id ON laporan (rencana_id);
CREATE INDEX IF NOT EXISTS idx_laporan_created_at ON laporan (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_laporan_tanggal_penagihan ON laporan (tanggal_penagihan);
CREATE INDEX IF NOT EXISTS idx_laporan_user_created ON laporan (user_id, created_at DESC);

-- ─── Table: user_locations ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_locations (
  user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  lat         NUMERIC(10,8) NOT NULL,
  lng         NUMERIC(11,8) NOT NULL,
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_locations IS 'Posisi terkini setiap user — satu baris per user, di-upsert tiap 30 detik';

-- Enable Realtime for user_locations (untuk live map tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE user_locations;

-- ─── Table: excel_imports ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS excel_imports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by   UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  filename      VARCHAR(255)  NOT NULL,
  total_rows    INTEGER       NOT NULL DEFAULT 0,
  success_rows  INTEGER       NOT NULL DEFAULT 0,
  failed_rows   INTEGER       NOT NULL DEFAULT 0,
  error_log     JSONB         NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE excel_imports IS 'Audit log untuk setiap bulk import user via Excel oleh Superadmin';

CREATE INDEX IF NOT EXISTS idx_excel_imports_uploaded_by ON excel_imports (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_excel_imports_created_at ON excel_imports (created_at DESC);

-- ─── Table: audit_logs ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID           REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100)   NOT NULL,
  metadata    JSONB          NOT NULL DEFAULT '{}'::jsonb,
  ip_address  INET,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Semua aksi penting di sistem — insert only, tidak bisa dibaca dari client';

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- ─── Storage Buckets ───────────────────────────────────────────────────────────
-- Note: Jalankan ini di Supabase Dashboard → Storage → Create Bucket
-- Bucket: laporan-foto (private)
-- Bucket: excel-template (public, read-only)
