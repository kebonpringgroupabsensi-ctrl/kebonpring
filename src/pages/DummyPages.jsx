import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, Building, DollarSign, ScanFace, Calendar as CalendarIcon, Filter, Moon, Sun, X, Shield, MapPin, Globe, Save, Trash2, Edit, UserCog, Coffee, Check, AlertCircle, FileEdit, LogOut } from 'lucide-react';
import { useTheme } from '../ThemeContext';

export const PagePlaceholder = ({ title, description }) => (
  <div className="content-card">
    <div className="content-header">
      <h2>{title}</h2>
      <button className="action-btn">Tambah Baru</button>
    </div>
    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{description}</p>
    
    <div style={{ background: 'rgba(0,0,0,0.2)', height: '200px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--surface-border)' }}>
      <span style={{ color: 'var(--text-muted)' }}>Data Table Placeholder for {title}</span>
    </div>
  </div>
);

// SUPER ADMIN PAGES
export const SADashboard = () => (
  <>
    <div className="stat-grid">
      <div className="stat-card">
        <div className="stat-info">
          <h3>Total Karyawan</h3>
          <div className="value">156</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>+12 bulan ini</div>
        </div>
        <div className="stat-icon"><Users size={24} /></div>
      </div>
      <div className="stat-card">
        <div className="stat-info">
          <h3>Cabang Aktif</h3>
          <div className="value">12</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Seluruh Indonesia</div>
        </div>
        <div className="stat-icon"><Building size={24} /></div>
      </div>
      <div className="stat-card">
        <div className="stat-info">
          <h3>Kehadiran Hari Ini</h3>
          <div className="value">94%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>Sangat Bagus</div>
        </div>
        <div className="stat-icon"><ScanFace size={24} /></div>
      </div>
      <div className="stat-card">
        <div className="stat-info">
          <h3>Total Karyawan Hadir</h3>
          <div className="value">148</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>Hari Ini</div>
        </div>
        <div className="stat-icon"><ScanFace size={24} /></div>
      </div>
    </div>

    <div className="responsive-grid-2-1">
      <div className="content-card">
        <div className="content-header">
          <h2>Aktivitas Absensi Terbaru</h2>
          <button className="action-btn" style={{ background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' }}>Lihat Semua</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '1rem 0' }}>Nama Karyawan</th>
                <th>Cabang</th>
                <th>Waktu</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Budi Santoso', branch: 'Madiun', time: '08:05', status: 'Masuk' },
                { name: 'Siti Aminah', branch: 'Solo', time: '07:55', status: 'Masuk' },
                { name: 'Andi Wijaya', branch: 'Madiun', time: '07:30', status: 'Masuk' },
                { name: 'Dewi Lestari', branch: 'Surabaya', time: '08:15', status: 'Terlambat' },
                { name: 'Rizky Pratama', branch: 'Solo', time: '08:00', status: 'Masuk' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                  <td style={{ padding: '1rem 0', fontWeight: '600' }}>{row.name}</td>
                  <td>{row.branch}</td>
                  <td>{row.time}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem', 
                      background: row.status === 'Terlambat' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: row.status === 'Terlambat' ? 'var(--error)' : 'var(--secondary)',
                      fontWeight: '700'
                    }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="content-card">
        <div className="content-header">
          <h2>Status Cabang</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { name: 'Cabang Madiun', count: '15 Karyawan', status: 'Open' },
            { name: 'Cabang Solo', count: '12 Karyawan', status: 'Open' },
            { name: 'Cabang Surabaya', count: '24 Karyawan', status: 'Open' },
            { name: 'Cabang Jakarta', count: '45 Karyawan', status: 'Open' },
            { name: 'Cabang Bandung', count: '18 Karyawan', status: 'Closed' },
          ].map((branch, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '12px' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{branch.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{branch.count}</div>
              </div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: branch.status === 'Open' ? 'var(--secondary)' : 'var(--error)' }}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

export const SACabang = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCabang, setSelectedCabang] = useState(null);

  const handleEdit = (cabang) => {
    setSelectedCabang(cabang);
    setShowEditModal(true);
  };

  const handleDelete = (cabang) => {
    setSelectedCabang(cabang);
    setShowDeleteModal(true);
  };

  return (
    <>
      <div className="stat-grid responsive-grid-3">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Cabang</h3>
            <div className="value">12</div>
          </div>
          <div className="stat-icon"><Building size={20} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Cabang Aktif</h3>
            <div className="value">11</div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--secondary)', background: 'rgba(16, 185, 129, 0.1)' }}><Building size={20} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Cabang Non-Aktif</h3>
            <div className="value">1</div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)' }}><Building size={20} /></div>
        </div>
      </div>

      <div className="content-card">
        <div className="content-header">
          <div>
            <h2>Daftar Cabang</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Kelola lokasi dan data operasional setiap outlet.</p>
          </div>
          <button className="action-btn" onClick={() => setShowAddModal(true)}>+ Tambah Cabang</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Cari nama cabang atau alamat..." 
              className="form-input" 
              style={{ padding: '0.75rem 1rem 0.75rem 2.5rem', fontSize: '0.9rem' }} 
            />
            <Filter size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <select className="form-input" style={{ width: '180px', padding: '0.75rem' }}>
            <option>Semua Status</option>
            <option>Aktif</option>
            <option>Non-Aktif</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '1rem' }}>Nama Cabang</th>
                <th>Alamat</th>
                <th>Admin Cabang</th>
                <th>Karyawan</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Cabang Madiun', address: 'Jl. Pahlawan No. 10', admin: 'Admin Madiun', staff: 15, status: 'Aktif' },
                { name: 'Cabang Solo', address: 'Jl. Slamet Riyadi No. 45', admin: 'Admin Solo', staff: 12, status: 'Aktif' },
                { name: 'Cabang Surabaya', address: 'Jl. Tunjungan No. 88', admin: 'Admin Surabaya', staff: 24, status: 'Aktif' },
                { name: 'Cabang Jakarta', address: 'Jl. Sudirman Kav. 52', admin: 'Admin Jakarta', staff: 45, status: 'Aktif' },
                { name: 'Cabang Bandung', address: 'Jl. Asia Afrika No. 12', admin: 'Admin Bandung', staff: 18, status: 'Non-Aktif' },
              ].map((cabang, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                  <td style={{ padding: '1.25rem 1rem', fontWeight: '700' }}>{cabang.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{cabang.address}</td>
                  <td>{cabang.admin}</td>
                  <td>{cabang.staff} Orang</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem', 
                      background: cabang.status === 'Non-Aktif' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: cabang.status === 'Non-Aktif' ? 'var(--error)' : 'var(--secondary)',
                      fontWeight: '700'
                    }}>
                      {cabang.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => handleEdit(cabang)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}
                    >
                      Edit
                    </button>
                    <span style={{ margin: '0 0.5rem', color: 'var(--surface-border)' }}>|</span>
                    <button 
                      onClick={() => handleDelete(cabang)}
                      style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{showAddModal ? 'Tambah Cabang Baru' : 'Edit Data Cabang'}</h2>
              <button className="modal-close" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">Nama Cabang</label>
                <input type="text" className="form-input" placeholder="Contoh: Cabang Malang" defaultValue={showEditModal ? selectedCabang?.name : ''} style={{ paddingLeft: '1rem' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">Alamat Cabang</label>
                <input type="text" className="form-input" placeholder="Masukkan alamat lengkap" defaultValue={showEditModal ? selectedCabang?.address : ''} style={{ paddingLeft: '1rem' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">Admin Cabang</label>
                <input type="text" className="form-input" placeholder="Pilih Admin" defaultValue={showEditModal ? selectedCabang?.admin : ''} style={{ paddingLeft: '1rem' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">Status Cabang</label>
                <select className="form-input" style={{ paddingLeft: '1rem' }} defaultValue={showEditModal ? selectedCabang?.status : 'Aktif'}>
                  <option>Aktif</option>
                  <option>Non-Aktif</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Batal</button>
              <button className="btn-submit" style={{ width: 'auto', marginTop: 0 }} onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
                {showAddModal ? 'Simpan Cabang' : 'Update Cabang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>
              <X size={48} style={{ margin: '0 auto', border: '2px solid var(--error)', borderRadius: '50%', padding: '0.5rem' }} />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>Konfirmasi Hapus</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Apakah Anda yakin ingin menghapus <strong>{selectedCabang?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setShowDeleteModal(false)}>Batal</button>
              <button className="btn-danger" onClick={() => setShowDeleteModal(false)}>Hapus Sekarang</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export const SAKaryawan = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedKaryawan, setSelectedKaryawan] = useState(null);

  const handleEdit = (karyawan) => {
    setSelectedKaryawan(karyawan);
    setShowEditModal(true);
  };

  const handleDelete = (karyawan) => {
    setSelectedKaryawan(karyawan);
    setShowDeleteModal(true);
  };

  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Karyawan</h3>
            <div className="value">156</div>
          </div>
          <div className="stat-icon"><Users size={20} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Karyawan Tetap</h3>
            <div className="value">98</div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--secondary)', background: 'rgba(16, 185, 129, 0.1)' }}><Users size={20} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Karyawan Kontrak</h3>
            <div className="value">58</div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--primary)', background: 'rgba(16, 185, 129, 0.1)' }}><Users size={20} /></div>
        </div>
        <div className="stat-info-card" style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '0.75rem', borderRadius: '12px' }}>
              <Clock size={20} />
           </div>
           <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Menunggu Aktivasi</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>4</div>
           </div>
        </div>
      </div>

      <div className="content-card">
        <div className="content-header">
          <div>
            <h2>Data Karyawan Seluruh Cabang</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Kelola profil, jabatan, dan status kepegawaian.</p>
          </div>
          <button className="action-btn" onClick={() => setShowAddModal(true)}>+ Tambah Karyawan</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Cari nama atau NIK..." 
              className="form-input" 
              style={{ padding: '0.75rem 1rem 0.75rem 2.5rem', fontSize: '0.9rem' }} 
            />
            <Filter size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <select className="form-input" style={{ width: '180px', padding: '0.75rem' }}>
            <option>Semua Cabang</option>
            <option>Cabang Madiun</option>
            <option>Cabang Solo</option>
            <option>Cabang Surabaya</option>
          </select>
          <select className="form-input" style={{ width: '180px', padding: '0.75rem' }}>
            <option>Semua Jabatan</option>
            <option>Manager</option>
            <option>Kasir</option>
            <option>Koki</option>
            <option>Waiter</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '1rem' }}>Nama Karyawan</th>
                <th>Jabatan</th>
                <th>Cabang</th>
                <th>Tanggal Gabung</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Budi Santoso', pos: 'Kasir', branch: 'Madiun', date: '12 Jan 2023', status: 'Tetap' },
                { name: 'Siti Aminah', pos: 'Manager', branch: 'Solo', date: '05 Mar 2022', status: 'Tetap' },
                { name: 'Andi Wijaya', pos: 'Koki', branch: 'Madiun', date: '20 Jun 2023', status: 'Kontrak' },
                { name: 'Dewi Lestari', pos: 'Waiter', branch: 'Surabaya', date: '15 Sep 2023', status: 'Tetap' },
                { name: 'Rizky Pratama', pos: 'Kasir', branch: 'Solo', date: '01 Nov 2023', status: 'Kontrak' },
              ].map((karyawan, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>{karyawan.name.charAt(0)}</div>
                      <div style={{ fontWeight: '700' }}>{karyawan.name}</div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{karyawan.pos}</td>
                  <td>{karyawan.branch}</td>
                  <td>{karyawan.date}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem', 
                      background: karyawan.status === 'Kontrak' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.2)',
                      color: 'var(--secondary)',
                      fontWeight: '700'
                    }}>
                      {karyawan.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => handleEdit(karyawan)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}
                    >
                      Edit
                    </button>
                    <span style={{ margin: '0 0.5rem', color: 'var(--surface-border)' }}>|</span>
                    <button 
                      onClick={() => handleDelete(karyawan)}
                      style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT KARYAWAN */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{showAddModal ? 'Tambah Karyawan Baru' : 'Edit Profil Karyawan'}</h2>
              <button className="modal-close" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input type="text" className="form-input" placeholder="Masukkan nama" defaultValue={showEditModal ? selectedKaryawan?.name : ''} style={{ paddingLeft: '1rem' }} />
              </div>
              <div className="form-group">
                <label className="form-label">NIK (Nomor Induk Karyawan)</label>
                <input type="text" className="form-input" placeholder="Contoh: WRQ-001" style={{ paddingLeft: '1rem' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="email@warungrequest.com" style={{ paddingLeft: '1rem' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Nomor WhatsApp</label>
                <input type="text" className="form-input" placeholder="0812..." style={{ paddingLeft: '1rem' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Cabang Penempatan</label>
                <select className="form-input" style={{ paddingLeft: '1rem' }} defaultValue={showEditModal ? selectedKaryawan?.branch : ''}>
                  <option>Pilih Cabang</option>
                  <option>Cabang Madiun</option>
                  <option>Cabang Solo</option>
                  <option>Cabang Surabaya</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Jabatan</label>
                <select className="form-input" style={{ paddingLeft: '1rem' }} defaultValue={showEditModal ? selectedKaryawan?.pos : ''}>
                  <option>Pilih Jabatan</option>
                  <option>Manager</option>
                  <option>Kasir</option>
                  <option>Koki</option>
                  <option>Waiter</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status Kepegawaian</label>
                <select className="form-input" style={{ paddingLeft: '1rem' }} defaultValue={showEditModal ? selectedKaryawan?.status : 'Kontrak'}>
                  <option>Kontrak</option>
                  <option>Tetap</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Role Login</label>
                <select className="form-input" style={{ paddingLeft: '1rem' }}>
                  <option>Karyawan</option>
                  <option>Admin Cabang</option>
                  <option>Super Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Batal</button>
              <button className="btn-submit" style={{ width: 'auto', marginTop: 0 }} onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
                {showAddModal ? 'Daftarkan Karyawan' : 'Update Profil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>
              <X size={48} style={{ margin: '0 auto', border: '2px solid var(--error)', borderRadius: '50%', padding: '0.5rem' }} />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>Konfirmasi Hapus Karyawan</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Apakah Anda yakin ingin menghapus <strong>{selectedKaryawan?.name}</strong> dari sistem? Semua data riwayat absensinya akan ikut terhapus.
            </p>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setShowDeleteModal(false)}>Batal</button>
              <button className="btn-danger" onClick={() => setShowDeleteModal(false)}>Hapus Karyawan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export const SAShift = () => {
  const [activeTab, setActiveTab] = useState('shift');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

  // Fungsi untuk mendapatkan jumlah hari dalam sebulan secara akurat
  const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  
  const generateShifts = () => {
    return Array.from({ length: 31 }, () => {
      const r = Math.random();
      if (r > 0.6) return 'Pagi';
      if (r > 0.3) return 'Malam';
      return 'Libur';
    });
  };

  const [karyawanShift] = useState([
    { name: 'Andi Wijaya', shifts: generateShifts() },
    { name: 'Rizky Pratama', shifts: generateShifts() },
    { name: 'Eko Saputra', shifts: generateShifts() },
    { name: 'Bambang Pamungkas', shifts: generateShifts() },
    { name: 'Slamet Riyadi', shifts: generateShifts() },
  ]);

  return (
    <>
      <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--surface-border)' }}>
          <button 
            onClick={() => setActiveTab('fulltime')}
            style={{ 
              flex: 1, padding: '1.25rem', border: 'none', background: 'none', cursor: 'pointer',
              color: activeTab === 'fulltime' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: '700', borderBottom: activeTab === 'fulltime' ? '2px solid var(--primary)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Karyawan Full Time (07:00 - 17:00)
          </button>
          <button 
            onClick={() => setActiveTab('shift')}
            style={{ 
              flex: 1, padding: '1.25rem', border: 'none', background: 'none', cursor: 'pointer',
              color: activeTab === 'shift' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: '700', borderBottom: activeTab === 'shift' ? '2px solid var(--primary)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Karyawan Shift (Pagi / Malam)
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'fulltime' ? (
            <div>
              <div className="content-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                  <h2>Jadwal Full Time</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Karyawan dengan jam kerja tetap 07:00 - 17:00 (Break 12:00 - 13:00).</p>
                </div>
                <button className="action-btn" style={{ background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--surface-border)' }}>Download Jadwal</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '1rem' }}>Nama Karyawan</th>
                      <th>Jabatan</th>
                      <th>Cabang</th>
                      <th>Jam Kerja</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Budi Santoso', pos: 'Kasir', branch: 'Madiun', time: '07:00 - 17:00', status: 'Active' },
                      { name: 'Siti Aminah', pos: 'Manager', branch: 'Solo', time: '07:00 - 17:00', status: 'Active' },
                      { name: 'Dewi Lestari', pos: 'Waiter', branch: 'Surabaya', time: '07:00 - 17:00', status: 'Active' },
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>{row.name}</td>
                        <td>{row.pos}</td>
                        <td>{row.branch}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: '700' }}>{row.time}</td>
                        <td><span style={{ color: 'var(--secondary)', fontWeight: '700' }}>{row.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <div className="content-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                  <h2>Matrix Penjadwalan Shift</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Atur shift pagi atau malam untuk setiap karyawan per tanggal.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <select 
                    className="form-input" 
                    style={{ width: '140px', padding: '0.5rem' }}
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                   >
                      {months.map((m, idx) => (
                        <option key={idx} value={idx}>{m}</option>
                      ))}
                   </select>
                   <select 
                    className="form-input" 
                    style={{ width: '100px', padding: '0.5rem' }}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                   >
                      {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                   </select>
                   <button className="action-btn">Simpan Perubahan</button>
                </div>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid var(--surface-border)', borderRadius: '12px' }}>
                <table style={{ borderCollapse: 'collapse', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-color)', borderBottom: '1px solid var(--surface-border)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', borderRight: '1px solid var(--surface-border)', minWidth: '180px', position: 'sticky', left: 0, background: 'var(--bg-color)', zIndex: 2 }}>Karyawan</th>
                      {days.map(d => (
                        <th key={d} style={{ padding: '0.75rem', fontSize: '0.75rem', minWidth: '110px', borderRight: '1px solid var(--surface-border)' }}>
                          Tgl {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {karyawanShift.map((k, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                        <td style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', borderRight: '1px solid var(--surface-border)', position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1 }}>{k.name}</td>
                        {days.map((d, idx) => {
                          const s = k.shifts[idx] || 'Libur';
                          return (
                            <td key={idx} style={{ padding: '0.5rem', borderRight: '1px solid var(--surface-border)' }}>
                              <select 
                                defaultValue={s}
                                style={{ 
                                  width: '100%', padding: '0.5rem', borderRadius: '8px', border: 'none',
                                  background: s === 'Pagi' ? 'rgba(16, 185, 129, 0.1)' : s === 'Malam' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                  color: s === 'Pagi' ? 'var(--secondary)' : s === 'Malam' ? '#3B82F6' : 'var(--error)',
                                  fontWeight: '700', fontSize: '0.8rem', outline: 'none', cursor: 'pointer',
                                  textAlign: 'center'
                                }}
                              >
                                <option>Pagi</option>
                                <option>Malam</option>
                                <option>Libur</option>
                              </select>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.2)' }}></div>
                    <span>Pagi: 07:00 - 15:00</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(59, 130, 246, 0.2)' }}></div>
                    <span>Malam: 15:00 - 23:00</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.2)' }}></div>
                    <span>Libur: Off Day</span>
                 </div>
                 <div style={{ marginLeft: 'auto', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                    * Geser tabel ke kanan untuk melihat tanggal berikutnya
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
export const SALaporan = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <>
      <div className="content-header" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
        <div>
          <h2>Laporan Absensi Bulanan</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rekapitulasi kehadiran karyawan dari seluruh cabang.</p>
        </div>
        <button className="action-btn" style={{ background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building size={18} /> Ekspor Laporan (Excel)
        </button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Rata-rata Kehadiran</h3>
            <div className="value">94.2%</div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--secondary)' }}><Users size={20} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Terlambat</h3>
            <div className="value">12 Kali</div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--error)' }}><Clock size={20} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Izin/Cuti</h3>
            <div className="value">8 Kali</div>
          </div>
          <div className="stat-icon" style={{ color: '#F59E0B' }}><CalendarIcon size={20} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Total Jam Kerja</h3>
            <div className="value">1.240 Jam</div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--primary)' }}><Building size={20} /></div>
        </div>
      </div>

      <div className="content-card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
            <label className="form-label">Periode Bulan</label>
            <select className="form-input" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '100px' }}>
            <label className="form-label">Tahun</label>
            <select className="form-input" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
            <label className="form-label">Filter Cabang</label>
            <select className="form-input">
              <option>Semua Cabang</option>
              <option>Cabang Madiun</option>
              <option>Cabang Solo</option>
              <option>Cabang Surabaya</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
            <label className="form-label">Cari Nama</label>
            <input type="text" className="form-input" placeholder="Ketik nama karyawan..." />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '1rem' }}>NIK & Nama</th>
                <th>Cabang</th>
                <th style={{ textAlign: 'center' }}>Hadir</th>
                <th style={{ textAlign: 'center' }}>Sakit</th>
                <th style={{ textAlign: 'center' }}>Izin</th>
                <th style={{ textAlign: 'center' }}>Alpa</th>
                <th style={{ textAlign: 'center' }}>Terlambat</th>
                <th style={{ textAlign: 'right', paddingRight: '1rem' }}>Persentase</th>
              </tr>
            </thead>
            <tbody>
              {[
                { nik: 'WRQ-001', name: 'Budi Santoso', branch: 'Madiun', hadir: 22, sakit: 1, izin: 0, alpa: 0, late: 2, pct: '95%' },
                { nik: 'WRQ-002', name: 'Siti Aminah', branch: 'Solo', hadir: 23, sakit: 0, izin: 0, alpa: 0, late: 0, pct: '100%' },
                { nik: 'WRQ-003', name: 'Andi Wijaya', branch: 'Madiun', hadir: 20, sakit: 0, izin: 2, alpa: 1, late: 5, pct: '86%' },
                { nik: 'WRQ-004', name: 'Dewi Lestari', branch: 'Surabaya', hadir: 23, sakit: 0, izin: 0, alpa: 0, late: 1, pct: '98%' },
                { nik: 'WRQ-005', name: 'Rizky Pratama', branch: 'Solo', hadir: 21, sakit: 2, izin: 0, alpa: 0, late: 4, pct: '91%' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ fontWeight: '700' }}>{row.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.nik}</div>
                  </td>
                  <td>{row.branch}</td>
                  <td style={{ textAlign: 'center', fontWeight: '700', color: 'var(--secondary)' }}>{row.hadir}</td>
                  <td style={{ textAlign: 'center' }}>{row.sakit}</td>
                  <td style={{ textAlign: 'center' }}>{row.izin}</td>
                  <td style={{ textAlign: 'center', color: row.alpa > 0 ? 'var(--error)' : 'inherit' }}>{row.alpa}</td>
                  <td style={{ textAlign: 'center', color: row.late > 0 ? '#F59E0B' : 'inherit' }}>{row.late}</td>
                  <td style={{ textAlign: 'right', paddingRight: '1rem', fontWeight: '800' }}>{row.pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
export const SAAdmin = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  
  return (
    <>
      <div className="content-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2>Manajemen Akun Admin</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Kelola hak akses untuk Admin Cabang dan Super Admin lainnya.</p>
        </div>
        <button className="action-btn" onClick={() => setShowAddModal(true)}>+ Tambah Admin</button>
      </div>

      <div className="content-card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '1rem' }}>Nama Admin</th>
                <th>Role</th>
                <th>Akses Cabang</th>
                <th>Email</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Abi Manyu', role: 'Super Admin', branch: 'Semua Cabang', email: 'abi@kebonpiring.com', status: 'Aktif' },
                { name: 'Admin Madiun', role: 'Admin Cabang', branch: 'Cabang Madiun', email: 'madiun@kebonpiring.com', status: 'Aktif' },
                { name: 'Admin Solo', role: 'Admin Cabang', branch: 'Cabang Solo', email: 'solo@kebonpiring.com', status: 'Aktif' },
              ].map((admin, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                  <td style={{ padding: '1.25rem 1rem', fontWeight: '700' }}>{admin.name}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700',
                      background: admin.role === 'Super Admin' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: admin.role === 'Super Admin' ? 'var(--secondary)' : '#3B82F6'
                    }}>
                      {admin.role}
                    </span>
                  </td>
                  <td>{admin.branch}</td>
                  <td>{admin.email}</td>
                  <td><span style={{ color: 'var(--secondary)', fontWeight: '700' }}>{admin.status}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginRight: '0.5rem' }}><Edit size={16} /></button>
                    <button style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Tambah Akun Admin</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <input type="text" className="form-input" placeholder="Nama admin" style={{ paddingLeft: '1rem' }} />
               </div>
               <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" placeholder="email@warungrequest.com" style={{ paddingLeft: '1rem' }} />
               </div>
               <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" placeholder="********" style={{ paddingLeft: '1rem' }} />
               </div>
               <div className="form-group">
                  <label className="form-label">Role Akses</label>
                  <select className="form-input" style={{ paddingLeft: '1rem' }}>
                     <option>Admin Cabang</option>
                     <option>Super Admin</option>
                  </select>
               </div>
               <div className="form-group">
                  <label className="form-label">Penempatan Cabang</label>
                  <select className="form-input" style={{ paddingLeft: '1rem' }}>
                     <option>Cabang Madiun</option>
                     <option>Cabang Solo</option>
                     <option>Cabang Surabaya</option>
                  </select>
               </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowAddModal(false)}>Batal</button>
              <button className="btn-submit" style={{ width: 'auto', marginTop: 0 }} onClick={() => setShowAddModal(false)}>Simpan Akun</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const SAPengaturan = () => {
  const [activeTab, setActiveTab] = useState('umum');
  
  return (
    <>
      <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface)' }}>
          {[
            { id: 'umum', label: 'Umum', icon: Globe },
            { id: 'jam', label: 'Jam Kerja & Shift', icon: Clock },
            { id: 'radius', label: 'Radius & Lokasi', icon: MapPin },
            { id: 'keamanan', label: 'Keamanan', icon: Shield },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                flex: 1, padding: '1.25rem', border: 'none', background: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: '700', borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: '2rem' }}>
          {activeTab === 'umum' && (
            <div style={{ maxWidth: '600px' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Konfigurasi Aplikasi</h3>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Nama Aplikasi</label>
                <input type="text" className="form-input" defaultValue="Warung Request App" style={{ paddingLeft: '1rem' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Logo Instansi</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ width: '80px', height: '80px', border: '1px solid var(--surface-border)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src="/logo.png" alt="Logo" style={{ width: '60px' }} />
                   </div>
                   <button className="action-btn" style={{ background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--surface-border)' }}>Ganti Logo</button>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Email Notifikasi Sistem</label>
                <input type="email" className="form-input" defaultValue="noreply@kebonpiring.com" style={{ paddingLeft: '1rem' }} />
              </div>
              <button className="action-btn"><Save size={18} /> Simpan Perubahan</button>
            </div>
          )}

          {activeTab === 'jam' && (
            <div style={{ maxWidth: '600px' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Pengaturan Waktu Kerja</h3>
              <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                 <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Karyawan Full Time</h4>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                       <label className="form-label">Jam Masuk</label>
                       <input type="time" className="form-input" defaultValue="07:00" style={{ paddingLeft: '1rem' }} />
                    </div>
                    <div className="form-group">
                       <label className="form-label">Jam Pulang</label>
                       <input type="time" className="form-input" defaultValue="17:00" style={{ paddingLeft: '1rem' }} />
                    </div>
                    <div className="form-group">
                       <label className="form-label">Mulai Istirahat</label>
                       <input type="time" className="form-input" defaultValue="12:00" style={{ paddingLeft: '1rem' }} />
                    </div>
                    <div className="form-group">
                       <label className="form-label">Selesai Istirahat</label>
                       <input type="time" className="form-input" defaultValue="13:00" style={{ paddingLeft: '1rem' }} />
                    </div>
                 </div>
              </div>

              <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                 <h4 style={{ marginBottom: '1rem', color: '#3B82F6' }}>Waktu Shift</h4>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                       <label className="form-label">Shift Pagi (Mulai)</label>
                       <input type="time" className="form-input" defaultValue="07:00" style={{ paddingLeft: '1rem' }} />
                    </div>
                    <div className="form-group">
                       <label className="form-label">Shift Pagi (Selesai)</label>
                       <input type="time" className="form-input" defaultValue="15:00" style={{ paddingLeft: '1rem' }} />
                    </div>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                       <label className="form-label">Shift Malam (Mulai)</label>
                       <input type="time" className="form-input" defaultValue="15:00" style={{ paddingLeft: '1rem' }} />
                    </div>
                    <div className="form-group">
                       <label className="form-label">Shift Malam (Selesai)</label>
                       <input type="time" className="form-input" defaultValue="23:00" style={{ paddingLeft: '1rem' }} />
                    </div>
                 </div>
              </div>
              <button className="action-btn"><Save size={18} /> Simpan Pengaturan Jam</button>
            </div>
          )}

          {activeTab === 'radius' && (
            <div style={{ maxWidth: '600px' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Pembatasan Geofencing</h3>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Radius Absensi Maksimal (Meter)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <input type="range" min="10" max="500" step="10" defaultValue="50" style={{ flex: 1, accentColor: 'var(--primary)' }} />
                   <div style={{ width: '80px', textAlign: 'center', fontWeight: '800', fontSize: '1.2rem', color: 'var(--primary)' }}>50m</div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Karyawan hanya bisa absen jika berada dalam radius ini dari titik lokasi cabang.</p>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px dashed var(--secondary)', marginBottom: '2rem' }}>
                 <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong>Note:</strong> Pastikan setiap cabang sudah memiliki koordinat GPS yang valid di menu Manajemen Cabang.
                 </p>
              </div>
              <button className="action-btn"><Save size={18} /> Simpan Konfigurasi Lokasi</button>
            </div>
          )}

          {activeTab === 'keamanan' && (
            <div style={{ maxWidth: '600px' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Keamanan & Autentikasi</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                       <div style={{ fontWeight: '700' }}>Wajibkan Scan Wajah</div>
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gunakan Face Recognition untuk verifikasi kehadiran.</div>
                    </div>
                    <div style={{ width: '44px', height: '24px', background: 'var(--primary)', borderRadius: '12px', position: 'relative' }}>
                       <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', right: '3px', top: '3px' }}></div>
                    </div>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                       <div style={{ fontWeight: '700' }}>Deteksi Mock Location (Fake GPS)</div>
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Blokir absen jika menggunakan aplikasi pemalsu lokasi.</div>
                    </div>
                    <div style={{ width: '44px', height: '24px', background: 'var(--primary)', borderRadius: '12px', position: 'relative' }}>
                       <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', right: '3px', top: '3px' }}></div>
                    </div>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                       <div style={{ fontWeight: '700' }}>Batas Terlambat (Menit)</div>
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Toleransi keterlambatan sebelum dianggap telat.</div>
                    </div>
                    <input type="number" className="form-input" defaultValue="15" style={{ width: '80px', textAlign: 'center' }} />
                 </div>
              </div>
              <button className="action-btn" style={{ marginTop: '2rem' }}><Save size={18} /> Update Keamanan</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ADMIN CABANG PAGES
export const ACDashboard = () => (
  <>
    <div className="stat-grid">
      <div className="stat-card">
        <div className="stat-info">
          <h3>Karyawan (Madiun)</h3>
          <div className="value">15</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Total di Cabang Ini</div>
        </div>
        <div className="stat-icon"><Users size={24} /></div>
      </div>
      <div className="stat-card">
        <div className="stat-info">
          <h3>Hadir Hari Ini</h3>
          <div className="value">12</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>3 Orang Belum Absen</div>
        </div>
        <div className="stat-icon"><ScanFace size={24} /></div>
      </div>
      <div className="stat-card">
        <div className="stat-info">
          <h3>Terlambat</h3>
          <div className="value">2</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '0.25rem' }}>Perlu Diperhatikan</div>
        </div>
        <div className="stat-icon" style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)' }}><Clock size={24} /></div>
      </div>
      <div className="stat-card">
        <div className="stat-info">
          <h3>Izin/Cuti</h3>
          <div className="value">1</div>
          <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: '0.25rem' }}>Sedang Berlangsung</div>
        </div>
        <div className="stat-icon" style={{ color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)' }}><CalendarIcon size={24} /></div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
       <div className="content-card">
          <div className="content-header">
             <h2>Log Absensi Terbaru</h2>
             <button className="action-btn" style={{ background: 'none', color: 'var(--primary)', border: 'none' }}>Lihat Semua</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {[
               { name: 'Budi Santoso', time: '07:55 AM', status: 'Hadir (Tepat Waktu)' },
               { name: 'Slamet Riyadi', time: '08:15 AM', status: 'Terlambat 15 Menit' },
               { name: 'Andi Wijaya', time: '07:45 AM', status: 'Hadir (Tepat Waktu)' },
               { name: 'Dewi Lestari', time: '---', status: 'Belum Check-in' },
             ].map((log, i) => (
               <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                     <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>{log.name.charAt(0)}</div>
                     <div>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{log.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.status}</div>
                     </div>
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--primary)' }}>{log.time}</div>
               </div>
             ))}
          </div>
       </div>
       <div className="content-card">
          <div className="content-header">
             <h2>Informasi Cabang</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Nama Outlet</label>
                <div style={{ fontWeight: '700' }}>Warung Request - Cabang Madiun</div>
             </div>
             <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Lokasi Koordinat</label>
                <div style={{ fontWeight: '700', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <MapPin size={16} /> -7.6298, 111.5239
                </div>
             </div>
             <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Manager Cabang</label>
                <div style={{ fontWeight: '700' }}>Abi Manyu</div>
             </div>
             <button className="action-btn" style={{ width: '100%', justifyContent: 'center' }}>Update Data Lokasi</button>
          </div>
       </div>
    </div>
  </>
);

export const ACKaryawan = () => {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <div className="content-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2>Karyawan Cabang Madiun</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Kelola data karyawan khusus untuk outlet Anda.</p>
        </div>
        <button className="action-btn" onClick={() => setShowModal(true)}>+ Karyawan Baru</button>
      </div>

      <div className="content-card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
           <input type="text" className="form-input" placeholder="Cari nama atau NIK..." style={{ flex: 1, paddingLeft: '1rem' }} />
           <select className="form-input" style={{ width: '180px', paddingLeft: '1rem' }}>
              <option>Semua Jabatan</option>
              <option>Kasir</option>
              <option>Waiter</option>
              <option>Koki</option>
           </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '1rem' }}>Nama Karyawan</th>
                <th>Jabatan</th>
                <th>Tipe Kerja</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Andi Wijaya', pos: 'Koki', type: 'Shift', status: 'Aktif' },
                { name: 'Budi Santoso', pos: 'Kasir', type: 'Full Time', status: 'Aktif' },
                { name: 'Dewi Lestari', pos: 'Waiter', type: 'Full Time', status: 'Aktif' },
                { name: 'Eko Saputra', pos: 'Waiter', type: 'Shift', status: 'Cuti' },
              ].map((k, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                  <td style={{ padding: '1.25rem 1rem', fontWeight: '700' }}>{k.name}</td>
                  <td>{k.pos}</td>
                  <td>{k.type}</td>
                  <td><span style={{ color: k.status === 'Cuti' ? '#F59E0B' : 'var(--secondary)', fontWeight: '700' }}>{k.status}</span></td>
                  <td style={{ textAlign: 'right' }}>
                     <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginRight: '0.5rem' }}><Edit size={16} /></button>
                     <button style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export const ACAbsensiHariIni = () => (
  <>
    <div className="content-header" style={{ marginBottom: '1.5rem' }}>
      <div>
        <h2>Monitoring Absensi Real-time</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pantau kehadiran karyawan hari ini secara langsung.</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: '700' }}>
         <div style={{ width: '8px', height: '8px', background: 'var(--secondary)', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
         Live Updating
      </div>
    </div>

    <div className="content-card">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th style={{ padding: '1rem' }}>Nama Karyawan</th>
              <th>Jadwal</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Status</th>
              <th>Lokasi</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Budi Santoso', shift: '07:00 - 17:00', in: '06:55', out: '---', status: 'Hadir', loc: 'Within Radius' },
              { name: 'Andi Wijaya', shift: 'Pagi (07:00 - 15:00)', in: '07:15', out: '---', status: 'Terlambat', loc: 'Within Radius' },
              { name: 'Dewi Lestari', shift: '07:00 - 17:00', in: '---', out: '---', status: 'Belum Absen', loc: '---' },
              { name: 'Slamet Riyadi', shift: 'Malam (15:00 - 23:00)', in: '---', out: '---', status: 'Belum Jadwal', loc: '---' },
            ].map((a, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                <td style={{ padding: '1.25rem 1rem', fontWeight: '700' }}>{a.name}</td>
                <td style={{ fontSize: '0.8rem' }}>{a.shift}</td>
                <td style={{ fontWeight: '800', color: a.in !== '---' ? 'var(--primary)' : 'var(--text-muted)' }}>{a.in}</td>
                <td style={{ fontWeight: '800', color: a.out !== '---' ? 'var(--primary)' : 'var(--text-muted)' }}>{a.out}</td>
                <td>
                   <span style={{ 
                     padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700',
                     background: a.status === 'Hadir' ? 'rgba(16, 185, 129, 0.1)' : a.status === 'Terlambat' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0,0,0,0.05)',
                     color: a.status === 'Hadir' ? 'var(--secondary)' : a.status === 'Terlambat' ? 'var(--error)' : 'var(--text-muted)'
                   }}>
                      {a.status}
                   </span>
                </td>
                <td style={{ fontSize: '0.75rem', color: a.loc === 'Within Radius' ? 'var(--secondary)' : 'var(--text-muted)' }}>{a.loc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
);

export const ACLaporan = () => {
  const [month, setMonth] = useState(new Date().getMonth());
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  return (
    <>
      <div className="content-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2>Laporan Absensi Bulanan</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Unduh rekap kehadiran untuk keperluan penggajian.</p>
        </div>
        <button className="action-btn" style={{ background: '#10B981', color: 'white' }}>
           <Save size={18} /> Download Excel (.xlsx)
        </button>
      </div>

      <div className="content-card">
         <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <select className="form-input" value={month} onChange={(e) => setMonth(parseInt(e.target.value))} style={{ width: '200px', paddingLeft: '1rem' }}>
               {months.map((m, i) => <option key={i} value={i}>{m} 2026</option>)}
            </select>
         </div>
         <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1rem' }}>Nama Karyawan</th>
                  <th style={{ textAlign: 'center' }}>Hadir</th>
                  <th style={{ textAlign: 'center' }}>Izin</th>
                  <th style={{ textAlign: 'center' }}>Alpa</th>
                  <th style={{ textAlign: 'center' }}>Terlambat</th>
                  <th style={{ textAlign: 'right', paddingRight: '1rem' }}>Performa</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Budi Santoso', hadir: 24, izin: 0, alpa: 0, late: 1, perf: '98%' },
                  { name: 'Andi Wijaya', hadir: 22, izin: 2, alpa: 0, late: 5, perf: '92%' },
                  { name: 'Dewi Lestari', hadir: 25, izin: 0, alpa: 0, late: 0, perf: '100%' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '1.25rem 1rem', fontWeight: '700' }}>{row.name}</td>
                    <td style={{ textAlign: 'center' }}>{row.hadir}</td>
                    <td style={{ textAlign: 'center' }}>{row.izin}</td>
                    <td style={{ textAlign: 'center' }}>{row.alpa}</td>
                    <td style={{ textAlign: 'center' }}>{row.late}</td>
                    <td style={{ textAlign: 'right', paddingRight: '1rem', fontWeight: '800', color: 'var(--primary)' }}>{row.perf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>
    </>
  );
};

export const ACShift = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const generateShifts = () => Array.from({ length: 31 }, () => {
    const r = Math.random();
    return r > 0.6 ? 'Pagi' : r > 0.3 ? 'Malam' : 'Libur';
  });

  return (
    <>
      <div className="content-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2>Jadwal Shift Karyawan</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Melihat jadwal kerja karyawan cabang Madiun (Read Only).</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
           <select className="form-input" style={{ width: '140px', padding: '0.5rem' }} value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
              {months.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
           </select>
           <select className="form-input" style={{ width: '100px', padding: '0.5rem' }} value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
           </select>
        </div>
      </div>

      <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', borderBottom: '1px solid var(--surface-border)' }}>
          <table style={{ borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ background: 'var(--bg-color)', borderBottom: '1px solid var(--surface-border)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', borderRight: '1px solid var(--surface-border)', minWidth: '180px', position: 'sticky', left: 0, background: 'var(--bg-color)', zIndex: 2 }}>Karyawan</th>
                {days.map(d => <th key={d} style={{ padding: '0.75rem', fontSize: '0.75rem', minWidth: '110px', borderRight: '1px solid var(--surface-border)' }}>Tgl {d}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Andi Wijaya', shifts: generateShifts() },
                { name: 'Budi Santoso', shifts: generateShifts() },
                { name: 'Dewi Lestari', shifts: generateShifts() },
              ].map((k, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', borderRight: '1px solid var(--surface-border)', position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1 }}>{k.name}</td>
                  {days.map((d, idx) => {
                    const s = k.shifts[idx] || 'Libur';
                    return (
                      <td key={idx} style={{ padding: '0.5rem', borderRight: '1px solid var(--surface-border)' }}>
                        <div style={{ 
                          padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700',
                          background: s === 'Pagi' ? 'rgba(16, 185, 129, 0.1)' : s === 'Malam' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: s === 'Pagi' ? 'var(--secondary)' : s === 'Malam' ? '#3B82F6' : 'var(--error)',
                          textAlign: 'center', opacity: 0.8
                        }}>
                          {s}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
           <span>* Jadwal ini diatur oleh Super Admin dan hanya dapat dilihat oleh Admin Cabang.</span>
        </div>
      </div>
    </>
  );
};

export const ACProfil = () => {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <>
      <div className="content-header" style={{ marginBottom: '1.5rem' }}>
        <h2>Profil Admin Cabang</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
         <div className="content-card" style={{ textAlign: 'center' }}>
            <div className="avatar" style={{ width: '100px', height: '100px', fontSize: '2.5rem', margin: '0 auto 1.5rem' }}>AM</div>
            <h3 style={{ marginBottom: '0.25rem' }}>Abi Manyu</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Manager Cabang Madiun</p>
            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1.5rem' }}>
               <button className="action-btn" style={{ width: '100%', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--surface-border)' }}>Ganti Foto Profil</button>
            </div>
         </div>
         <div className="content-card">
            <h3>Informasi Akun</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
               <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="text" className="form-input" defaultValue="abi@kebonpiring.com" disabled style={{ paddingLeft: '1rem', opacity: 0.7 }} />
               </div>
               <div className="form-group">
                  <label className="form-label">WhatsApp</label>
                  <input type="text" className="form-input" defaultValue="08123456789" style={{ paddingLeft: '1rem' }} />
               </div>
               <div className="form-group">
                  <label className="form-label">Password Baru</label>
                  <input type="password" className="form-input" placeholder="Isi untuk ganti password" style={{ paddingLeft: '1rem' }} />
               </div>
               <div className="form-group">
                  <label className="form-label">Konfirmasi Password</label>
                  <input type="password" className="form-input" placeholder="Ulangi password baru" style={{ paddingLeft: '1rem' }} />
               </div>
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Mode Tampilan</span>
                  <button className="theme-toggle" onClick={toggleTheme} style={{ background: 'var(--bg-color)', border: '1px solid var(--surface-border)', borderRadius: '20px', padding: '0.4rem 1rem' }}>
                     {isDark ? 'Dark Mode' : 'Light Mode'}
                  </button>
               </div>
               <button className="action-btn"><Save size={18} /> Simpan Perubahan</button>
            </div>
         </div>
      </div>
    </>
  );
};



export const KaryawanDashboard = () => (
  <>
    <div className="mobile-header">
      <div className="user-greeting">
        <p>Halo, Selamat Pagi!</p>
        <h1>Budi Santoso</h1>
      </div>
      <div className="avatar">BS</div>
    </div>
    
    <div className="page-container" style={{ paddingTop: '1rem' }}>
       <div style={{ background: 'var(--primary)', padding: '1.5rem', borderRadius: '20px', color: 'white', marginBottom: '1.5rem', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>Shift Hari Ini</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem' }}>Shift Pagi (07:00 - 15:00)</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.15)', padding: '1rem', borderRadius: '12px' }}>
             <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Status</div>
                <div style={{ fontWeight: '700' }}>Belum Absen</div>
             </div>
             <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.3)' }}></div>
             <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Lokasi</div>
                <div style={{ fontWeight: '700' }}>Cabang Madiun</div>
             </div>
          </div>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Hadir', value: '22', sub: 'Hari ini', icon: Check, color: '#10B981' },
            { label: 'Terlambat', value: '2', sub: 'Bulan ini', icon: Clock, color: '#F59E0B' },
            { label: 'Izin/Sakit', value: '1', sub: 'Bulan ini', icon: FileEdit, color: '#3B82F6' },
            { label: 'Alpa', value: '0', sub: 'Disiplin!', icon: AlertCircle, color: '#EF4444' },
          ].map((stat, i) => (
            <div key={i} className="content-card" style={{ padding: '1rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${stat.color}20`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={18} />
               </div>
               <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700' }}>{stat.label}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{stat.sub}</div>
               </div>
            </div>
          ))}
       </div>

       <div className="content-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Pengumuman</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
             <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '8px' }}>
                <Clock size={20} />
             </div>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Jangan lupa melakukan scan wajah saat check-in dan check-out untuk validitas absensi.
             </p>
          </div>
       </div>
    </div>
  </>
);

export const KaryawanAbsen = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [absenStep, setAbsenStep] = useState('idle'); // idle, scanned, break, checkout
  const [scanTarget, setScanTarget] = useState(''); // target step after scan
  const [scanLabel, setScanLabel] = useState('');

  const triggerScan = (target, label) => {
    setScanTarget(target);
    setScanLabel(label);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setAbsenStep(target);
    }, 2000);
  };

  return (
    <>
      <div className="mobile-header">
        <div className="user-greeting">
          <h1>Presensi Kehadiran</h1>
        </div>
      </div>
      <div className="page-container" style={{ paddingTop: '1rem' }}>
        <div className="content-card" style={{ textAlign: 'center', padding: '2rem 1rem', position: 'relative', overflow: 'hidden' }}>
          
          {/* STEP: BELUM ABSEN */}
          {absenStep === 'idle' && (
            <>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Shift Pagi</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>07:00 - 15:00</p>
              <div className="absent-button-container">
                <button 
                  className="btn-absen" 
                  onClick={() => triggerScan('scanned', 'Check In')} 
                  style={{ position: 'relative', zIndex: 10 }}
                >
                  <ScanFace size={48} />
                  <span>Check In</span>
                </button>
              </div>
            </>
          )}

          {/* STEP: SUDAH MASUK */}
          {absenStep === 'scanned' && (
            <>
              <div style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>
                 <Check size={48} style={{ margin: '0 auto', border: '2px solid var(--secondary)', borderRadius: '50%', padding: '0.5rem' }} />
              </div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Sudah Check In</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Terdeteksi di Cabang Madiun • 07:00 AM</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                 <button className="action-btn" onClick={() => triggerScan('break', 'Mulai Istirahat')} style={{ width: '100%', justifyContent: 'center', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '1rem' }}>
                    <Coffee size={20} /> Mulai Istirahat
                 </button>
                 <button className="action-btn" onClick={() => triggerScan('idle', 'Check Out')} style={{ width: '100%', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '1rem' }}>
                    <LogOut size={20} /> Check Out
                 </button>
              </div>
            </>
          )}

          {/* STEP: SEDANG ISTIRAHAT */}
          {absenStep === 'break' && (
            <>
              <div style={{ color: '#F59E0B', marginBottom: '1rem' }}>
                 <Coffee size={48} style={{ margin: '0 auto', border: '2px solid #F59E0B', borderRadius: '50%', padding: '0.5rem' }} />
              </div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Sedang Istirahat</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Lokasi: Area Istirahat • 12:05 PM</p>
              
              <button className="action-btn" onClick={() => triggerScan('scanned', 'Selesai Istirahat')} style={{ width: '100%', justifyContent: 'center', background: 'var(--secondary)', color: 'white', padding: '1rem' }}>
                 Selesai Istirahat
              </button>
            </>
          )}

          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--surface-border)' }}>
             <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
               <MapPin size={14} className="pulse-animation" style={{ color: 'var(--primary)' }} /> 
               Mendeteksi Lokasi: <b>Cabang Madiun</b>
             </p>
             <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Radius: 12.5 meter (Aman)</p>
          </div>
        </div>
      </div>

      {/* FACE SCAN & LOCATION VERIFICATION MODAL */}
      {isScanning && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.95)', zIndex: 10000, flexDirection: 'column' }}>
           <div style={{ position: 'relative', width: '300px', height: '300px', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%', overflow: 'hidden', marginBottom: '2rem' }}>
              
              {/* Camera Simulation Background */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(45deg, #111, #222)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <ScanFace size={120} style={{ color: 'white', opacity: 0.1 }} />
              </div>

              {/* Animated Scan Line */}
              <div style={{ 
                position: 'absolute', width: '100%', height: '4px', background: 'var(--primary)', 
                top: 0, boxShadow: '0 0 20px var(--primary)',
                animation: 'scanLine 2s infinite ease-in-out',
                zIndex: 5
              }}></div>
              
              {/* Scan Circle Highlight */}
              <div style={{ position: 'absolute', inset: '10px', border: '2px dashed var(--primary)', borderRadius: '50%', opacity: 0.3, animation: 'spin 10s linear infinite' }}></div>

              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 6 }}>
                 <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '3px', color: 'var(--primary)', textShadow: '0 0 10px var(--primary)' }}>VERIFYING...</span>
              </div>
           </div>

           <div style={{ textAlign: 'center', color: 'white' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{scanLabel}</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                 <div className="loader" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--primary)' }}></div>
                 <span>Memverifikasi Wajah & Lokasi GPS...</span>
              </div>
           </div>

           <style>{`
              @keyframes scanLine {
                0% { top: 0%; }
                50% { top: 100%; }
                100% { top: 0%; }
              }
              .pulse-animation {
                 animation: mapPulse 2s infinite;
              }
              @keyframes mapPulse {
                 0% { transform: scale(1); opacity: 1; }
                 50% { transform: scale(1.2); opacity: 0.7; }
                 100% { transform: scale(1); opacity: 1; }
              }
           `}</style>
        </div>
      )}
    </>
  );
};

export const KaryawanRiwayat = () => (
  <>
    <div className="mobile-header">
      <div className="user-greeting">
        <h1>Riwayat Absen</h1>
      </div>
      <Filter className="avatar" style={{ background: 'transparent', color: 'var(--text-main)', border: 'none' }} />
    </div>
    <div className="page-container" style={{ paddingTop: '1rem' }}>
      {[1,2,3,4].map(i => (
        <div key={i} className="content-card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{`0${i} Mei 2026`}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Check In: 07:55 • Check Out: 16:05</div>
          </div>
          <div style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--secondary)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>Hadir</div>
        </div>
      ))}
    </div>
  </>
);

export const KaryawanIzin = () => (
  <>
    <div className="mobile-header">
      <div className="user-greeting">
        <h1>Pengajuan Izin</h1>
      </div>
    </div>
    <div className="page-container" style={{ paddingTop: '1rem' }}>
      <button className="btn-submit" style={{ marginBottom: '2rem' }}>+ Ajukan Izin Baru</button>
      <PagePlaceholder title="Riwayat Izin" description="Belum ada pengajuan izin terbaru." />
    </div>
  </>
);


export const KaryawanProfil = () => {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  return (
    <>
      <div className="mobile-header" style={{ flexDirection: 'column', gap: '1rem', paddingTop: '3rem', paddingBottom: '2rem' }}>
        <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>BS</div>
        <div className="user-greeting" style={{ textAlign: 'center' }}>
          <h1>Budi Santoso</h1>
          <p>Kasir • Cabang Madiun</p>
        </div>
      </div>
      <div className="page-container" style={{ paddingTop: '0' }}>
        <div className="content-card">
          <div style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>No. Handphone</span>
            <span>081234567890</span>
          </div>
          <div style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Email</span>
            <span>budi@warungrequest.com</span>
          </div>
          <div style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isDark ? <Moon size={16} /> : <Sun size={16} />} Theme
            </span>
            <button className="theme-toggle" onClick={toggleTheme} style={{ background: 'var(--surface-hover)', borderRadius: '12px', padding: '0.25rem 0.75rem' }}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
          <div style={{ padding: '0.75rem 0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Status Karyawan</span>
            <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>Aktif</span>
          </div>
        </div>
        <button 
          className="action-btn" 
          onClick={() => navigate('/')}
          style={{ width: '100%', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '1rem' }}
        >
          <LogOut size={20} />
          Log Out
        </button>
      </div>
    </>
  );
};
