// ============================================================================
// Superadmin Dashboard — Same as Admin + mengakses user management
// ============================================================================

'use client';

import { redirect } from 'next/navigation';

/**
 * Superadmin dashboard menampilkan konten yang sama dengan Admin dashboard.
 * Perbedaannya hanya pada menu navigasi tambahan di sidebar (User Management, Import Excel).
 * Redirect ke admin dashboard karena kontennya identik.
 */
export default function SuperadminDashboardPage() {
  // Di production, dashboard admin dan super berbagi halaman yang sama.
  // Sidebar sudah menampilkan menu tambahan untuk superadmin.
  redirect('/dashboard/admin');
}
