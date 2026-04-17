// ============================================================================
// Edge Function: process-laporan-submit
// Validasi & simpan laporan penagihan dari mobile app
// ============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { verify } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const JWT_SECRET = Deno.env.get('JWT_SECRET') || SUPABASE_SERVICE_ROLE_KEY;

// GPS bounds Indonesia
const GPS_BOUNDS = {
  lat: { min: -11, max: 6 },
  lng: { min: 95, max: 141 },
};

// Buat HMAC key untuk JWT verification
const encoder = new TextEncoder();
const keyData = encoder.encode(JWT_SECRET);
const cryptoKey = await crypto.subtle.importKey(
  'raw',
  keyData,
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign', 'verify'],
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-custom-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Validasi JWT dan extract payload */
async function validateAuth(req: Request): Promise<{ sub: string; role: string } | null> {
  // Custom JWT dikirim via x-custom-token (karena Authorization dipakai anon key untuk gateway)
  const customToken = req.headers.get('x-custom-token');
  if (!customToken) return null;

  try {
    const payload = await verify(customToken, cryptoKey);
    return payload as unknown as { sub: string; role: string };
  } catch {
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validasi JWT
    const auth = await validateAuth(req);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Token tidak valid atau kadaluarsa' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 2. Parse input
    const body = await req.json();
    const {
      rencana_id,
      jumlah_tagihan,
      tanggal_penagihan,
      foto_urls,
      lokasi_lat,
      lokasi_lng,
      lokasi_alamat,
      keterangan,
      status,
    } = body;

    // 3. Validasi field wajib
    const errors: string[] = [];

    if (!rencana_id) errors.push('Rencana wajib dipilih');
    if (jumlah_tagihan === undefined || jumlah_tagihan < 0) errors.push('Jumlah tagihan tidak valid');
    if (!tanggal_penagihan) errors.push('Tanggal penagihan wajib diisi');
    if (!foto_urls || !Array.isArray(foto_urls) || foto_urls.length === 0) {
      errors.push('Minimal 1 foto bukti wajib diupload');
    }
    if (!status) errors.push('Status laporan wajib dipilih');

    // 4. Validasi GPS bounds Indonesia
    if (
      typeof lokasi_lat !== 'number' ||
      lokasi_lat < GPS_BOUNDS.lat.min ||
      lokasi_lat > GPS_BOUNDS.lat.max
    ) {
      errors.push('Koordinat latitude di luar wilayah Indonesia');
    }
    if (
      typeof lokasi_lng !== 'number' ||
      lokasi_lng < GPS_BOUNDS.lng.min ||
      lokasi_lng > GPS_BOUNDS.lng.max
    ) {
      errors.push('Koordinat longitude di luar wilayah Indonesia');
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validasi gagal', details: errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 5. Validasi ownership rencana
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: rencana, error: rencanaError } = await supabase
      .from('rencana')
      .select('id, user_id, status, target_nominal, tanggal_target')
      .eq('id', rencana_id)
      .single();

    if (rencanaError || !rencana) {
      return new Response(
        JSON.stringify({ error: 'Rencana tidak ditemukan' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (rencana.user_id !== auth.sub) {
      return new Response(
        JSON.stringify({ error: 'Rencana bukan milik user yang sedang login' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (rencana.status !== 'aktif') {
      return new Response(
        JSON.stringify({ error: 'Rencana sudah selesai atau terlambat' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 6. Insert laporan
    const { data: laporan, error: insertError } = await supabase
      .from('laporan')
      .insert({
        user_id: auth.sub,
        rencana_id,
        jumlah_tagihan,
        tanggal_penagihan,
        foto_urls,
        lokasi_lat,
        lokasi_lng,
        lokasi_alamat: lokasi_alamat || '-',
        keterangan: keterangan?.trim() || null,
        status,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert laporan error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Gagal menyimpan laporan' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 7. Hitung TOTAL tagihan yang sudah terkumpul untuk rencana ini (semua laporan)
    const { data: laporanSum } = await supabase
      .from('laporan')
      .select('jumlah_tagihan')
      .eq('rencana_id', rencana_id);

    const totalCollected = (laporanSum || []).reduce(
      (sum: number, l: any) => sum + Number(l.jumlah_tagihan || 0),
      0,
    );

    // 8. Update status rencana berdasarkan total terkumpul vs target
    let newRencanaStatus = 'aktif';
    const now = new Date();
    const deadline = new Date(rencana.tanggal_target);
    // Set deadline ke akhir hari (23:59:59)
    deadline.setHours(23, 59, 59, 999);

    if (totalCollected >= rencana.target_nominal) {
      // Target tercapai → selesai
      newRencanaStatus = 'selesai';
    } else if (now > deadline) {
      // Melewati deadline tapi target belum tercapai → terlambat (gagal)
      newRencanaStatus = 'terlambat';
    }
    // Jika belum deadline dan belum lunas → tetap 'aktif'

    if (newRencanaStatus !== rencana.status) {
      await supabase
        .from('rencana')
        .update({ status: newRencanaStatus })
        .eq('id', rencana_id);
    }

    // 9. Audit log
    await supabase.from('audit_logs').insert({
      user_id: auth.sub,
      action: 'submit_laporan',
      metadata: {
        laporan_id: laporan.id,
        rencana_id,
        jumlah_tagihan,
        total_collected: totalCollected,
        target_nominal: rencana.target_nominal,
        rencana_status: newRencanaStatus,
        status,
      },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
    });

    // 10. Success response
    return new Response(
      JSON.stringify({
        laporan_id: laporan.id,
        total_collected: totalCollected,
        target_nominal: rencana.target_nominal,
        rencana_status: newRencanaStatus,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('process-laporan-submit error:', err);
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan server' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
