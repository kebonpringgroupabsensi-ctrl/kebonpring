import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Store, Users, Clock, FileText, UserCog, Settings, LogOut, User, Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useState } from 'react';
import { authService } from '../services/authService';
import { getUser } from '../services/api';
import RunningText from '../components/RunningText';

const MENU_ITEMS = [
  { path: '/superadmin', label: 'Dashboard', icon: Home },
  { path: '/superadmin/cabang', label: 'Manajemen Cabang', icon: Store },
  { path: '/superadmin/karyawan', label: 'Manajemen Karyawan', icon: Users },
  { path: '/superadmin/shift', label: 'Manajemen Shift', icon: Clock },
  { path: '/superadmin/laporan', label: 'Laporan Absensi', icon: FileText },
  { path: '/superadmin/admin', label: 'Manajemen Akun Admin', icon: UserCog },
  { path: '/superadmin/pengaturan', label: 'Pengaturan Sistem', icon: Settings },
];

export default function SuperAdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = getUser();

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  return (
    <div className="app-layout">
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo.png" alt="Logo" className="sidebar-logo" />
          <div className="sidebar-title">Super Admin</div>
        </div>
        
        <nav className="nav-menu">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/superadmin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <button 
            className="sidebar-toggle" 
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open Sidebar"
          >
            <Menu size={24} />
          </button>
          <div className="page-title">
            {MENU_ITEMS.find(i => i.path === location.pathname)?.label || 'Super Admin'}
          </div>
          <div className="topbar-actions">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="profile-btn">
              <User size={18} />
              <span>{user?.full_name || 'Super Admin'}</span>
            </button>
          </div>
        </header>

        <RunningText />
        
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
