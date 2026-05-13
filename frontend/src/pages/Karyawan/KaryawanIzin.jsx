import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useSearchParams } from 'react-router-dom';
import { Plus, X, Calendar, FileText, CheckCircle, XCircle, Clock, Trash2, Camera, MapPin, Image as ImageIcon } from 'lucide-react';
import { compressImage, fileToBase64 } from '../../utils/imageUtils';

const STATUS_MAP = {
  pending: { label: 'Menunggu', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  approved: { label: 'Disetujui', color: 'var(--secondary)', bg: 'rgba(16, 185, 129, 0.1)' },
  rejected: { label: 'Ditolak', color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.1)' },
};

export default function KaryawanIzin() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'izin',
    start_date: '',
    end_date: '',
    reason: '',
    attachment: null,
    latitude: null,
    longitude: null,
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  React.useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'pulang_cepat') {
      const today = new Date().toLocaleDateString('en-CA');
      setFormData(prev => ({ 
        ...prev, 
        leave_type: 'pulang_cepat',
        start_date: today,
        end_date: today,
        reason: 'Izin pulang cepat (sakit di tengah pekerjaan / keperluan mendadak)'
      }));
    }
  }, [searchParams]);

  const { data: leaves, isLoading } = useQuery({
    queryKey: ['karyawan-leaves'],
    queryFn: () => api.get('/leaves'),
  });

  const mutation = useMutation({
    mutationFn: (newLeave) => api.post('/leaves', newLeave),
    onSuccess: () => {
      queryClient.invalidateQueries(['karyawan-leaves']);
      setShowModal(false);
      setFormData({ 
        leave_type: 'izin', start_date: '', end_date: '', reason: '', 
        attachment: null, latitude: null, longitude: null 
      });
      alert('Pengajuan izin berhasil dikirim!');
    },
    onError: (err) => alert(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/leaves/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['karyawan-leaves']);
      alert('Pengajuan berhasil dibatalkan.');
    },
    onError: (err) => alert(err.message),
  });
  const getLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setLocationLoading(false);
      },
      (err) => {
        console.error('Error getting location:', err);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const compressed = await compressImage(base64, 800, 0.7);
      setFormData(prev => ({ ...prev, attachment: compressed }));
    } catch (err) {
      console.error('Error processing image:', err);
      alert('Gagal memproses gambar. Silakan coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  const openModal = () => {
    setShowModal(true);
    getLocation();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <div className="mobile-header" style={{ padding: '1.5rem', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Pengajuan Izin</h1>
        <button className="action-btn" onClick={openModal}>
          <Plus size={18} /> Ajukan
        </button>
      </div>

      <div className="page-container" style={{ padding: '1rem' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="loader" style={{ width: '30px', height: '30px', margin: '0 auto' }} />
          </div>
        ) : leaves?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {leaves.map((item) => (
              <div key={item.id} className="content-card" style={{ padding: '1.25rem', margin: 0, borderRadius: '20px', border: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', padding: '0.5rem', borderRadius: '10px' }}>
                      <FileText size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.9rem', textTransform: 'capitalize' }}>{item.leave_type}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Diajukan pada {formatDate(item.created_at)}</div>
                    </div>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '800',
                    background: STATUS_MAP[item.status].bg, color: STATUS_MAP[item.status].color
                  }}>
                    {STATUS_MAP[item.status].label}
                  </span>
                </div>

                <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{formatDate(item.start_date)} - {formatDate(item.end_date)}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{item.reason || 'Tanpa alasan.'}</p>
                </div>

                {item.status === 'pending' && (
                  <button 
                    onClick={() => { if (confirm('Batalkan pengajuan ini?')) deleteMutation.mutate(item.id); }}
                    style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', padding: '0.2rem 0' }}
                  >
                    <Trash2 size={14} /> Batalkan Pengajuan
                  </button>
                )}

                {item.status !== 'pending' && item.review_notes && (
                  <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '0.75rem', fontSize: '0.75rem' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Catatan Admin: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.review_notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
            <p style={{ fontSize: '0.9rem' }}>Belum ada riwayat pengajuan izin.</p>
          </div>
        )}
      </div>

      {/* Modal Pengajuan */}
      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ margin: '1rem', maxWidth: '100%' }}>
            <div className="modal-header">
              <h2>Ajukan Izin / Sakit</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Jenis Pengajuan</label>
                <select 
                  className="form-input" 
                  value={formData.leave_type} 
                  onChange={e => setFormData({ ...formData, leave_type: e.target.value })}
                >
                  <option value="izin">Izin</option>
                  <option value="sakit">Sakit</option>
                  <option value="cuti">Cuti</option>
                  <option value="pulang_cepat">Pulang Cepat</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Tgl Mulai</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    required 
                    value={formData.start_date} 
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tgl Selesai</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    required 
                    value={formData.end_date} 
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Alasan</label>
                <textarea 
                  className="form-input" 
                  rows="3"
                  placeholder="Berikan alasan pengajuan Anda..."
                  required
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  style={{ resize: 'none', padding: '0.75rem' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bukti Foto / Surat (Opsional)</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2 }}
                  />
                  <div style={{ 
                    border: '2px dashed var(--surface-border)', 
                    borderRadius: '12px', 
                    padding: '1rem', 
                    textAlign: 'center',
                    color: formData.attachment ? 'var(--secondary)' : 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: formData.attachment ? 'rgba(16,185,129,0.05)' : 'transparent'
                  }}>
                    {uploading ? (
                      <div className="loader" style={{ width: '20px', height: '20px' }} />
                    ) : formData.attachment ? (
                      <>
                        <CheckCircle size={24} />
                        <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Foto Berhasil Diunggah</span>
                      </>
                    ) : (
                      <>
                        <Camera size={24} />
                        <span style={{ fontSize: '0.8rem' }}>Ambil Foto atau Pilih File</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Lokasi Saat Ini</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: formData.latitude ? 'var(--secondary)' : 'var(--text-muted)' }}>
                  <MapPin size={16} />
                  {locationLoading ? 'Mendeteksi lokasi...' : formData.latitude ? `${formData.latitude.toFixed(5)}, ${formData.longitude.toFixed(5)}` : 'Lokasi tidak terdeteksi'}
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '1rem 0 0' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="action-btn" disabled={mutation.isLoading || uploading}>
                  {mutation.isLoading ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
