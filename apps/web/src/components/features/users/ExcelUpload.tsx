// ============================================================================
// ExcelUpload — 4-step stepper untuk bulk import user via Excel
// ============================================================================

'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface ImportRow {
  nomor_induk: string;
  nama: string;
  nomor_rekening: string;
  role: string;
}

interface ImportResult {
  success_rows: number;
  failed_rows: number;
  errors: Array<{ row: number; reason: string }>;
}

interface ExcelUploadProps {
  onImport: (rows: ImportRow[], filename: string) => Promise<ImportResult>;
}

const STEPS = [
  { label: 'Download Template', icon: Download },
  { label: 'Upload File', icon: Upload },
  { label: 'Preview Data', icon: FileSpreadsheet },
  { label: 'Hasil Import', icon: CheckCircle },
] as const;

export function ExcelUpload({ onImport }: ExcelUploadProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [filename, setFilename] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);

    // Parse menggunakan ExcelJS di client
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error('File Excel kosong');

      const rows: ImportRow[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        rows.push({
          nomor_induk: String(row.getCell(1).value || '').trim(),
          nama: String(row.getCell(2).value || '').trim(),
          nomor_rekening: String(row.getCell(3).value || '').trim(),
          role: String(row.getCell(4).value || '').trim().toLowerCase(),
        });
      });

      setParsedRows(rows);
      setCurrentStep(2);
    } catch (error) {
      console.error('Parse error:', error);
      alert('Gagal membaca file Excel. Pastikan format file sesuai template.');
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const importResult = await onImport(parsedRows, filename);
      setResult(importResult);
      setCurrentStep(3);
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="card">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                    isActive && 'border-accent bg-accent text-white',
                    isCompleted && 'border-success bg-success text-white',
                    !isActive && !isCompleted && 'border-border text-text-muted dark:border-dark-border',
                  )}
                >
                  {isCompleted ? <CheckCircle size={18} /> : <Icon size={18} />}
                </div>
                <span
                  className={cn(
                    'mt-2 text-[10px] font-medium text-center max-w-[80px]',
                    isActive && 'text-accent',
                    isCompleted && 'text-success',
                    !isActive && !isCompleted && 'text-text-muted',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 w-12 sm:w-20',
                    index < currentStep ? 'bg-success' : 'bg-border dark:bg-dark-border',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="min-h-[300px]">
        {/* Step 1: Download Template */}
        {currentStep === 0 && (
          <div className="flex flex-col items-center gap-6 py-8">
            <FileSpreadsheet size={48} className="text-success" />
            <div className="text-center">
              <p className="text-sm text-text-primary dark:text-gray-100 font-medium mb-2">
                Download template Excel terlebih dahulu
              </p>
              <p className="text-xs text-text-muted">
                Kolom: nomor_induk, nama, nomor_rekening, role
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-primary">
                <Download size={16} />
                Download Template
              </button>
              <button onClick={() => setCurrentStep(1)} className="btn-outline">
                Sudah Punya
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Upload */}
        {currentStep === 1 && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div
              className={cn(
                'flex h-40 w-full max-w-sm cursor-pointer flex-col items-center justify-center rounded-xl',
                'border-2 border-dashed border-border hover:border-accent transition-colors',
                'dark:border-dark-border dark:hover:border-accent',
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={32} className="text-text-muted mb-2" />
              <p className="text-sm text-text-secondary">Klik atau drag file Excel ke sini</p>
              <p className="text-xs text-text-muted mt-1">.xlsx, .xls</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button onClick={() => setCurrentStep(0)} className="btn-ghost">
              <ArrowLeft size={16} />
              Kembali
            </button>
          </div>
        )}

        {/* Step 3: Preview */}
        {currentStep === 2 && (
          <div>
            <p className="text-sm text-text-secondary mb-4">
              <span className="font-semibold text-text-primary dark:text-gray-100">
                {parsedRows.length} baris
              </span>{' '}
              ditemukan dari file <span className="font-mono text-xs">{filename}</span>
            </p>
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto rounded-lg border border-border dark:border-dark-border">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nomor Induk</th>
                    <th>Nama</th>
                    <th>Nomor Rekening</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, i) => (
                    <tr key={i}>
                      <td className="text-text-muted">{i + 1}</td>
                      <td className="font-mono text-sm">{row.nomor_induk}</td>
                      <td>{row.nama}</td>
                      <td className="font-mono text-sm">{row.nomor_rekening}</td>
                      <td>
                        <span className={cn(
                          'badge',
                          row.role === 'admin' ? 'badge-info' : 'bg-surface-alt text-text-secondary dark:bg-dark-surface-alt',
                        )}>
                          {row.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-6">
              <button onClick={() => setCurrentStep(1)} className="btn-ghost">
                <ArrowLeft size={16} />
                Kembali
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="btn-primary"
              >
                {importing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Mengimport...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Konfirmasi Import ({parsedRows.length} baris)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {currentStep === 3 && result && (
          <div className="flex flex-col items-center gap-6 py-8">
            <CheckCircle size={48} className="text-success" />
            <div className="text-center">
              <p className="text-lg font-semibold text-text-primary dark:text-gray-100 mb-2">
                Import Selesai
              </p>
              <div className="flex items-center gap-6 mt-4">
                <div className="flex flex-col items-center">
                  <p className="text-2xl font-bold text-success">{result.success_rows}</p>
                  <p className="text-xs text-text-muted">Berhasil</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-2xl font-bold text-danger">{result.failed_rows}</p>
                  <p className="text-xs text-text-muted">Gagal</p>
                </div>
              </div>
            </div>

            {/* Error details */}
            {result.errors.length > 0 && (
              <div className="w-full max-w-md rounded-lg border border-danger/20 bg-danger/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-danger" />
                  <p className="text-xs font-semibold text-danger">Detail Error</p>
                </div>
                <ul className="space-y-1 max-h-[150px] overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <li key={i} className="text-xs text-text-secondary">
                      {err.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                setCurrentStep(0);
                setParsedRows([]);
                setResult(null);
              }}
              className="btn-outline"
            >
              Import Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
