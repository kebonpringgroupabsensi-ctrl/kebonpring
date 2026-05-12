import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileText, Download, Search, Filter, Users, CheckCircle, XCircle, Calendar, MessageSquare, Camera, MapPin, Image as ImageIcon, Eye } from 'lucide-react';

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function SALaporan() {
  const [activeTab, setActiveTab] = useState('report');
  const [reportData, setReportData] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize date range with current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('en-CA');
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toLocaleDateString('en-CA');

  const [filterStartDate, setFilterStartDate] = useState(firstDay);
  const [filterEndDate, setFilterEndDate] = useState(lastDay);
  const [filterBranch, setFilterBranch] = useState('');
  const [leaveStatusTab, setLeaveStatusTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  
  // Custom Modal State
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null, status: null, name: '' });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  useEffect(() => {
    api.get('/branches/all-admin').then(setBranches).catch(console.error);
  }, []);

  useEffect(() => { 
    if (activeTab === 'report') fetchReport();
    else if (activeTab === 'leave_approval') fetchLeaveRequests(leaveStatusTab);
    else if (activeTab === 'log') fetchAttendanceLog();
  }, [activeTab, filterStartDate, filterEndDate, filterBranch, leaveStatusTab]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { startDate: filterStartDate, endDate: filterEndDate };
      if (filterBranch) params.branch_id = filterBranch;
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
      if (filterBranch) params.branch_id = filterBranch;
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
      const notes = status === 'approved' ? 'Disetujui oleh Admin' : 'Ditolak oleh Admin';
      await api.put(`/leaves/${id}/review`, { status, review_notes: notes });
      await fetchLeaveRequests(leaveStatusTab);
      showNotification(`Berhasil: Izin telah ${status === 'approved' ? 'disetujui' : 'ditolak'}.`, 'success');
    } catch (err) {
      console.error('Approval Error:', err);
      showNotification(`Gagal memproses: ${err.message || 'Terjadi kesalahan'}`, 'error');
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
        ['Laporan Absensi - Periode: ' + filterStartDate + ' s/d ' + filterEndDate],
        [],
        ['No', 'Nama Karyawan', 'NIK', 'Jabatan', 'Cabang', 'Hadir', 'Telat Kerja', 'Telat Istirahat', 'Cepat Pulang', 'Izin', 'Sakit', 'Alfa', 'Total Jam Kerja'],
        ...reportFiltered.map((row, i) => [
          i + 1,
          row.full_name || '-',
          row.nik || '-',
          row.position || '-',
          row.branch || '-',
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
      XLSX.writeFile(wb, `Laporan_Absensi_${filterStartDate}_${filterEndDate}.xlsx`);
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
    izin: acc.izin + (row.izin || 0),
    sakit: acc.sakit + (row.sakit || 0),
    alpa: acc.alpa + (row.alpa || 0),
    total_work_minutes: acc.total_work_minutes + (row.total_work_minutes || 0),
  }), { hadir: 0, terlambat_kerja: 0, terlambat_istirahat: 0, cepat_pulang: 0, izin: 0, sakit: 0, alpa: 0, total_work_minutes: 0 });

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
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
            boxShadow: activeTab === 'report' ? '0 4px 12px rgba(16,185,129,0.3)' : 'none'
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
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
            boxShadow: activeTab === 'leave_approval' ? '0 4px 12px rgba(16,185,129,0.3)' : 'none'
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
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
            boxShadow: activeTab === 'log' ? '0 4px 12px rgba(16,185,129,0.3)' : 'none'
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
          <div className="stat-grid responsive-grid-4" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="stat-card">
              <div className="stat-info"><h3>Total Hadir</h3><div className="value">{totals.hadir}</div></div>
              <div className="stat-icon" style={{ color: 'var(--secondary)', background: 'rgba(16,185,129,0.1)' }}><Users size={24} /></div>
            </div>
            <div className="stat-card">
              <div className="stat-info"><h3>Telat Kerja</h3><div className="value">{totals.terlambat_kerja}</div></div>
              <div className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}><FileText size={24} /></div>
            </div>
            <div className="stat-card">
              <div className="stat-info"><h3>Cepat Pulang</h3><div className="value">{totals.cepat_pulang}</div></div>
              <div className="stat-icon" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}><XCircle size={24} /></div>
            </div>
            <div className="stat-card">
              <div className="stat-info"><h3>Alfa</h3><div className="value">{totals.alpa}</div></div>
              <div className="stat-icon" style={{ color: '#6b7280', background: 'rgba(107,114,128,0.1)' }}><Calendar size={24} /></div>
            </div>
          </div>

          <div className="content-card">
            <div className="content-header">
              <div>
                <h2>Laporan Absensi Bulanan</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Rekap kehadiran karyawan per bulan dari seluruh cabang.</p>
              </div>
              <button className="action-btn" onClick={exportToExcel} disabled={reportFiltered.length === 0}>
                <Download size={16} /> Ekspor Laporan (Excel)
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Periode:</span>
                <input type="date" className="form-input" style={{ width: '150px' }} value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>s/d</span>
                <input type="date" className="form-input" style={{ width: '150px' }} value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
              </div>
              <select className="form-input" style={{ width: '160px' }} value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
                <option value="">Semua Cabang</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Cari nama atau NIK..." className="form-input" style={{ paddingLeft: '2.5rem' }} value={search} onChange={e => setSearch(e.target.value)} />
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
                      <th>Jabatan</th>
                      <th>Cabang</th>
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
                    {reportFiltered.length === 0 ? (
                      <tr><td colSpan={11} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada data absensi untuk periode ini</td></tr>
                    ) : (
                      reportFiltered.map((row, i) => (
                        <tr key={row.employee_id || i} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.875rem' }}>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: '700' }}>{row.full_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.nik || '-'}</div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{row.position || '-'}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{row.branch || '-'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>{row.hadir || 0}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: '700', color: row.terlambat_kerja > 0 ? '#f59e0b' : 'var(--text-muted)' }}>{row.terlambat_kerja || 0}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: '700', color: row.terlambat_istirahat > 0 ? '#f59e0b' : 'var(--text-muted)' }}>{row.terlambat_istirahat || 0}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: '700', color: row.cepat_pulang > 0 ? 'var(--error)' : 'var(--text-muted)' }}>{row.cepat_pulang || 0}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>{row.izin || 0}</td>
                          <td style={{ textAlign: 'center' }}>{row.sakit || 0}</td>
                          <td style={{ textAlign: 'center' }}>{row.pulang_cepat || 0}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: '700', color: row.alpa > 0 ? 'var(--error)' : 'var(--text-muted)' }}>{row.alpa || 0}</span>
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '100px' }}>
                            {Math.floor((row.total_work_minutes || 0) / 60)}j {(row.total_work_minutes || 0) % 60}m
                          </td>
                        </tr>
                      ))
                    )}
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
              <h2>Persetujuan Izin & Sakit</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Daftar pengajuan izin karyawan yang menunggu persetujuan.</p>
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
                    {leaveStatusTab === 'pending' ? 'Tidak ada pengajuan izin yang menunggu persetujuan' : 
                     leaveStatusTab === 'approved' ? 'Belum ada izin yang disetujui' : 'Belum ada izin yang ditolak'}
                  </p>
                </div>
              ) : (
                leaveRequests.map((leave) => (
                  <div key={leave.id} style={{ 
                    padding: '1.25rem', borderRadius: '16px', background: 'var(--bg-color)', 
                    border: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div className="avatar" style={{ width: '45px', height: '45px', fontSize: '1.1rem' }}>{leave.profiles?.full_name?.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '1rem' }}>{leave.profiles?.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                           <Users size={12} /> {leave.profiles?.branches?.name || 'Semua Cabang'}
                        </div>
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase',
                          background: leave.leave_type === 'sakit' ? 'rgba(139,92,246,0.1)' : 'rgba(59,130,246,0.1)',
                          color: leave.leave_type === 'sakit' ? '#8b5cf6' : '#3b82f6'
                        }}>
                          {leave.leave_type}
                        </span>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                          {new Date(leave.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} 
                          {leave.start_date !== leave.end_date && ` - ${new Date(leave.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <MessageSquare size={14} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                        <span>{leave.reason || '(Tidak ada alasan)'}</span>
                      </div>
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
                      <div style={{ display: 'flex', gap: '0.75rem', position: 'relative', zIndex: 10 }}>
                        <button 
                          onClick={() => triggerConfirm(leave.id, 'rejected', leave.profiles?.full_name)}
                          disabled={processingId === leave.id}
                          style={{ 
                            padding: '0.75rem 1.25rem', borderRadius: '12px', border: '2px solid var(--error)',
                            background: 'white', color: 'var(--error)', fontWeight: '800', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem',
                            opacity: processingId === leave.id ? 0.5 : 1
                          }}
                        >
                          <XCircle size={18} /> Tolak
                        </button>
                        <button 
                          onClick={() => triggerConfirm(leave.id, 'approved', leave.profiles?.full_name)}
                          disabled={processingId === leave.id}
                          style={{ 
                            padding: '0.75rem 1.25rem', borderRadius: '12px', border: 'none',
                            background: 'var(--primary)', color: 'white', fontWeight: '800', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem',
                            boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                            opacity: processingId === leave.id ? 0.5 : 1
                          }}
                        >
                          {processingId === leave.id ? <div className="loader" style={{ width: '18px', height: '18px' }} /> : <CheckCircle size={18} />} Setujui
                        </button>
                      </div>
                    ) : (
                      <div style={{ 
                        padding: '0.5rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800',
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
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Daftar aktivitas absensi individu secara mendetail.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Periode:</span>
              <input type="date" className="form-input" style={{ width: '150px' }} value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>s/d</span>
              <input type="date" className="form-input" style={{ width: '150px' }} value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
            </div>
            <select className="form-input" style={{ width: '160px' }} value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
              <option value="">Semua Cabang</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
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
                          <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                            {att.total_work_minutes ? `${Math.floor(att.total_work_minutes / 60)}j ${att.total_work_minutes % 60}m` : '-'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>
                            {att.total_break_minutes ? `${Math.floor(att.total_break_minutes / 60)}j ${att.total_break_minutes % 60}m` : '-'}
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
