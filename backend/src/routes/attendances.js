import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

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
    } else if (req.query.startDate && req.query.endDate) {
      query = query.gte('date', req.query.startDate).lte('date', req.query.endDate);
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

    // Get today's shift assignment
    const { data: assignment } = await supabaseAdmin
      .from('shift_assignments')
      .select('shift_id, shifts(start_time, late_tolerance_minutes)')
      .eq('employee_id', profile.id)
      .eq('date', today)
      .maybeSingle();

    // Calculate lateness
    const now = new Date();
    let isLate = false;
    let lateMinutes = 0;

    if (assignment?.shifts) {
      const [shiftHour, shiftMin] = assignment.shifts.start_time.split(':').map(Number);
      const shiftStart = new Date();
      shiftStart.setHours(shiftHour, shiftMin, 0, 0);

      const tolerance = assignment.shifts.late_tolerance_minutes || 0;
      shiftStart.setMinutes(shiftStart.getMinutes() + tolerance);

      if (now > shiftStart) {
        isLate = true;
        lateMinutes = Math.round((now - shiftStart) / 60000);
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
      .select('*, shifts(max_break_minutes)')
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

    // Check if break is too long
    const maxBreak = attendance.shifts?.max_break_minutes || 60;
    const isBreakLate = breakMinutes > maxBreak;

    const { data, error } = await supabaseAdmin
      .from('attendances')
      .update({
        end_break_time: now.toISOString(),
        total_break_minutes: breakMinutes,
        is_break_late: isBreakLate
      })
      .eq('id', attendance.id)
      .select()
      .single();

    if (error) throw error;
    return res.json({
      message: `Istirahat selesai (${breakMinutes} menit). Semangat bekerja kembali!`,
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
      .select('*, shifts(end_time)')
      .eq('employee_id', req.user.profile.id)
      .eq('date', today)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!attendance) return res.status(400).json({ error: 'Anda belum check-in hari ini.' });
    if (attendance.check_out_time) return res.status(400).json({ error: 'Anda sudah check-out hari ini.' });

    const now = new Date();
    
    // Check if early leave
    let isEarlyLeave = false;
    if (attendance.shifts?.end_time) {
      const [shiftHour, shiftMin] = attendance.shifts.end_time.split(':').map(Number);
      const shiftEnd = new Date();
      shiftEnd.setHours(shiftHour, shiftMin, 0, 0);
      
      if (now < shiftEnd) {
        isEarlyLeave = true;
      }
    }

    const checkIn = new Date(attendance.check_in_time);
    const totalWorkMinutes = Math.round((now - checkIn) / 60000) - (attendance.total_break_minutes || 0);

    const { data, error } = await supabaseAdmin
      .from('attendances')
      .update({
        check_out_time: now.toISOString(),
        check_out_latitude: latitude,
        check_out_longitude: longitude,
        check_out_face_verified: face_verified || false,
        total_work_minutes: totalWorkMinutes,
        is_early_leave: isEarlyLeave
      })
      .eq('id', attendance.id)
      .select()
      .single();

    if (error) throw error;

    const hours = Math.floor(totalWorkMinutes / 60);
    const mins = totalWorkMinutes % 60;

    return res.json({
      message: `Check-out berhasil! Total kerja: ${hours} jam ${mins} menit.`,
      attendance: data,
    });
  } catch (err) {
    console.error('Check-out error:', err);
    return res.status(500).json({ error: 'Gagal melakukan check-out.' });
  }
});

/**
 * GET /api/attendances/summary
 * Get attendance summary/report for a given period
 */
router.get('/summary', authorize('admin_cabang', 'super_admin'), async (req, res) => {
  try {
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
      .select('employee_id, status, is_late, is_break_late, is_early_leave, total_work_minutes, profiles!attendances_employee_id_fkey(full_name, nik, position, branch_id, branches(name))')
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
      // Count by status
      if (att.status === 'hadir' || att.status === 'terlambat') {
        summary[empId].hadir = (summary[empId].hadir || 0) + 1;
      } else if (att.status === 'izin') {
        summary[empId].izin = (summary[empId].izin || 0) + 1;
      } else if (att.status === 'sakit') {
        summary[empId].sakit = (summary[empId].sakit || 0) + 1;
      } else if (att.status === 'alpa') {
        summary[empId].alpa = (summary[empId].alpa || 0) + 1;
      } else if (att.status === 'pulang_cepat') {
        summary[empId].pulang_cepat = (summary[empId].pulang_cepat || 0) + 1;
        summary[empId].hadir = (summary[empId].hadir || 0) + 1;
      }

      // Violation flags
      if (att.is_late) summary[empId].terlambat_kerja = (summary[empId].terlambat_kerja || 0) + 1;
      if (att.is_break_late) summary[empId].terlambat_istirahat = (summary[empId].terlambat_istirahat || 0) + 1;
      if (att.is_early_leave) summary[empId].cepat_pulang = (summary[empId].cepat_pulang || 0) + 1;

      summary[empId].total_work_minutes += att.total_work_minutes || 0;
    });

    return res.json(Object.values(summary));
  } catch (err) {
    console.error('Summary error:', err);
    return res.status(500).json({ error: 'Gagal memuat ringkasan absensi.' });
  }
});

/**
 * GET /api/attendances/detail
 * Get list of employees + dates for a specific violation type
 * type: terlambat_kerja | terlambat_istirahat | cepat_pulang | alpa | hadir
 */
router.get('/detail', authorize('admin_cabang', 'super_admin'), async (req, res) => {
  try {
    const { type, startDate: qStartDate, endDate: qEndDate, branch_id } = req.query;
    const userRole = req.user.profile.role;

    if (!type) return res.status(400).json({ error: 'Parameter type diperlukan.' });
    if (!qStartDate || !qEndDate) return res.status(400).json({ error: 'Parameter startDate dan endDate diperlukan.' });

    let query = supabaseAdmin
      .from('attendances')
      .select('id, date, employee_id, status, is_late, is_break_late, is_early_leave, late_minutes, total_break_minutes, profiles!attendances_employee_id_fkey(full_name, nik, position, branches(name))')
      .gte('date', qStartDate)
      .lte('date', qEndDate)
      .order('date', { ascending: false });

    if (userRole === 'admin_cabang') {
      query = query.eq('branch_id', req.user.profile.branch_id);
    } else if (branch_id) {
      query = query.eq('branch_id', branch_id);
    }

    // Filter by violation type
    if (type === 'terlambat_kerja') {
      query = query.eq('is_late', true);
    } else if (type === 'terlambat_istirahat') {
      query = query.eq('is_break_late', true);
    } else if (type === 'cepat_pulang') {
      query = query.eq('is_early_leave', true);
    } else if (type === 'alpa') {
      query = query.eq('status', 'alpa');
    } else if (type === 'hadir') {
      query = query.in('status', ['hadir', 'terlambat', 'pulang_cepat']);
    } else {
      query = query.eq('status', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Detail error:', err);
    return res.status(500).json({ error: 'Gagal memuat detail absensi.' });
  }
});

export default router;
