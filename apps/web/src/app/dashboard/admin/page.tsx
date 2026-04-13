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
import { getExportData } from '@/app/dashboard/actions';

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

  const handleDownloadExcel = async () => {
    try {
      const exportData = await getExportData(startDate, endDate);
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();

      // Sheet 1: Summary
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Metrik', key: 'metrik', width: 30 },
        { header: 'Nilai', key: 'nilai', width: 25 },
      ];
      summarySheet.addRow({ metrik: 'Periode', nilai: `${exportData.summary.startDate} s/d ${exportData.summary.endDate}` });
      summarySheet.addRow({ metrik: 'Total Laporan', nilai: exportData.summary.totalLaporan });
      summarySheet.addRow({ metrik: 'Total Nominal', nilai: formatRupiah(exportData.summary.totalNominal) });
      Object.entries(exportData.summary.statusCounts).forEach(([status, count]) => {
        summarySheet.addRow({ metrik: `Status: ${status}`, nilai: count });
      });
      // Style header
      summarySheet.getRow(1).font = { bold: true };

      // Sheet 2: Detail Laporan
      const detailSheet = workbook.addWorksheet('Detail Laporan');
      detailSheet.columns = [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Nama User', key: 'user_nama', width: 25 },
        { header: 'Tanggal', key: 'tanggal', width: 15 },
        { header: 'Jumlah Tagihan', key: 'jumlah_tagihan', width: 20 },
        { header: 'Target Nominal', key: 'target_nominal', width: 20 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Keterangan', key: 'keterangan', width: 30 },
      ];
      exportData.laporan.forEach((row, i) => {
        detailSheet.addRow({ no: i + 1, ...row });
      });
      detailSheet.getRow(1).font = { bold: true };

      // Generate & download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_${startDate}_${endDate}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadOpen(false);
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Gagal mengexport Excel. Silakan coba lagi.');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const exportData = await getExportData(startDate, endDate);
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF('landscape', 'mm', 'a4');

      // Title
      doc.setFontSize(18);
      doc.text('Laporan Field Marketing', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Periode: ${exportData.summary.startDate} s/d ${exportData.summary.endDate}`, 14, 28);
      doc.text(`Dibuat: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 34);

      // Summary box
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Ringkasan', 14, 46);
      doc.setFontSize(10);
      doc.text(`Total Laporan: ${exportData.summary.totalLaporan}`, 14, 54);
      doc.text(`Total Nominal: ${formatRupiah(exportData.summary.totalNominal)}`, 14, 60);
      let y = 66;
      Object.entries(exportData.summary.statusCounts).forEach(([status, count]) => {
        doc.text(`${status}: ${count}`, 14, y);
        y += 6;
      });

      // Table
      y += 6;
      doc.setFontSize(12);
      doc.text('Detail Laporan', 14, y);
      y += 8;

      // Table headers
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const headers = ['No', 'Nama', 'Tanggal', 'Tagihan', 'Target', 'Status', 'Keterangan'];
      const colWidths = [10, 45, 25, 35, 35, 25, 90];
      let x = 14;
      headers.forEach((h, i) => {
        doc.text(h, x, y);
        x += colWidths[i]!;
      });
      y += 2;
      doc.setDrawColor(200);
      doc.line(14, y, 280, y);
      y += 5;

      // Table rows
      doc.setFont('helvetica', 'normal');
      exportData.laporan.forEach((row, i) => {
        if (y > 190) {
          doc.addPage();
          y = 20;
        }
        x = 14;
        const values = [
          String(i + 1),
          row.user_nama.substring(0, 20),
          row.tanggal,
          formatRupiah(row.jumlah_tagihan),
          formatRupiah(row.target_nominal),
          row.status,
          (row.keterangan || '-').substring(0, 40),
        ];
        values.forEach((v, j) => {
          doc.text(v, x, y);
          x += colWidths[j]!;
        });
        y += 6;
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Halaman ${i} dari ${pageCount}`, 260, 200);
      }

      doc.save(`Laporan_${startDate}_${endDate}.pdf`);
      setDownloadOpen(false);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Gagal mengexport PDF. Silakan coba lagi.');
    }
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

      {/* Download Modal — with real export handlers */}
      <DownloadModal
        isOpen={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        onDownloadExcel={handleDownloadExcel}
        onDownloadPDF={handleDownloadPDF}
      />
    </PageContainer>
  );
}
