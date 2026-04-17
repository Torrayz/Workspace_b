// ============================================================================
// useRencana — Fetch + create rencana
// ============================================================================

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export interface Rencana {
  id: string;
  user_id: string;
  target_nominal: number;
  deskripsi: string | null;
  tanggal_target: string;
  status: 'aktif' | 'selesai' | 'terlambat';
  created_at: string;
  /** Total sudah tertagih (dari semua laporan terkait) */
  total_collected: number;
  /** Sisa yang belum tertagih */
  sisa: number;
  /** Persentase progress (0-100) */
  progress: number;
  /** Delete request fields */
  delete_status: 'none' | 'pending' | 'approved' | 'rejected';
  delete_reason: string | null;
  delete_requested_at: string | null;
  delete_admin_note: string | null;
}

export interface CreateRencanaPayload {
  target_nominal: number;
  tanggal_target: string;
  deskripsi?: string;
}

/** Helper: Enrich rencana rows with total_collected, sisa, progress */
async function enrichRencana(rows: any[], supabaseClient: any): Promise<Rencana[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((r: any) => r.id);

  // Ambil semua laporan untuk rencana-rencana ini
  const { data: allLaporan } = await supabaseClient
    .from('laporan')
    .select('rencana_id, jumlah_tagihan')
    .in('rencana_id', ids);

  // Hitung total per rencana
  const collectedMap: Record<string, number> = {};
  for (const l of (allLaporan || [])) {
    const rid = l.rencana_id;
    collectedMap[rid] = (collectedMap[rid] || 0) + Number(l.jumlah_tagihan || 0);
  }

  return rows.map((r: any) => {
    const collected = collectedMap[r.id] || 0;
    const target = Number(r.target_nominal);
    const sisa = Math.max(target - collected, 0);
    const progress = target > 0 ? Math.min(Math.round((collected / target) * 100), 100) : 0;
    return { ...r, total_collected: collected, sisa, progress } as Rencana;
  });
}

export function useRencana() {
  const [rencanaList, setRencanaList] = useState<Rencana[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  /** Fetch semua rencana milik user (enriched dengan total collected) */
  const fetchRencana = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('rencana')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      const enriched = await enrichRencana(data || [], supabase);
      setRencanaList(enriched);
    }
    setLoading(false);
  }, [user]);

  /** Fetch rencana yang statusnya 'aktif' — untuk dropdown laporan */
  const fetchRencanaAktif = useCallback(async (): Promise<Rencana[]> => {
    if (!user) return [];

    const { data, error: fetchError } = await supabase
      .from('rencana')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'aktif')
      .order('created_at', { ascending: false });

    if (fetchError) return [];
    return enrichRencana(data || [], supabase);
  }, [user]);

  /** Buat rencana baru */
  const createRencana = useCallback(async (payload: CreateRencanaPayload): Promise<{success: boolean, error?: string}> => {
    if (!user) return { success: false, error: 'User not logged in' };
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from('rencana').insert({
      user_id: user.id,
      target_nominal: payload.target_nominal,
      tanggal_target: payload.tanggal_target,
      deskripsi: payload.deskripsi || null,
      status: 'aktif',
    });

    setLoading(false);

    if (insertError) {
      const errMsg = insertError.message || JSON.stringify(insertError);
      setError(errMsg);
      console.error('Supabase insert error details:', insertError);
      return { success: false, error: errMsg };
    }

    await fetchRencana();
    return { success: true };
  }, [user, fetchRencana]);

  /** Request hapus rencana (butuh persetujuan admin) */
  const requestDeleteRencana = useCallback(async (
    rencanaId: string,
    reason: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not logged in' };

    const { error: updateError } = await supabase
      .from('rencana')
      .update({
        delete_status: 'pending',
        delete_reason: reason,
        delete_requested_at: new Date().toISOString(),
      })
      .eq('id', rencanaId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Request delete error:', updateError);
      return { success: false, error: updateError.message };
    }

    await fetchRencana();
    return { success: true };
  }, [user, fetchRencana]);

  const hasRencanaAktif = rencanaList.some((r) => r.status === 'aktif');

  return {
    rencanaList,
    loading,
    error,
    hasRencanaAktif,
    fetchRencana,
    fetchRencanaAktif,
    createRencana,
    requestDeleteRencana,
  };
}
