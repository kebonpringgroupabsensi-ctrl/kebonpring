import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Filter, Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_LABELS = {
  hadir: { label: 'Hadir', color: 'var(--secondary)', bg: 'rgba(16,185,129,0.1)' },
  terlambat: { label: 'Terlambat', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  izin: { label: 'Izin', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  sakit: { label: 'Sakit', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  alpa: { label: 'Alpa', color: 'var(--error)', bg: 'rgba(239,68,68,0.1)' },
};

export default function KaryawanRiwayat() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: history, isLoading, refetch } = useQuery({
    queryKey: ['karyawan-history', month, year],
    queryFn: () => api.get('/attendances', { month, year }),
  });

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return '--:--';
    return new Date(isoStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="mobile-header" style={{ padding: '1.5rem', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Riwayat Absen</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.4rem 0.8rem', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
          <Calendar size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{year}</span>
        </div>
      </div>

      <div className="page-container" style={{ padding: '1rem' }}>
        {/* Month Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'var(--surface)', padding: '0.75rem', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
          <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>{months[month]} {year}</span>
          <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronRight size={20} /></button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="loader" style={{ width: '30px', height: '30px', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>Memuat riwayat...</p>
          </div>
        ) : history?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((item) => (
              <div key={item.id} className="content-card" style={{ padding: '1.25rem', margin: 0, borderRadius: '20px', border: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)' }}>{formatDate(item.date)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.shifts?.name || 'Shift...'}</div>
                  </div>
                  <span style={{
                    padding: '0.3rem 0.75rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '800',
                    textTransform: 'uppercase',
                    ...STATUS_LABELS[item.status] || STATUS_LABELS.hadir
                  }}>
                    {STATUS_LABELS[item.status]?.label || item.status}
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>CHECK IN</div>
                    <div style={{ fontWeight: '800', fontSize: '0.9rem', color: item.is_late ? 'var(--error)' : 'var(--text-main)' }}>
                      {formatTime(item.check_in_time)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>CHECK OUT</div>
                    <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>{formatTime(item.check_out_time)}</div>
                  </div>
                </div>
                
                {(item.check_in_latitude || item.check_out_latitude) && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <MapPin size={12} />
                    Terverifikasi di {item.profiles?.branches?.name || 'Cabang'}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
            <Calendar size={48} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
            <p style={{ fontSize: '0.9rem' }}>Tidak ada riwayat absensi pada bulan ini.</p>
          </div>
        )}
      </div>
    </>
  );
}
