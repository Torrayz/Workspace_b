// ============================================================================
// Edge Function: validate-nomor-induk
// Autentikasi user via Nomor Induk → return custom JWT token
// ============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { create } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const JWT_SECRET = Deno.env.get('JWT_SECRET') || SUPABASE_SERVICE_ROLE_KEY;

// Buat HMAC key untuk JWT signing
const encoder = new TextEncoder();
const keyData = encoder.encode(JWT_SECRET);
const cryptoKey = await crypto.subtle.importKey(
  'raw',
  keyData,
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign', 'verify'],
);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Ganti dengan domain production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Parse & validate input
    const { nomor_induk } = await req.json();

    if (!nomor_induk || typeof nomor_induk !== 'string' || nomor_induk.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nomor induk wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 2. Query user dari database menggunakan service role (bypass RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('id, nomor_induk, nama, nomor_rekening, role, is_active')
      .eq('nomor_induk', nomor_induk.trim())
      .single();

    if (queryError || !user) {
      // Log gagal login
      await supabase.from('audit_logs').insert({
        action: 'login_failed',
        metadata: { nomor_induk: nomor_induk.trim(), reason: 'not_found' },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
      });

      return new Response(
        JSON.stringify({ error: 'Nomor induk tidak ditemukan' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 3. Cek apakah akun aktif
    if (!user.is_active) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'login_failed',
        metadata: { reason: 'account_inactive' },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
      });

      return new Response(
        JSON.stringify({ error: 'Akun tidak aktif. Hubungi admin.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 4. Buat custom JWT token
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user.id,
      role: user.role,
      nomor_induk: user.nomor_induk,
      iat: now,
      exp: now + 60 * 60 * 24 * 7, // 7 hari
      iss: 'field-marketing-system',
    };

    const token = await create({ alg: 'HS256', typ: 'JWT' }, payload, cryptoKey);

    // 5. Log berhasil login
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'login_success',
      metadata: { role: user.role },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
    });

    // 6. Return token + user data
    return new Response(
      JSON.stringify({
        token,
        user: {
          id: user.id,
          nama: user.nama,
          nomor_induk: user.nomor_induk,
          nomor_rekening: user.nomor_rekening,
          role: user.role,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('validate-nomor-induk error:', err);
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan server' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
