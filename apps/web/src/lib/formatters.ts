// ============================================================================
// Utility: Format helpers — currency, date, percentage
// ============================================================================

/**
 * Format angka ke format Rupiah Indonesia.
 * @example formatRupiah(15000000) → "Rp 15.000.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format angka nominal singkat untuk card KPI.
 * @example formatNominalShort(15000000) → "15 Jt"
 * @example formatNominalShort(1500000000) → "1,5 M"
 */
export function formatNominalShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Rb`;
  }
  return amount.toLocaleString('id-ID');
}

/**
 * Format tanggal ke format Indonesia.
 * @example formatDate("2026-04-11") → "11 April 2026"
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format tanggal pendek.
 * @example formatDateShort("2026-04-11") → "11 Apr 2026"
 */
export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format tanggal + waktu.
 * @example formatDateTime("2026-04-11T13:30:00Z") → "11 Apr 2026, 20:30"
 */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format persentase.
 * @example formatPercentage(85.5) → "85,5%"
 */
export function formatPercentage(value: number): string {
  return `${value.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;
}

/**
 * Format angka biasa dengan separator ribuan.
 * @example formatNumber(15000) → "15.000"
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('id-ID');
}
