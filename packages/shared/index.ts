// ============================================================================
// @field-marketing/shared — Barrel Export
// ============================================================================

// ─── Types ─────────────────────────────────────────────────────────────────────

export type {
  UserRole,
  User,
  AuthUser,
  JWTPayload,
  UserListItem,
  CreateUserInput,
  UpdateUserInput,
  ExcelImportRow,
  ExcelImportResult,
  ExcelImportLog,
} from './types/user.types';

export type {
  RencanaStatus,
  Rencana,
  RencanaWithUser,
  CreateRencanaInput,
  RencanaDropdownItem,
} from './types/rencana.types';

export type {
  LaporanStatus,
  Laporan,
  LaporanWithDetails,
  CreateLaporanInput,
  UserLocation,
  MapMarkerData,
  AuditLog,
} from './types/laporan.types';

export type {
  PerformanceTier,
  DashboardSummary,
  DailyTrend,
  StatusDistribution,
  UserPerformance,
  AnomalyRecord,
  DashboardFilter,
  TrendLinePoint,
  PersonalDashboard,
  PaginationMeta,
  PaginatedResponse,
} from './types/dashboard.types';

// ─── Validations ───────────────────────────────────────────────────────────────

export {
  createRencanaSchema,
  type CreateRencanaSchema,
} from './validations/rencana.schema';

// TODO: Implement laporan.schema.ts untuk validasi laporan submission
// export {
//   createLaporanSchema,
//   type CreateLaporanSchema,
// } from './validations/laporan.schema';

export {
  createUserSchema,
  type CreateUserSchema,
  updateUserRoleSchema,
  toggleUserStatusSchema,
  loginSchema,
  type LoginSchema,
  excelImportRowSchema,
  type ExcelImportRowSchema,
} from './validations/user.schema';

// ─── Constants ─────────────────────────────────────────────────────────────────

export {
  GPS_BOUNDS_INDONESIA,
  GPS_TRACKING_INTERVAL_MS,
  GPS_BACKGROUND_TIMEOUT_MS,
  IMAGE_COMPRESSION_MOBILE,
  IMAGE_COMPRESSION_SERVER,
  MAX_FILE_SIZE_BYTES,
  FILE_MAGIC_BYTES,
  DEFAULT_PAGE_SIZE,
  RATE_LIMITS,
  LAPORAN_STATUS_CONFIG,
  RENCANA_STATUS_CONFIG,
  PERFORMANCE_TIER_CONFIG,
  COLORS,
  SIDEBAR,
  HEADER_HEIGHT,
  AUDIT_ACTIONS,
  STORAGE_BUCKETS,
  ANOMALY_Z_SCORE_THRESHOLD,
  PERFORMANCE_SCORE_WEIGHTS,
} from './constants';
