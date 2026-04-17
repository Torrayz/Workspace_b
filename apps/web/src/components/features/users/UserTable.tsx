// ============================================================================
// UserTable — Tabel manajemen user (Superadmin only)
// ============================================================================

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDateShort } from '@/lib/formatters';
import { UserPlus, Search, AlertTriangle, Trash2 } from 'lucide-react';

interface UserItem {
  id: string;
  nomor_induk: string;
  nama: string;
  nomor_rekening: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface UserTableProps {
  users: UserItem[];
  onToggleActive: (userId: string, currentStatus: boolean) => void;
  onChangeRole: (userId: string, newRole: string) => void;
  onAddUser: () => void;
  onDeleteUser?: (userId: string, userName: string) => void;
  loading?: boolean;
}

const ROLE_STYLES: Record<string, string> = {
  superadmin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  admin: 'bg-accent/10 text-accent dark:bg-accent/20',
  user: 'bg-surface-alt text-text-secondary dark:bg-dark-surface-alt dark:text-gray-400',
};

export function UserTable({
  users,
  onToggleActive,
  onChangeRole,
  onAddUser,
  onDeleteUser,
  loading,
}: UserTableProps) {
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    action: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.nomor_induk.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-5 w-40 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-14 w-full mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header & actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Cari nama atau nomor induk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input !pl-9"
          />
        </div>
        <button onClick={onAddUser} className="btn-primary">
          <UserPlus size={16} />
          Tambah User
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nomor Induk</th>
              <th>Nama</th>
              <th>Nomor Rekening</th>
              <th>Role</th>
              <th>Status</th>
              <th>Tanggal Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="font-mono text-sm">{user.nomor_induk}</td>
                <td className="font-medium">{user.nama}</td>
                <td className="text-text-secondary font-mono text-sm">{user.nomor_rekening}</td>
                <td>
                  <span className={cn('badge', ROLE_STYLES[user.role])}>
                    {user.role}
                  </span>
                </td>
                <td>
                  {/* Toggle switch */}
                  <button
                    onClick={() => {
                      setConfirmAction({
                        userId: user.id,
                        action: user.is_active ? 'nonaktifkan' : 'aktifkan',
                        message: `Apakah Anda yakin ingin ${user.is_active ? 'menonaktifkan' : 'mengaktifkan'} akun ${user.nama}?`,
                        onConfirm: () => {
                          onToggleActive(user.id, user.is_active);
                          setConfirmAction(null);
                        },
                      });
                    }}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      user.is_active ? 'bg-success' : 'bg-gray-300 dark:bg-gray-600',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                        user.is_active ? 'translate-x-6' : 'translate-x-1',
                      )}
                    />
                  </button>
                </td>
                <td className="text-text-secondary text-sm">{formatDateShort(user.created_at)}</td>
                <td>
                  {user.role !== 'superadmin' && (
                    <select
                      value={user.role}
                      onChange={(e) => {
                        setConfirmAction({
                          userId: user.id,
                          action: 'ubah role',
                          message: `Ubah role ${user.nama} menjadi ${e.target.value}?`,
                          onConfirm: () => {
                            onChangeRole(user.id, e.target.value);
                            setConfirmAction(null);
                          },
                        });
                      }}
                      className="input !w-auto !py-1 !text-xs"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                  {user.role !== 'superadmin' && onDeleteUser && (
                    <button
                      onClick={() => {
                        setConfirmAction({
                          userId: user.id,
                          action: 'hapus',
                          message: `PERINGATAN: Semua data (rencana, laporan, lokasi) milik ${user.nama} akan dihapus permanen. Lanjutkan?`,
                          onConfirm: () => {
                            onDeleteUser(user.id, user.nama);
                            setConfirmAction(null);
                          },
                        });
                      }}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Hapus user"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setConfirmAction(null)}
          />
          <div className="relative mx-4 w-full max-w-sm animate-fade-in rounded-2xl border border-border bg-surface p-6 shadow-2xl dark:bg-dark-surface dark:border-dark-border">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-warning" size={24} />
              <h3 className="text-card-title text-text-primary dark:text-gray-100">Konfirmasi</h3>
            </div>
            <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">
              {confirmAction.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="btn-outline"
              >
                Batal
              </button>
              <button
                onClick={confirmAction.onConfirm}
                className="btn-primary"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
