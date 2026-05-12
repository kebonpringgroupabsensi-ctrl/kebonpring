import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { authenticateRequest, authorizeRole } from '../lib/auth.js';
import { uploadToDrive } from '../lib/gdrive.js';

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
    const { date, month, year, employee_id, branch_id, status, startDate: qStartDate, endDate: qEndDate } = req.query;
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
    } else if (qStartDate && qEndDate) {
      query = query.gte('date', qStartDate).lte('date', qEndDate);
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
    const today = req.query.date || getTodayWIB();

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
 * Helper: Get current time in WIB (UTC+7) as a Date-like object
 * Vercel runs in UTC, so we must manually offset for WIB
 */
function getNowWIB() {
  const now = new Date();
  // Create a date shifted to WIB: add 7 hours to UTC
  const wibOffset = 7 * 60 * 60 * 1000; // 7 hours in ms
  return new Date(now.getTime() + wibOffset);
}

/**
 * Helper: Create a WIB date for today with specific hours/minutes
 * Builds a comparable date in the same "shifted" space as getNowWIB()
 */
function buildWIBTime(nowWIB, hours, minutes) {
  const d = new Date(nowWIB);
  d.setUTCHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Helper: Format WIB time for display (HH:MM)
 */
function formatWIBTime(wibDate) {
  const h = String(wibDate.getUTCHours()).padStart(2, '0');
  const m = String(wibDate.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Helper: Get today's date string in WIB (YYYY-MM-DD)
 */
function getTodayWIB() {
  const nowWIB = getNowWIB();
  const y = nowWIB.getUTCFullYear();
  const m = String(nowWIB.getUTCMonth() + 1).padStart(2, '0');
  const d = String(nowWIB.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * POST /api/attendances/check-in
 * Employee check-in with location & face verification
 */
router.post('/check-in', async (req, res) => {
  try {
    const { latitude, longitude, face_verified, date, photo } = req.body;
    const profile = req.user.profile;
    const today = date || getTodayWIB();

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

    // Helper to get parsed setting
    const getSetting = (key, fallback) => {
      const val = settings[key];
      if (val === undefined || val === null) return fallback;
      try {
        return JSON.parse(val);
      } catch (e) {
        return val;
      }
    };

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

    // Use WIB time for all time comparisons
    const nowWIB = getNowWIB();
    const now = new Date(); // Real UTC for storing in DB
    let isLate = false;
    let lateMinutes = 0;

    if (assignment.shifts) {
      const [sH, sM] = assignment.shifts.start_time.split(':').map(Number);
      const shiftStart = buildWIBTime(nowWIB, sH, sM);

      // Validate Window
      const beforeHours = parseFloat(getSetting('check_in_before_hours', 1));
      const afterHours = parseFloat(getSetting('check_in_after_hours', 4));
      
      const winStart = new Date(shiftStart.getTime() - (beforeHours * 60 * 60 * 1000));
      const winEnd = new Date(shiftStart.getTime() + (afterHours * 60 * 60 * 1000));

      console.log(`[CHECK-IN DEBUG] nowWIB=${formatWIBTime(nowWIB)}, shiftStart=${formatWIBTime(shiftStart)}, winStart=${formatWIBTime(winStart)}, winEnd=${formatWIBTime(winEnd)}`);

      if (nowWIB < winStart) {
        return res.status(400).json({ 
          error: `Belum waktunya absen masuk. Absen dibuka mulai pukul ${formatWIBTime(winStart)}` 
        });
      }
      if (nowWIB > winEnd) {
        return res.status(400).json({ 
          error: `Batas waktu absen masuk telah berakhir pada pukul ${formatWIBTime(winEnd)}` 
        });
      }

      // Calculate lateness (considering tolerance)
      const tolerance = assignment.shifts.late_tolerance_minutes || 0;
      const shiftStartWithTolerance = new Date(shiftStart.getTime() + (tolerance * 60 * 1000));

      if (nowWIB > shiftStartWithTolerance) {
        isLate = true;
        lateMinutes = Math.round((nowWIB - shiftStartWithTolerance) / 60000);
      }
    }

    let photoUrl = null;
    if (photo) {
      try {
        const fileName = `checkin_${profile.full_name}_${new Date().getTime()}.jpg`;
        photoUrl = await uploadToDrive(fileName, 'image/jpeg', photo);
      } catch (uploadErr) {
        console.error('Check-in photo upload error:', uploadErr);
        // We continue even if photo upload fails to not block attendance
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
        check_in_photo_url: photoUrl,
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
    const today = getTodayWIB();

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
    const today = getTodayWIB();
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
      const nowWIB = getNowWIB();
      const breakEndWIB = buildWIBTime(nowWIB, h, m);
      if (nowWIB > breakEndWIB) {
        isLateBreak = true;
        lateBreakMinutes = Math.round((nowWIB - breakEndWIB) / 60000);
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
    const today = getTodayWIB();
    const { latitude, longitude, face_verified, photo } = req.body;

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

      // Helper to get parsed setting
      const getSetting = (key, fallback) => {
        const val = settings[key];
        if (val === undefined || val === null) return fallback;
        try {
          return JSON.parse(val);
        } catch (e) {
          return val;
        }
      };

      const nowWIB = getNowWIB();
      const [eH, eM] = assignment.shifts.end_time.split(':').map(Number);
      const shiftEnd = buildWIBTime(nowWIB, eH, eM);

      // Validate Window
      const beforeHours = parseFloat(getSetting('check_out_before_hours', 1));
      const afterHours = parseFloat(getSetting('check_out_after_hours', 4));
      
      const winStart = new Date(shiftEnd.getTime() - (beforeHours * 60 * 60 * 1000));
      const winEnd = new Date(shiftEnd.getTime() + (afterHours * 60 * 60 * 1000));

      console.log(`[CHECK-OUT DEBUG] nowWIB=${formatWIBTime(nowWIB)}, shiftEnd=${formatWIBTime(shiftEnd)}, winStart=${formatWIBTime(winStart)}, winEnd=${formatWIBTime(winEnd)}`);

      if (nowWIB < winStart) {
        return res.status(400).json({ 
          error: `Belum waktunya absen pulang. Absen dibuka mulai pukul ${formatWIBTime(winStart)}` 
        });
      }
      if (nowWIB > winEnd) {
        return res.status(400).json({ 
          error: `Batas waktu absen pulang telah berakhir pada pukul ${formatWIBTime(winEnd)}` 
        });
      }

      if (nowWIB < shiftEnd) {
        isEarlyLeave = true;
        earlyLeaveMinutes = Math.round((shiftEnd - nowWIB) / 60000);
      }
    }

    let photoUrl = null;
    if (photo) {
      try {
        const fileName = `checkout_${req.user.profile.full_name}_${new Date().getTime()}.jpg`;
        photoUrl = await uploadToDrive(fileName, 'image/jpeg', photo);
      } catch (uploadErr) {
        console.error('Check-out photo upload error:', uploadErr);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('attendances')
      .update({
        check_out_time: now.toISOString(),
        check_out_latitude: latitude,
        check_out_longitude: longitude,
        check_out_face_verified: face_verified || false,
        check_out_photo_url: photoUrl,
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

    const { month, year, branch_id, startDate: qStartDate, endDate: qEndDate } = req.query;
    const userRole = req.user.profile.role;

    let startDate, endDate;

    if (qStartDate && qEndDate) {
      startDate = qStartDate;
      endDate = qEndDate;
    } else {
      const targetMonth = month !== undefined ? Number(month) : new Date().getMonth();
      const targetYear = year || new Date().getFullYear();

      startDate = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`;
      const endMonth = targetMonth + 2;
      const endYear = endMonth > 12 ? Number(targetYear) + 1 : targetYear;
      const endMonthStr = endMonth > 12 ? '01' : String(endMonth).padStart(2, '0');
      endDate = `${endYear}-${endMonthStr}-01`;
    }

    let query = supabaseAdmin
      .from('attendances')
      .select('*, profiles!attendances_employee_id_fkey(full_name, nik, position, branch_id, branches(name)), shifts(*)')
      .gte('date', startDate);
    
    if (qStartDate && qEndDate) {
      query = query.lte('date', endDate);
    } else {
      query = query.lt('date', endDate);
    }

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
          pulang_cepat: 0,
          total_work_minutes: 0,
        };
      }

      // Base status counts
      if (att.status === 'hadir') summary[empId].hadir++;
      else if (att.status === 'terlambat') summary[empId].terlambat_kerja++;
      else if (att.status === 'izin') summary[empId].izin++;
      else if (att.status === 'sakit') summary[empId].sakit++;
      else if (att.status === 'alpa') summary[empId].alpa++;
      else if (att.status === 'pulang_cepat') summary[empId].pulang_cepat++;

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
