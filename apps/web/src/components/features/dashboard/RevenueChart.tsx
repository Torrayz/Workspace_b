// ============================================================================
// RevenueChart — Line chart tren nominal harian + trend line prediktif
// ============================================================================

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { formatRupiah, formatDateShort } from '@/lib/formatters';

interface DailyTrendItem {
  tanggal: string;
  total_nominal: number;
  total_laporan: number;
}

interface TrendLineItem {
  tanggal: string;
  predicted_nominal: number;
}

interface RevenueChartProps {
  data: DailyTrendItem[];
  trendLine?: TrendLineItem[];
  loading?: boolean;
}

/** Custom tooltip untuk chart */
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;

  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3 shadow-xl dark:bg-dark-surface dark:border-dark-border">
      <p className="text-xs font-semibold text-text-primary dark:text-gray-100 mb-2">
        {formatDateShort(label)}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-xs text-text-secondary dark:text-gray-400">
          {entry.dataKey === 'total_nominal' && `Nominal: ${formatRupiah(entry.value)}`}
          {entry.dataKey === 'predicted_nominal' && `Prediksi: ${formatRupiah(entry.value)}`}
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data, trendLine, loading }: RevenueChartProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-5 w-40 mb-4" />
        <div className="skeleton h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  // Gabungkan data aktual dengan trend line
  const combinedData: (DailyTrendItem & { predicted_nominal?: number })[] = [...data];
  if (trendLine) {
    for (const point of trendLine) {
      const existing = combinedData.find((d) => d.tanggal === point.tanggal);
      if (existing) {
        existing.predicted_nominal = point.predicted_nominal;
      } else {
        combinedData.push({
          tanggal: point.tanggal,
          total_nominal: 0,
          total_laporan: 0,
          predicted_nominal: point.predicted_nominal,
        });
      }
    }
  }

  return (
    <div className="card">
      <h3 className="text-card-title text-text-primary dark:text-gray-100 mb-4">
        Tren Nominal Harian
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="tanggal"
              tickFormatter={(val: string) => {
                const date = new Date(val);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              tickFormatter={(val: number) =>
                val >= 1_000_000 ? `${(val / 1_000_000).toFixed(0)}Jt` : `${val}`
              }
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />
            {/* Garis aktual */}
            <Line
              type="monotone"
              dataKey="total_nominal"
              stroke="#2563EB"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#2563EB' }}
              activeDot={{ r: 5, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
              name="Nominal Aktual"
            />
            {/* Garis prediksi (putus-putus) */}
            {trendLine && (
              <Line
                type="monotone"
                dataKey="predicted_nominal"
                stroke="#94A3B8"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                name="Prediksi 7 Hari"
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
