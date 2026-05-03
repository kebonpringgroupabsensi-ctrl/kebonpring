import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { authenticateRequest, authorizeRole } from '../lib/auth.js';

const router = Router();

// Auth middleware for all routes
router.use(async (req, res, next) => {
  try {
    req.user = await authenticateRequest(req);
    next();
  } catch (err) {
    return res.status(err.statusCode || 401).json({ error: err.message });
  }
});

/**
 * Helper: Calculate distance between two GPS coordinates (meters)
 * Uses Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GET /api/attendances
 * List attendances with filters
 */
router.get('/', async (req, res) => {
  try {
    const { date, month, year, employee_id, branch_id, status } = req.query;
    const userRole = req.user.profile.role;

    let query = supabaseAdmin
      .from('attendances')
      .select('*, profiles!attendances_employee_id_fkey(full_name, nik, position, branch_id, branches(name))')
      .order('date', { ascending: false });

    // Role-based filtering
    if (userRole === 'karyawan') {
      query = query.eq('employee_id', req.user.profile.id);
    } else if (userRole === 'admin_cabang') {
      query = query.eq('branch_id', req.user.profile.branch_id);
    }

    // Additional filters
    if (employee_id) query = query.eq('employee_id', employee_id);
    if (branch_id && userRole === 'super_admin') query = query.eq('branch_id', branch_id);
    if (status) query = query.eq('status', status);

    if (date) {
      query = query.eq('date', date);
    } else if (month !== undefined && year) {
      const startDate = `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`;
      const endMonth = Number(month) + 2;
      const endYear = endMonth > 12 ? Number(year) + 1 : year;
      const endMonthStr = endMonth > 12 ? '01' : String(endMonth).padStart(2, '0');
      const endDate = `${endYear}-${endMonthStr}-01`;
      query = query.gte('date', startDate).lt('date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Get attendances error:', err);
    return res.status(500).json({ error: 'Gagal memuat data absensi.' });
  }
});

/**
 * GET /api/attendances/today
 * Get today's attendance for the current user
 */
router.get('/today', async (req, res) => {
  try {
    const today = req.query.date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('attendances')
      .select('*, shifts(name, shift_type, start_time, end_time)')
      .eq('employee_id', req.user.profile.id)
      .eq('date', today)
      .maybeSingle();

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Get today attendance error:', err);
    return res.status(500).json({ error: 'Gagal memuat absensi hari ini.' });
  }
});

/**
 * POST /api/attendances/check-in
 * Employee check-in with location & face verification
 */
router.post('/check-in', async (req, res) => {
  try {
    const { latitude, longitude, face_verified, date } = req.body;
    const profile = req.user.profile;
    const today = date || new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const { data: existing } = await supabaseAdmin
      .from('attendances')
      .select('id')
      .eq('employee_id', profile.id)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Anda sudah check-in hari ini.' });
    }

    // Validate location
    if (latitude && longitude && profile.branches) {
      const branch = profile.branches;
      const distance = calculateDistance(
        latitude, longitude,
        branch.latitude, branch.longitude
      );

      if (distance > branch.radius_meters) {
        return res.status(400).json({
          error: `Anda berada di luar radius cabang (${Math.round(distance)}m dari lokasi cabang, maks ${branch.radius_meters}m).`,
        });
      }
    }

    // Get settings for windows
    const { data: settingsList } = await supabaseAdmin.from('app_settings').select('*');
    const settings = {};
    settingsList?.forEach(s => settings[s.key] = s.value);

    // Get today's shift assignment
    const { data: assignment } = await supabaseAdmin
      .from('shift_assignments')
      .select('shift_id, shifts(*)')
      .eq('employee_id', profile.id)
      .eq('date', today)
      .maybeSingle();

    if (!assignment) {
      return res.status(400).json({ error: 'Anda tidak memiliki jadwal kerja hari ini (Libur/Day Off).' });
    }

    const now = new Date();
    let isLate = false;
    let lateMinutes = 0;

    if (assignment.shifts) {
      const [sH, sM] = assignment.shifts.start_time.split(':').map(Number);
      const shiftStart = new Date(now);
      shiftStart.setHours(sH, sM, 0, 0);

      // Validate Window
      const beforeHours = parseFloat(settings.check_in_before_hours || 1);
      const afterHours = parseFloat(settings.check_in_after_hours || 4);
      
      const winStart = new Date(shiftStart);
      winStart.setMinutes(winStart.getMinutes() - (beforeHours * 60));
      
      const winEnd = new Date(shiftStart);
      winEnd.setMinutes(winEnd.getMinutes() + (afterHours * 60));

      if (now < winStart) {
        return res.status(400).json({ 
          error: `Belum waktunya absen masuk. Absen dibuka mulai pukul ${winStart.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` 
        });
      }
      if (now > winEnd) {
        return res.status(400).json({ 
          error: `Batas waktu absen masuk telah berakhir pada pukul ${winEnd.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` 
        });
      }

      // Calculate lateness (considering tolerance)
      const tolerance = assignment.shifts.late_tolerance_minutes || 0;
      const shiftStartWithTolerance = new Date(shiftStart);
      shiftStartWithTolerance.setMinutes(shiftStartWithTolerance.getMinutes() + tolerance);

      if (now > shiftStartWithTolerance) {
        isLate = true;
        lateMinutes = Math.round((now - shiftStartWithTolerance) / 60000);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('attendances')
      .insert({
        employee_id: profile.id,
        branch_id: profile.branch_id,
        shift_id: assignment?.shift_id || null,
        date: today,
        status: isLate ? 'terlambat' : 'hadir',
        check_in_time: now.toISOString(),
        check_in_latitude: latitude,
        check_in_longitude: longitude,
        check_in_face_verified: face_verified || false,
        is_late: isLate,
        late_minutes: lateMinutes,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      message: isLate
        ? `Check-in berhasil, tetapi Anda terlambat ${lateMinutes} menit.`
        : 'Check-in berhasil! Selamat bekerja.',
      attendance: data,
    });
  } catch (err) {
    console.error('Check-in error:', err);
    return res.status(500).json({ error: 'Gagal melakukan check-in.' });
  }
});

/**
 * POST /api/attendances/break/start
 * Start break
 */
router.post('/break/start', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: attendance, error: fetchError } = await supabaseAdmin
      .from('attendances')
      .select('*')
      .eq('employee_id', req.user.profile.id)
      .eq('date', today)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!attendance) return res.status(400).json({ error: 'Anda belum check-in hari ini.' });
    if (attendance.start_break_time) return res.status(400).json({ error: 'Istirahat sudah dimulai.' });

    const { data, error } = await supabaseAdmin
      .from('attendances')
      .update({ start_break_time: new Date().toISOString() })
      .eq('id', attendance.id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ message: 'Istirahat dimulai. Selamat beristirahat!', attendance: data });
  } catch (err) {
    console.error('Start break error:', err);
    return res.status(500).json({ error: 'Gagal memulai istirahat.' });
  }
});

