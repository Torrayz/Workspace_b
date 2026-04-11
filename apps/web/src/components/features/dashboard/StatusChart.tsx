// ============================================================================
// StatusChart — Donut chart distribusi status laporan
// ============================================================================

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';


interface StatusDistributionItem {
  status: string;
  count: number;
  percentage: number;
}

interface StatusChartProps {
  data: StatusDistributionItem[];
  loading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  lunas: '#16A34A',
  sebagian: '#2563EB',
  gagal: '#DC2626',
  pending: '#D97706',
};

const STATUS_LABELS: Record<string, string> = {
  lunas: 'Lunas',
  sebagian: 'Sebagian',
  gagal: 'Gagal',
  pending: 'Pending',
};

export function StatusChart({ data, loading }: StatusChartProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-5 w-40 mb-4" />
        <div className="skeleton h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    name: STATUS_LABELS[item.status] || item.status,
    fill: STATUS_COLORS[item.status] || '#94A3B8',
  }));

  return (
    <div className="card">
      <h3 className="text-card-title text-text-primary dark:text-gray-100 mb-4">
        Distribusi Status Laporan
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
              dataKey="count"
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [`${value} laporan`, name]}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
              formatter={(value: any) => (
                <span className="text-text-secondary dark:text-gray-400">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
