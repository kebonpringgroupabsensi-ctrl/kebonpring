import React, { useState, useEffect, useRef } from 'react';
import { api, getUser } from '../../services/api';
import { Camera, CheckCircle, XCircle, MapPin, ScanFace, Clock, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { compressImage } from '../../utils/imageUtils';
import FaceRegisterModal from '../../components/FaceRegisterModal';
import { loadFaceModels, extractFaceDescriptor, isMatch } from '../../services/faceService';

const STATUS_LABELS = {
  hadir: { label: 'Hadir', color: 'var(--secondary)', bg: 'rgba(16,185,129,0.1)' },
  terlambat: { label: 'Terlambat', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  izin: { label: 'Izin', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  sakit: { label: 'Sakit', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  alpa: { label: 'Alpa', color: 'var(--error)', bg: 'rgba(239,68,68,0.1)' },
  pulang_cepat: { label: 'Pulang Cepat', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
};

export default function KaryawanAbsen() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [attendance, setAttendance] = useState(null);
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [now, setNow] = useState(new Date());
  const [settings, setSettings] = useState({});

  const isFaceRegistered = user?.face_registered || false;
  const hasShift = !!shift && !!shift.shifts;
  const isNonShift = !hasShift;

  useEffect(() => {
    fetchTodayData();
    getLocation();
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayData = async () => {
    setLoading(true);
    try {
      const today = new Date().toLocaleDateString('en-CA');
      const [att, dashData, s] = await Promise.all([
        api.get('/attendances/today', { date: today }),
        api.get('/dashboard/karyawan', { date: today }),
        api.get('/settings').catch(() => ({})),
      ]);
      setAttendance(att);
      setShift(dashData.today_shift);
      setSettings(s || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Browser tidak mendukung GPS');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError('');
      },
      (err) => {
        setLocationError('Gagal mendapatkan lokasi: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleAction = (action) => {
    if (!isFaceRegistered) {
      setShowFaceModal(true);
      return;
    }
    setPendingAction(action);
    setShowScanModal(true);
  };

  const executeAction = async (faceVerified = false, photo = null) => {
    setShowScanModal(false);
    if (!pendingAction) return;

    setActionLoading(true);
    try {
      let result;
      const locationPayload = location ? { latitude: location.lat, longitude: location.lng } : {};

      if (pendingAction === 'check_in') {
        result = await api.post('/attendances/check-in', { ...locationPayload, face_verified: faceVerified, photo });
      } else if (pendingAction === 'break_start') {
        result = await api.post('/attendances/break/start', {});
      } else if (pendingAction === 'break_end') {
        result = await api.post('/attendances/break/end', { face_verified: faceVerified, photo });
      } else if (pendingAction === 'check_out') {
        result = await api.post('/attendances/check-out', { ...locationPayload, face_verified: faceVerified, photo });
      }

      showMessage(result?.message || 'Berhasil!', 'success');
      setPendingAction(null);
      fetchTodayData();
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return '--:--';
    return new Date(isoStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const getWorkDuration = () => {
    if (!attendance?.check_in_time) return null;
    const start = new Date(attendance.check_in_time);
    const end = attendance.check_out_time ? new Date(attendance.check_out_time) : now;
    const mins = Math.round((end - start) / 60000) - (attendance.total_break_minutes || 0);
    return `${Math.floor(mins / 60)}j ${mins % 60}m`;
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem' }}>
      <div className="loader" style={{ width: '40px', height: '40px' }} />
      <p style={{ color: 'var(--text-secondary)' }}>Memuat data absensi...</p>
    </div>
  );

  return (
    <div style={{ padding: '1rem', maxWidth: '500px', margin: '0 auto' }}>
      {/* Face not registered warning */}
      {!isFaceRegistered && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} style={{ color: 'var(--error)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: '700', color: 'var(--error)', fontSize: '0.9rem' }}>Wajah Belum Terdaftar</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Daftarkan wajah Anda untuk bisa melakukan absensi</div>
          </div>
          <button onClick={() => setShowFaceModal(true)} className="action-btn" style={{ flexShrink: 0, padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
            Daftar Wajah
          </button>
        </div>
      )}

      {/* Day Off Warning */}
      {!hasShift && !loading && (
        <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} style={{ color: '#3b82f6', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: '700', color: '#3b82f6', fontSize: '0.9rem' }}>Hari Libur / Tidak Ada Jadwal</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Anda tidak memiliki jadwal kerja hari ini. Tombol absen dinonaktifkan.</div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div style={{
          background: messageType === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${messageType === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: '12px', padding: '1rem', marginBottom: '1rem',
          color: messageType === 'success' ? 'var(--secondary)' : 'var(--error)',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600'
        }}>
          {messageType === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {message}
        </div>
      )}

      {/* Clock & Date */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: '800', fontVariantNumeric: 'tabular-nums', color: 'var(--text-main)' }}>
          {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Location Status */}
      <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--surface-border)' }}>
        <MapPin size={18} style={{ color: location ? 'var(--secondary)' : 'var(--error)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>
            {location ? '📍 Lokasi Terdeteksi' : '⏳ Mendeteksi Lokasi...'}
          </div>
          {locationError && <div style={{ fontSize: '0.75rem', color: 'var(--error)' }}>{locationError}</div>}
          {location && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</div>}
        </div>
        <button onClick={getLocation} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Shift Info */}
      {shift && (
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--secondary)' }}>
            🕐 Shift: {shift.shifts?.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {shift.shifts?.start_time} – {shift.shifts?.end_time}
          </div>
        </div>
      )}

      {/* Today's Attendance Status */}
      {attendance && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontWeight: '800' }}>Absensi Hari Ini</div>
            <span style={{
              padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
              ...STATUS_LABELS[attendance.status] || STATUS_LABELS.hadir,
            }}>
              {STATUS_LABELS[attendance.status]?.label || attendance.status}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'Masuk', time: formatTime(attendance.check_in_time), icon: '🟢' },
              { label: 'Keluar', time: formatTime(attendance.check_out_time), icon: '🔴' },
              { label: 'Mulai Istirahat', time: formatTime(attendance.start_break_time), icon: '☕' },
              { label: 'Selesai Istirahat', time: formatTime(attendance.end_break_time), icon: '✅' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--bg-color)', borderRadius: '10px', padding: '0.6rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{item.icon} {item.label}</div>
                <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{item.time}</div>
              </div>
            ))}
          </div>
          {getWorkDuration() && (
            <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ⏱️ Durasi kerja: <strong>{getWorkDuration()}</strong>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Check In */}
        {!attendance && (
          <button
            onClick={() => handleAction('check_in')}
            disabled={actionLoading || !location || !hasShift}
            style={{
              background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '14px',
              padding: '1.1rem', fontSize: '1rem', fontWeight: '800', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              opacity: (!location || actionLoading || !hasShift) ? 0.7 : 1,
            }}
          >
            {actionLoading && pendingAction === 'check_in' ? <div className="loader" style={{ width: '20px', height: '20px', borderColor: '#fff' }} /> : <><ScanFace size={22} /> Check In</>}
          </button>
        )}

        {/* Break Buttons - only for employees with shift */}
        {attendance && !attendance.check_out_time && (
          <>
            {!isNonShift && !attendance.start_break_time && (
              <button
                onClick={() => handleAction('break_start')}
                disabled={actionLoading}
                style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '14px', padding: '1rem', fontSize: '0.95rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', opacity: actionLoading ? 0.7 : 1 }}
              >
                {actionLoading && pendingAction === 'break_start' ? <div className="loader" style={{ width: '18px', height: '18px', borderColor: '#fff' }} /> : <>☕ Mulai Istirahat</>}
              </button>
            )}

            {!isNonShift && attendance.start_break_time && !attendance.end_break_time && (
              <button
                onClick={() => handleAction('break_end')}
                disabled={actionLoading}
                style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '14px', padding: '1rem', fontSize: '0.95rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', opacity: actionLoading ? 0.7 : 1 }}
              >
                {actionLoading && pendingAction === 'break_end' ? <div className="loader" style={{ width: '18px', height: '18px', borderColor: '#fff' }} /> : <><ScanFace size={20} /> Selesai Istirahat</>}
              </button>
            )}

            {isNonShift && (
              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem', background: 'var(--surface)', borderRadius: '8px' }}>
                ℹ️ Fitur istirahat tidak tersedia untuk karyawan non-shift
              </div>
            )}

            {/* Check Out */}
            <button
              onClick={() => handleAction('check_out')}
              disabled={actionLoading || !location}
              style={{
                background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '14px',
                padding: '1.1rem', fontSize: '1rem', fontWeight: '800', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                opacity: (!location || actionLoading) ? 0.7 : 1,
              }}
            >
              {actionLoading && pendingAction === 'check_out' ? <div className="loader" style={{ width: '20px', height: '20px', borderColor: '#fff' }} /> : <><ScanFace size={22} /> Check Out</>}
            </button>

            {/* Izin Pulang Cepat */}
            <button
              onClick={() => navigate('/karyawan/izin?type=pulang_cepat')}
              disabled={actionLoading}
              style={{
                background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '14px',
                padding: '1rem', fontSize: '0.95rem', fontWeight: '800', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                opacity: actionLoading ? 0.7 : 1,
              }}
            >
              <LogOut size={20} /> Izin Pulang Cepat (Sakit/Emergency)
            </button>
          </>
        )}

        {/* Already done */}
        {attendance?.check_out_time && (
          <div style={{ textAlign: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '14px', padding: '1.5rem' }}>
            <CheckCircle size={32} style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: '800', color: 'var(--secondary)', fontSize: '1.1rem' }}>Absensi Selesai</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Sampai jumpa besok! Selamat beristirahat 🎉
            </div>
          </div>
        )}
      </div>

      {/* Face Register Modal */}
      {showFaceModal && (
        <FaceRegisterModal
          userId={user?.id}
          onSuccess={() => {
            setShowFaceModal(false);
            // Update local user data without full reload to prevent session loss
            const updatedUser = { ...user, face_registered: true };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            showMessage('Wajah berhasil didaftarkan!', 'success');
          }}
          onClose={() => setShowFaceModal(false)}
        />
      )}

      {/* Face Scan Verification Modal */}
      {showScanModal && (
        <FaceScanModal
          userId={user?.id}
          action={pendingAction}
          faceMatchThreshold={settings.face_match_threshold}
          onVerified={(photo) => executeAction(true, photo)}
          onSkip={() => executeAction(false)}
          onClose={() => { setShowScanModal(false); setPendingAction(null); }}
        />
      )}
    </div>
  );
}

// ─── Face Scan Verification Modal ────────────────────────────────────────────
function FaceScanModal({ action, faceMatchThreshold, onVerified, onSkip, onClose }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState('Arahkan wajah Anda ke kamera');
  const [storedDescriptor, setStoredDescriptor] = useState(null);

  const actionLabels = {
    check_in: 'Check In',
    break_start: 'Mulai Istirahat',
    break_end: 'Selesai Istirahat',
    check_out: 'Check Out',
  };

  useEffect(() => {
    startCamera();
    fetchStoredDescriptor();
    loadFaceModels().catch(err => setStatus('Gagal memuat modul: ' + err.message));
    return () => stopCamera();
  }, []);

  const fetchStoredDescriptor = async () => {
    try {
      const u = getUser();
      const data = await api.get(`/employees/${u.id}`);
      if (data?.face_descriptor?.descriptor) {
        setStoredDescriptor(data.face_descriptor.descriptor);
      } else {
        setStatus('Data wajah tidak ditemukan. Silakan daftarkan ulang.');
      }
    } catch (err) {
      console.error('Error fetching descriptor:', err);
    }
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      setStatus('Gagal akses kamera: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
  };

  const handleCapture = async () => {
    if (!videoRef.current || !storedDescriptor || scanning) return;
    
    setScanning(true);
    setStatus('Menyiapkan pemindaian...');
    
    // Give UI time to render the loader before heavy computation
    setTimeout(async () => {
      try {
        setStatus('Sedang memverifikasi wajah...');
        const currentDescriptor = await extractFaceDescriptor(videoRef.current);
        
        if (!currentDescriptor) {
          setStatus('Wajah tidak terdeteksi. Pastikan wajah terlihat jelas dan coba lagi.');
          setScanning(false);
          return;
        }

        let thresholdValue = faceMatchThreshold;
        if (typeof thresholdValue === 'string') {
          thresholdValue = thresholdValue.replace(/"/g, '');
        }
        const threshold = (thresholdValue !== undefined && thresholdValue !== null && thresholdValue !== '') 
          ? Number(thresholdValue) 
          : 0.5;
        const matched = isMatch(storedDescriptor, currentDescriptor, threshold);

        if (matched) {
          // Capture photo for audit
          let photo = null;
          try {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);
            const rawPhoto = canvas.toDataURL('image/jpeg', 0.8);
            photo = await compressImage(rawPhoto, 600, 0.6); // Compress to ~50KB
          } catch (err) {
            console.error('Failed to capture/compress photo:', err);
          }

          setStatus('Verifikasi Berhasil! Memproses absensi...');
          setTimeout(() => {
            stopCamera();
            onVerified(photo);
          }, 1000);
        } else {
          setStatus('Wajah tidak cocok. Silakan coba posisi lain atau bersihkan kamera.');
          setScanning(false);
        }
      } catch (err) {
        console.error('Face verification error:', err);
        setStatus('Kesalahan sistem: ' + err.message);
        setScanning(false);
      }
    }, 500);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 999 }}>
      <div className="modal-content" style={{ maxWidth: '380px' }}>
        <div className="modal-header">
          <h2>Verifikasi Wajah — {actionLabels[action]}</h2>
          <button className="modal-close" onClick={() => { stopCamera(); onClose(); }}><XCircle size={20} /></button>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1', background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '1rem' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* Face guide overlay */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: '60%', aspectRatio: '1', border: '3px solid var(--primary)', borderRadius: '50%', opacity: 0.7 }} />
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>{status}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            {!scanning && (
              <>
                <button onClick={handleCapture} className="action-btn" style={{ flex: 1 }}>
                  <Camera size={18} /> Verifikasi Sekarang
                </button>
                <button onClick={() => { stopCamera(); onSkip(); }} className="btn-ghost">
                  Lewati
                </button>
              </>
            )}
            {scanning && <div className="loader" style={{ width: '30px', height: '30px', margin: '0 auto' }} />}
          </div>
        </div>
      </div>
    </div>
  );
}
