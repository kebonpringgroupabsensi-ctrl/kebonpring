import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { getUser } from '../../services/api';
import { LogOut, User, Phone, Mail, MapPin, Building, Shield, Moon, Sun, ChevronRight } from 'lucide-react';

export default function KaryawanProfil() {
  const { isDark, toggleTheme } = useTheme();
  const user = getUser();
  const navigate = useNavigate();

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
      <div className="mobile-header" style={{ 
        flexDirection: 'column', 
        gap: '1rem', 
        paddingTop: '3rem', 
        paddingBottom: '2.5rem',
        background: 'var(--surface)',
        borderRadius: '0 0 30px 30px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        <div className="avatar" style={{ 
          width: '100px', 
          height: '100px', 
          fontSize: '2.5rem', 
          background: 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)',
          color: 'white',
          boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)',
          border: '4px solid var(--surface)'
        }}>
          {getInitials(user?.full_name)}
        </div>
        <div className="user-greeting" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-main)' }}>{user?.full_name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600', marginTop: '0.25rem' }}>
            {user?.position || 'Karyawan'} • {user?.branches?.name || 'Cabang'}
          </p>
        </div>
      </div>

      <div className="page-container" style={{ padding: '1.5rem', paddingTop: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="content-card" style={{ padding: '0.5rem 1.25rem', borderRadius: '24px', margin: 0 }}>
            <ProfileItem icon={<Phone size={18} />} label="Nomor WhatsApp" value={user?.phone || '-'} />
            <ProfileItem icon={<Mail size={18} />} label="Email" value={user?.email || '-'} />
            <ProfileItem icon={<Building size={18} />} label="Cabang" value={user?.branches?.name || '-'} />
            <ProfileItem icon={<Shield size={18} />} label="Role Sistem" value={user?.role?.replace('_', ' ') || '-'} isLast />
          </div>

          <div className="content-card" style={{ padding: '0.5rem 1.25rem', borderRadius: '24px', margin: 0 }}>
            <div 
              onClick={toggleTheme}
              style={{ 
                padding: '1.1rem 0', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ color: 'var(--primary)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.6rem', borderRadius: '12px' }}>
                  {isDark ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>Mode Tampilan</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{isDark ? 'Gelap' : 'Terang'}</span>
                <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          <button 
            className="action-btn" 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--error)', 
              padding: '1.2rem',
              borderRadius: '20px',
              fontWeight: '800',
              marginTop: '1rem',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            <LogOut size={20} />
            Keluar Aplikasi
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            ID Karyawan: {user?.id?.substring(0, 8).toUpperCase()}
          </p>
        </div>
      </div>
    </>
  );
}

function ProfileItem({ icon, label, value, isLast }) {
  return (
    <div style={{ 
      padding: '1.1rem 0', 
      borderBottom: isLast ? 'none' : '1px solid var(--surface-border)', 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ color: 'var(--primary)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.6rem', borderRadius: '12px' }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</div>
          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.1rem' }}>{value}</div>
        </div>
      </div>
    </div>
  );
}
