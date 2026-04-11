// ============================================================================
// Supabase Browser Client — untuk dipakai di Client Components
// ============================================================================

import { createBrowserClient } from '@supabase/ssr';

/**
 * Buat Supabase client untuk browser.
 * Menggunakan @supabase/ssr agar token disimpan di HttpOnly cookies.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
