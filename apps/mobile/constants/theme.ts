// ============================================================================
// Design Tokens — Centralized colors, spacing, typography
// ============================================================================

export const Colors = {
  primary: '#1E3A5F',
  accent: '#2563EB',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

/** Status laporan → color, label */
export const StatusConfig = {
  lunas: { color: Colors.success, bg: Colors.successLight, label: 'Lunas' },
  sebagian: { color: Colors.info, bg: Colors.infoLight, label: 'Sebagian' },
  gagal: { color: Colors.danger, bg: Colors.dangerLight, label: 'Gagal' },
  pending: { color: Colors.warning, bg: Colors.warningLight, label: 'Pending' },
} as const;
