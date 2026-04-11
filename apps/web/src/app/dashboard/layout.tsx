// ============================================================================
// Dashboard Layout — Shared layout for all /dashboard/* routes
// ============================================================================

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch actual session data from Supabase
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/login');
  }

  // Get user data from database
  const { data: userData, error } = await supabase
    .from('users')
    .select('id, nama, nomor_induk, role')
    .eq('id', session.user.id)
    .single();

  if (error || !userData) {
    redirect('/login');
  }

  return (
    <DashboardLayout
      userRole={userData.role}
      userName={userData.nama}
      userNomorInduk={userData.nomor_induk}
    >
      {children}
    </DashboardLayout>
  );
}
