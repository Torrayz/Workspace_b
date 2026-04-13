'use server';

import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function validateLogin(nomorInduk: string) {
  try {
    // Gunakan admin client untuk bypass RLS saat login
    // (User belum punya JWT token yet)
    const supabase = createSupabaseAdminClient();

    console.log('[DEBUG] Attempting login for nomor_induk:', nomorInduk);

    // Query user dari database
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('id, nomor_induk, nama, nomor_rekening, role, is_active')
      .eq('nomor_induk', nomorInduk.trim())
      .single();

    console.log('[DEBUG] Query result:', { user, queryError });

    if (queryError || !user) {
      console.log('[DEBUG] User not found or query error:', queryError);
      // Log gagal login
      await supabase.from('audit_logs').insert({
        action: 'login_failed',
        metadata: { nomor_induk: nomorInduk.trim(), reason: 'not_found' },
      });

      return {
        success: false,
        error: 'Nomor induk tidak ditemukan',
      };
    }

    console.log('[DEBUG] User found:', { id: user.id, nomor_induk: user.nomor_induk, role: user.role, is_active: user.is_active });

    // Cek apakah akun aktif
    if (!user.is_active) {
      console.log('[DEBUG] Account is inactive');
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'login_failed',
        metadata: { reason: 'account_inactive' },
      });

      return {
        success: false,
        error: 'Akun tidak aktif. Hubungi admin.',
      };
    }

    // BLOKIR: User role hanya bisa login via mobile app
    if (user.role === 'user') {
      console.log('[DEBUG] User role blocked from web login:', nomorInduk);
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'login_failed',
        metadata: { reason: 'web_access_denied', role: 'user' },
      });

      return {
        success: false,
        error: 'Akun Anda hanya dapat diakses melalui aplikasi mobile. Silakan download dan gunakan aplikasi Field Marketing di HP Anda.',
      };
    }

    // Simpan user data (token handling di future updates)
    const userData = {
      id: user.id,
      nama: user.nama,
      nomor_induk: user.nomor_induk,
      nomor_rekening: user.nomor_rekening,
      role: user.role,
    };

    // Log berhasil login
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'login_success',
      metadata: { role: user.role },
    });

    console.log('[DEBUG] Login successful for:', nomorInduk);

    // Set cookie untuk middleware detect user sudah login
    const cookieStore = await cookies();
    cookieStore.set('auth_user', JSON.stringify({
      id: user.id,
      nomor_induk: user.nomor_induk,
      nama: user.nama,
      role: user.role,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return {
      success: true,
      role: user.role,
      user: userData,
    };
  } catch (error: any) {
    console.error('[ERROR] Login error:', error);
    return {
      success: false,
      error: error.message || 'Terjadi kesalahan server',
    };
  }
}
