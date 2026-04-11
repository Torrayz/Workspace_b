// ============================================================================
// Excel Upload Page — Bulk import user (Superadmin Only)
// ============================================================================

'use client';

import { PageContainer } from '@/components/layout/PageContainer';
import { ExcelUpload } from '@/components/features/users/ExcelUpload';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';

export default function ExcelUploadPage() {
  const handleImport = async (
    rows: Array<{ nomor_induk: string; nama: string; nomor_rekening: string; role: string }>,
    filename: string,
  ) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.functions.invoke('bulk-import-users', {
        body: { users: rows, filename },
      });

      if (error) {
        throw new Error(error.message || 'Gagal memanggil fungsi import');
      }

      return {
        success_rows: data.success_count || 0,
        failed_rows: data.failed_count || 0,
        errors: data.errors || [],
      };
    } catch (err: any) {
      console.error('Import error:', err);
      return {
        success_rows: 0,
        failed_rows: rows.length,
        errors: [{ row: 0, reason: err.message || 'Terjadi kesalahan sistem' }],
      };
    }
  };

  return (
    <PageContainer
      title="Import User via Excel"
      description="Upload file Excel untuk menambahkan user secara bulk"
    >
      <ExcelUpload onImport={handleImport} />
    </PageContainer>
  );
}