/**
 * POST /api/attendances/break/end
 * End break
 */
router.post('/break/end', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { face_verified } = req.body;

    const { data: attendance, error: fetchError } = await supabaseAdmin
      .from('attendances')
      .select('*')
      .eq('employee_id', req.user.profile.id)
      .eq('date', today)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!attendance) return res.status(400).json({ error: 'Anda belum check-in hari ini.' });
    if (!attendance.start_break_time) return res.status(400).json({ error: 'Istirahat belum dimulai.' });
    if (attendance.end_break_time) return res.status(400).json({ error: 'Istirahat sudah diakhiri.' });

    const now = new Date();
    const breakStart = new Date(attendance.start_break_time);
    const breakMinutes = Math.round((now - breakStart) / 60000);

    // Get shift info for lateness check
    const { data: assignment } = await supabaseAdmin
      .from('shift_assignments')
      .select('shifts(*)')
      .eq('employee_id', req.user.profile.id)
      .eq('date', today)
      .maybeSingle();

    let isLateBreak = false;
    let lateBreakMinutes = 0;
    if (assignment?.shifts?.break_end) {
      const [h, m] = assignment.shifts.break_end.split(':').map(Number);
      const breakEnd = new Date(now);
      breakEnd.setHours(h, m, 0, 0);
      if (now > breakEnd) {
        isLateBreak = true;
        lateBreakMinutes = Math.round((now - breakEnd) / 60000);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('attendances')
      .update({
        end_break_time: now.toISOString(),
        total_break_minutes: breakMinutes,
        notes: isLateBreak ? `Terlambat habis istirahat ${lateBreakMinutes} menit` : attendance.notes
      })
      .eq('id', attendance.id)
      .select()
      .single();

    if (error) throw error;
    return res.json({
      message: isLateBreak 
        ? `Istirahat selesai. Anda terlambat ${lateBreakMinutes} menit kembali bekerja.`
        : `Istirahat selesai (${breakMinutes} menit). Semangat bekerja kembali!`,
      attendance: data,
    });
  } catch (err) {
    console.error('End break error:', err);
    return res.status(500).json({ error: 'Gagal mengakhiri istirahat.' });
  }
});

