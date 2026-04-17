'use server';

import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

// ── Helper: Ambil user yang sedang login dari custom cookie ─────────────────
async function getAuthUser(): Promise<{ id: string; role: string; nama: string; nomor_induk: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('auth_user')?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ── Admin Dashboard Functions ───────────────────────────────────────────────

export async function getDashboardSummary(startDate: string, endDate: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('get_dashboard_summary', {
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw error;
  return data;
}

export async function getDailyTrend(startDate: string, endDate: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('get_daily_trend', {
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw error;
  return data || [];
}

export async function getStatusDistribution(startDate: string, endDate: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('get_status_distribution', {
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw error;
  return data || [];
}

export async function getUserPerformance() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('calculate_user_scores');
  if (error) throw error;
  return data || [];
}

export async function getLaporanList(options: {
  startDate: string;
  endDate: string;
  status?: string | null;
  userId?: string | null;
  limit?: number;
  offset?: number;
}): Promise<{ data: any[]; count: number }> {
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from('laporan')
    .select(`
      id,
      jumlah_tagihan,
      tanggal_penagihan,
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

  if (options.userId) {
    query = query.eq('user_id', options.userId);
  }

  if (options.limit) {
    query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data || []).map((row: any) => ({
      id: row.id,
      user_nama: row.users?.nama || 'Unknown',
      tanggal_penagihan: row.tanggal_penagihan || row.created_at,
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

export async function getMapMarkers() {
  const supabase = createSupabaseAdminClient();
  // Kolom yang benar sesuai schema: lat, lng, updated_at
  const { data: locations, error } = await supabase
    .from('user_locations')
    .select('user_id, lat, lng, updated_at, users(nama)')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  // Deduplicate by user_id — ambil yang terbaru
  const latestLocations = new Map<string, any>();
  for (const loc of locations || []) {
    if (!latestLocations.has(loc.user_id)) {
      latestLocations.set(loc.user_id, {
        user_id: loc.user_id,
        user_nama: (loc.users as any)?.nama || 'Unknown',
        lat: loc.lat,
        lng: loc.lng,
        updated_at: loc.updated_at,
        has_reported_today: false,
      });
    }
  }

  return Array.from(latestLocations.values());
}

// ── Personal (User) Dashboard Functions ────────────────────────────────────

export async function getPersonalDashboard(): Promise<{
  total_laporan_bulan_ini: number;
  total_nominal_bulan_ini: number;
  rencana_aktif: number;
  daily_trend: Array<{ tanggal: string; jumlah: number; nominal: number }>;
}> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Tidak terautentikasi');

  const supabase = createSupabaseAdminClient();

  // Awal dan akhir bulan ini
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  // Total laporan & nominal bulan ini
  const { data: laporanData, error: laporanError } = await supabase
    .from('laporan')
    .select('id, jumlah_tagihan, created_at')
    .eq('user_id', authUser.id)
    .gte('created_at', startOfMonth)
    .lte('created_at', endOfMonth);

  if (laporanError) throw laporanError;

  const laporan = laporanData || [];
  const total_laporan_bulan_ini = laporan.length;
  const total_nominal_bulan_ini = laporan.reduce((sum: number, l: any) => sum + Number(l.jumlah_tagihan || 0), 0);

  // Rencana aktif
  const { count: rencanaCount, error: rencanaError } = await supabase
    .from('rencana')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', authUser.id)
    .eq('status', 'aktif');

  if (rencanaError) throw rencanaError;

  // Daily trend — group by date
  const trendMap = new Map<string, { jumlah: number; nominal: number }>();
  for (const l of laporan) {
    const tanggal = (l.created_at as string).split('T')[0]!;
    const existing = trendMap.get(tanggal) || { jumlah: 0, nominal: 0 };
    existing.jumlah += 1;
    existing.nominal += Number(l.jumlah_tagihan || 0);
    trendMap.set(tanggal, existing);
  }

  const daily_trend = Array.from(trendMap.entries())
    .map(([tanggal, val]) => ({ tanggal, ...val }))
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  return {
    total_laporan_bulan_ini,
    total_nominal_bulan_ini,
    rencana_aktif: rencanaCount || 0,
    daily_trend,
  };
}

export async function getPersonalLaporan(_options: {
  limit?: number;
  offset?: number;
}): Promise<{ data: any[]; count: number }> {
  const authUser = await getAuthUser();
  if (!authUser) throw new Error('Tidak terautentikasi');

  const supabase = createSupabaseAdminClient();
  const limit = _options.limit || 10;
  const offset = _options.offset || 0;

  const { data, error, count } = await supabase
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
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

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
      is_anomaly: false,
      created_at: row.created_at,
    })),
    count: count || 0,
  };
}

// ── User Management Functions ──────────────────────────────────────────────

export async function getUsers() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateUserRole(userId: string, newRole: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) throw error;
  return true;
}

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('users')
    .update({ is_active: !currentStatus })
    .eq('id', userId);

  if (error) throw error;
  return true;
}

export async function createUser(data: {
  nomor_induk: string;
  nama: string;
  nomor_rekening: string;
  role: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('users')
    .insert({
      nomor_induk: data.nomor_induk.trim(),
      nama: data.nama.trim(),
      nomor_rekening: data.nomor_rekening.trim(),
      role: data.role,
    });

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Nomor induk "${data.nomor_induk}" sudah terdaftar`);
    }
    throw error;
  }
  return true;
}

export async function getExportData(startDate: string, endDate: string) {
  const supabase = createSupabaseAdminClient();

  // Fetch all laporan for date range (no pagination)
  const { data: laporan, error: laporanError } = await supabase
    .from('laporan')
    .select(`
      id,
      jumlah_tagihan,
      status,
      keterangan,
      created_at,
      rencana:rencana_id (target_nominal),
      users:user_id (nama)
    `)
    .gte('created_at', `${startDate}T00:00:00Z`)
    .lte('created_at', `${endDate}T23:59:59Z`)
    .order('created_at', { ascending: false });

  if (laporanError) throw laporanError;

  // Summary stats
  const totalLaporan = (laporan || []).length;
  const totalNominal = (laporan || []).reduce((sum: number, l: any) => sum + Number(l.jumlah_tagihan || 0), 0);
  const statusCounts: Record<string, number> = {};
  for (const l of laporan || []) {
    statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
  }

  return {
    laporan: (laporan || []).map((row: any) => ({
      user_nama: row.users?.nama || 'Unknown',
      tanggal: new Date(row.created_at).toLocaleDateString('id-ID'),
      jumlah_tagihan: Number(row.jumlah_tagihan || 0),
      target_nominal: Number(row.rencana?.target_nominal || 0),
      status: row.status,
      keterangan: row.keterangan || '-',
    })),
    summary: {
      totalLaporan,
      totalNominal,
      statusCounts,
      startDate,
      endDate,
    },
  };
}

// ── Delete Request Management ───────────────────────────────────────────────

export async function getDeleteRequests() {
  const authUser = await getAuthUser();
  if (!authUser || !['admin', 'superadmin'].includes(authUser.role)) {
    throw new Error('Unauthorized');
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('rencana')
    .select(`
      id, user_id, target_nominal, deskripsi, tanggal_target, status,
      delete_status, delete_reason, delete_requested_at,
      delete_admin_note, delete_reviewed_by, created_at,
      users!rencana_user_id_fkey ( nama, nomor_induk )
    `)
    .eq('delete_status', 'pending')
    .order('delete_requested_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    user_nama: r.users?.nama || 'Unknown',
    user_nomor_induk: r.users?.nomor_induk || '-',
    target_nominal: r.target_nominal,
    deskripsi: r.deskripsi,
    tanggal_target: r.tanggal_target,
    status: r.status,
    delete_reason: r.delete_reason,
    delete_requested_at: r.delete_requested_at,
    created_at: r.created_at,
  }));
}

export async function approveDeleteRequest(rencanaId: string, adminNote: string) {
  const authUser = await getAuthUser();
  if (!authUser || !['admin', 'superadmin'].includes(authUser.role)) {
    throw new Error('Unauthorized');
  }

  const supabase = createSupabaseAdminClient();

  // 1. Hapus semua laporan terkait rencana ini (FK constraint ON DELETE RESTRICT)
  const { error: laporanDeleteError } = await supabase
    .from('laporan')
    .delete()
    .eq('rencana_id', rencanaId);

  if (laporanDeleteError) throw new Error('Gagal menghapus laporan terkait: ' + laporanDeleteError.message);

  // 2. Hapus rencana dari database (hard delete)
  const { error: deleteError } = await supabase
    .from('rencana')
    .delete()
    .eq('id', rencanaId);

  if (deleteError) throw new Error('Gagal menghapus rencana: ' + deleteError.message);

  return { success: true };
}

export async function rejectDeleteRequest(rencanaId: string, adminNote: string) {
  const authUser = await getAuthUser();
  if (!authUser || !['admin', 'superadmin'].includes(authUser.role)) {
    throw new Error('Unauthorized');
  }

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from('rencana')
    .update({
      delete_status: 'rejected',
      delete_admin_note: adminNote || 'Ditolak',
      delete_reviewed_by: authUser.id,
    })
    .eq('id', rencanaId)
    .eq('delete_status', 'pending');

  if (error) throw error;

  return { success: true };
}

// ── Delete User (cascade) ───────────────────────────────────────────────────

export async function deleteUser(userId: string) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'superadmin') {
    throw new Error('Hanya Superadmin yang dapat menghapus user');
  }

  // Tidak boleh hapus diri sendiri
  if (authUser.id === userId) {
    throw new Error('Tidak dapat menghapus akun sendiri');
  }

  const supabase = createSupabaseAdminClient();

  // 1. Hapus semua laporan milik user
  await supabase.from('laporan').delete().eq('user_id', userId);

  // 2. Hapus semua rencana milik user
  await supabase.from('rencana').delete().eq('user_id', userId);

  // 3. Hapus lokasi user (user_locations PK = user_id, ON DELETE CASCADE — tapi manual lebih aman)
  await supabase.from('user_locations').delete().eq('user_id', userId);

  // 4. Set NULL pada audit_logs (FK ON DELETE SET NULL — otomatis, tapi tidak masalah)

  // 5. Hapus user
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw new Error('Gagal menghapus user: ' + error.message);

  return { success: true };
}

// ── Get Users for Filter Dropdown ───────────────────────────────────────────

export async function getUsersForFilter() {
  const authUser = await getAuthUser();
  if (!authUser || !['admin', 'superadmin'].includes(authUser.role)) {
    throw new Error('Unauthorized');
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, nama, nomor_induk')
    .eq('role', 'user')
    .eq('is_active', true)
    .order('nama');

  if (error) throw error;
  return data || [];
}
