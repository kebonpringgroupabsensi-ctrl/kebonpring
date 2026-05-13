import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { Building, MapPin, Edit, Trash2, Plus, X, Save, Search, Map as MapIcon } from 'lucide-react';
import MapPicker from '../../components/MapPicker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const emptyForm = { name: '', address: '', latitude: '', longitude: '', radius_meters: 100, admin_name: '', status: 'aktif' };

export default function SACabang() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch branches with React Query
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      try {
        return await api.get('/branches/all-admin');
      } catch {
        return await api.get('/branches');
      }
    }
  });

  // Mutation for Save (Add/Edit)
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editData) {
        return await api.put(`/branches/${editData.id}`, payload);
      } else {
        return await api.post('/branches', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setShowModal(false);
    },
    onError: (err) => setError(err.message)
  });

  // Mutation for Delete
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/branches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setShowDeleteModal(false);
    },
    onError: (err) => alert(err.message)
  });

  const openAdd = () => {
    setEditData(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (branch) => {
    setEditData(branch);
    setForm({
      name: branch.name || '',
      address: branch.address || '',
      latitude: branch.latitude || '',
      longitude: branch.longitude || '',
      radius_meters: branch.radius_meters || 100,
      admin_name: branch.admin_name || '',
      status: branch.status || 'aktif',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      latitude: form.latitude !== '' ? parseFloat(form.latitude) : null,
      longitude: form.longitude !== '' ? parseFloat(form.longitude) : null,
      radius_meters: parseInt(form.radius_meters),
    };
    saveMutation.mutate(payload);
  };

  const handleDelete = () => {
    deleteMutation.mutate(deleteTarget.id);
  };

  const filtered = branches.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Stats */}
      <div className="stat-grid responsive-grid-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-info"><h3>Total Cabang</h3><div className="value">{branches.length}</div></div>
          <div className="stat-icon"><Building size={20} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h3>Cabang Aktif</h3><div className="value">{branches.filter(b => b.status === 'aktif').length}</div></div>
          <div className="stat-icon" style={{ color: 'var(--secondary)', background: 'rgba(16,185,129,0.1)' }}><Building size={20} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info"><h3>Non-Aktif</h3><div className="value">{branches.filter(b => b.status !== 'aktif').length}</div></div>
          <div className="stat-icon" style={{ color: 'var(--error)', background: 'rgba(239,68,68,0.1)' }}><Building size={20} /></div>
        </div>
      </div>

      <div className="content-card">
        <div className="content-header">
          <div>
            <h2>Daftar Cabang</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Kelola lokasi dan data operasional setiap outlet.</p>
          </div>
          <button className="action-btn" onClick={openAdd}><Plus size={16} /> Tambah Cabang</button>
        </div>

        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Cari nama atau alamat cabang..." className="form-input form-input-icon" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}><div className="loader" style={{ width: '30px', height: '30px', margin: '0 auto' }} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Nama Cabang</th>
                  <th>Alamat</th>
                  <th>Admin</th>
                  <th>Radius</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Tidak ada cabang ditemukan</td></tr>
                ) : (
                  filtered.map((branch) => (
                    <tr key={branch.id} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.875rem' }}>
                      <td style={{ padding: '1rem', fontWeight: '700' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Building size={16} style={{ color: 'var(--primary)' }} />
                          {branch.name}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
                          <MapPin size={12} style={{ flexShrink: 0, marginTop: '3px', color: 'var(--text-muted)' }} />
                          {branch.address || '-'}
                        </div>
                      </td>
                      <td>{branch.admin_name || '-'}</td>
                      <td>{branch.radius_meters || 100}m</td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
                          background: branch.status === 'aktif' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: branch.status === 'aktif' ? 'var(--secondary)' : 'var(--error)',
                        }}>{branch.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => openEdit(branch)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', marginRight: '0.5rem' }}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => { setDeleteTarget(branch); setShowDeleteModal(true); }} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal using React Portal to escape transform containing blocks */}
      {showModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editData ? 'Edit Cabang' : 'Tambah Cabang Baru'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nama Cabang *</label>
                  <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Cabang Madiun" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Alamat</label>
                  <textarea className="form-input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Jl. ..." />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="btn-ghost" 
                    style={{ width: '100%', border: '1px dashed var(--primary)', color: 'var(--primary)', gap: '0.5rem', height: '48px', borderRadius: '12px' }}
                    onClick={() => setShowMapPicker(true)}
                  >
                    <MapIcon size={18} />
                    <span>Pilih Lokasi dari Peta</span>
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input className="form-input" type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="-7.6298" />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input className="form-input" type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="111.5239" />
                </div>
                <div className="form-group">
                  <label className="form-label">Radius Absen (meter)</label>
                  <input className="form-input" type="number" value={form.radius_meters} onChange={e => setForm({ ...form, radius_meters: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Admin Cabang</label>
                  <input className="form-input" value={form.admin_name} onChange={e => setForm({ ...form, admin_name: e.target.value })} placeholder="Admin Madiun" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="aktif">Aktif</option>
                    <option value="non_aktif">Non-Aktif</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="action-btn" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <div className="loader" style={{ width: '16px', height: '16px' }} /> : <><Save size={16} /> {editData ? 'Simpan Perubahan' : 'Tambah Cabang'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Hapus Cabang</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}><X size={20} /></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Yakin ingin menghapus cabang <strong>{deleteTarget?.name}</strong>? Aksi ini tidak bisa dibatalkan.
            </p>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowDeleteModal(false)}>Batal</button>
              <button onClick={handleDelete} style={{ background: 'var(--error)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                <Trash2 size={16} /> Ya, Hapus
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Map Picker Modal */}
      <MapPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onConfirm={(pos) => setForm({ 
          ...form, 
          latitude: pos.lat.toString(), 
          longitude: pos.lng.toString(),
          address: pos.address || form.address 
        })}
        initialLocation={form.latitude && form.longitude ? { lat: parseFloat(form.latitude), lng: parseFloat(form.longitude) } : null}
      />
    </>
  );
}
