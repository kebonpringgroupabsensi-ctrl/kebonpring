import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, LogIn, X, Mail, Phone, Briefcase, MapPin } from 'lucide-react';
import { authService } from '../../services/authService';
import { branchService } from '../../services/branchService';

const ROLES = [
  { id: 'karyawan', label: 'Karyawan', path: '/karyawan' },
  { id: 'admin', label: 'Admin Cabang', path: '/admin' },
  { id: 'superadmin', label: 'Owner', path: '/superadmin' }
];

export default function Login() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState(ROLES[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [error, setError] = useState('');
  
  // Login Form State
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Registration Form State
  const [registerData, setRegisterData] = useState({
    full_name: '',
    nik: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    branch_id: '',
    position: ''
  });

  // Branches State
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    if (showRegisterModal) {
      fetchBranches();
    }
  }, [showRegisterModal]);

  const fetchBranches = async () => {
    try {
      const data = await branchService.getAllBranches();
      setBranches(data);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await authService.login(loginData.email, loginData.password);
      
      // Check if user role matches the selected tab
      const userRoleMap = {
        'karyawan': 'karyawan',
        'admin_cabang': 'admin',
        'super_admin': 'superadmin'
      };

      const mappedRole = userRoleMap[data.user.role];
      if (mappedRole !== activeRole.id) {
        // Automatically switch to correct dashboard if role mismatch, 
        // or you could show an error. Let's redirect to correct one.
        const correctRole = ROLES.find(r => r.id === mappedRole);
        if (correctRole) {
          navigate(correctRole.path);
        } else {
          navigate(activeRole.path);
        }
      } else {
        navigate(activeRole.path);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      setError('Password tidak cocok.');
      return;
    }

    if (registerData.password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authService.register({
        full_name: registerData.full_name,
        nik: registerData.nik,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password,
        branch_id: registerData.branch_id,
        position: registerData.position
      });
      
      alert('Pendaftaran berhasil! Silakan login dengan akun Anda.');
      setShowRegisterModal(false);
      setLoginData({ ...loginData, email: registerData.email });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-layout">
      {/* Background Glowing Effects */}
      <div className="lamp-glow-container">
        <div className="lamp-glow glow-1"></div>
        <div className="lamp-glow glow-2"></div>
        <div className="lamp-glow glow-3"></div>
        <div className="lamp-glow glow-4"></div>
        <div className="lamp-glow glow-5"></div>
      </div>

      <div className="auth-container">
        <div className="login-logo-wrapper">
          <img src="/logo-login.png" alt="Kebon Pring Logo" className="login-logo" />
        </div>
        <div className="role-tabs-custom">
            {ROLES.map(role => (
              <button
                key={role.id}
                type="button"
                className={`role-tab ${activeRole.id === role.id ? 'active' : ''}`}
                onClick={() => setActiveRole(role)}
              >
                {role.label}
              </button>
            ))}
          </div>

          {error && !showRegisterModal && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '0.75rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="custom-input-wrapper">
              <User className="icon" size={20} />
                <input
                  type="email"
                  id="email"
                  name="email"
                className=""
                placeholder="Username / Email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  required
                />
            </div>

            <div className="custom-input-wrapper">
              <Lock className="icon" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                className=""
                placeholder="Password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '0.2rem' }}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            <button type="submit" className="custom-btn-submit" disabled={isLoading}>
              {isLoading ? (
                <div className="loader" style={{borderColor: 'white', width: '20px', height: '20px'}}></div>
              ) : (
                'LOGIN'
              )}
            </button>
          </form>

          <div className="custom-links">
            <a href="#">Lupa Password?</a>
          </div>

          <div className="custom-divider">
            atau
          </div>

          <div className="custom-links">
            Belum punya akun?{' '}
            <button 
              onClick={() => {
                setError('');
                setShowRegisterModal(true);
              }}
            >
              Daftar di sini
            </button>
          </div>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Pendaftaran Karyawan Baru</h2>
              <button className="modal-close" onClick={() => setShowRegisterModal(false)}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '0.75rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={16} style={{ left: '12px' }} />
                    <input 
                      type="text" 
                      name="full_name"
                      className="form-input" 
                      placeholder="Nama Anda" 
                      style={{ paddingLeft: '2.5rem' }} 
                      value={registerData.full_name}
                      onChange={handleRegisterChange}
                      required 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">NIK (Karyawan)</label>
                  <div className="input-wrapper">
                    <Briefcase className="input-icon" size={16} style={{ left: '12px' }} />
                    <input 
                      type="text" 
                      name="nik"
                      className="form-input" 
                      placeholder="WRQ-001" 
                      style={{ paddingLeft: '2.5rem' }} 
                      value={registerData.nik}
                      onChange={handleRegisterChange}
                      required 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={16} style={{ left: '12px' }} />
                    <input 
                      type="email" 
                      name="email"
                      className="form-input" 
                      placeholder="email@example.com" 
                      style={{ paddingLeft: '2.5rem' }} 
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      required 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Nomor WhatsApp</label>
                  <div className="input-wrapper">
                    <Phone className="input-icon" size={16} style={{ left: '12px' }} />
                    <input 
                      type="text" 
                      name="phone"
                      className="form-input" 
                      placeholder="0812..." 
                      style={{ paddingLeft: '2.5rem' }} 
                      value={registerData.phone}
                      onChange={handleRegisterChange}
                      required 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Cabang Penempatan</label>
                  <div className="input-wrapper">
                    <MapPin className="input-icon" size={16} style={{ left: '12px', zIndex: 1 }} />
                    <select 
                      name="branch_id"
                      className="form-input" 
                      style={{ paddingLeft: '2.5rem' }} 
                      value={registerData.branch_id}
                      onChange={handleRegisterChange}
                      required
                    >
                      <option value="">Pilih Cabang</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Jabatan</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={16} style={{ left: '12px', zIndex: 1 }} />
                    <select 
                      name="position"
                      className="form-input" 
                      style={{ paddingLeft: '2.5rem' }} 
                      value={registerData.position}
                      onChange={handleRegisterChange}
                      required
                    >
                      <option value="">Pilih Jabatan</option>
                      <option>Manager</option>
                      <option>Kasir</option>
                      <option>Koki</option>
                      <option>Waiter</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Buat Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={16} style={{ left: '12px' }} />
                    <input 
                      type="password" 
                      name="password"
                      className="form-input" 
                      placeholder="Min. 8 karakter" 
                      style={{ paddingLeft: '2.5rem' }} 
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      required 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Konfirmasi Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={16} style={{ left: '12px' }} />
                    <input 
                      type="password" 
                      name="confirmPassword"
                      className="form-input" 
                      placeholder="Ulangi password" 
                      style={{ paddingLeft: '2.5rem' }} 
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      required 
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setShowRegisterModal(false)}>Batal</button>
                <button type="submit" className="btn-submit" style={{ width: 'auto', marginTop: 0 }} disabled={isLoading}>
                  {isLoading ? <div className="loader" style={{ width: '16px', height: '16px' }}></div> : 'Daftar Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


