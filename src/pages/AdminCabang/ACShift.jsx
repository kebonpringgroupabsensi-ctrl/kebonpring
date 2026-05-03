import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function ACShift() {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState({}); // Key: employeeId_date
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  useEffect(() => { 
    fetchData(); 
  }, [calMonth, calYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sh, emps, asgn] = await Promise.all([
        api.get('/shifts'),
        api.get('/employees'),
        api.get('/shifts/assignments', { month: calMonth, year: calYear }),
      ]);
      
      setShifts(sh);
      setEmployees(emps.filter(e => e.role === 'karyawan'));

      const map = {};
      asgn.forEach(a => {
        map[`${a.employee_id}_${a.date}`] = a.shifts?.name || '';
      });
      setAssignments(map);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <div className="loader" style={{ width: '40px', height: '40px' }} />
    </div>
  );

  return (
    <>
      <style>{`
        @media print {
          @page { size: landscape; margin: 1cm; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { 
            display: block !important;
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            background: white !important;
            padding: 0;
            color: black !important;
          }
          .no-print { display: none !important; }
          .shift-table-print { 
            border-collapse: collapse; 
            width: 100%; 
            table-layout: fixed;
            border: 1px solid #000;
          }
          .shift-table-print th, .shift-table-print td { 
            border: 1px solid #000; 
            padding: 4px 2px; 
            font-size: 9px; 
            text-align: center; 
            color: black !important;
          }
          .shift-table-print th { background: #eee !important; -webkit-print-color-adjust: exact; }
          .shift-table-print .name-col { width: 140px; text-align: left; padding-left: 5px; }
          .shift-table-print .pos-col { width: 100px; text-align: left; padding-left: 5px; }
        }
      `}</style>

      {/* DISPLAY AREA */}
      <div className="content-card no-print">
        <div className="content-header">
          <div>
            <h2>Jadwal Shift Cabang</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Menampilkan jadwal kerja karyawan bulan {MONTHS_ID[calMonth]} {calYear}
            </p>
          </div>
          <button onClick={handlePrint} className="action-btn" style={{ background: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Printer size={16} /> Print / PDF
          </button>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} className="btn-ghost" style={{ padding: '0.5rem' }}><ChevronLeft size={20} /></button>
          <h3 style={{ minWidth: '200px', textAlign: 'center', margin: 0 }}>{MONTHS_ID[calMonth]} {calYear}</h3>
          <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} className="btn-ghost" style={{ padding: '0.5rem' }}><ChevronRight size={20} /></button>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid var(--surface-border)', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--surface-border)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', minWidth: '180px', position: 'sticky', left: 0, background: 'var(--bg-color)', zIndex: 2 }}>Karyawan</th>
                {days.map(d => (
                  <th key={d} style={{ padding: '0.75rem', fontSize: '0.75rem', minWidth: '45px', borderRight: '1px solid var(--surface-border)' }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'left', position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{emp.full_name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.position}</div>
                  </td>
                  {days.map(d => {
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const shiftName = assignments[`${emp.id}_${dateStr}`] || '';
                    
                    let bgColor = 'transparent';
                    let textColor = 'var(--text-muted)';
                    let char = '-';

                    if (shiftName.toLowerCase().includes('pagi')) { 
                      bgColor = 'rgba(16,185,129,0.1)'; textColor = 'var(--primary)'; char = 'P';
                    } else if (shiftName.toLowerCase().includes('malam')) { 
                      bgColor = 'rgba(59,130,246,0.1)'; textColor = '#3B82F6'; char = 'M';
                    }

                    return (
                      <td key={d} style={{ padding: '0.5rem 0', fontSize: '0.75rem', fontWeight: '800', textAlign: 'center', background: bgColor, color: textColor, borderRight: '1px solid var(--surface-border)' }}>
                        {char}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', fontSize: '0.8rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.2)' }}></div><span>P: Pagi</span></div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(59, 130, 246, 0.2)' }}></div><span>M: Malam</span></div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.2)' }}></div><span>-: Libur</span></div>
        </div>
      </div>

      {/* PRINT AREA (Hidden on screen, shown only on print) */}
      <div className="print-area" style={{ display: 'none' }}>
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0, fontSize: '16px' }}>JADWAL SHIFT KARYAWAN</h2>
          <p style={{ margin: '5px 0', fontSize: '12px' }}>Periode: {MONTHS_ID[calMonth].toUpperCase()} {calYear}</p>
        </div>
        <table className="shift-table-print">
          <thead>
            <tr>
              <th className="name-col">Nama Karyawan</th>
              <th className="pos-col">Jabatan</th>
              {days.map(d => <th key={d}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td className="name-col">{emp.full_name}</td>
                <td className="pos-col">{emp.position}</td>
                {days.map(d => {
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const shiftName = assignments[`${emp.id}_${dateStr}`] || '';
                  let char = '-';
                  if (shiftName.toLowerCase().includes('pagi')) char = 'P';
                  else if (shiftName.toLowerCase().includes('malam')) char = 'M';
                  return <td key={d}>{char}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '15px', fontSize: '10px', display: 'flex', justifyContent: 'space-between' }}>
          <div>Keterangan: P = Pagi, M = Malam, - = Libur</div>
          <div>Dicetak pada: {new Date().toLocaleString('id-ID')}</div>
        </div>
      </div>
    </>
  );
}
