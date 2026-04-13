// ============================================================================
// Login Page — Input Nomor Induk + validasi via Server Action
// ============================================================================

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Loader2, LogIn, Shield, AlertTriangle } from 'lucide-react';
import { validateLogin } from './actions';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nomorInduk, setNomorInduk] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cek apakah ada error dari middleware redirect (misal: mobile_only)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'mobile_only') {
      setError('Akun Anda hanya bisa diakses melalui aplikasi mobile. Gunakan app Field Marketing di HP Anda.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorInduk.trim()) {
      setError('Nomor induk wajib diisi');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await validateLogin(nomorInduk.trim());

      if (!result.success) {
        setError(result.error || 'Terjadi kesalahan');
        return;
      }

      // Redirect berdasarkan role — hanya admin/superadmin yang bisa masuk web
      const roleRoutes: Record<string, string> = {
        superadmin: '/dashboard/super',
        admin: '/dashboard/admin',
      };

      const target = roleRoutes[result.role || ''];
      if (!target) {
        setError('Akun Anda tidak memiliki akses ke dashboard web.');
        return;
      }

      router.push(target);
    } catch (error: any) {
      setError(error.message || 'Gagal terhubung ke server. Periksa koneksi internet Anda.');
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
              <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 flex items-start gap-3">
                <AlertTriangle size={18} className="text-danger mt-0.5 flex-shrink-0" />
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
            Dashboard web hanya untuk Admin dan Superadmin.
            <br />
            User lapangan gunakan aplikasi mobile.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-primary-700 to-primary-900">
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
