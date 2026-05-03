import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, CheckSquare, FileText, User, LogOut, Moon, Sun, Clock, Menu, X } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useState } from 'react';
import RunningText from '../components/RunningText';

const MENU_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: Home },
  { path: '/admin/karyawan', label: 'Karyawan Cabang', icon: Users },
  { path: '/admin/shift', label: 'Manajemen Shift', icon: Clock },
  { path: '/admin/absensi-hari-ini', label: 'Absensi Hari Ini', icon: CheckSquare },
  { path: '/admin/laporan', label: 'Laporan Absensi', icon: FileText },
  { path: '/admin/profil', label: 'Profil Saya', icon: User },
];

export default function AdminCabangLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('session');
    localStorage.removeItem('user');
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
          <div className="sidebar-title">Admin Cabang</div>
        </div>
        
        <nav className="nav-menu">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
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
            {MENU_ITEMS.find(i => i.path === location.pathname)?.label || 'Admin Cabang'}
          </div>
          <div className="topbar-actions">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="profile-btn">
              <User size={18} />
              <span>Admin Madiun</span>
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
