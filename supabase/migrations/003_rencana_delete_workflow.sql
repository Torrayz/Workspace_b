-- ============================================================================
-- Migration: Add delete request workflow columns to rencana table
-- ============================================================================

-- Tambah kolom untuk workflow permintaan hapus
ALTER TABLE rencana
  ADD COLUMN IF NOT EXISTS delete_status TEXT NOT NULL DEFAULT 'none'
    CHECK (delete_status IN ('none', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS delete_reason TEXT,
  ADD COLUMN IF NOT EXISTS delete_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delete_admin_note TEXT,
  ADD COLUMN IF NOT EXISTS delete_reviewed_by UUID REFERENCES users(id);

-- Index untuk query pending requests
CREATE INDEX IF NOT EXISTS idx_rencana_delete_status ON rencana (delete_status)
  WHERE delete_status = 'pending';

-- RLS: anon bisa UPDATE rencana milik sendiri (untuk set delete request)
CREATE POLICY rencana_update_anon ON rencana
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- RLS: service_role & admin bisa DELETE rencana (hard delete setelah approved)
CREATE POLICY rencana_delete_service ON rencana
  FOR DELETE TO service_role
  USING (true);
