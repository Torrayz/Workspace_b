// ============================================================================
// FilterBar — DateRangePicker untuk kontrol filter dashboard
// ============================================================================

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Download, RefreshCw } from 'lucide-react';

interface FilterBarProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  onRefresh?: () => void;
  onDownload?: () => void;
  loading?: boolean;
}

/** Shortcut label untuk date range */
const DATE_PRESETS = [
  { label: 'Hari Ini', days: 0 },
  { label: '7 Hari', days: 7 },
  { label: '30 Hari', days: 30 },
  { label: '90 Hari', days: 90 },
] as const;

function getDateRange(daysBack: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  return {
    start: start.toISOString().split('T')[0]!,
    end: end.toISOString().split('T')[0]!,
  };
}

export function FilterBar({
  startDate,
  endDate,
  onDateChange,
  onRefresh,
  onDownload,
  loading,
}: FilterBarProps) {
  const [activePreset, setActivePreset] = useState<number>(7);

  const handlePresetClick = (days: number) => {
    setActivePreset(days);
    const { start, end } = getDateRange(days);
    onDateChange(start, end);
  };

  return (
    <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {/* Date presets */}
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.days}
            onClick={() => handlePresetClick(preset.days)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200',
              activePreset === preset.days
                ? 'bg-accent text-white shadow-sm'
                : 'bg-surface-alt text-text-secondary hover:bg-border hover:text-text-primary dark:bg-dark-surface-alt dark:text-gray-400 dark:hover:bg-dark-border',
            )}
          >
            {preset.label}
          </button>
        ))}

        {/* Separator */}
        <div className="mx-1 h-6 w-px bg-border dark:bg-dark-border" />

        {/* Custom date inputs */}
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-text-muted" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setActivePreset(-1);
              onDateChange(e.target.value, endDate);
            }}
            className="input !w-auto !py-1 !text-xs"
          />
          <span className="text-xs text-text-muted">—</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setActivePreset(-1);
              onDateChange(startDate, e.target.value);
            }}
            className="input !w-auto !py-1 !text-xs"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-ghost !px-2 !py-1.5"
            title="Refresh data"
          >
            <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
          </button>
        )}
        {onDownload && (
          <button onClick={onDownload} className="btn-primary !py-1.5 !text-xs">
            <Download size={14} />
            Download Report
          </button>
        )}
      </div>
    </div>
  );
}
