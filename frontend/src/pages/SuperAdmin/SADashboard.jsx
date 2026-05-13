import React from 'react';
import { api } from '../../services/api';
import { Users, Building, ScanFace, Clock, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function SADashboard() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/super-admin'),
    staleTime: 1000 * 60 * 2, // Dashboard data is fresh for 2 minutes
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>Overview Hari Ini</h2>
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
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Semua cabang</div>
          </div>
          <div className="stat-icon"><Users size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Cabang Aktif</h3>
            <div className="value">{stats.active_branches}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Seluruh Indonesia</div>
          </div>
          <div className="stat-icon"><Building size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Hadir Hari Ini</h3>
            <div className="value">{stats.today_attendance}</div>
            <div style={{ fontSize: '0.75rem', color: stats.attendance_percentage >= 80 ? 'var(--secondary)' : 'var(--error)', marginTop: '0.25rem' }}>
              {stats.attendance_percentage}% kehadiran
            </div>
          </div>
          <div className="stat-icon"><ScanFace size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Terlambat</h3>
            <div className="value" style={{ color: stats.today_late > 0 ? 'var(--error)' : 'var(--text-main)' }}>{stats.today_late}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Hari ini</div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)' }}><Clock size={24} /></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="responsive-grid-2-1">
        {/* Recent Log */}
        <div className="content-card">
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
                    <th>Cabang</th>
                    <th>Masuk</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_log.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.75rem 0', fontWeight: '600' }}>{row.profiles?.full_name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{row.profiles?.branches?.name || '-'}</td>
                      <td>{row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
                          background: row.status === 'terlambat' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: row.status === 'terlambat' ? 'var(--error)' : 'var(--secondary)',
                        }}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Branch Stats */}
        <div className="content-card">
          <div className="content-header">
            <h2>Status Cabang</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.branch_stats.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Tidak ada cabang</p>
            ) : (
              stats.branch_stats.map((branch) => (
                <div key={branch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{branch.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{branch.employee_count} Karyawan</div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '700',
                    color: branch.status === 'aktif' ? 'var(--secondary)' : 'var(--error)',
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: branch.status === 'aktif' ? 'var(--secondary)' : 'var(--error)' }} />
                    {branch.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
