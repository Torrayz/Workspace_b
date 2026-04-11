'use client';

import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { UserTable } from '@/components/features/users/UserTable';
import { getUsers, toggleUserStatus, updateUserRole } from '@/app/dashboard/actions';
import { useToast } from '@/components/ui/Toaster';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data || []);
    } catch (error: any) {
      toast('error', error.message || 'Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserStatus(userId, currentStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u)),
      );
      toast('success', `User berhasil di${!currentStatus ? 'aktifkan' : 'nonaktifkan'}`);
    } catch (error: any) {
      toast('error', error.message || 'Gagal mengubah status user');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      toast('success', `Role user berhasil diubah menjadi ${newRole}`);
    } catch (error: any) {
      toast('error', error.message || 'Gagal mengubah role user');
    }
  };

  return (
    <PageContainer
      title="Kelola User"
      description="Manajemen akun karyawan — tambah, edit role, dan nonaktifkan akun"
    >
      <UserTable
        users={users}
        onToggleActive={handleToggleActive}
        onChangeRole={handleChangeRole}
        onAddUser={() => toast('info', 'Fitur tambah user via UI akan segera hadir')}
        loading={loading}
      />
    </PageContainer>
  );
}
