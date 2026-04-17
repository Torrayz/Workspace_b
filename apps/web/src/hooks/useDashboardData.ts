import { useState, useEffect } from 'react';
import { 
  getDashboardSummary, 
  getDailyTrend, 
  getStatusDistribution, 
  getUserPerformance, 
  getLaporanList, 
  getMapMarkers,
  getPersonalDashboard,
  getPersonalLaporan
} from '@/app/dashboard/actions';

export function useDashboardData(startDate: string, endDate: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summary,
        dailyTrend,
        statusDist,
        performances,
        markers
      ] = await Promise.all([
        getDashboardSummary(startDate, endDate),
        getDailyTrend(startDate, endDate),
        getStatusDistribution(startDate, endDate),
        getUserPerformance(),
        getMapMarkers()
      ]);

      setData({
        summary: summary || {
          total_laporan: 0,
          total_nominal: 0,
          completion_rate: 0,
          user_aktif: 0,
          trends: { laporan_change: 0, nominal_change: 0, completion_change: 0, user_aktif_change: 0 }
        },
        dailyTrend,
        statusDistribution: statusDist,
        performances,
        markers
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data', err);
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  return {
    ...data,
    loading,
    error,
    refresh: fetchData
  };
}

export function useLaporanData(startDate: string, endDate: string, status: string | null, page: number, limit = 10, userId: string | null = null) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const res = await getLaporanList({ startDate, endDate, status, userId, limit, offset });
      setData(res.data);
      setTotalCount(res.count);
    } catch (err) {
      console.error('Error fetching laporan data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, status, page, limit, userId]);

  return {
    laporan: data,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    loading,
    refresh: fetchData
  };
}

export function usePersonalDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getPersonalDashboard();
      setData(res);
    } catch (err) {
      console.error('Error fetching personal dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    ...data,
    loading,
    refresh: fetchData
  };
}

export function usePersonalLaporan(page: number, limit = 10) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const res = await getPersonalLaporan({ limit, offset });
      setData(res.data);
      setTotalCount(res.count);
    } catch (err) {
      console.error('Error fetching personal laporan data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit]);

  return {
    laporan: data,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    loading,
    refresh: fetchData
  };
}
