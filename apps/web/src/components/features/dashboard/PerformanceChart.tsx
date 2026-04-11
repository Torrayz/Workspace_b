// ============================================================================
// PerformanceChart — Bar chart performa per user + tier coloring
// ============================================================================

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { formatRupiah } from '@/lib/formatters';

interface UserPerformanceItem {
  user_id: string;
  user_nama: string;
  total_laporan: number;
  total_nominal: number;
  completion_rate: number;
  score: number;
  tier: string;
}

interface PerformanceChartProps {
  data: UserPerformanceItem[];
  loading?: boolean;
}

const TIER_COLORS: Record<string, string> = {
  top: '#22C55E',
  on_track: '#3B82F6',
  needs_attention: '#F59E0B',
  underperforming: '#EF4444',
};

const TIER_LABELS: Record<string, string> = {
  top: 'Top Performer',
  on_track: 'On Track',
  needs_attention: 'Perlu Perhatian',
  underperforming: 'Di Bawah Target',
};

export function PerformanceChart({ data, loading }: PerformanceChartProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-5 w-48 mb-4" />
        <div className="skeleton h-[350px] w-full rounded-lg" />
      </div>
    );
  }

  // Sort by total_nominal descending, limit to top 15
  const chartData = [...data]
    .sort((a, b) => b.total_nominal - a.total_nominal)
    .slice(0, 15);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-card-title text-text-primary dark:text-gray-100">
          Performa Per User
        </h3>
        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(TIER_LABELS).map(([tier, label]) => (
            <div key={tier} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: TIER_COLORS[tier] }}
              />
              <span className="text-[10px] text-text-secondary dark:text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="user_nama"
              tick={{ fontSize: 10, fill: '#64748B' }}
              angle={-45}
              textAnchor="end"
              height={80}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              tickFormatter={(val: number) =>
                val >= 1_000_000 ? `${(val / 1_000_000).toFixed(0)}Jt` : `${val}`
              }
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <Tooltip
              formatter={(value: any) => [formatRupiah(Number(value) || 0), 'Total Nominal']}
              labelFormatter={(label: any) => `User: ${label}`}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="total_nominal" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.user_id}
                  fill={TIER_COLORS[entry.tier] || '#94A3B8'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ranking Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nama</th>
              <th>Total Laporan</th>
              <th>Total Nominal</th>
              <th>Completion Rate</th>
              <th>Tier</th>
            </tr>
          </thead>
          <tbody>
            {data
              .sort((a, b) => b.score - a.score)
              .map((user, index) => (
                <tr key={user.user_id}>
                  <td className="font-semibold text-text-muted">{index + 1}</td>
                  <td className="font-medium">{user.user_nama}</td>
                  <td>{user.total_laporan}</td>
                  <td className="font-medium">{formatRupiah(user.total_nominal)}</td>
                  <td>{user.completion_rate.toFixed(1)}%</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        color: TIER_COLORS[user.tier],
                        backgroundColor: `${TIER_COLORS[user.tier]}15`,
                      }}
                    >
                      {TIER_LABELS[user.tier] || user.tier}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