/**
 * POST /api/attendances/check-out
 * Employee check-out
 */
router.post('/check-out', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { latitude, longitude, face_verified } = req.body;

    const { data: attendance, error: fetchError } = await supabaseAdmin
      .from('attendances')
      .select('*')
      .eq('employee_id', req.user.profile.id)
      .eq('date', today)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!attendance) return res.status(400).json({ error: 'Anda belum check-in hari ini.' });
    if (attendance.check_out_time) return res.status(400).json({ error: 'Anda sudah check-out hari ini.' });

    const now = new Date();
    const checkIn = new Date(attendance.check_in_time);
    const totalWorkMinutes = Math.round((now - checkIn) / 60000) - (attendance.total_break_minutes || 0);

    // Get shift info for early leave check and windows
    const { data: assignment } = await supabaseAdmin
      .from('shift_assignments')
      .select('shifts(*)')
      .eq('employee_id', req.user.profile.id)
      .eq('date', today)
      .maybeSingle();

    let isEarlyLeave = false;
    let earlyLeaveMinutes = 0;

    if (assignment?.shifts) {
      // Get settings for windows
      const { data: settingsList } = await supabaseAdmin.from('app_settings').select('*');
      const settings = {};
      settingsList?.forEach(s => settings[s.key] = s.value);

      const [eH, eM] = assignment.shifts.end_time.split(':').map(Number);
      const shiftEnd = new Date(now);
      shiftEnd.setHours(eH, eM, 0, 0);

      // Validate Window
      const beforeHours = parseFloat(settings.check_out_before_hours || 1);
      const afterHours = parseFloat(settings.check_out_after_hours || 4);
      
      const winStart = new Date(shiftEnd);
      winStart.setMinutes(winStart.getMinutes() - (beforeHours * 60));
      
      const winEnd = new Date(shiftEnd);
      winEnd.setMinutes(winEnd.getMinutes() + (afterHours * 60));

      if (now < winStart) {
        return res.status(400).json({ 
          error: `Belum waktunya absen pulang. Absen dibuka mulai pukul ${winStart.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` 
        });
      }
      if (now > winEnd) {
        return res.status(400).json({ 
          error: `Batas waktu absen pulang telah berakhir pada pukul ${winEnd.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` 
        });
      }

      if (now < shiftEnd) {
        isEarlyLeave = true;
        earlyLeaveMinutes = Math.round((shiftEnd - now) / 60000);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('attendances')
      .update({
        check_out_time: now.toISOString(),
        check_out_latitude: latitude,
        check_out_longitude: longitude,
        check_out_face_verified: face_verified || false,
        total_work_minutes: totalWorkMinutes,
        notes: isEarlyLeave ? `Pulang lebih awal ${earlyLeaveMinutes} menit` : attendance.notes
      })
      .eq('id', attendance.id)
      .select()
      .single();

    if (error) throw error;

    const hours = Math.floor(totalWorkMinutes / 60);
    const mins = totalWorkMinutes % 60;

    return res.json({
      message: isEarlyLeave
        ? `Check-out berhasil! Anda pulang lebih awal ${earlyLeaveMinutes} menit. Total kerja: ${hours} jam ${mins} menit.`
        : `Check-out berhasil! Total kerja: ${hours} jam ${mins} menit.`,
      attendance: data,
    });
  } catch (err) {
    console.error('Check-out error:', err);
    return res.status(500).json({ error: 'Gagal melakukan check-out.' });
  }
});

