// ============================================================================
// Format Helpers — Currency, date, number Indonesia
// ============================================================================

/** Format angka ke Rupiah: 15000000 → "Rp 15.000.000" */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format tanggal: "2026-04-11" → "11 April 2026" */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Format tanggal pendek: "2026-04-11" → "11 Apr" */
export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

/** Format angka biasa dengan separator ribuan */
export function formatNumber(value: number): string {
  return value.toLocaleString('id-ID');
}
