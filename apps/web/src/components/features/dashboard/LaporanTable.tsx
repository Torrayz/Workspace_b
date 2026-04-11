// ============================================================================
// LaporanTable — DataTable laporan dengan pagination, sort, dan filter
// ============================================================================

'use client';


import Image from 'next/image';
import { cn } from '@/lib/utils';
import { formatRupiah, formatDateShort } from '@/lib/formatters';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

interface LaporanItem {
  id: string;
  user_nama: string;
  tanggal_penagihan: string;
  jumlah_tagihan: number;
  rencana_target_nominal: number;
  status: string;
  keterangan: string | null;
  foto_urls: string[];
  is_anomaly?: boolean;
  created_at: string;
}

interface LaporanTableProps {
  data: LaporanItem[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onStatusFilter?: (status: string | null) => void;
  activeStatusFilter?: string | null;
  loading?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  lunas: { label: 'Lunas', className: 'badge-success' },
  sebagian: { label: 'Sebagian', className: 'badge-info' },
  gagal: { label: 'Gagal', className: 'badge-danger' },
  pending: { label: 'Pending', className: 'badge-warning' },
};

export function LaporanTable({
  data,
  totalPages,
  currentPage,
  onPageChange,
  onStatusFilter,
  activeStatusFilter,
  loading,
}: LaporanTableProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-5 w-40 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-12 w-full mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-card-title text-text-primary dark:text-gray-100">
          Detail Laporan
        </h3>

        {/* Status filter */}
        {onStatusFilter && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onStatusFilter(null)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                !activeStatusFilter
                  ? 'bg-accent text-white'
                  : 'bg-surface-alt text-text-secondary hover:bg-border dark:bg-dark-surface-alt',
              )}
            >
              Semua
            </button>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => onStatusFilter(key)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  activeStatusFilter === key
                    ? 'bg-accent text-white'
                    : 'bg-surface-alt text-text-secondary hover:bg-border dark:bg-dark-surface-alt',
                )}
              >
                {config.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama User</th>
              <th>Tanggal</th>
              <th>Jumlah Tagihan</th>
              <th>Target Rencana</th>
              <th>Status</th>
              <th>Keterangan</th>
              <th>Foto</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-text-muted">
                  Tidak ada data laporan
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const statusInfo = STATUS_CONFIG[item.status];
                return (
                  <tr
                    key={item.id}
                    className={cn(item.is_anomaly && 'bg-danger/5 dark:bg-danger/10')}
                  >
                    <td className="font-medium">
                      <div className="flex items-center gap-2">
                        {item.is_anomaly && (
                          <span title="Anomali terdeteksi" className="flex items-center">
                            <AlertTriangle size={14} className="text-danger shrink-0" />
                          </span>
                        )}
                        {item.user_nama}
                      </div>
                    </td>
                    <td className="text-text-secondary whitespace-nowrap">
                      {formatDateShort(item.tanggal_penagihan)}
                    </td>
                    <td className="font-medium whitespace-nowrap">
                      {formatRupiah(item.jumlah_tagihan)}
                    </td>
                    <td className="text-text-secondary whitespace-nowrap">
                      {formatRupiah(item.rencana_target_nominal)}
                    </td>
                    <td>
                      <span className={cn('badge', statusInfo?.className)}>
                        {statusInfo?.label || item.status}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate text-text-secondary" title={item.keterangan || ''}>
                      {item.keterangan || '—'}
                    </td>
                    <td>
                      <div className="flex -space-x-1">
                        {item.foto_urls.slice(0, 3).map((url, i) => (
                          <div
                            key={i}
                            className="relative h-8 w-8 overflow-hidden rounded-md border-2 border-surface dark:border-dark-surface"
                          >
                            <Image
                              src={url}
                              alt={`Foto ${i + 1}`}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                        ))}
                        {item.foto_urls.length > 3 && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-surface bg-surface-alt text-[10px] font-bold text-text-muted dark:border-dark-surface dark:bg-dark-surface-alt">
                            +{item.foto_urls.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 dark:border-dark-border">
          <p className="text-xs text-text-secondary dark:text-gray-400">
            Halaman {currentPage} dari {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="btn-ghost !p-1.5 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                    page === currentPage
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:bg-surface-alt dark:hover:bg-dark-surface-alt',
                  )}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="btn-ghost !p-1.5 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
