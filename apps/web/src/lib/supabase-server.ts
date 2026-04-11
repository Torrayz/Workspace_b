// ============================================================================
// Supabase Server Client — untuk dipakai di Server Components & Server Actions
// ============================================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Buat Supabase client untuk server-side (Server Components, Server Actions, Route Handlers).
 * Token dibaca dari HttpOnly cookies secara otomatis.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // cookies().set di Server Component akan throw error — abaikan
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Di Server Component — abaikan
          }
        },
      },
    },
  );
}

/**
 * Buat Supabase client dengan SERVICE ROLE key.
 * ⚠️ HANYA untuk Server Actions yang butuh bypass RLS.
 * JANGAN PERNAH expose ke client.
 */
export function createSupabaseAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() { return undefined; },
        set() {},
        remove() {},
      },
    },
  );
}
