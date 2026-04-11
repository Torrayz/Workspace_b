'use client';

import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { KPICard } from '@/components/features/dashboard/KPICard';
import { FilterBar } from '@/components/features/dashboard/FilterBar';
import { RevenueChart } from '@/components/features/dashboard/RevenueChart';
import { StatusChart } from '@/components/features/dashboard/StatusChart';
import { PerformanceChart } from '@/components/features/dashboard/PerformanceChart';
import { LaporanTable } from '@/components/features/dashboard/LaporanTable';
import { RealtimeMap } from '@/components/features/maps/RealtimeMap';
import { DownloadModal } from '@/components/features/reports/DownloadModal';
import { formatRupiah, formatPercentage, formatNumber } from '@/lib/formatters';
import { FileText, DollarSign, Target, Users } from 'lucide-react';
import { useDashboardData, useLaporanData } from '@/hooks/useDashboardData';

export default function AdminDashboardPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0]!;
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]!);
  
  // Dashboard overall data
  const { summary, dailyTrend, statusDistribution, performances, markers, loading, refresh: refreshDashboard } = useDashboardData(startDate, endDate);

  // Laporan table data
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { laporan, totalPages, loading: loadingTable, refresh: refreshTable } = useLaporanData(startDate, endDate, statusFilter, currentPage, 10);

  const [downloadOpen, setDownloadOpen] = useState(false);

  const handleRefresh = () => {
    refreshDashboard();
    refreshTable();
  };

  return (
    <PageContainer
      title="Dashboard"
      description="Overview performa tim field marketing"
    >
      {/* Filter Bar */}
      <div className="mb-section-gap">
        <FilterBar
          startDate={startDate}
          endDate={endDate}
          onDateChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
            setCurrentPage(1);
          }}
          onRefresh={handleRefresh}
          onDownload={() => setDownloadOpen(true)}
          loading={loading || loadingTable}
        />
      </div>

      {/* KPI Cards */}
      <div className="mb-section-gap grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="Total Laporan"
          value={summary ? formatNumber(summary.total_laporan) : '0'}
          change={summary?.trends?.laporan_change || 0}
          icon={FileText}
          iconColor="#2563EB"
          loading={loading}
        />
        <KPICard
          label="Total Nominal"
          value={summary ? formatRupiah(summary.total_nominal) : 'Rp 0'}
          change={summary?.trends?.nominal_change || 0}
          icon={DollarSign}
          iconColor="#16A34A"
          loading={loading}
        />
        <KPICard
          label="Completion Rate"
          value={summary ? formatPercentage(summary.completion_rate) : '0%'}
          change={summary?.trends?.completion_change || 0}
          icon={Target}
          iconColor="#D97706"
          loading={loading}
        />
        <KPICard
          label="User Aktif"
          value={summary ? formatNumber(summary.user_aktif) : '0'}
          change={summary?.trends?.user_aktif_change || 0}
          icon={Users}
          iconColor="#7C3AED"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="mb-section-gap grid grid-cols-1 gap-section-gap lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={dailyTrend || []} loading={loading} />
        </div>
        <div>
          <StatusChart data={statusDistribution || []} loading={loading} />
        </div>
      </div>

      {/* Performance Chart */}
      <div className="mb-section-gap">
        <PerformanceChart data={performances || []} loading={loading} />
      </div>

      {/* Realtime Map */}
      <div className="mb-section-gap">
        <RealtimeMap markers={markers || []} loading={loading} onRefresh={handleRefresh} />
      </div>

      {/* Laporan Table */}
      <div className="mb-section-gap">
        <LaporanTable
          data={laporan || []}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onStatusFilter={(status) => {
            setStatusFilter(status);
            setCurrentPage(1);
          }}
          activeStatusFilter={statusFilter}
          loading={loadingTable}
        />
      </div>

      {/* Download Modal - Logic integrasi TODO saat Export fitur */}
      <DownloadModal
        isOpen={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        onDownloadExcel={async () => {
          console.log('Downloading Excel with real data');
          setDownloadOpen(false);
        }}
        onDownloadPDF={async () => {
          console.log('Downloading PDF with real data');
          setDownloadOpen(false);
        }}
      />
    </PageContainer>
  );
}
