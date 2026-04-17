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
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || '';

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

  /**
   * Upload satu foto ke Supabase Storage via XHR + direct REST API.
   *
   * Alur:
   * 1. XHR membaca file:// URI → respons langsung di-stream ke Supabase
   * 2. Menggunakan XMLHttpRequest untuk SELURUH proses (baca + upload)
   *    karena fetch() di React Native tidak bisa kirim Blob sebagai body
   * 3. Anon key sebagai auth karena app pakai custom JWT (bukan Supabase Auth)
   */
  const uploadSingleFile = (
    fileUri: string,
    storagePath: string,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/laporan-foto/${storagePath}`;

      // Step 1: Baca file lokal sebagai blob via XHR
      const readXhr = new XMLHttpRequest();
      readXhr.onload = () => {
        if (readXhr.status !== 200 && readXhr.status !== 0) {
          reject(new Error(`Gagal baca file: status ${readXhr.status}`));
          return;
        }
        const blob = readXhr.response;

        // Step 2: Upload blob ke Supabase via XHR (bukan fetch!)
        const uploadXhr = new XMLHttpRequest();
        uploadXhr.onload = () => {
          if (uploadXhr.status >= 200 && uploadXhr.status < 300) {
            resolve();
          } else {
            let errMsg = `Upload gagal (HTTP ${uploadXhr.status})`;
            try {
              const body = JSON.parse(uploadXhr.responseText);
              errMsg = body.error || body.message || errMsg;
            } catch {}
            console.error('Storage XHR upload error:', uploadXhr.status, uploadXhr.responseText);
            reject(new Error(errMsg));
          }
        };
        uploadXhr.onerror = () => {
          console.error('Storage XHR network error');
          reject(new Error('Network error saat upload foto'));
        };
        uploadXhr.open('POST', uploadUrl, true);
        uploadXhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
        uploadXhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
        uploadXhr.setRequestHeader('Content-Type', 'image/jpeg');
        uploadXhr.setRequestHeader('Cache-Control', '3600');
        uploadXhr.setRequestHeader('x-upsert', 'false');
        uploadXhr.send(blob);
      };
      readXhr.onerror = () => {
        console.error('File read XHR error for:', fileUri);
        reject(new Error('Gagal membaca file foto'));
      };
      readXhr.responseType = 'blob';
      readXhr.open('GET', fileUri, true);
      readXhr.send(null);
    });
  };

  /** Upload foto ke Supabase Storage, kembalikan array signed URL */
  const uploadFotos = async (uris: string[], laporanId: string): Promise<string[]> => {
    if (!user) return [];

    // Kompresi semua foto dulu
    const compressedUris = await compressImages(uris);
    const urls: string[] = [];

    for (let i = 0; i < compressedUris.length; i++) {
      const uri = compressedUris[i]!;
      const timestamp = Date.now();
      const storagePath = `${user.id}/${laporanId}/${timestamp}_${i}.jpg`;

      // Upload via XHR chain (baca file → upload) — bypass semua bug fetch() di RN
      await uploadSingleFile(uri, storagePath);

      // Buat signed URL (berlaku 7 hari)
      const { data: signedData, error: signError } = await supabase.storage
        .from('laporan-foto')
        .createSignedUrl(storagePath, 7 * 24 * 60 * 60);

      if (signError) {
        console.error('Supabase Signed URL Error:', signError);
        throw new Error(`Signed URL error: ${signError.message}`);
      }

      if (signedData?.signedUrl) urls.push(signedData.signedUrl);

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
    if (!user || !token) {
      console.warn('[submitLaporan] Tidak terautentikasi — user:', !!user, 'token:', !!token);
      return { success: false, error: 'Tidak terautentikasi' };
    }
    if (!latitude || !longitude) {
      console.warn('[submitLaporan] GPS belum tersedia — lat:', latitude, 'lng:', longitude);
      return { success: false, error: 'Lokasi GPS tidak tersedia' };
    }
    if (payload.foto_uris.length === 0) {
      console.warn('[submitLaporan] Tidak ada foto');
      return { success: false, error: 'Minimal 1 foto diperlukan' };
    }

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      console.log('[submitLaporan] Mulai upload...', payload.foto_uris.length, 'foto');

      // Step 1: Generate laporan_id sementara untuk storage path
      const tempId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      // Step 2: Upload foto dulu ke Storage
      const fotoUrls = await uploadFotos(payload.foto_uris, tempId);
      if (fotoUrls.length === 0) {
        throw new Error('Gagal mengupload foto. Coba lagi.');
      }
      console.log('[submitLaporan] Upload selesai, URLs:', fotoUrls.length);

      // Step 3: Panggil Edge Function untuk insert laporan + validasi
      console.log('[submitLaporan] Mengirim ke Edge Function...');
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/process-laporan-submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            apikey: SUPABASE_ANON_KEY,
            'x-custom-token': token!,
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
      console.log('[submitLaporan] Edge Function response:', response.status, result);

      if (!response.ok) {
        throw new Error(result.error || 'Gagal submit laporan');
      }

      await fetchLaporan();
      return { success: true, laporan_id: result.laporan_id };
    } catch (err: any) {
      const message = err.message || 'Terjadi kesalahan';
      console.error('[submitLaporan] ERROR:', message, err);
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
