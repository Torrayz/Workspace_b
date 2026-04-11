// ============================================================================
// KPICard — Kartu KPI dengan angka besar + tren
// ============================================================================

'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  /** Label di bawah angka utama (contoh: "Total Laporan Hari Ini") */
  label: string;
  /** Angka utama yang ditampilkan (sudah di-format) */
  value: string;
  /** Persentase perubahan vs periode sebelumnya */
  change: number;
  /** Ikon di pojok kanan atas */
  icon: React.ElementType;
  /** Warna ikon */
  iconColor?: string;
  /** Loading state */
  loading?: boolean;
}

export function KPICard({ label, value, change, icon: Icon, iconColor, loading }: KPICardProps) {
  if (loading) {
    return (
      <div className="kpi-card">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-9 w-32" />
            <div className="skeleton h-4 w-20" />
          </div>
          <div className="skeleton h-10 w-10 rounded-lg" />
        </div>
      </div>
    );
  }

  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <div className="kpi-card group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-caption text-text-secondary dark:text-gray-400">{label}</p>
          <p className="text-[2rem] font-bold leading-tight text-text-primary dark:text-gray-100">
            {value}
          </p>

          {/* Tren indicator */}
          <div className="flex items-center gap-1.5 pt-1">
            {isNeutral ? (
              <Minus size={14} className="text-text-muted" />
            ) : isPositive ? (
              <TrendingUp size={14} className="text-success" />
            ) : (
              <TrendingDown size={14} className="text-danger" />
            )}
            <span
              className={cn(
                'text-xs font-semibold',
                isNeutral && 'text-text-muted',
                isPositive && 'text-success',
                !isPositive && !isNeutral && 'text-danger',
              )}
            >
              {isPositive && '+'}
              {change.toFixed(1)}%
            </span>
            <span className="text-xs text-text-muted dark:text-gray-500">vs sebelumnya</span>
          </div>
        </div>

        {/* Icon */}
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl',
            'transition-transform duration-200 group-hover:scale-110',
          )}
          style={{ backgroundColor: `${iconColor || '#2563EB'}15` }}
        >
          <Icon size={22} style={{ color: iconColor || '#2563EB' }} />
        </div>
      </div>
    </div>
  );
}
