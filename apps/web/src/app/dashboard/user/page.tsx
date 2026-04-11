'use client';

import { PageContainer } from '@/components/layout/PageContainer';
import { KPICard } from '@/components/features/dashboard/KPICard';
import { RevenueChart } from '@/components/features/dashboard/RevenueChart';
import { LaporanTable } from '@/components/features/dashboard/LaporanTable';
import { formatRupiah, formatNumber } from '@/lib/formatters';
import { FileText, DollarSign, ListChecks } from 'lucide-react';
import { useState } from 'react';
import { usePersonalDashboard, usePersonalLaporan } from '@/hooks/useDashboardData';

export default function UserDashboardPage() {
  const [page, setPage] = useState(1);
  const { total_laporan_bulan_ini, total_nominal_bulan_ini, rencana_aktif, daily_trend, loading } = usePersonalDashboard();
  const { laporan, totalPages, loading: loadingTable } = usePersonalLaporan(page, 10);

  return (
    <PageContainer
      title="Dashboard Saya"
      description="Ringkasan performa pribadi bulan ini"
    >
      {/* KPI Cards */}
      <div className="mb-section-gap grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard
          label="Total Laporan Bulan Ini"
          value={loading ? '0' : formatNumber(total_laporan_bulan_ini || 0)}
          change={0} // To be implemented vs previous month
          icon={FileText}
          iconColor="#2563EB"
          loading={loading}
        />
        <KPICard
          label="Total Nominal Bulan Ini"
          value={loading ? 'Rp 0' : formatRupiah(total_nominal_bulan_ini || 0)}
          change={0}
          icon={DollarSign}
          iconColor="#16A34A"
          loading={loading}
        />
        <KPICard
          label="Rencana Aktif"
          value={loading ? '0' : formatNumber(rencana_aktif || 0)}
          change={0}
          icon={ListChecks}
          iconColor="#D97706"
          loading={loading}
        />
      </div>

      {/* Chart */}
      <div className="mb-section-gap">
        <RevenueChart data={daily_trend || []} loading={loading} />
      </div>

      {/* History Table */}
      <LaporanTable
        data={laporan || []}
        totalPages={totalPages}
        currentPage={page}
        onPageChange={setPage}
        loading={loadingTable}
      />
    </PageContainer>
  );
}
