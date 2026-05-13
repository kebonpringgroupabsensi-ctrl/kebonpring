import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { Users, Search, Edit, Trash2, Plus, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const emptyForm = {
  full_name: '', nik: '', email: '', phone: '', password: '',
  position: '', employment_status: 'kontrak', role: 'karyawan',
};

const POSITIONS = ['Manager', 'Kasir', 'Koki', 'Waiter', 'Kebersihan', 'Keamanan', 'Lainnya'];

export default function ACKaryawan() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  // Fetch employees (Backend auto-filters by branch)
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees-admin'],
    queryFn: () => api.get('/employees')
  });

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      // For Admin Cabang, we don't send branch_id, backend will assign based on current admin's branch
      if (editData) {
        return await api.put(`/employees/${editData.id}`, payload);
      } else {
        return await api.post('/employees', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-admin'] });
      setShowModal(false);
    },
    onError: (err) => setFormError(err.message)
  });

  const openAdd = () => {
    setEditData(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditData(emp);
    setForm({
      full_name: emp.full_name || '',
      nik: emp.nik || '',
      email: emp.email || '',
      phone: emp.phone || '',
      password: '',
      position: emp.position || '',
      employment_status: emp.employment_status || 'kontrak',
      employee_status: emp.employee_status || 'aktif',
      role: emp.role || 'karyawan',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!editData && (!form.email || !form.password)) {
      setFormError('Email dan password wajib diisi untuk karyawan baru.');
      return;
    }
    
    const payload = editData ? {
      full_name: form.full_name,
      nik: form.nik,
      phone: form.phone,
      position: form.position,
      employment_status: form.employment_status,
      employee_status: form.employee_status,
      role: form.role,
    } : { ...form };

    // Update password only if provided
    if (editData && form.password) {
      payload.password = form.password;
    }

    saveMutation.mutate(payload);
  };

  const filteredEmployees = employees.filter(emp => {
    if (search) {
      const q = search.toLowerCase();
      if (!emp.full_name.toLowerCase().includes(q) && !emp.nik?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (isLoading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Memuat data karyawan...</div>;

  return (
    <>
      <div className="content-card">
        <div className="content-header">
          <div>
            <h2>Data Karyawan Cabang</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Kelola karyawan yang bertugas di cabang Anda.</p>
          </div>
          <button className="action-btn" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Tambah Karyawan
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Cari nama atau NIK..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                <th>Jabatan</th>
                <th>Status Kerja</th>
                <th>Status Akun</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '700' }}>{emp.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.nik || '-'}</div>
                  </td>
                  <td>{emp.position}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700',
                      background: emp.employment_status === 'tetap' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                      color: emp.employment_status === 'tetap' ? 'var(--primary)' : '#3B82F6'
                    }}>
                      {emp.employment_status?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700',
                      background: emp.employee_status === 'aktif' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: emp.employee_status === 'aktif' ? 'var(--primary)' : 'var(--error)'
                    }}>
                      {emp.employee_status?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => openEdit(emp)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Edit size={16} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Tidak ada karyawan ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2>{editData ? 'Edit Karyawan' : 'Tambah Karyawan'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            {formError && <div style={{ color: 'var(--error)', background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{formError}</div>}
            
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap *</label>
                  <input required type="text" className="form-input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">NIK</label>
                  <input type="text" className="form-input" value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} placeholder="WRQ-001" />
                </div>
                {!editData && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Email Login *</label>
                      <input required type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label className="form-label">{editData ? 'Password Baru' : 'Password Login *'}</label>
                  <input required={!editData} type="password" className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editData ? "Kosongkan jika tidak diubah" : "Min. 8 karakter"} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nomor HP</label>
                  <input type="text" className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xx" />
                </div>
                <div className="form-group">
                  <label className="form-label">Jabatan</label>
                  <select className="form-input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                    <option value="">Pilih Jabatan</option>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status Pegawai</label>
                  <select className="form-input" value={form.employment_status} onChange={(e) => setForm({ ...form, employment_status: e.target.value })}>
                    <option value="kontrak">Kontrak</option>
                    <option value="tetap">Tetap</option>
                  </select>
                </div>
                {editData && (
                  <div className="form-group">
                    <label className="form-label">Status Akun</label>
                    <select className="form-input" value={form.employee_status} onChange={(e) => setForm({ ...form, employee_status: e.target.value })}>
                      <option value="aktif">Aktif</option>
                      <option value="non-aktif">Non-Aktif</option>
                      <option value="cuti">Cuti</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="action-btn" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Menyimpan...' : <><Users size={18} /> {editData ? 'Simpan Perubahan' : 'Tambah Karyawan'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
