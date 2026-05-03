import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileText, Download, Search, Filter, Users, CheckCircle, XCircle, Calendar, MessageSquare } from 'lucide-react';

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function SALaporan() {
  const [activeTab, setActiveTab] = useState('report');
  const [reportData, setReportData] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterBranch, setFilterBranch] = useState('');
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
    api.get('/branches/all-admin').then(setBranches).catch(console.error);
  }, []);

  useEffect(() => { 
    if (activeTab === 'report') fetchReport();
    else fetchLeaveRequests();
  }, [activeTab, filterMonth, filterYear, filterBranch]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { month: filterMonth, year: filterYear };
      if (filterBranch) params.branch_id = filterBranch;
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
      const notes = status === 'approved' ? 'Disetujui oleh Admin' : 'Ditolak oleh Admin';
      await api.put(`/leaves/${id}/review`, { status, review_notes: notes });
      await fetchLeaveRequests();
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
        ['Laporan Absensi - ' + MONTHS_ID[filterMonth] + ' ' + filterYear],
        [],
        ['No', 'Nama Karyawan', 'NIK', 'Cabang', 'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpa', 'Total Jam Kerja'],
        ...reportFiltered.map((row, i) => [
          i + 1,
          row.full_name || '-',
          row.nik || '-',
          row.branch || '-',
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
      XLSX.writeFile(wb, `Laporan_Absensi_${MONTHS_ID[filterMonth]}_${filterYear}.xlsx`);
    } catch (err) {
      alert('Gagal export: ' + err.message);
    }
  };

  const reportFiltered = reportData.filter(row =>
    !search || row.full_name?.toLowerCase().includes(search.toLowerCase()) || row.nik?.toLowerCase().includes(search.toLowerCase())
  );

  const totals = reportFiltered.reduce((acc, row) => ({
    hadir: acc.hadir + (row.hadir || 0),
    terlambat: acc.terlambat + (row.terlambat || 0),
    izin: acc.izin + (row.izin || 0),
    sakit: acc.sakit + (row.sakit || 0),
    alpa: acc.alpa + (row.alpa || 0),
    total_work_minutes: acc.total_work_minutes + (row.total_work_minutes || 0),
  }), { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpa: 0, total_work_minutes: 0 });

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
      </div>

      {activeTab === 'report' ? (
        <>
          {/* Summary Cards */}
          <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-info"><h3>Total Hadir</h3><div className="value">{totals.hadir}</div></div>
              <div className="stat-icon" style={{ color: 'var(--secondary)', background: 'rgba(16,185,129,0.1)' }}><Users size={24} /></div>
            </div>
            <div className="stat-card">
              <div className="stat-info"><h3>Terlambat</h3><div className="value">{totals.terlambat}</div></div>
              <div className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}><FileText size={24} /></div>
            </div>
            <div className="stat-card">
              <div className="stat-info"><h3>Izin/Sakit</h3><div className="value">{totals.izin + totals.sakit}</div></div>
              <div className="stat-icon" style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)' }}><FileText size={24} /></div>
            </div>
            <div className="stat-card">
              <div className="stat-info"><h3>Alpa</h3><div className="value">{totals.alpa}</div></div>
              <div className="stat-icon" style={{ color: 'var(--error)', background: 'rgba(239,68,68,0.1)' }}><FileText size={24} /></div>
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
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <select className="form-input" style={{ width: '140px' }} value={filterMonth} onChange={e => setFilterMonth(parseInt(e.target.value))}>
                {MONTHS_ID.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select className="form-input" style={{ width: '100px' }} value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
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
                      <th>Cabang</th>
                      <th style={{ textAlign: 'center' }}>Hadir</th>
                      <th style={{ textAlign: 'center' }}>Terlambat</th>
                      <th style={{ textAlign: 'center' }}>Izin</th>
                      <th style={{ textAlign: 'center' }}>Sakit</th>
                      <th style={{ textAlign: 'center' }}>Alpa</th>
                      <th style={{ textAlign: 'center' }}>Jam Kerja</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportFiltered.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada data absensi untuk periode ini</td></tr>
                    ) : (
                      reportFiltered.map((row, i) => (
                        <tr key={row.employee_id || i} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '0.875rem' }}>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ fontWeight: '700' }}>{row.full_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.nik || '-'}</div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{row.branch || '-'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>{row.hadir || 0}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: '700', color: row.terlambat > 0 ? '#f59e0b' : 'var(--text-muted)' }}>{row.terlambat || 0}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>{row.izin || 0}</td>
                          <td style={{ textAlign: 'center' }}>{row.sakit || 0}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: '700', color: row.alpa > 0 ? 'var(--error)' : 'var(--text-muted)' }}>{row.alpa || 0}</span>
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
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
      ) : (
        <div className="content-card">
          <div className="content-header">
            <div>
              <h2>Persetujuan Izin & Sakit</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Daftar pengajuan izin karyawan yang menunggu persetujuan.</p>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="loader" style={{ width: '30px', height: '30px', margin: '0 auto' }} /></div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {leaveRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-color)', borderRadius: '16px', border: '2px dashed var(--surface-border)' }}>
                  <CheckCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Tidak ada pengajuan izin yang menunggu persetujuan</p>
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
                    </div>

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
