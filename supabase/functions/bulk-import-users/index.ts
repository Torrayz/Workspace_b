// ============================================================================
// Edge Function: bulk-import-users
// Import user secara bulk dari data Excel yang sudah di-parse di frontend
// ============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { verify } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const JWT_SECRET = Deno.env.get('JWT_SECRET') || SUPABASE_SERVICE_ROLE_KEY;

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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Validasi JWT dan pastikan role = superadmin */
async function validateSuperadmin(req: Request): Promise<{ sub: string } | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.slice(7);
    const payload = await verify(token, cryptoKey) as Record<string, unknown>;
    if (payload.role !== 'superadmin') return null;
    return { sub: payload.sub as string };
  } catch {
    return null;
  }
}

/** Validasi satu baris data user */
function validateRow(
  row: Record<string, string>,
  index: number,
): { valid: boolean; error?: string; data?: Record<string, string> } {
  const { nomor_induk, nama, nomor_rekening, role } = row;

  if (!nomor_induk || nomor_induk.trim().length === 0) {
    return { valid: false, error: `Baris ${index + 1}: Nomor induk kosong` };
  }
  if (!nama || nama.trim().length === 0) {
    return { valid: false, error: `Baris ${index + 1}: Nama kosong` };
  }
  if (!nomor_rekening || nomor_rekening.trim().length === 0) {
    return { valid: false, error: `Baris ${index + 1}: Nomor rekening kosong` };
  }
  if (!role || !['admin', 'user'].includes(role.trim().toLowerCase())) {
    return {
      valid: false,
      error: `Baris ${index + 1}: Role harus "admin" atau "user", diterima: "${role}"`,
    };
  }

  return {
    valid: true,
    data: {
      nomor_induk: nomor_induk.trim(),
      nama: nama.trim(),
      nomor_rekening: nomor_rekening.trim(),
      role: role.trim().toLowerCase(),
    },
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validasi: hanya superadmin
    const auth = await validateSuperadmin(req);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Hanya Superadmin yang bisa mengimpor user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 2. Parse input
    const { rows, filename } = await req.json() as {
      rows: Record<string, string>[];
      filename: string;
    };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Data kosong' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 3. Proses setiap baris
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ row: number; reason: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const validation = validateRow(rows[i]!, i);

      if (!validation.valid) {
        failedCount++;
        errors.push({ row: i + 1, reason: validation.error! });
        continue;
      }

      // Insert ke database
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          nomor_induk: validation.data!.nomor_induk,
          nama: validation.data!.nama,
          nomor_rekening: validation.data!.nomor_rekening,
          role: validation.data!.role,
        });

      if (insertError) {
        failedCount++;
        // Deteksi error duplikat nomor induk
        const reason = insertError.code === '23505'
          ? `Baris ${i + 1}: Nomor induk "${validation.data!.nomor_induk}" sudah terdaftar`
          : `Baris ${i + 1}: ${insertError.message}`;
        errors.push({ row: i + 1, reason });
      } else {
        successCount++;
      }
    }

    // 4. Log import ke excel_imports
    await supabase.from('excel_imports').insert({
      uploaded_by: auth.sub,
      filename: filename || 'unknown.xlsx',
      total_rows: rows.length,
      success_rows: successCount,
      failed_rows: failedCount,
      error_log: errors,
    });

    // 5. Audit log
    await supabase.from('audit_logs').insert({
      user_id: auth.sub,
      action: 'bulk_import_users',
      metadata: {
        filename,
        total_rows: rows.length,
        success_rows: successCount,
        failed_rows: failedCount,
      },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
    });

    // 6. Return summary
    return new Response(
      JSON.stringify({
        success_rows: successCount,
        failed_rows: failedCount,
        errors,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('bulk-import-users error:', err);
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan server' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
