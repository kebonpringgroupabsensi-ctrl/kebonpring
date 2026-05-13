import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getUser } from '../../services/api';
import { Check, Clock, FileEdit, AlertCircle, MapPin, ScanFace, LogOut } from 'lucide-react';

export default function KaryawanDashboard() {
  const user = getUser();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['karyawan-dashboard', user?.id],
    queryFn: () => {
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      return api.get('/dashboard/karyawan', { date: today });
    },
    staleTime: 0, // Always refetch on mount to ensure fresh data
  });

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', background: 'var(--bg-color)' }}>
      <div className="loader" style={{ width: '40px', height: '40px' }} />
      <p style={{ color: 'var(--text-secondary)' }}>Memuat dashboard...</p>
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p style={{ color: 'var(--error)' }}>⚠️ {error.message}</p>
      <button onClick={() => refetch()} className="action-btn" style={{ marginTop: '1rem' }}>Coba Lagi</button>
    </div>
  );

  const { today_shift, today_attendance, monthly_stats, announcements } = data;
  const stats = monthly_stats || { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpa: 0 };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi!';
    if (hour < 15) return 'Selamat Siang!';
    if (hour < 19) return 'Selamat Sore!';
    return 'Selamat Malam!';
  };

  return (
    <>
      <div className="mobile-header" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
        <div className="user-greeting">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Halo, {getGreeting()}</p>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>{user?.full_name}</h1>
        </div>
        <div className="avatar" style={{ width: '45px', height: '45px', fontSize: '1rem', fontWeight: '700', background: 'var(--primary)', color: 'white' }}>
          {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
        </div>
      </div>
      
      <div className="page-container" style={{ padding: '1rem' }}>
        {/* Current Shift Card */}
        <div style={{ 
          background: 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)', 
          padding: '1.5rem', 
          borderRadius: '24px', 
          color: 'white', 
          marginBottom: '1.5rem', 
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative Circle */}
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
          
          <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem', fontWeight: '600' }}>Shift Hari Ini</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '1.25rem' }}>
            {today_shift ? `${today_shift.shifts?.name} (${today_shift.shifts?.start_time} - ${today_shift.shifts?.end_time})` : 'Tidak Ada Jadwal'}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.15)', padding: '1rem', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
             <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.25rem' }}>Status</div>
                <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>
                  {today_attendance ? (today_attendance.check_out_time ? 'Sudah Pulang' : 'Sudah Absen') : 'Belum Absen'}
                </div>
             </div>
             <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.3)' }}></div>
             <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.25rem' }}>Lokasi</div>
                <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>{user?.branches?.name || 'Cabang...'}</div>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Hadir', value: stats.hadir, sub: 'Bulan ini', icon: Check, color: '#10B981' },
            { label: 'Terlambat', value: stats.terlambat, sub: 'Bulan ini', icon: Clock, color: '#F59E0B' },
            { label: 'Izin/Sakit', value: (stats.izin || 0) + (stats.sakit || 0), sub: 'Bulan ini', icon: FileEdit, color: '#3B82F6' },
            { label: 'Alpa', value: stats.alpa, sub: 'Bulan ini', icon: AlertCircle, color: '#EF4444' },
          ].map((stat, i) => (
            <div key={i} className="content-card" style={{ padding: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', borderRadius: '20px', border: '1px solid var(--surface-border)' }}>
               <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={20} />
               </div>
               <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--text-main)', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.5rem' }}>{stat.label}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{stat.sub}</div>
               </div>
            </div>
          ))}
        </div>

        {/* Announcements */}
        <div className="content-card" style={{ padding: '1.25rem', borderRadius: '20px', border: '1px solid var(--surface-border)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.25rem', color: 'var(--text-main)' }}>Pengumuman</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {announcements.length > 0 ? announcements.map((ann, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', padding: '0.6rem', borderRadius: '10px', flexShrink: 0 }}>
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>{ann.title}</div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {ann.content}
                  </p>
                </div>
              </div>
            )) : (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', padding: '0.6rem', borderRadius: '10px' }}>
                  <Clock size={18} />
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Jangan lupa melakukan scan wajah saat check-in dan check-out untuk validitas absensi.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '2rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Versi 1.0.4 • Warung Request Team</p>
        </div>
      </div>
    </>
  );
}
