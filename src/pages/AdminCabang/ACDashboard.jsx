import React from 'react';
import { api } from '../../services/api';
import { Users, ScanFace, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function ACDashboard() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-admin-cabang'],
    queryFn: () => api.get('/dashboard/admin-cabang'),
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', flexDirection: 'column', gap: '1rem' }}>
      <div className="loader" style={{ width: '40px', height: '40px' }} />
      <p style={{ color: 'var(--text-secondary)' }}>Memuat data dashboard...</p>
    </div>
  );

  if (error) return (
    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '1.5rem', color: 'var(--error)', textAlign: 'center' }}>
      <p>⚠️ {error.message}</p>
      <button onClick={() => refetch()} className="action-btn" style={{ marginTop: '1rem' }}>Coba Lagi</button>
    </div>
  );

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>Overview {stats.branch?.name || 'Cabang'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{today}</p>
        </div>
        <button onClick={() => refetch()} style={{ background: 'none', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Karyawan</h3>
            <div className="value">{stats.total_employees}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Karyawan aktif</div>
          </div>
          <div className="stat-icon"><Users size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Hadir Hari Ini</h3>
            <div className="value">{stats.today_attendance}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Karyawan</div>
          </div>
          <div className="stat-icon"><ScanFace size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Terlambat</h3>
            <div className="value" style={{ color: stats.today_late > 0 ? 'var(--error)' : 'var(--text-main)' }}>{stats.today_late}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Karyawan</div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)' }}><Clock size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Izin Menunggu</h3>
            <div className="value" style={{ color: stats.pending_leaves > 0 ? '#F59E0B' : 'var(--text-main)' }}>{stats.pending_leaves}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Menunggu persetujuan</div>
          </div>
          <div className="stat-icon" style={{ color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)' }}><AlertCircle size={24} /></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="responsive-grid-2-1">
        {/* Recent Log */}
        <div className="content-card" style={{ gridColumn: '1 / -1' }}>
          <div className="content-header">
            <h2>Aktivitas Absensi Terbaru</h2>
          </div>
          {stats.recent_log.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Belum ada absensi hari ini</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '0.75rem 0' }}>Nama</th>
                    <th>Jam Masuk</th>
                    <th>Jam Keluar</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_log.map((log) => {
                    const inTime = new Date(log.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    const outTime = log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                        <td style={{ padding: '0.75rem 0', fontWeight: '600' }}>{log.profiles?.full_name}</td>
                        <td>{inTime}</td>
                        <td>{outTime}</td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '8px',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            backgroundColor: log.status === 'hadir' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: log.status === 'hadir' ? 'var(--primary)' : 'var(--error)'
                          }}>
                            {log.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
