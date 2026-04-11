// ============================================================================
// Login Page — Input Nomor Induk + validasi via Edge Function
// ============================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Loader2, LogIn, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [nomorInduk, setNomorInduk] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorInduk.trim()) {
      setError('Nomor induk wajib diisi');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/validate-nomor-induk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({ nomor_induk: nomorInduk.trim() }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan');
        return;
      }

      // Redirect berdasarkan role
      const roleRoutes: Record<string, string> = {
        superadmin: '/dashboard/super',
        admin: '/dashboard/admin',
        user: '/dashboard/user',
      };
      router.push(roleRoutes[data.user.role] || '/dashboard/user');
    } catch {
      setError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-primary-700 to-primary-900 p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, white 2px, transparent 0)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur-xl dark:bg-dark-surface/95 dark:border-dark-border">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-700 shadow-lg shadow-accent/30">
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-section-title text-text-primary dark:text-gray-100">
              Field Marketing System
            </h1>
            <p className="mt-2 text-sm text-text-secondary dark:text-gray-400">
              Masuk menggunakan Nomor Induk Karyawan
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="nomor-induk"
                className="mb-1.5 block text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider"
              >
                Nomor Induk
              </label>
              <input
                id="nomor-induk"
                type="text"
                value={nomorInduk}
                onChange={(e) => {
                  setNomorInduk(e.target.value);
                  setError(null);
                }}
                placeholder="Masukkan nomor induk karyawan"
                className={cn('input text-base', error && 'border-danger focus:border-danger focus:ring-danger/20')}
                autoFocus
                autoComplete="off"
                disabled={loading}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !nomorInduk.trim()}
              className="btn-primary w-full !py-3 text-base"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Masuk
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-[10px] text-text-muted dark:text-gray-500">
            Hanya karyawan terdaftar yang dapat mengakses sistem ini.
            <br />
            Hubungi Superadmin jika Anda belum memiliki akun.
          </p>
        </div>
      </div>
    </div>
  );
}
