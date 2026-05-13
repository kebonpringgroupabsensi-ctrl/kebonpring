import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { Users, Edit, Trash2, Plus, X, Save, Search, UserCheck, UserX } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const emptyForm = {
  full_name: '', nik: '', email: '', phone: '', password: '',
  branch_id: '', position: '', employment_status: 'kontrak', role: 'karyawan',
};

const POSITIONS = ['Manager', 'Kasir', 'Koki', 'Waiter', 'Admin Cabang', 'Kebersihan', 'Keamanan', 'Lainnya'];

export default function SAKaryawan() {
  const queryClient = useQueryClient();
  console.log("SAKaryawan Component Loaded - Delete Fixed"); // DEBUG
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Queries
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get('/employees')
  });

  const { data: branches = [], isLoading: loadingBranches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches/all-admin')
  });

  const loading = loadingEmployees || loadingBranches;

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editData) {
        return await api.put(`/employees/${editData.id}`, payload);
      } else {
        return await api.post('/employees', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowModal(false);
    },
    onError: (err) => setFormError(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowDeleteModal(false);
    },
    onError: (err) => alert(err.message)
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
      branch_id: emp.branch_id || '',
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
      branch_id: form.branch_id,
      employment_status: form.employment_status,
      employee_status: form.employee_status,
      role: form.role,
    } : form;

    saveMutation.mutate(payload);
  };

  const openDelete = (emp) => {
    setDeleteTarget(emp);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    deleteMutation.mutate(deleteTarget.id);
  };

  const filtered = employees.filter(e => {
    const matchSearch = !search || e.full_name?.toLowerCase().includes(search.toLowerCase()) || e.nik?.toLowerCase().includes(search.toLowerCase());
    const matchBranch = !filterBranch || e.branch_id === filterBranch;
    const matchStatus = !filterStatus || e.employee_status === filterStatus;
    return matchSearch && matchBranch && matchStatus;
  });

  const getRoleLabel = (role) => {
    if (role === 'super_admin') return 'Owner';
    if (role === 'admin_cabang') return 'Admin Cabang';
    return 'Karyawan';
  };

  return (
    <>
      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-info"><h3>Total Karyawan</h3><div className="value">{employees.filter(e => e.role === 'karyawan').length}</div></div>
          <div className="stat-icon"><Users size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h3>Karyawan Aktif</h3><div className="value">{employees.filter(e => e.employee_status === 'aktif').length}</div></div>
          <div className="stat-icon" style={{ color: 'var(--secondary)', background: 'rgba(16,185,129,0.1)' }}><UserCheck size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h3>Non-Aktif</h3><div className="value">{employees.filter(e => e.employee_status !== 'aktif').length}</div></div>
          <div className="stat-icon" style={{ color: 'var(--error)', background: 'rgba(239,68,68,0.1)' }}><UserX size={24} /></div>
        </div>
      </div>

      <div className="content-card">
        <div className="content-header">
          <div>
            <h2>Daftar Karyawan</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Kelola data semua karyawan dari seluruh cabang.</p>
          </div>
          <button className="action-btn" onClick={openAdd}><Plus size={16} /> Tambah Karyawan</button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Cari nama atau NIK..." className="form-input form-input-icon" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ width: '180px' }}>
            <select className="form-input" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
              <option value="">Semua Cabang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div style={{ width: '150px' }}>
            <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="non_aktif">Non-Aktif</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}><div className="loader" style={{ width: '30px', height: '30px', margin: '0 auto' }} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Nama / NIK</th>
                  <th>Cabang</th>
                  <th>Jabatan</th>
                  <th>Status Kerja</th>
                  <th>Status Akun</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Tidak ada karyawan ditemukan</td></tr>
                ) : (
                  filtered.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.875rem' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '700' }}>{emp.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.nik || '-'} · {getRoleLabel(emp.role)}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{emp.branches?.name || '-'}</td>
                      <td>{emp.position || '-'}</td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
                          background: emp.employment_status === 'tetap' ? 'rgba(59,130,246,0.1)' : 'rgba(156,163,175,0.1)',
                          color: emp.employment_status === 'tetap' ? '#3b82f6' : 'var(--text-secondary)',
                        }}>{emp.employment_status === 'tetap' ? 'Tetap' : 'Kontrak'}</span>
                      </td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
                          background: emp.employee_status === 'aktif' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: emp.employee_status === 'aktif' ? 'var(--secondary)' : 'var(--error)',
                        }}>{emp.employee_status}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => openEdit(emp)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginRight: '0.5rem' }}><Edit size={14} /></button>
                        <button onClick={() => openDelete(emp)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2>{editData ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            {formError && <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{formError}</div>}
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap *</label>
                  <input className="form-input" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">NIK</label>
                  <input className="form-input" value={form.nik} onChange={e => setForm({ ...form, nik: e.target.value })} placeholder="WRQ-001" />
                </div>
                {!editData && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password *</label>
                      <input className="form-input" type="password" required minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 karakter" />
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label className="form-label">No. HP</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="08xx" />
                </div>
                <div className="form-group">
                  <label className="form-label">Cabang</label>
                  <select className="form-input" value={form.branch_id} onChange={e => setForm({ ...form, branch_id: e.target.value })}>
                    <option value="">Pilih Cabang</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jabatan</label>
                  <select className="form-input" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}>
                    <option value="">Pilih Jabatan</option>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status Kerja</label>
                  <select className="form-input" value={form.employment_status} onChange={e => setForm({ ...form, employment_status: e.target.value })}>
                    <option value="kontrak">Kontrak</option>
                    <option value="tetap">Tetap</option>
                  </select>
                </div>
                {editData && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Status Akun</label>
                      <select className="form-input" value={form.employee_status} onChange={e => setForm({ ...form, employee_status: e.target.value })}>
                        <option value="aktif">Aktif</option>
                        <option value="non_aktif">Non-Aktif</option>
                        <option value="cuti">Cuti</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                        <option value="karyawan">Karyawan</option>
                        <option value="admin_cabang">Admin Cabang</option>
                        <option value="super_admin">Owner</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="action-btn" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <div className="loader" style={{ width: '16px', height: '16px' }} /> : <><Save size={16} /> {editData ? 'Simpan Perubahan' : 'Tambah Karyawan'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showDeleteModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Hapus Karyawan</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}><X size={20} /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Yakin hapus karyawan <strong>{deleteTarget?.full_name}</strong>? Akun login dan semua data akan dihapus permanen.
            </p>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowDeleteModal(false)}>Batal</button>
              <button onClick={handleDelete} style={{ background: 'var(--error)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
