// ============================================================================
// useLaporan — Submit laporan + upload foto ke Supabase Storage
// ============================================================================

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { compressImages } from '@/lib/image-compress';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import Constants from 'expo-constants';

export interface Laporan {
  id: string;
  user_id: string;
  rencana_id: string;
  jumlah_tagihan: number;
  tanggal_penagihan: string;
  status: 'lunas' | 'sebagian' | 'gagal' | 'pending';
  keterangan: string | null;
  foto_urls: string[];
  created_at: string;
}

export interface SubmitLaporanPayload {
  rencana_id: string;
  jumlah_tagihan: number;
  tanggal_penagihan: string;
  foto_uris: string[];      // URI lokal file foto
  keterangan?: string;
  status: 'lunas' | 'sebagian' | 'gagal' | 'pending';
}

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || '';

export function useLaporan() {
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { user, token } = useAuthStore();
  const { latitude, longitude } = useLocationStore();

  /** Fetch history laporan milik user */
  const fetchLaporan = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('laporan')
      .select(`
        id, user_id, rencana_id, jumlah_tagihan,
        tanggal_penagihan, status, keterangan, foto_urls, created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setLaporan(data as Laporan[]);
    }
    setLoading(false);
  }, [user]);

  /** Upload foto ke Supabase Storage, kembalikan array URL public */
  const uploadFotos = async (uris: string[], laporanId: string): Promise<string[]> => {
    if (!user) return [];

    // Kompresi semua foto dulu
    const compressedUris = await compressImages(uris);
    const urls: string[] = [];

    for (let i = 0; i < compressedUris.length; i++) {
      const uri = compressedUris[i]!;
      const timestamp = Date.now();
      const storagePath = `${user.id}/${laporanId}/${timestamp}_${i}.jpg`;

      // Fetch file sebagai blob
      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('laporan-foto')
        .upload(storagePath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (!uploadError) {
        // Buat signed URL (berlaku 7 hari)
        const { data: signedData } = await supabase.storage
          .from('laporan-foto')
          .createSignedUrl(storagePath, 7 * 24 * 60 * 60);

        if (signedData?.signedUrl) urls.push(signedData.signedUrl);
      }

      setUploadProgress(((i + 1) / compressedUris.length) * 100);
    }

    return urls;
  };

  /**
   * Submit laporan via Supabase Edge Function process-laporan-submit.
   * Edge Function melakukan validasi server-side (GPS bounds, ownership rencana).
   */
  const submitLaporan = useCallback(async (
    payload: SubmitLaporanPayload,
  ): Promise<{ success: boolean; laporan_id?: string; error?: string }> => {
    if (!user || !token) return { success: false, error: 'Tidak terautentikasi' };
    if (!latitude || !longitude) return { success: false, error: 'Lokasi GPS tidak tersedia' };
    if (payload.foto_uris.length === 0) return { success: false, error: 'Minimal 1 foto diperlukan' };

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Step 1: Generate laporan_id sementara untuk storage path
      const tempId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      // Step 2: Upload foto dulu ke Storage
      const fotoUrls = await uploadFotos(payload.foto_uris, tempId);
      if (fotoUrls.length === 0) {
        throw new Error('Gagal mengupload foto. Coba lagi.');
      }

      // Step 3: Panggil Edge Function untuk insert laporan + validasi
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/process-laporan-submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rencana_id: payload.rencana_id,
            jumlah_tagihan: payload.jumlah_tagihan,
            tanggal_penagihan: payload.tanggal_penagihan,
            foto_urls: fotoUrls,
            lokasi_lat: latitude,
            lokasi_lng: longitude,
            keterangan: payload.keterangan || null,
            status: payload.status,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal submit laporan');
      }

      await fetchLaporan();
      return { success: true, laporan_id: result.laporan_id };
    } catch (err: any) {
      const message = err.message || 'Terjadi kesalahan';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }, [user, token, latitude, longitude, fetchLaporan]);

  return {
    laporan,
    loading,
    error,
    uploadProgress,
    fetchLaporan,
    submitLaporan,
  };
}
