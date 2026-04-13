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
  status: 'aktif' | 'selesai' | 'batal';
  created_at: string;
}

export interface CreateRencanaPayload {
  target_nominal: number;
  tanggal_target: string;
  deskripsi?: string;
}

export function useRencana() {
  const [rencanaList, setRencanaList] = useState<Rencana[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  /** Fetch semua rencana milik user */
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
      setRencanaList(data as Rencana[]);
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
    return data as Rencana[];
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

  const hasRencanaAktif = rencanaList.some((r) => r.status === 'aktif');

  return {
    rencanaList,
    loading,
    error,
    hasRencanaAktif,
    fetchRencana,
    fetchRencanaAktif,
    createRencana,
  };
}
