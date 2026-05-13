import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileText, Download, Search, Users, CheckCircle, XCircle, Calendar, MessageSquare, Camera, MapPin, Image as ImageIcon, Eye } from 'lucide-react';

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function ACLaporan() {
  const [activeTab, setActiveTab] = useState('report');
  const [reportData, setReportData] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Initialize date range with current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('en-CA');
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toLocaleDateString('en-CA');
  
  const [filterStartDate, setFilterStartDate] = useState(firstDay);
  const [filterEndDate, setFilterEndDate] = useState(lastDay);
  const [leaveStatusTab, setLeaveStatusTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  
  // Custom Modal State
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null, status: null, name: '' });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [detailModal, setDetailModal] = useState({ show: false, type: '', title: '', data: [], loading: false });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const openDetailModal = async (type, title) => {
    setDetailModal({ show: true, type, title, data: [], loading: true });
    try {
      const params = { type, startDate: filterStartDate, endDate: filterEndDate };
      const result = await api.get('/attendances/detail', params);
      setDetailModal(prev => ({ ...prev, data: result || [], loading: false }));
    } catch (err) {
      console.error('Detail fetch error:', err);
      setDetailModal(prev => ({ ...prev, loading: false }));
    }
  };

  const closeDetailModal = () => setDetailModal({ show: false, type: '', title: '', data: [], loading: false });

  useEffect(() => { 
    if (activeTab === 'report') fetchReport();
    else if (activeTab === 'leave_approval') fetchLeaveRequests(leaveStatusTab);
    else if (activeTab === 'log') fetchAttendanceLog();
  }, [activeTab, filterStartDate, filterEndDate, leaveStatusTab]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { startDate: filterStartDate, endDate: filterEndDate };
      const result = await api.get('/attendances/summary', params);
      setReportData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async (status = 'pending') => {
    setLoading(true);
    try {
      const result = await api.get('/leaves', { status });
      setLeaveRequests(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceLog = async () => {
    setLoading(true);
    try {
      const params = { startDate: filterStartDate, endDate: filterEndDate };
      const result = await api.get('/attendances', params);
      setAttendanceLog(result);
    } catch (err) {
      console.error('Fetch log error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewLeave = async () => {
    const { id, status } = confirmModal;
    setProcessingId(id);
    setConfirmModal({ show: false, id: null, status: null, name: '' });

    try {
      const notes = status === 'approved' ? 'Disetujui oleh Admin Cabang' : 'Ditolak oleh Admin Cabang';
      await api.put(`/leaves/${id}/review`, { status, review_notes: notes });
      await fetchLeaveRequests(leaveStatusTab);
      showNotification(`Berhasil memperbarui status izin.`, 'success');
    } catch (err) {
      console.error('Review error:', err);
      showNotification(`Gagal: ${err.message || 'Terjadi kesalahan'}`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const triggerConfirm = (id, status, name) => {
    setConfirmModal({ show: true, id, status, name });
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const ws_data = [
        ['Laporan Absensi Cabang - Periode: ' + filterStartDate + ' s/d ' + filterEndDate],
        [],
        ['No', 'Nama Karyawan', 'NIK', 'Hadir', 'Telat Kerja', 'Telat Istirahat', 'Cepat Pulang', 'Izin', 'Sakit', 'Alfa', 'Total Jam Kerja'],
        ...reportFiltered.map((row, i) => [
          i + 1,
          row.full_name || '-',
          row.nik || '-',
          row.hadir || 0,
          row.terlambat_kerja || 0,
          row.terlambat_istirahat || 0,
          row.cepat_pulang || 0,
          row.izin || 0,
          row.sakit || 0,
          row.alpa || 0,
          `${Math.floor((row.total_work_minutes || 0) / 60)} jam ${(row.total_work_minutes || 0) % 60} menit`,
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Absensi');
      XLSX.writeFile(wb, `Laporan_Cabang_${filterStartDate}_${filterEndDate}.xlsx`);
    } catch (err) {
      alert('Gagal export: ' + err.message);
    }
  };

  const reportFiltered = reportData.filter(row =>
    !search || row.full_name?.toLowerCase().includes(search.toLowerCase()) || row.nik?.toLowerCase().includes(search.toLowerCase())
  );

  const totals = reportFiltered.reduce((acc, row) => ({
    hadir: acc.hadir + (row.hadir || 0),
    terlambat_kerja: acc.terlambat_kerja + (row.terlambat_kerja || 0),
    terlambat_istirahat: acc.terlambat_istirahat + (row.terlambat_istirahat || 0),
    cepat_pulang: acc.cepat_pulang + (row.cepat_pulang || 0),
    alpa: acc.alpa + (row.alpa || 0),
  }), { hadir: 0, terlambat_kerja: 0, terlambat_istirahat: 0, cepat_pulang: 0, alpa: 0 });

  return (
    <>
      {/* Toast Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 10000,
          background: notification.type === 'success' ? 'var(--primary)' : 'var(--error)',
          color: 'white', padding: '1rem 2rem', borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontWeight: '700',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {notification.message}
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ color: confirmModal.status === 'approved' ? 'var(--primary)' : 'var(--error)', marginBottom: '1rem' }}>
              {confirmModal.status === 'approved' ? <CheckCircle size={64} style={{ margin: '0 auto' }} /> : <XCircle size={64} style={{ margin: '0 auto' }} />}
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Konfirmasi Persetujuan</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Apakah Anda yakin ingin <strong>{confirmModal.status === 'approved' ? 'MENYETUJUI' : 'MENOLAK'}</strong> izin untuk <strong>{confirmModal.name}</strong>?
            </p>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setConfirmModal({ show: false, id: null, status: null, name: '' })}>Batal</button>
              <button 
                className="btn-submit" 
                style={{ width: 'auto', marginTop: 0, background: confirmModal.status === 'approved' ? 'var(--primary)' : 'var(--error)' }}
                onClick={handleReviewLeave}
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.show && (
        <div className="modal-overlay" style={{ zIndex: 10001 }} onClick={closeDetailModal}>
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{detailModal.title}</h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filterStartDate} s/d {filterEndDate}</p>
              </div>
              <button onClick={closeDetailModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
                <XCircle size={22} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '1rem 1.5rem' }}>
              {detailModal.loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}><div className="loader" style={{ width: '30px', height: '30px', margin: '0 auto' }} /></div>
              ) : detailModal.data.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada data untuk periode ini.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>No</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Nama Karyawan</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>Tanggal</th>
                      {detailModal.type === 'terlambat_kerja' && <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>Menit Terlambat</th>}
                      {detailModal.type === 'terlambat_istirahat' && <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>Durasi Istirahat</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {detailModal.data.map((row, i) => (
                      <tr key={row.id || i} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                        <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <div style={{ fontWeight: '700' }}>{row.profiles?.full_name || '-'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{row.profiles?.nik || ''}</div>
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: '600' }}>
                          {new Date(row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        {detailModal.type === 'terlambat_kerja' && (
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                            <span style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem' }}>
                              {row.late_minutes || 0} menit
                            </span>
                          </td>
                        )}
                        {detailModal.type === 'terlambat_istirahat' && (
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                            <span style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem' }}>
                              {row.total_break_minutes || 0} menit
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total: <strong>{detailModal.data.length}</strong> kejadian</span>
              <button className="btn-ghost" style={{ padding: '0.5rem 1.25rem' }} onClick={closeDetailModal}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setActiveTab('report')}
          style={{ 
            padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '700', border: 'none',
            background: activeTab === 'report' ? 'var(--primary)' : 'var(--surface)',
            color: activeTab === 'report' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <FileText size={18} /> Rekap Absensi
        </button>
        <button 
          onClick={() => setActiveTab('leave_approval')}
          style={{ 
            padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '700', border: 'none',
            background: activeTab === 'leave_approval' ? 'var(--primary)' : 'var(--surface)',
            color: activeTab === 'leave_approval' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <CheckCircle size={18} /> Persetujuan Izin {leaveRequests.length > 0 && <span style={{ background: activeTab === 'leave_approval' ? 'white' : 'var(--primary)', color: activeTab === 'leave_approval' ? 'var(--primary)' : 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{leaveRequests.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('log')}
          style={{ 
            padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '700', border: 'none',
            background: activeTab === 'log' ? 'var(--primary)' : 'var(--surface)',
            color: activeTab === 'log' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <Camera size={18} /> Log Absensi
        </button>
      </div>

      {previewImage && (
        <div className="modal-overlay" style={{ zIndex: 11000 }} onClick={() => setPreviewImage(null)}>
          <div className="modal-content" style={{ maxWidth: '500px', padding: '0.5rem', background: 'transparent', boxShadow: 'none' }}>
            <img src={previewImage} alt="Preview" style={{ width: '100%', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
            <button className="modal-close" style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', top: '10px', right: '10px' }} onClick={() => setPreviewImage(null)}><XCircle size={24} /></button>
          </div>
        </div>
      )}

      {activeTab === 'report' ? (
        <>
          {/* Summary Cards */}
          <div className="stat-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <div className="stat-card" onClick={() => openDetailModal('hadir', 'Total Hadir')} style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div className="stat-info"><h3>Total Hadir</h3><div className="value">{totals.hadir}</div></div>
              <div className="stat-icon" style={{ color: 'var(--secondary)', background: 'rgba(16,185,129,0.1)' }}><Users size={22} /></div>
            </div>
            <div className="stat-card" onClick={() => openDetailModal('terlambat_kerja', 'Telat Kerja')} style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,158,11,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div className="stat-info"><h3>Telat Kerja</h3><div className="value">{totals.terlambat_kerja}</div></div>
              <div className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}><FileText size={22} /></div>
            </div>
            <div className="stat-card" onClick={() => openDetailModal('terlambat_istirahat', 'Telat Istirahat')} style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div className="stat-info"><h3>Telat Istirahat</h3><div className="value">{totals.terlambat_istirahat}</div></div>
              <div className="stat-icon" style={{ color: '#6366f1', background: 'rgba(99,102,241,0.1)' }}><Calendar size={22} /></div>
            </div>
            <div className="stat-card" onClick={() => openDetailModal('cepat_pulang', 'Cepat Pulang')} style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(239,68,68,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div className="stat-info"><h3>Cepat Pulang</h3><div className="value">{totals.cepat_pulang}</div></div>
              <div className="stat-icon" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}><XCircle size={22} /></div>
            </div>
            <div className="stat-card" onClick={() => openDetailModal('alpa', 'Alfa')} style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(107,114,128,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div className="stat-info"><h3>Alfa</h3><div className="value">{totals.alpa}</div></div>
              <div className="stat-icon" style={{ color: '#6b7280', background: 'rgba(107,114,128,0.1)' }}><CheckCircle size={22} /></div>
            </div>
          </div>

          <div className="content-card">
          <div className="content-header">
            <div>
              <h2>Laporan Absensi Cabang</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Rekap kehadiran karyawan di cabang Anda.</p>
            </div>
            <button className="action-btn" onClick={exportToExcel} disabled={reportFiltered.length === 0}>
              <Download size={16} /> Excel
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Periode:</span>
              <input type="date" className="form-input" style={{ width: '150px' }} value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>s/d</span>
              <input type="date" className="form-input" style={{ width: '150px' }} value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Cari karyawan..." className="form-input" style={{ paddingLeft: '2.5rem' }} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="loader" style={{ width: '30px', height: '30px', margin: '0 auto' }} /></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Nama Karyawan</th>
                    <th style={{ textAlign: 'center' }}>Hadir</th>
                    <th style={{ textAlign: 'center' }}>Telat Kerja</th>
                    <th style={{ textAlign: 'center' }}>Telat Istirahat</th>
                    <th style={{ textAlign: 'center' }}>Cepat Pulang</th>
                    <th style={{ textAlign: 'center' }}>Izin</th>
                    <th style={{ textAlign: 'center' }}>Sakit</th>
                    <th style={{ textAlign: 'center' }}>Plg Cepat</th>
                    <th style={{ textAlign: 'center' }}>Alfa</th>
                    <th style={{ textAlign: 'center' }}>Jam Kerja</th>
                  </tr>
                </thead>
                <tbody>
                  {reportFiltered.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.875rem' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: '700' }}>{row.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.nik || '-'}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{row.hadir || 0}</td>
                      <td style={{ textAlign: 'center' }}>{row.terlambat_kerja || 0}</td>
                      <td style={{ textAlign: 'center' }}>{row.terlambat_istirahat || 0}</td>
                      <td style={{ textAlign: 'center' }}>{row.cepat_pulang || 0}</td>
                      <td style={{ textAlign: 'center' }}>{row.izin || 0}</td>
                      <td style={{ textAlign: 'center' }}>{row.sakit || 0}</td>
                      <td style={{ textAlign: 'center' }}>{row.pulang_cepat || 0}</td>
                      <td style={{ textAlign: 'center' }}>{row.alpa || 0}</td>
                      <td style={{ textAlign: 'center' }}>{Math.floor((row.total_work_minutes || 0) / 60)}j {(row.total_work_minutes || 0) % 60}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
      ) : activeTab === 'leave_approval' ? (
        <div className="content-card">
          <div className="content-header" style={{ marginBottom: '1rem' }}>
            <div>
              <h2>Persetujuan Izin Cabang</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Review pengajuan izin dari karyawan di cabang Anda.</p>
            </div>
          </div>

          {/* Sub-tab Switcher */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', padding: '4px', background: 'var(--bg-color)', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--surface-border)' }}>
            <button 
              onClick={() => setLeaveStatusTab('pending')}
              style={{ 
                padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', border: 'none',
                background: leaveStatusTab === 'pending' ? 'white' : 'transparent',
                color: leaveStatusTab === 'pending' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: leaveStatusTab === 'pending' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Menunggu ({leaveStatusTab === 'pending' ? leaveRequests.length : '...'})
            </button>
            <button 
              onClick={() => setLeaveStatusTab('approved')}
              style={{ 
                padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', border: 'none',
                background: leaveStatusTab === 'approved' ? 'white' : 'transparent',
                color: leaveStatusTab === 'approved' ? 'var(--secondary)' : 'var(--text-muted)',
                boxShadow: leaveStatusTab === 'approved' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Disetujui
            </button>
            <button 
              onClick={() => setLeaveStatusTab('rejected')}
              style={{ 
                padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', border: 'none',
                background: leaveStatusTab === 'rejected' ? 'white' : 'transparent',
                color: leaveStatusTab === 'rejected' ? 'var(--error)' : 'var(--text-muted)',
                boxShadow: leaveStatusTab === 'rejected' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Ditolak
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="loader" style={{ width: '30px', height: '30px', margin: '0 auto' }} /></div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {leaveRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-color)', borderRadius: '16px', border: '2px dashed var(--surface-border)' }}>
                  <CheckCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                    {leaveStatusTab === 'pending' ? 'Tidak ada pengajuan izin tertunda' : 
                     leaveStatusTab === 'approved' ? 'Belum ada izin yang disetujui' : 'Belum ada izin yang ditolak'}
                  </p>
                </div>
              ) : (
                leaveRequests.map((leave) => (
                  <div key={leave.id} style={{ 
                    padding: '1.25rem', borderRadius: '16px', background: 'var(--bg-color)', 
                    border: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: '1.5rem', flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div className="avatar" style={{ width: '40px', height: '40px' }}>{leave.profiles?.full_name?.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: '800' }}>{leave.profiles?.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{leave.leave_type} • {new Date(leave.start_date).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{leave.reason || '(Tanpa alasan)'}</div>
                      {leave.attachment_url && (
                        <button 
                          onClick={() => setPreviewImage(leave.attachment_url)}
                          style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', padding: '0.4rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}
                        >
                          <ImageIcon size={14} /> Lihat Bukti Foto
                        </button>
                      )}
                      {leave.review_notes && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Catatan: {leave.review_notes}
                        </div>
                      )}
                      {(leave.latitude || leave.longitude) && (
                        <a 
                          href={`https://www.google.com/maps?q=${leave.latitude},${leave.longitude}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', textDecoration: 'none' }}
                          title="Klik untuk buka di Google Maps"
                        >
                          <MapPin size={12} /> {leave.latitude?.toFixed(5)}, {leave.longitude?.toFixed(5)} (Klik Lihat Map)
                        </a>
                      )}
                    </div>

                    {leave.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', position: 'relative', zIndex: 10 }}>
                        <button 
                          onClick={() => triggerConfirm(leave.id, 'rejected', leave.profiles?.full_name)}
                          disabled={processingId === leave.id}
                          className="btn-ghost" 
                          style={{ padding: '0.6rem 1.25rem', color: 'var(--error)', border: '2px solid var(--error)', opacity: processingId === leave.id ? 0.5 : 1 }}
                        >
                          Tolak
                        </button>
                        <button 
                          onClick={() => triggerConfirm(leave.id, 'approved', leave.profiles?.full_name)}
                          disabled={processingId === leave.id}
                          className="action-btn" 
                          style={{ padding: '0.6rem 1.25rem', opacity: processingId === leave.id ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          {processingId === leave.id ? <div className="loader" style={{ width: '14px', height: '14px' }} /> : null} Setujui
                        </button>
                      </div>
                    ) : (
                      <div style={{ 
                        padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800',
                        background: leave.status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: leave.status === 'approved' ? 'var(--secondary)' : 'var(--error)',
                        textTransform: 'uppercase'
                      }}>
                        {leave.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : activeTab === 'log' ? (
        <div className="content-card">
          <div className="content-header">
            <div>
              <h2>Log Absensi Harian</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Daftar aktivitas absensi individu di cabang Anda.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Periode:</span>
              <input type="date" className="form-input" style={{ width: '150px' }} value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>s/d</span>
              <input type="date" className="form-input" style={{ width: '150px' }} value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Cari nama..." className="form-input" style={{ paddingLeft: '2.5rem' }} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="loader" style={{ width: '30px', height: '30px', margin: '0 auto' }} /></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Tanggal / Nama</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Durasi Kerja</th>
                    <th>Durasi Istirahat</th>
                    <th>Lokasi</th>
                    <th>Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLog
                    .filter(att => !search || att.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()))
                    .map((att) => (
                    <tr key={att.id} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '700' }}>{new Date(att.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{att.profiles?.full_name}</div>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700',
                          background: att.status === 'hadir' ? 'rgba(16,185,129,0.1)' : 
                                      att.status === 'pulang_cepat' ? 'rgba(245,158,11,0.1)' :
                                      att.status === 'terlambat' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
                          color: att.status === 'hadir' ? 'var(--secondary)' : 
                                 att.status === 'pulang_cepat' ? '#f59e0b' :
                                 att.status === 'terlambat' ? '#f59e0b' : '#3b82f6'
                        }}>
                          {att.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700' }}>{att.check_in_time ? new Date(att.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{att.check_in_face_verified ? '✅ Wajah Terverifikasi' : '❌ Tanpa Verifikasi'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700' }}>{att.check_out_time ? new Date(att.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{att.check_out_time ? (att.check_out_face_verified ? '✅ Wajah Terverifikasi' : '❌ Tanpa Verifikasi') : ''}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {att.total_work_minutes ? `${Math.floor(att.total_work_minutes / 60)}j ${att.total_work_minutes % 60}m` : '-'}
                          {att.is_early_leave && <span style={{ fontSize: '0.65rem', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: '800' }}>PULANG CEPAT</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {att.total_break_minutes ? `${Math.floor(att.total_break_minutes / 60)}j ${att.total_break_minutes % 60}m` : '-'}
                          {att.is_break_late && <span style={{ fontSize: '0.65rem', background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: '800' }}>TELAT</span>}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <a 
                          href={`https://www.google.com/maps?q=${att.check_in_latitude},${att.check_in_longitude}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'inherit', textDecoration: 'none', display: 'block', marginBottom: '0.2rem' }}
                          title="Klik lihat Map"
                        >
                          IN: {att.check_in_latitude?.toFixed(4)}, {att.check_in_longitude?.toFixed(4)} 📍
                        </a>
                        {att.check_out_time && (
                          <a 
                            href={`https://www.google.com/maps?q=${att.check_out_latitude},${att.check_out_longitude}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}
                            title="Klik lihat Map"
                          >
                            OUT: {att.check_out_latitude?.toFixed(4)}, {att.check_out_longitude?.toFixed(4)} 📍
                          </a>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {att.check_in_photo_url && (
                            <button onClick={() => setPreviewImage(att.check_in_photo_url)} className="btn-ghost" style={{ padding: '0.4rem', minWidth: 'auto' }} title="Foto Masuk">
                              <Camera size={16} />
                            </button>
                          )}
                          {att.check_out_photo_url && (
                            <button onClick={() => setPreviewImage(att.check_out_photo_url)} className="btn-ghost" style={{ padding: '0.4rem', minWidth: 'auto', color: 'var(--error)' }} title="Foto Pulang">
                              <Camera size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
