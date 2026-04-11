-- ============================================================================
-- Migration 002 — Row Level Security (RLS) Policies
-- Field Marketing Reporting System
-- ============================================================================
-- Prinsip: bahkan jika ada bug di kode, data tetap terlindungi di level DB.
-- ============================================================================

-- ─── Helper: Extract role from JWT ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT (current_setting('request.jwt.claims', true)::jsonb ->> 'role')::user_role;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID AS $$
  SELECT (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid;
$$ LANGUAGE sql STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: users
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- User: hanya bisa lihat data sendiri
CREATE POLICY users_select_own ON users
  FOR SELECT TO authenticated
  USING (
    auth.user_role() = 'user' AND id = auth.user_id()
  );

-- Admin: bisa lihat semua user
CREATE POLICY users_select_admin ON users
  FOR SELECT TO authenticated
  USING (
    auth.user_role() = 'admin'
  );

-- Superadmin: bisa lihat semua user
CREATE POLICY users_select_superadmin ON users
  FOR SELECT TO authenticated
  USING (
    auth.user_role() = 'superadmin'
  );

-- Superadmin: bisa update is_active dan role
CREATE POLICY users_update_superadmin ON users
  FOR UPDATE TO authenticated
  USING (auth.user_role() = 'superadmin')
  WITH CHECK (auth.user_role() = 'superadmin');

-- Superadmin: bisa insert user baru
CREATE POLICY users_insert_superadmin ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.user_role() = 'superadmin');

-- Tidak ada policy DELETE — user tidak pernah dihapus

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: rencana
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE rencana ENABLE ROW LEVEL SECURITY;

-- User: bisa lihat rencana milik sendiri
CREATE POLICY rencana_select_own ON rencana
  FOR SELECT TO authenticated
  USING (
    auth.user_role() = 'user' AND user_id = auth.user_id()
  );

-- User: bisa buat rencana milik sendiri
CREATE POLICY rencana_insert_own ON rencana
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.user_role() = 'user' AND user_id = auth.user_id()
  );

-- Admin & Superadmin: bisa lihat semua rencana
CREATE POLICY rencana_select_admin ON rencana
  FOR SELECT TO authenticated
  USING (
    auth.user_role() IN ('admin', 'superadmin')
  );

-- Tidak ada policy UPDATE / DELETE pada rencana — immutable setelah dibuat

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: laporan
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE laporan ENABLE ROW LEVEL SECURITY;

-- User: bisa lihat laporan milik sendiri
CREATE POLICY laporan_select_own ON laporan
  FOR SELECT TO authenticated
  USING (
    auth.user_role() = 'user' AND user_id = auth.user_id()
  );

-- User: bisa submit laporan milik sendiri
CREATE POLICY laporan_insert_own ON laporan
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.user_role() = 'user' AND user_id = auth.user_id()
  );

-- Admin & Superadmin: bisa lihat semua laporan
CREATE POLICY laporan_select_admin ON laporan
  FOR SELECT TO authenticated
  USING (
    auth.user_role() IN ('admin', 'superadmin')
  );

-- Tidak ada policy UPDATE / DELETE pada laporan — immutable

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: user_locations
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- User: bisa insert/update lokasi sendiri
CREATE POLICY locations_upsert_own ON user_locations
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.user_role() = 'user' AND user_id = auth.user_id()
  );

CREATE POLICY locations_update_own ON user_locations
  FOR UPDATE TO authenticated
  USING (
    auth.user_role() = 'user' AND user_id = auth.user_id()
  )
  WITH CHECK (
    auth.user_role() = 'user' AND user_id = auth.user_id()
  );

-- Admin & Superadmin: bisa lihat semua lokasi (untuk peta realtime)
CREATE POLICY locations_select_admin ON user_locations
  FOR SELECT TO authenticated
  USING (
    auth.user_role() IN ('admin', 'superadmin')
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: excel_imports
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE excel_imports ENABLE ROW LEVEL SECURITY;

-- Superadmin only: bisa lihat dan insert
CREATE POLICY excel_imports_select_superadmin ON excel_imports
  FOR SELECT TO authenticated
  USING (auth.user_role() = 'superadmin');

CREATE POLICY excel_imports_insert_superadmin ON excel_imports
  FOR INSERT TO authenticated
  WITH CHECK (auth.user_role() = 'superadmin');

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: audit_logs
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Insert only via service_role (Server Actions / Edge Functions)
-- Tidak ada SELECT policy dari client — audit log hanya bisa dibaca via Admin Supabase
CREATE POLICY audit_logs_insert_service ON audit_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Superadmin bisa lihat audit logs via server action
CREATE POLICY audit_logs_select_superadmin ON audit_logs
  FOR SELECT TO authenticated
  USING (auth.user_role() = 'superadmin');
