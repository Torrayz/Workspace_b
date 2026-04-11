'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function getDashboardSummary(startDate: string, endDate: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('get_dashboard_summary', {
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw error;
  return data;
}

export async function getDailyTrend(startDate: string, endDate: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('get_daily_trend', {
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw error;
  return data || [];
}

export async function getStatusDistribution(startDate: string, endDate: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('get_status_distribution', {
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw error;
  return data || [];
}

export async function getUserPerformance() {
  const supabase = await createSupabaseServerClient();
  // calculate_user_scores provides the scores and tiers needed for PerformanceChart
  const { data, error } = await supabase.rpc('calculate_user_scores');
  if (error) throw error;
  return data || [];
}

export async function getLaporanList(options: { 
  startDate: string; 
  endDate: string; 
  status?: string | null;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createSupabaseServerClient();
  
  let query = supabase
    .from('laporan')
    .select(`
      id,
      jumlah_tagihan,
      status,
      keterangan,
      foto_urls,
      created_at,
      rencana:rencana_id (target_nominal),
      users:user_id (nama)
    `, { count: 'exact' })
    .gte('created_at', `${options.startDate}T00:00:00Z`)
    .lte('created_at', `${options.endDate}T23:59:59Z`)
    .order('created_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.limit) {
    query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  // Format data untuk tabel
  return {
    data: (data || []).map((row: any) => ({
      id: row.id,
      user_nama: row.users?.nama || 'Unknown',
      tanggal_penagihan: row.created_at,
      jumlah_tagihan: row.jumlah_tagihan,
      rencana_target_nominal: row.rencana?.target_nominal || 0,
      status: row.status,
      keterangan: row.keterangan,
      foto_urls: row.foto_urls || [],
      is_anomaly: false, // In a real app we'd merge with anomalies logic
      created_at: row.created_at,
    })),
    count: count || 0,
  };
}

export async function getMapMarkers() {
  const supabase = await createSupabaseServerClient();
  // Fetch latest location per user from user_locations
  const { data: locations, error } = await supabase
    .from('user_locations')
    .select('*, users(nama)')
    .order('updated_at', { ascending: false });
    
  if (error) throw error;

  // We need to deduplicate by user_id and maybe check if they reported today
  const latestLocations = new Map();
  for (const loc of locations || []) {
    if (!latestLocations.has(loc.user_id)) {
      latestLocations.set(loc.user_id, {
        user_id: loc.user_id,
        user_nama: loc.users?.nama || 'Unknown',
        lat: loc.latitude,
        lng: loc.longitude,
        updated_at: loc.updated_at,
        has_reported_today: false // Simplified for now
      });
    }
  }

  return Array.from(latestLocations.values());
}

export async function getPersonalDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('get_personal_dashboard', {
    p_user_id: sessionData.session.user.id
  });
  if (error) throw error;
  return data;
}

export async function getPersonalLaporan(options: {
  limit?: number;
  offset?: number;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) throw new Error('Not authenticated');

  let query = supabase
    .from('laporan')
    .select(`
      id,
      jumlah_tagihan,
      status,
      keterangan,
      foto_urls,
      created_at,
      rencana:rencana_id (target_nominal),
      users:user_id (nama)
    `, { count: 'exact' })
    .eq('user_id', sessionData.session.user.id)
    .order('created_at', { ascending: false });

  if (options.limit) {
    query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data || []).map((row: any) => ({
      id: row.id,
      user_nama: 'Saya',
      tanggal_penagihan: row.created_at,
      jumlah_tagihan: row.jumlah_tagihan,
      rencana_target_nominal: row.rencana?.target_nominal || 0,
      status: row.status,
      keterangan: row.keterangan,
      foto_urls: row.foto_urls || [],
      is_anomaly: false,
      created_at: row.created_at,
    })),
    count: count || 0,
  };
}

export async function getUsers() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function updateUserRole(userId: string, newRole: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);
  
  if (error) throw error;
  return true;
}

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('users')
    .update({ is_active: !currentStatus })
    .eq('id', userId);
    
  if (error) throw error;
  return true;
}
