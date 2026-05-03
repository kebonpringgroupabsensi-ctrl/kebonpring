import React from 'react';
import { useTheme } from '../../ThemeContext';
import { getUser } from '../../services/api';
import { LogOut, Phone, Mail, Building, Shield, Moon, Sun, ChevronRight } from 'lucide-react';

export default function ACProfil() {
  const { isDark, toggleTheme } = useTheme();
  const user = getUser();

  const handleLogout = () => {
    if (confirm('Yakin ingin keluar aplikasi?')) {
      localStorage.removeItem('session');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??';
  };

  return (
    <>
      <div className="content-card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '2rem' }}>
        <div className="avatar" style={{ 
          width: '120px', 
          height: '120px', 
          fontSize: '3rem', 
          background: 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)',
          color: 'white',
          boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)',
        }}>
          {getInitials(user?.full_name)}
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{user?.full_name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '600' }}>
            {user?.position || 'Admin'} • {user?.branches?.name || 'Cabang'}
          </p>
          <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.1)', color: 'var(--secondary)', padding: '0.35rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
            <Shield size={14} /> Admin Cabang
          </div>
        </div>
      </div>

      <div className="responsive-grid-2-1">
        <div className="content-card" style={{ padding: '0.5rem 1.5rem', borderRadius: '24px' }}>
          <ProfileItem icon={<Phone size={20} />} label="Nomor WhatsApp" value={user?.phone || '-'} />
          <ProfileItem icon={<Mail size={20} />} label="Email Login" value={user?.email || '-'} />
          <ProfileItem icon={<Building size={20} />} label="Cabang Penugasan" value={user?.branches?.name || '-'} isLast />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="content-card" style={{ padding: '0.5rem 1.5rem', borderRadius: '24px' }}>
            <div 
              onClick={toggleTheme}
              style={{ 
                padding: '1.25rem 0', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ color: 'var(--primary)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                  {isDark ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>Mode Tampilan</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{isDark ? 'Gelap' : 'Terang'}</span>
                <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          <div className="content-card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Keluar dari Sistem</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Anda harus login kembali untuk mengakses data cabang.</p>
            <button 
              className="action-btn" 
              onClick={handleLogout}
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                background: 'var(--error)', 
                color: 'white', 
                padding: '1rem',
                borderRadius: '16px',
                fontWeight: '800',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
              }}
            >
              <LogOut size={18} />
              Keluar Sekarang
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ProfileItem({ icon, label, value, isLast }) {
  return (
    <div style={{ 
      padding: '1.25rem 0', 
      borderBottom: isLast ? 'none' : '1px solid var(--surface-border)', 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ color: 'var(--primary)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</div>
          <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>{value}</div>
        </div>
      </div>
    </div>
  );
}
