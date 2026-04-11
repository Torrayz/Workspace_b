// ============================================================================
// DownloadModal — Pilih format export Excel atau PDF
// ============================================================================

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FileSpreadsheet, FileText, X, Loader2 } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadExcel: () => Promise<void>;
  onDownloadPDF: () => Promise<void>;
}

export function DownloadModal({
  isOpen,
  onClose,
  onDownloadExcel,
  onDownloadPDF,
}: DownloadModalProps) {
  const [loading, setLoading] = useState<'excel' | 'pdf' | null>(null);

  if (!isOpen) return null;

  const handleDownload = async (type: 'excel' | 'pdf') => {
    setLoading(type);
    try {
      if (type === 'excel') {
        await onDownloadExcel();
      } else {
        await onDownloadPDF();
      }
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-md animate-fade-in rounded-2xl border border-border bg-surface p-6 shadow-2xl dark:bg-dark-surface dark:border-dark-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-section-title text-text-primary dark:text-gray-100">
            Download Report
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-alt hover:text-text-primary transition-colors dark:hover:bg-dark-surface-alt"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">
          Pilih format file yang ingin diunduh. Data mengikuti filter yang sedang aktif.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Excel option */}
          <button
            onClick={() => handleDownload('excel')}
            disabled={loading !== null}
            className={cn(
              'flex flex-col items-center gap-3 rounded-xl border-2 border-border p-6',
              'transition-all duration-200 hover:border-success hover:bg-success/5',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'dark:border-dark-border dark:hover:border-success',
            )}
          >
            {loading === 'excel' ? (
              <Loader2 size={32} className="animate-spin text-success" />
            ) : (
              <FileSpreadsheet size={32} className="text-success" />
            )}
            <div>
              <p className="font-semibold text-text-primary dark:text-gray-100">Excel</p>
              <p className="text-[10px] text-text-muted mt-0.5">3 sheets: Summary, Detail, Performa</p>
            </div>
          </button>

          {/* PDF option */}
          <button
            onClick={() => handleDownload('pdf')}
            disabled={loading !== null}
            className={cn(
              'flex flex-col items-center gap-3 rounded-xl border-2 border-border p-6',
              'transition-all duration-200 hover:border-danger hover:bg-danger/5',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'dark:border-dark-border dark:hover:border-danger',
            )}
          >
            {loading === 'pdf' ? (
              <Loader2 size={32} className="animate-spin text-danger" />
            ) : (
              <FileText size={32} className="text-danger" />
            )}
            <div>
              <p className="font-semibold text-text-primary dark:text-gray-100">PDF</p>
              <p className="text-[10px] text-text-muted mt-0.5">Chart + tabel dalam satu dokumen</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
