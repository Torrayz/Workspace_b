// ============================================================================
// Dashboard Layout — Shared layout for all /dashboard/* routes
// Menggunakan custom auth cookie (auth_user) bukan Supabase Auth session
// ============================================================================

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Baca custom auth cookie yang di-set saat login via nomor induk
  const cookieStore = await cookies();
  const authUserCookie = cookieStore.get('auth_user')?.value;

  if (!authUserCookie) {
    redirect('/login');
  }

  let authUser: { id: string; nama: string; nomor_induk: string; role: string } | null = null;
  try {
    authUser = JSON.parse(authUserCookie);
  } catch {
    redirect('/login');
  }

  if (!authUser) {
    redirect('/login');
  }

  return (
    <DashboardLayout
      userRole={authUser.role}
      userName={authUser.nama}
      userNomorInduk={authUser.nomor_induk}
    >
      {children}
    </DashboardLayout>
  );
}
