// ============================================================================
// Design Tokens — Centralized colors, spacing, typography, shadows
// Redesign v2: Modern dark navy + clean white card styling
// ============================================================================

export const Colors = {
  primary: '#1E3A5F',
  primaryDark: '#152C4A',
  primaryLight: '#254B78',
  accent: '#2563EB',
  accentLight: '#3B82F6',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F0F4F8',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  success: '#16A34A',
  successLight: '#DCFCE7',
  successSoft: '#F0FDF4',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  warningSoft: '#FFFBEB',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  dangerSoft: '#FEF2F2',
  info: '#2563EB',
  infoLight: '#DBEAFE',
  infoSoft: '#EFF6FF',
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
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 999,
} as const;

/** Reusable shadow presets */
export const Shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHover: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  fab: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

/** Header rounded bottom corners preset */
export const HeaderStyle = {
  borderBottomLeftRadius: BorderRadius['2xl'],
  borderBottomRightRadius: BorderRadius['2xl'],
} as const;

/** Status laporan → color, label, icon, bg, softBg */
export const StatusConfig = {
  lunas: {
    color: Colors.success,
    bg: Colors.successLight,
    softBg: Colors.successSoft,
    label: 'Lunas',
    icon: '✓',
    borderColor: Colors.success,
  },
  sebagian: {
    color: Colors.info,
    bg: Colors.infoLight,
    softBg: Colors.infoSoft,
    label: 'Sebagian',
    icon: '≈',
    borderColor: Colors.info,
  },
  gagal: {
    color: Colors.danger,
    bg: Colors.dangerLight,
    softBg: Colors.dangerSoft,
    label: 'Gagal',
    icon: '✗',
    borderColor: Colors.danger,
  },
  pending: {
    color: Colors.warning,
    bg: Colors.warningLight,
    softBg: Colors.warningSoft,
    label: 'Pending',
    icon: '⏳',
    borderColor: Colors.warning,
  },
} as const;
