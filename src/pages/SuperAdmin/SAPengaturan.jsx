import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Settings, Save, Globe, Clock, Bell, Plus, Trash2, X } from 'lucide-react';

export default function SAPengaturan() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', content: '', is_global: true });
  const [savingAnn, setSavingAnn] = useState(false);

  const [form, setForm] = useState({
    company_name: 'Warung Request',
    company_address: '',
    check_in_start: '05:00',
    check_in_end: '12:00',
    check_out_start: '14:00',
    check_out_end: '23:59',
    max_radius_meters: '100',
    working_days: '["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"]',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, ann] = await Promise.all([
        api.get('/settings'),
        api.get('/settings/announcements'),
      ]);
      setSettings(s);
      setAnnouncements(ann);
      // Merge settings into form
      setForm(prev => ({
        ...prev,
        company_name: s.company_name || prev.company_name,
        company_address: s.company_address || prev.company_address,
        check_in_start: s.check_in_start || prev.check_in_start,
        check_in_end: s.check_in_end || prev.check_in_end,
        check_out_start: s.check_out_start || prev.check_out_start,
        check_out_end: s.check_out_end || prev.check_out_end,
        max_radius_meters: s.max_radius_meters || prev.max_radius_meters,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    setSavingAnn(true);
    try {
      await api.post('/settings/announcements', annForm);
      setShowAnnModal(false);
      setAnnForm({ title: '', content: '', is_global: true });
      const ann = await api.get('/settings/announcements');
      setAnnouncements(ann);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingAnn(false);
    }
  };

  const handleDeleteAnn = async (id) => {
    if (!confirm('Hapus pengumuman ini?')) return;
    try {
      await api.delete(`/settings/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem' }}><div className="loader" style={{ width: '30px', height: '30px', margin: '0 auto' }} /></div>
  );

  return (
    <>
      <form onSubmit={handleSave}>
        {/* Company Info */}
        <div className="content-card" style={{ marginBottom: '1.5rem' }}>
          <div className="content-header">
            <div>
              <h2><Globe size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />Informasi Perusahaan</h2>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nama Perusahaan</label>
              <input className="form-input" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Alamat Perusahaan</label>
              <textarea className="form-input" rows={2} value={form.company_address} onChange={e => setForm({ ...form, company_address: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Attendance Rules */}
        <div className="content-card" style={{ marginBottom: '1.5rem' }}>
          <div className="content-header">
            <h2><Clock size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />Aturan Absensi</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Mulai Check-In</label>
              <input className="form-input" type="time" value={form.check_in_start} onChange={e => setForm({ ...form, check_in_start: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Batas Check-In</label>
              <input className="form-input" type="time" value={form.check_in_end} onChange={e => setForm({ ...form, check_in_end: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Mulai Check-Out</label>
              <input className="form-input" type="time" value={form.check_out_start} onChange={e => setForm({ ...form, check_out_start: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Batas Check-Out</label>
              <input className="form-input" type="time" value={form.check_out_end} onChange={e => setForm({ ...form, check_out_end: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Radius Maksimum Absen (meter)</label>
              <input className="form-input" type="number" value={form.max_radius_meters} onChange={e => setForm({ ...form, max_radius_meters: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
          <button type="submit" className="action-btn" disabled={saving} style={{ minWidth: '160px' }}>
            {saving ? <div className="loader" style={{ width: '16px', height: '16px' }} /> : saved ? '✅ Tersimpan!' : <><Save size={16} /> Simpan Pengaturan</>}
          </button>
        </div>
      </form>

      {/* Announcements */}
      <div className="content-card">
        <div className="content-header">
          <div>
            <h2><Bell size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />Pengumuman</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Pengumuman akan tampil di dashboard karyawan</p>
          </div>
          <button className="action-btn" onClick={() => setShowAnnModal(true)}><Plus size={16} /> Buat Pengumuman</button>
        </div>
        {announcements.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Belum ada pengumuman aktif</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {announcements.map(ann => (
              <div key={ann.id} style={{ border: '1px solid var(--surface-border)', borderRadius: '10px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', marginBottom: '0.25rem' }}>{ann.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ann.content}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    {ann.is_global ? '🌍 Global' : '📍 Per Cabang'} · {new Date(ann.created_at).toLocaleDateString('id-ID')}
                  </div>
                </div>
                <button onClick={() => handleDeleteAnn(ann.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', flexShrink: 0 }}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Announcement Modal */}
      {showAnnModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Buat Pengumuman</h2>
              <button className="modal-close" onClick={() => setShowAnnModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddAnnouncement}>
              <div className="form-group">
                <label className="form-label">Judul *</label>
                <input className="form-input" required value={annForm.title} onChange={e => setAnnForm({ ...annForm, title: e.target.value })} placeholder="Judul pengumuman..." />
              </div>
              <div className="form-group">
                <label className="form-label">Isi Pengumuman *</label>
                <textarea className="form-input" rows={4} required value={annForm.content} onChange={e => setAnnForm({ ...annForm, content: e.target.value })} placeholder="Tulis isi pengumuman di sini..." />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={annForm.is_global} onChange={e => setAnnForm({ ...annForm, is_global: e.target.checked })} />
                  <span className="form-label" style={{ margin: 0 }}>Tampilkan ke semua cabang (Global)</span>
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setShowAnnModal(false)}>Batal</button>
                <button type="submit" className="action-btn" disabled={savingAnn}>
                  {savingAnn ? <div className="loader" style={{ width: '16px', height: '16px' }} /> : <><Save size={16} /> Publikasikan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
