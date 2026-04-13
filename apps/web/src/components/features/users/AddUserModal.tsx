// ============================================================================
// AddUserModal — Form modal untuk menambah user baru
// ============================================================================

'use client';

import { useState } from 'react';
import { X, Loader2, UserPlus } from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nomor_induk: string;
    nama: string;
    nomor_rekening: string;
    role: string;
  }) => Promise<void>;
}

export function AddUserModal({ isOpen, onClose, onSubmit }: AddUserModalProps) {
  const [nomorInduk, setNomorInduk] = useState('');
  const [nama, setNama] = useState('');
  const [nomorRekening, setNomorRekening] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nomorInduk.trim() || !nama.trim() || !nomorRekening.trim()) {
      setError('Semua field wajib diisi');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ nomor_induk: nomorInduk, nama, nomor_rekening: nomorRekening, role });
      // Reset & close on success
      setNomorInduk('');
      setNama('');
      setNomorRekening('');
      setRole('user');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menambah user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative mx-4 w-full max-w-md animate-fade-in rounded-2xl border border-border bg-surface p-6 shadow-2xl dark:bg-dark-surface dark:border-dark-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <UserPlus size={20} className="text-accent" />
            </div>
            <h2 className="text-card-title text-text-primary dark:text-gray-100">
              Tambah User Baru
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-alt hover:text-text-primary transition-colors dark:hover:bg-dark-surface-alt"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">
              Nomor Induk
            </label>
            <input
              type="text"
              value={nomorInduk}
              onChange={(e) => setNomorInduk(e.target.value)}
              placeholder="Contoh: USR001"
              className="input"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama lengkap karyawan"
              className="input"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">
              Nomor Rekening
            </label>
            <input
              type="text"
              value={nomorRekening}
              onChange={(e) => setNomorRekening(e.target.value)}
              placeholder="Nomor rekening bank"
              className="input"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input"
              disabled={loading}
            >
              <option value="user">User (Field Marketing)</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-outline" disabled={loading}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Tambah User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
