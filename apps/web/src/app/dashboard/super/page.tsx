// ============================================================================
// Superadmin Dashboard — Redirect ke admin dashboard
// Server Component: redirect() hanya bisa dipakai di server components
// ============================================================================

import { redirect } from 'next/navigation';

/**
 * Superadmin dashboard menampilkan konten yang sama dengan Admin dashboard.
 * Perbedaannya hanya pada menu navigasi tambahan di sidebar (User Management, Import Excel).
 */
export default function SuperadminDashboardPage() {
  redirect('/dashboard/admin');
}
