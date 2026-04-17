'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { getDeleteRequests, approveDeleteRequest, rejectDeleteRequest } from '@/app/dashboard/actions';
import { formatRupiah } from '@/lib/formatters';
import { Trash2, CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';

interface DeleteRequest {
  id: string;
  user_id: string;
  user_nama: string;
  user_nomor_induk: string;
  target_nominal: number;
  deskripsi: string | null;
  tanggal_target: string;
  status: string;
  delete_reason: string;
  delete_requested_at: string;
  created_at: string;
}

export default function PersetujuanHapusPage() {
  const [requests, setRequests] = useState<DeleteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDeleteRequests();
      setRequests(data);
    } catch (err) {
      console.error('Error fetching delete requests:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id: string) => {
    if (!confirm('Yakin ingin MENYETUJUI penghapusan rencana ini? Data akan dihapus permanen.')) return;
    setProcessing(id);
    try {
      await approveDeleteRequest(id, adminNote[id] || '');
      await fetchRequests();
    } catch (err) {
      alert('Gagal menyetujui: ' + (err as Error).message);
    }
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    const note = adminNote[id]?.trim();
    if (!note) {
      alert('Keterangan wajib diisi saat menolak permintaan hapus.');
      return;
    }
    setProcessing(id);
    try {
      await rejectDeleteRequest(id, note);
      await fetchRequests();
    } catch (err) {
      alert('Gagal menolak: ' + (err as Error).message);
    }
    setProcessing(null);
  };

  return (
    <PageContainer
      title="Persetujuan Hapus Rencana"
      description="Kelola permintaan penghapusan rencana dari user lapangan"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={20} color="#f59e0b" />
          <span style={{ fontSize: 14, color: '#6b7280' }}>
            {requests.length} permintaan menunggu persetujuan
          </span>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff',
            cursor: 'pointer', fontSize: 13, fontWeight: 500,
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          Memuat data...
        </div>
      ) : requests.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, borderRadius: 12,
          border: '2px dashed #e5e7eb', color: '#9ca3af',
        }}>
          <Trash2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 4, color: '#6b7280' }}>
            Tidak ada permintaan
          </p>
          <p style={{ fontSize: 13 }}>
            Semua permintaan penghapusan sudah ditangani.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {requests.map((req) => (
            <div
              key={req.id}
              style={{
                background: '#fff', borderRadius: 12, padding: 20,
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                    {req.deskripsi || 'Rencana Penagihan'}
                  </h3>
                  <p style={{ fontSize: 13, color: '#6b7280' }}>
                    {req.user_nama} ({req.user_nomor_induk}) • Target: {formatRupiah(req.target_nominal)}
                  </p>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    Deadline: {new Date(req.tanggal_target).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' • '}Status: <span style={{ fontWeight: 600, color: req.status === 'aktif' ? '#f59e0b' : req.status === 'selesai' ? '#10b981' : '#ef4444' }}>{req.status}</span>
                  </p>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 10px',
                  borderRadius: 20, background: '#fef3c7', color: '#d97706',
                }}>
                  PENDING
                </span>
              </div>

              {/* Alasan */}
              <div style={{
                background: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 16,
                borderLeft: '3px solid #ef4444',
              }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#991b1b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Alasan Penghapusan
                </p>
                <p style={{ fontSize: 14, color: '#7f1d1d', lineHeight: 1.5 }}>
                  {req.delete_reason}
                </p>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                  Diajukan: {new Date(req.delete_requested_at).toLocaleString('id-ID')}
                </p>
              </div>

              {/* Admin note input */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>
                  Keterangan Admin {processing !== req.id && '(wajib saat menolak)'}
                </label>
                <textarea
                  placeholder="Tulis keterangan atau alasan keputusan..."
                  value={adminNote[req.id] || ''}
                  onChange={(e) => setAdminNote({ ...adminNote, [req.id]: e.target.value })}
                  disabled={processing === req.id}
                  style={{
                    width: '100%', padding: 10, borderRadius: 8,
                    border: '1px solid #e5e7eb', fontSize: 13,
                    minHeight: 60, resize: 'vertical', fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleReject(req.id)}
                  disabled={processing === req.id}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 16px', borderRadius: 8, border: '1px solid #fca5a5',
                    background: '#fff', color: '#dc2626', fontWeight: 600, fontSize: 13,
                    cursor: processing === req.id ? 'not-allowed' : 'pointer',
                    opacity: processing === req.id ? 0.5 : 1,
                  }}
                >
                  <XCircle size={16} />
                  Tolak
                </button>
                <button
                  onClick={() => handleApprove(req.id)}
                  disabled={processing === req.id}
                  style={{
                    flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 16px', borderRadius: 8, border: 'none',
                    background: '#dc2626', color: '#fff', fontWeight: 600, fontSize: 13,
                    cursor: processing === req.id ? 'not-allowed' : 'pointer',
                    opacity: processing === req.id ? 0.5 : 1,
                  }}
                >
                  <CheckCircle size={16} />
                  {processing === req.id ? 'Memproses...' : 'Setujui & Hapus'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
