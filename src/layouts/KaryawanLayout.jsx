import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, MapPin, Calendar, FileEdit, User, LogOut, Moon, Sun } from 'lucide-react';
import RunningText from '../components/RunningText';
import { useTheme } from '../ThemeContext';
import { getUser } from '../services/api';
import { authService } from '../services/authService';

const MENU_ITEMS = [
  { path: '/karyawan', label: 'Dashboard', icon: Home },
  { path: '/karyawan/absen', label: 'Absen', icon: MapPin },
  { path: '/karyawan/riwayat', label: 'Riwayat', icon: Calendar },
  { path: '/karyawan/izin', label: 'Izin', icon: FileEdit },
  { path: '/karyawan/profil', label: 'Profil', icon: User },
];

export default function KaryawanLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const user = getUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="mobile-layout">
      {/* Header */}
      <header style={{
        padding: '0.75rem 1rem', background: 'var(--surface)',
        borderBottom: '1px solid var(--surface-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-main)' }}>
            Halo, {user?.full_name?.split(' ')[0] || 'Karyawan'} 👋
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {user?.position || 'Warung Request'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mobile-content">
        <RunningText />
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/karyawan' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
