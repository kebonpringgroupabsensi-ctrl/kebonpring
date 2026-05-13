import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ScanFace, Search, Filter, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function ACAbsensiHariIni() {
  const [search, setSearch] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  const displayDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Fetch from dashboard endpoint to get recent log, or from a specific attendance endpoint.
  // We use dashboard admin-cabang since it returns today's attendance detailed list
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-admin-cabang-today'],
    queryFn: () => api.get('/dashboard/admin-cabang'),
    refetchInterval: 60000, // Auto refresh every minute
  });

  if (isLoading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Memuat data absensi hari ini...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--error)' }}>Gagal memuat data.</div>;

  const logs = stats?.recent_log || [];

  const filteredLogs = logs.filter(log => {
    if (search) {
      return log.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  return (
    <>
      <div className="content-card">
        <div className="content-header">
          <div>
            <h2>Absensi Hari Ini</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{displayDate}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <div className="stat-info-card" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} />
                <span style={{ fontWeight: '700' }}>{stats.today_attendance} Hadir</span>
             </div>
             <div className="stat-info-card" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <XCircle size={18} />
                <span style={{ fontWeight: '700' }}>{stats.not_checked_in} Belum Masuk</span>
             </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Cari nama karyawan..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input" 
              style={{ paddingLeft: '2.5rem' }} 
            />
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '1rem' }}>Nama Karyawan</th>
                <th>Waktu Masuk</th>
                <th>Verifikasi Wajah</th>
                <th>Waktu Keluar</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const inTime = new Date(log.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                const outTime = log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
                
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '1.25rem 1rem', fontWeight: '700' }}>{log.profiles?.full_name}</td>
                    <td style={{ color: log.is_late ? 'var(--error)' : 'var(--text-main)' }}>
                      {inTime}
                      {log.is_late && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--error)', background: 'rgba(239,68,68,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Terlambat {log.late_minutes}m</span>}
                    </td>
                    <td>
                      {log.check_in_face_verified ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--secondary)', fontSize: '0.8rem' }}><CheckCircle size={14} /> Terverifikasi</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}><XCircle size={14} /> Manual</span>
                      )}
                    </td>
                    <td>{outTime}</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem', 
                        background: log.status === 'terlambat' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: log.status === 'terlambat' ? 'var(--error)' : 'var(--secondary)',
                        fontWeight: '700'
                      }}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Belum ada data absensi hari ini yang sesuai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
