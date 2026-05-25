import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { Camera, X, CheckCircle, AlertCircle, ScanFace } from 'lucide-react';
import { loadFaceModels, extractFaceDescriptor } from '../services/faceService';

export default function FaceRegisterModal({ userId, onSuccess, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [captured, setCaptured] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [permissionBlocked, setPermissionBlocked] = useState(false);

  useEffect(() => {
    startCamera();
    loadFaceModels().catch(err => setError(err.message));
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setError('');
    setPermissionBlocked(false);
    setCameraReady(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Browser Anda tidak mendukung akses kamera atau koneksi tidak aman (bukan HTTPS).');
      return;
    }

    const constraintOptions = [
      { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } } },
      { video: { facingMode: 'user' } },
      { video: true }
    ];

    let lastError = null;
    let s = null;

    for (const constraints of constraintOptions) {
      try {
        s = await navigator.mediaDevices.getUserMedia(constraints);
        if (s) break;
      } catch (err) {
        lastError = err;
        console.warn('Gagal dengan constraint:', constraints, err.name);
      }
    }

    if (s) {
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
          videoRef.current.play().catch(e => console.error("Error playing video stream:", e));
        };
      }
    } else {
      console.error('Camera access failed completely:', lastError);
      if (lastError.name === 'NotAllowedError' || lastError.name === 'PermissionDeniedError') {
        setPermissionBlocked(true);
        setError('Akses kamera ditolak. Silakan izinkan akses kamera untuk melanjutkan.');
      } else if (lastError.name === 'NotReadableError' || lastError.name === 'TrackStartError') {
        setError('Kamera sedang digunakan oleh aplikasi lain. Silakan tutup aplikasi lain (WhatsApp, Zoom, dll) lalu coba lagi.');
      } else if (lastError.name === 'NotFoundError' || lastError.name === 'DevicesNotFoundError') {
        setError('Kamera tidak ditemukan di perangkat Anda.');
      } else {
        setError('Gagal mengakses kamera: ' + lastError.message);
      }
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    // Mirror the image
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    setImageData(dataUrl);
    setCaptured(true);
    stopCamera();
  };

  const retake = async () => {
    setCaptured(false);
    setImageData(null);
    setError('');
    await startCamera();
  };

  const handleSave = async () => {
    if (!imageData || !canvasRef.current) return;
    setSaving(true);
    setError('');
    try {
      // Extract face descriptor from the canvas
      const descriptor = await extractFaceDescriptor(canvasRef.current);
      
      if (!descriptor) {
        throw new Error('Wajah tidak terdeteksi dengan jelas. Silakan ulangi foto.');
      }

      // Convert Float32Array to regular array for JSON storage
      const descriptorArray = Array.from(descriptor);

      await api.put(`/employees/${userId}/face`, {
        face_descriptor: { 
          descriptor: descriptorArray, 
          registered_at: new Date().toISOString() 
        },
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2><ScanFace size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />Daftarkan Wajah</h2>
          <button className="modal-close" onClick={() => { stopCamera(); onClose(); }}><X size={20} /></button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          {/* Camera / Preview Area */}
          {permissionBlocked ? (
            <div style={{ 
              width: '100%', 
              background: 'var(--surface)', 
              border: '1px solid var(--surface-border)', 
              borderRadius: '16px', 
              padding: '1.25rem', 
              marginBottom: '1rem',
              textAlign: 'left',
              boxSizing: 'border-box',
              maxHeight: '350px',
              overflowY: 'auto'
            }}>
              <h3 style={{ color: 'var(--error)', marginTop: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: '800' }}>
                🔒 Akses Kamera Diblokir
              </h3>
              <p style={{ color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1.5, fontSize: '0.82rem' }}>
                Aplikasi membutuhkan izin kamera untuk verifikasi wajah. Silakan aktifkan izin kamera dengan panduan berikut:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.8rem' }}>
                <div>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>🌐 Android (Google Chrome)</strong>
                  <ol style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    <li>Klik ikon 🔒 (gembok) atau setelan di sebelah kiri alamat web di bagian atas layar.</li>
                    <li>Pilih <strong>Izin (Permissions)</strong> atau <strong>Setelan Situs</strong>.</li>
                    <li>Ubah izin <strong>Kamera</strong> menjadi <strong>Izinkan (Allow)</strong>.</li>
                    <li>Segarkan (refresh) halaman ini.</li>
                  </ol>
                </div>

                <div style={{ borderTop: '1px dashed var(--surface-border)', paddingTop: '0.5rem' }}>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.25rem' }}>🍎 iPhone / iPad (Safari)</strong>
                  <ol style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    <li>Buka aplikasi <strong>Pengaturan (Settings)</strong> perangkat Anda.</li>
                    <li>Cari dan pilih browser <strong>Safari</strong>.</li>
                    <li>Di bagian bawah, pilih <strong>Kamera (Camera)</strong>.</li>
                    <li>Pilih <strong>Izinkan (Allow)</strong>.</li>
                    <li>Kembali ke Safari dan segarkan (refresh) halaman ini.</li>
                  </ol>
                </div>

                <div style={{ borderTop: '1px dashed var(--surface-border)', paddingTop: '0.5rem' }}>
                  <strong style={{ color: 'var(--error)', display: 'block', marginBottom: '0.25rem' }}>📱 Aplikasi Sosial (WhatsApp, Instagram, dll.)</strong>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Jika Anda membuka link ini lewat chat WhatsApp atau aplikasi lain, silakan klik tombol <strong>titik tiga (⋮)</strong> di kanan atas layar, lalu pilih <strong>Buka di Browser Chrome / Safari</strong>.
                  </p>
                </div>
              </div>
              
              <button 
                onClick={startCamera} 
                className="action-btn" 
                style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem', fontSize: '0.85rem' }}
              >
                Coba Aktifkan Kamera Lagi
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1', background: '#111', borderRadius: '16px', overflow: 'hidden', marginBottom: '1rem' }}>
              {!captured ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                  {/* Face guide circle */}
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
                  }}>
                    <div style={{
                      width: '65%', aspectRatio: '1', border: '3px solid var(--primary)',
                      borderRadius: '50%', opacity: cameraReady ? 0.8 : 0,
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
                      transition: 'opacity 0.5s'
                    }} />
                  </div>
                </>
              ) : (
                <img
                  src={imageData}
                  alt="Face capture"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {!permissionBlocked && (
            <>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                {!captured
                  ? '👤 Posisikan wajah Anda di dalam lingkaran, lalu klik "Ambil Foto"'
                  : '✅ Foto berhasil diambil. Klik "Simpan" untuk mendaftarkan wajah Anda.'}
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                {!captured ? (
                  <button
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                    className="action-btn"
                    style={{ flex: 1, opacity: cameraReady ? 1 : 0.6 }}
                  >
                    <Camera size={18} /> Ambil Foto
                  </button>
                ) : (
                  <>
                    <button onClick={retake} className="btn-ghost" disabled={saving}>
                      Ulangi
                    </button>
                    <button onClick={handleSave} className="action-btn" style={{ flex: 1 }} disabled={saving}>
                      {saving
                        ? <div className="loader" style={{ width: '16px', height: '16px' }} />
                        : <><CheckCircle size={18} /> Simpan Wajah</>
                      }
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