/**
 * GET /api/attendances/summary
 * Get attendance summary/report for a given month
 */
router.get('/summary', async (req, res) => {
  try {
    authorizeRole(req.user, 'admin_cabang', 'super_admin');

    const { month, year, branch_id } = req.query;
    const userRole = req.user.profile.role;

    const targetMonth = month !== undefined ? Number(month) : new Date().getMonth();
    const targetYear = year || new Date().getFullYear();

    const startDate = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`;
    const endMonth = targetMonth + 2;
    const endYear = endMonth > 12 ? Number(targetYear) + 1 : targetYear;
    const endMonthStr = endMonth > 12 ? '01' : String(endMonth).padStart(2, '0');
    const endDate = `${endYear}-${endMonthStr}-01`;

    let query = supabaseAdmin
      .from('attendances')
      .select('*, profiles!attendances_employee_id_fkey(full_name, nik, position, branch_id, branches(name)), shifts(*)')
      .gte('date', startDate)
      .lt('date', endDate);

    if (userRole === 'admin_cabang') {
      query = query.eq('branch_id', req.user.profile.branch_id);
    } else if (branch_id) {
      query = query.eq('branch_id', branch_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate per employee
    const summary = {};
    data.forEach((att) => {
      const empId = att.employee_id;
      if (!summary[empId]) {
        summary[empId] = {
          employee_id: empId,
          full_name: att.profiles?.full_name,
          nik: att.profiles?.nik,
          position: att.profiles?.position,
          branch: att.profiles?.branches?.name,
          hadir: 0,
          terlambat_kerja: 0,
          terlambat_istirahat: 0,
          cepat_pulang: 0,
          izin: 0,
          sakit: 0,
          alpa: 0,
          total_work_minutes: 0,
        };
      }

      // Base status counts
      if (att.status === 'hadir') summary[empId].hadir++;
      else if (att.status === 'terlambat') summary[empId].terlambat_kerja++;
      else if (att.status === 'izin') summary[empId].izin++;
      else if (att.status === 'sakit') summary[empId].sakit++;
      else if (att.status === 'alpa') summary[empId].alpa++;

      // Check for specific lateness even if marked as 'hadir' or 'terlambat'
      const shift = att.shifts;
      if (shift && att.status !== 'izin' && att.status !== 'sakit' && att.status !== 'alpa') {
        // Late after break
        if (att.end_break_time && shift.break_end) {
          const [h, m] = shift.break_end.split(':').map(Number);
          const breakEnd = new Date(att.end_break_time);
          breakEnd.setHours(h, m, 0, 0);
          if (new Date(att.end_break_time) > breakEnd) {
            summary[empId].terlambat_istirahat++;
          }
        }
        
        // Early Leave
        if (att.check_out_time && shift.end_time) {
          const [h, m] = shift.end_time.split(':').map(Number);
          const endTime = new Date(att.check_out_time);
          endTime.setHours(h, m, 0, 0);
          if (new Date(att.check_out_time) < endTime) {
            summary[empId].cepat_pulang++;
          }
        }
      }

      summary[empId].total_work_minutes += att.total_work_minutes || 0;
    });

    return res.json(Object.values(summary));
  } catch (err) {
    console.error('Summary error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Gagal memuat ringkasan absensi.' });
  }
});

export default router;
