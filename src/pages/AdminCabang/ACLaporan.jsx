import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileText, Download, Search, Users, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function ACLaporan() {
  const [activeTab, setActiveTab] = useState('report');
  const [reportData, setReportData] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);
  
  // Custom Modal State
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null, status: null, name: '' });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  useEffect(() => { 
    if (activeTab === 'report') fetchReport();
    else fetchLeaveRequests();
  }, [activeTab, filterMonth, filterYear]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { month: filterMonth, year: filterYear };
      const result = await api.get('/attendances/summary', params);
      setReportData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const result = await api.get('/leaves', { status: 'pending' });
      setLeaveRequests(result);
    } catch (err) {
      console.error(err);
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
      await fetchLeaveRequests();
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
        ['Laporan Absensi Cabang - ' + MONTHS_ID[filterMonth] + ' ' + filterYear],
        [],
        ['No', 'Nama Karyawan', 'NIK', 'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpa', 'Total Jam Kerja'],
        ...reportFiltered.map((row, i) => [
          i + 1,
          row.full_name || '-',
          row.nik || '-',
          row.hadir || 0,
          row.terlambat || 0,
          row.izin || 0,
          row.sakit || 0,
          row.alpa || 0,
          `${Math.floor((row.total_work_minutes || 0) / 60)} jam ${(row.total_work_minutes || 0) % 60} menit`,
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Absensi');
      XLSX.writeFile(wb, `Laporan_Cabang_${MONTHS_ID[filterMonth]}_${filterYear}.xlsx`);
    } catch (err) {
      alert('Gagal export: ' + err.message);
    }
  };

  const reportFiltered = reportData.filter(row =>
    !search || row.full_name?.toLowerCase().includes(search.toLowerCase()) || row.nik?.toLowerCase().includes(search.toLowerCase())
  );

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
      </div>

      {activeTab === 'report' ? (
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

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <select className="form-input" style={{ width: '140px' }} value={filterMonth} onChange={e => setFilterMonth(parseInt(e.target.value))}>
              {MONTHS_ID.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select className="form-input" style={{ width: '100px' }} value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
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
                    <th style={{ textAlign: 'center' }}>Izin</th>
                    <th style={{ textAlign: 'center' }}>Sakit</th>
                    <th style={{ textAlign: 'center' }}>Alpa</th>
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
                      <td style={{ textAlign: 'center' }}>{row.izin || 0}</td>
                      <td style={{ textAlign: 'center' }}>{row.sakit || 0}</td>
                      <td style={{ textAlign: 'center' }}>{row.alpa || 0}</td>
                      <td style={{ textAlign: 'center' }}>{Math.floor((row.total_work_minutes || 0) / 60)}j {(row.total_work_minutes || 0) % 60}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="content-card">
          <div className="content-header">
            <div>
              <h2>Persetujuan Izin Cabang</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Review pengajuan izin dari karyawan di cabang Anda.</p>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="loader" style={{ width: '30px', height: '30px', margin: '0 auto' }} /></div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {leaveRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-color)', borderRadius: '16px', border: '2px dashed var(--surface-border)' }}>
                  <CheckCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Tidak ada pengajuan izin tertunda</p>
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
                    </div>

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
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
