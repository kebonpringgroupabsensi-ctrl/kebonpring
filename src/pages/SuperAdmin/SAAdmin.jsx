import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { UserCog, Plus, X, Save, Edit, Trash2, Search, ShieldCheck } from 'lucide-react';

const emptyForm = { full_name: '', email: '', password: '', phone: '', branch_id: '', role: 'admin_cabang' };

export default function SAAdmin() {
  const [admins, setAdmins] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [emps, brs] = await Promise.all([
        api.get('/employees'),
        api.get('/branches/all-admin'),
      ]);
      setAdmins(emps.filter(e => e.role === 'admin_cabang' || e.role === 'super_admin'));
      setBranches(brs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditData(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (admin) => {
    setEditData(admin);
    setForm({
      full_name: admin.full_name || '',
      email: admin.email || '',
      password: '',
      phone: admin.phone || '',
      branch_id: admin.branch_id || '',
      role: admin.role || 'admin_cabang',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editData) {
        await api.put(`/employees/${editData.id}`, {
          full_name: form.full_name,
          phone: form.phone,
          branch_id: form.branch_id,
          role: form.role,
        });
      } else {
        if (!form.password) {
          setFormError('Password wajib diisi untuk akun baru.');
          setSaving(false);
          return;
        }
        await api.post('/employees', { ...form, position: 'Admin', employment_status: 'tetap' });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (admin) => {
    setDeleteTarget(admin);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/employees/${deleteTarget.id}`);
      setShowDeleteModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = admins.filter(a =>
    !search || a.full_name?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="stat-grid responsive-grid-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-info"><h3>Total Admin</h3><div className="value">{admins.length}</div></div>
          <div className="stat-icon"><UserCog size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h3>Admin Cabang</h3><div className="value">{admins.filter(a => a.role === 'admin_cabang').length}</div></div>
          <div className="stat-icon" style={{ color: 'var(--secondary)', background: 'rgba(16,185,129,0.1)' }}><ShieldCheck size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h3>Super Admin</h3><div className="value">{admins.filter(a => a.role === 'super_admin').length}</div></div>
          <div className="stat-icon" style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)' }}><ShieldCheck size={24} /></div>
        </div>
      </div>

      <div className="content-card">
        <div className="content-header">
          <div>
            <h2>Manajemen Akun Admin</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Kelola akun admin cabang dan super admin</p>
          </div>
          <button className="action-btn" onClick={openAdd}><Plus size={16} /> Tambah Admin</button>
        </div>

        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Cari nama atau email..." className="form-input" style={{ paddingLeft: '2.5rem' }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}><div className="loader" style={{ width: '30px', height: '30px', margin: '0 auto' }} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Nama</th>
                  <th>Email</th>
                  <th>Cabang</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Tidak ada admin</td></tr>
                ) : (
                  filtered.map(admin => (
                    <tr key={admin.id} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.875rem' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{admin.full_name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{admin.email}</td>
                      <td>{admin.branches?.name || (admin.role === 'super_admin' ? 'Semua Cabang' : '-')}</td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
                          background: admin.role === 'super_admin' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                          color: admin.role === 'super_admin' ? '#3b82f6' : 'var(--secondary)',
                        }}>{admin.role === 'super_admin' ? 'Super Admin' : 'Admin Cabang'}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => openEdit(admin)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginRight: '0.5rem' }}><Edit size={14} /></button>
                        <button onClick={() => confirmDelete(admin)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editData ? 'Edit Akun Admin' : 'Tambah Admin Baru'}</h2>
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
                  <label className="form-label">No. HP</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                {!editData && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password *</label>
                      <input className="form-input" type="password" minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 karakter" />
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="admin_cabang">Admin Cabang</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                {form.role === 'admin_cabang' && (
                  <div className="form-group">
                    <label className="form-label">Cabang</label>
                    <select className="form-input" value={form.branch_id} onChange={e => setForm({ ...form, branch_id: e.target.value })}>
                      <option value="">Pilih Cabang</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="action-btn" disabled={saving}>
                  {saving ? <div className="loader" style={{ width: '16px', height: '16px' }} /> : <><Save size={16} /> {editData ? 'Simpan' : 'Buat Akun Admin'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Hapus Akun Admin</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}><X size={20} /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Yakin hapus akun <strong>{deleteTarget?.full_name}</strong>? Akun ini tidak bisa dipulihkan.
            </p>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowDeleteModal(false)}>Batal</button>
              <button onClick={handleDelete} style={{ background: 'var(--error)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
