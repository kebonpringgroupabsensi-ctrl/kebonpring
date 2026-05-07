import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Clock, Plus, X, Save, Edit, Trash2, Users, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const emptyShiftForm = {
  name: '', shift_type: 'pagi', start_time: '08:00', end_time: '17:00',
  break_start: '12:00', break_end: '13:00', late_tolerance_minutes: 15, max_break_minutes: 60,
};

const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function SAShift() {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editShift, setEditShift] = useState(null);
  const [shiftForm, setShiftForm] = useState(emptyShiftForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleChanges, setScheduleChanges] = useState({});
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  useEffect(() => { 
    fetchShiftsAndEmployees(); 
    api.get('/branches/all-admin').then(setBranches).catch(console.error);
  }, []);
  useEffect(() => { if (selectedEmployee) fetchAssignments(); }, [selectedEmployee, calMonth, calYear]);

  const fetchShiftsAndEmployees = async () => {
    setLoading(true);
    try {
      const [sh, emps] = await Promise.all([
        api.get('/shifts'),
        api.get('/employees'),
      ]);
      setShifts(sh);
      setEmployees(emps.filter(e => e.role === 'karyawan'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const data = await api.get('/shifts/assignments', { month: calMonth, year: calYear, employee_id: selectedEmployee });
      const map = {};
      data.forEach(a => { map[a.date] = a.shift_id; });
      setAssignments(map);
      setScheduleChanges({});
    } catch (err) {
      console.error(err);
    }
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handleDayClick = (dateStr, shiftId) => {
    setScheduleChanges(prev => ({
      ...prev,
      [dateStr]: prev[dateStr] === shiftId ? null : shiftId,
    }));
  };

  const handleSaveSchedule = async () => {
    if (!selectedEmployee) return;
    setScheduleSaving(true);
    try {
      const merged = { ...assignments, ...scheduleChanges };
      
      // Separate assignments to save and assignments to delete
      const toSave = [];
      const toDelete = [];

      Object.entries(scheduleChanges).forEach(([date, shift_id]) => {
        if (shift_id) {
          toSave.push({ employee_id: selectedEmployee, shift_id, date });
        } else {
          toDelete.push(date);
        }
      });

      // 1. Save new/updated assignments
      if (toSave.length > 0) {
        await api.post('/shifts/assignments/bulk', { assignments: toSave });
      }

      // 2. Delete removed assignments (Day Off)
      if (toDelete.length > 0) {
        await api.delete('/shifts/assignments/bulk', { employee_id: selectedEmployee, dates: toDelete });
      }

      setScheduleChanges({});
      await fetchAssignments();
      alert('Jadwal berhasil diperbarui!');
    } catch (err) {
      console.error('Save schedule error:', err);
      alert(err.message || 'Gagal menyimpan jadwal. Silakan coba lagi.');
    } finally {
      setScheduleSaving(false);
    }
  };

  const openAddShift = () => {
    setEditShift(null);
    setShiftForm(emptyShiftForm);
    setFormError('');
    setShowShiftModal(true);
  };

  const openEditShift = (shift) => {
    setEditShift(shift);
    setShiftForm({
      name: shift.name, shift_type: shift.shift_type,
      start_time: shift.start_time, end_time: shift.end_time,
      break_start: shift.break_start || '', break_end: shift.break_end || '',
      late_tolerance_minutes: shift.late_tolerance_minutes || 15,
      max_break_minutes: shift.max_break_minutes || 60,
    });
    setFormError('');
    setShowShiftModal(true);
  };

  const handleSaveShift = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    
    // Sanitize numeric fields
    const sanitizedForm = {
      ...shiftForm,
      late_tolerance_minutes: parseInt(shiftForm.late_tolerance_minutes) || 0,
      max_break_minutes: parseInt(shiftForm.max_break_minutes) || 0,
    };

    try {
      if (editShift) {
        await api.put(`/shifts/${editShift.id}`, sanitizedForm);
      } else {
        await api.post('/shifts', sanitizedForm);
      }
      setShowShiftModal(false);
      fetchShiftsAndEmployees();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShift = async (shift) => {
    if (!confirm(`Hapus shift "${shift.name}"?`)) return;
    try {
      await api.delete(`/shifts/${shift.id}`);
      fetchShiftsAndEmployees();
    } catch (err) {
      alert(err.message);
    }
  };

  const daysInMonth = getDaysInMonth(calMonth, calYear);
  const firstDay = getFirstDayOfMonth(calMonth, calYear);
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getShiftColor = (shiftType) => {
    if (shiftType === 'pagi') return { bg: 'rgba(251,191,36,0.15)', color: '#d97706' };
    if (shiftType === 'malam') return { bg: 'rgba(139,92,246,0.15)', color: '#7c3aed' };
    return { bg: 'rgba(16,185,129,0.15)', color: 'var(--secondary)' };
  };

  return (
    <>
      {/* Shift Master List */}
      <div className="content-card" style={{ marginBottom: '1.5rem' }}>
        <div className="content-header">
          <div>
            <h2>Master Shift</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Konfigurasi tipe-tipe shift kerja</p>
          </div>
          <button className="action-btn" onClick={openAddShift}><Plus size={16} /> Tambah Shift</button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}><div className="loader" style={{ width: '30px', height: '30px', margin: '0 auto' }} /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {shifts.map(shift => {
              const clr = getShiftColor(shift.shift_type);
              return (
                <div key={shift.id} style={{ border: '1px solid var(--surface-border)', borderRadius: '12px', padding: '1.25rem', background: 'var(--bg-color)', borderLeft: `4px solid ${clr.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '1rem' }}>{shift.name}</div>
                      <span style={{ display: 'inline-block', marginTop: '0.25rem', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700', background: clr.bg, color: clr.color }}>
                        {shift.shift_type}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEditShift(shift)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><Edit size={15} /></button>
                      <button onClick={() => handleDeleteShift(shift)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>🕐 {shift.start_time} - {shift.end_time}</span>
                  </div>
                  {shift.break_start && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      ☕ Istirahat: {shift.break_start} - {shift.break_end}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Toleransi terlambat: {shift.late_tolerance_minutes} menit
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Calendar */}
      <div className="content-card">
        <div className="content-header">
          <div>
            <h2>Jadwal Shift Karyawan</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Klik hari untuk mengatur shift karyawan</p>
          </div>
          {Object.keys(scheduleChanges).length > 0 && (
            <button className="action-btn" onClick={handleSaveSchedule} disabled={scheduleSaving}>
              {scheduleSaving ? <div className="loader" style={{ width: '16px', height: '16px' }} /> : <><Save size={16} /> Simpan Jadwal ({Object.keys(scheduleChanges).length} hari)</>}
            </button>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ width: '200px' }}>
            <select className="form-input" value={selectedBranch} onChange={e => { setSelectedBranch(e.target.value); setSelectedEmployee(''); }}>
              <option value="">-- Pilih Cabang --</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <select 
            className="form-input" 
            style={{ flex: 1, minWidth: '180px' }} 
            value={selectedEmployee} 
            onChange={e => setSelectedEmployee(e.target.value)}
            disabled={!selectedBranch}
          >
            <option value="">{selectedBranch ? '-- Pilih Karyawan --' : '-- Pilih Cabang Dulu --'}</option>
            {employees
              .filter(e => !selectedBranch || e.branch_id === selectedBranch)
              .map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.position || 'Staf'})</option>)
            }
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} style={{ background: 'none', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={18} /></button>
            <span style={{ fontWeight: '700', minWidth: '140px', textAlign: 'center' }}>{MONTHS_ID[calMonth]} {calYear}</span>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} style={{ background: 'none', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', display: 'flex' }}><ChevronRight size={18} /></button>
          </div>
        </div>

        {/* Shift Legend */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {shifts.map(s => {
            const clr = getShiftColor(s.shift_type);
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: clr.color }} />
                {s.name}
              </div>
            );
          })}
        </div>

        {!selectedEmployee ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Users size={40} style={{ opacity: 0.3, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
            <p>Pilih karyawan untuk mengatur jadwal shiftnya</p>
          </div>
        ) : (
          <div>
            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {DAYS_ID.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', padding: '0.5rem 0' }}>{d}</div>
              ))}
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />;
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const currentShiftId = scheduleChanges.hasOwnProperty(dateStr) ? scheduleChanges[dateStr] : assignments[dateStr];
                const currentShift = shifts.find(s => s.id === currentShiftId);
                const clr = currentShift ? getShiftColor(currentShift.shift_type) : null;
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                return (
                  <div key={dateStr} style={{ position: 'relative' }}>
                    <button
                      style={{
                        width: '100%', border: isToday ? '2px solid var(--primary)' : '1px solid var(--surface-border)',
                        borderRadius: '8px', padding: '0.4rem 0.2rem', cursor: 'pointer',
                        background: currentShift ? clr.bg : 'var(--bg-color)',
                        minHeight: '52px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                      }}
                      onClick={() => {
                        // Cycle through shifts or clear
                        const currentIdx = currentShiftId ? shifts.findIndex(s => s.id === currentShiftId) : -1;
                        const nextShift = shifts[(currentIdx + 1) % shifts.length];
                        if (currentIdx === shifts.length - 1) {
                          handleDayClick(dateStr, null);
                        } else {
                          handleDayClick(dateStr, nextShift?.id);
                        }
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', fontWeight: isToday ? '800' : '600', color: isToday ? 'var(--primary)' : 'var(--text-main)' }}>{day}</span>
                      {currentShift && (
                        <span style={{ 
                          fontSize: '0.6rem', 
                          fontWeight: '800', 
                          color: clr.color, 
                          textAlign: 'center', 
                          lineHeight: 1.1, 
                          marginTop: '2px', 
                          padding: '2px 4px', 
                          background: clr.bg, 
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          {currentShift.shift_type === 'full_time' ? 'Full' : currentShift.shift_type === 'pagi' ? 'Pagi' : 'Malam'}
                        </span>
                      )}
                    </button>
                    {scheduleChanges.hasOwnProperty(dateStr) && (
                      <div style={{ position: 'absolute', top: '2px', right: '2px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                    )}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
              💡 Klik tanggal untuk berganti shift. Klik terus hingga tombol kosong untuk menghapus jadwal pada hari tersebut.
            </p>
          </div>
        )}
      </div>

      {/* Shift Add/Edit Modal */}
      {showShiftModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editShift ? 'Edit Shift' : 'Tambah Shift Baru'}</h2>
              <button className="modal-close" onClick={() => setShowShiftModal(false)}><X size={20} /></button>
            </div>
            {formError && <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{formError}</div>}
            <form onSubmit={handleSaveShift}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nama Shift *</label>
                  <input className="form-input" required value={shiftForm.name} onChange={e => setShiftForm({ ...shiftForm, name: e.target.value })} placeholder="Shift Pagi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipe Shift *</label>
                  <select className="form-input" required value={shiftForm.shift_type} onChange={e => setShiftForm({ ...shiftForm, shift_type: e.target.value })}>
                    <option value="pagi">Pagi</option>
                    <option value="malam">Malam</option>
                    <option value="full_time">Full Time</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jam Masuk *</label>
                  <input className="form-input" type="time" required value={shiftForm.start_time} onChange={e => setShiftForm({ ...shiftForm, start_time: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Jam Selesai *</label>
                  <input className="form-input" type="time" required value={shiftForm.end_time} onChange={e => setShiftForm({ ...shiftForm, end_time: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mulai Istirahat</label>
                  <input className="form-input" type="time" value={shiftForm.break_start} onChange={e => setShiftForm({ ...shiftForm, break_start: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Selesai Istirahat</label>
                  <input className="form-input" type="time" value={shiftForm.break_end} onChange={e => setShiftForm({ ...shiftForm, break_end: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Toleransi Terlambat (menit)</label>
                  <input className="form-input" type="number" min="0" value={shiftForm.late_tolerance_minutes} onChange={e => setShiftForm({ ...shiftForm, late_tolerance_minutes: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Maks. Istirahat (menit)</label>
                  <input className="form-input" type="number" min="0" value={shiftForm.max_break_minutes} onChange={e => setShiftForm({ ...shiftForm, max_break_minutes: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setShowShiftModal(false)}>Batal</button>
                <button type="submit" className="action-btn" disabled={saving}>
                  {saving ? <div className="loader" style={{ width: '16px', height: '16px' }} /> : <><Save size={16} /> {editShift ? 'Simpan Perubahan' : 'Buat Shift'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
