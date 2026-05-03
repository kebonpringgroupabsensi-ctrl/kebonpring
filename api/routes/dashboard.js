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
 * GET /api/dashboard/super-admin
 * Dashboard stats for Super Admin
 */
router.get('/super-admin', async (req, res) => {
  try {
    authorizeRole(req.user, 'super_admin');

    const today = new Date().toISOString().split('T')[0];

    // Total employees
    const { count: totalEmployees } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'karyawan');

    // Active branches
    const { count: activeBranches } = await supabaseAdmin
      .from('branches')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'aktif');

    // Today's attendance count
    const { count: todayAttendance } = await supabaseAdmin
      .from('attendances')
      .select('id', { count: 'exact', head: true })
      .eq('date', today)
      .in('status', ['hadir', 'terlambat']);

    // Today's late count
    const { count: todayLate } = await supabaseAdmin
      .from('attendances')
      .select('id', { count: 'exact', head: true })
      .eq('date', today)
      .eq('is_late', true);

    // Recent attendance log
    const { data: recentLog } = await supabaseAdmin
      .from('attendances')
      .select('*, profiles!attendances_employee_id_fkey(full_name, branches(name))')
      .eq('date', today)
      .order('check_in_time', { ascending: false })
      .limit(10);

    // Branch summary
    const { data: branches } = await supabaseAdmin
      .from('branches')
      .select('id, name, status')
      .order('name');

    const branchStats = [];
    for (const branch of branches || []) {
      const { count } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branch.id)
        .eq('employee_status', 'aktif');

      branchStats.push({ ...branch, employee_count: count || 0 });
    }

    const attendancePercentage = totalEmployees > 0
      ? Math.round((todayAttendance / totalEmployees) * 100)
      : 0;

    return res.json({
      total_employees: totalEmployees || 0,
      active_branches: activeBranches || 0,
      today_attendance: todayAttendance || 0,
      today_late: todayLate || 0,
      attendance_percentage: attendancePercentage,
      recent_log: recentLog || [],
      branch_stats: branchStats,
    });
  } catch (err) {
    console.error('SA Dashboard error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Gagal memuat dashboard.' });
  }
});

/**
 * GET /api/dashboard/admin-cabang
 * Dashboard stats for Admin Cabang
 */
router.get('/admin-cabang', async (req, res) => {
  try {
    authorizeRole(req.user, 'admin_cabang');

    const today = new Date().toISOString().split('T')[0];
    const branchId = req.user.profile.branch_id;

    // Employee count in this branch
    const { count: totalEmployees } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .eq('role', 'karyawan')
      .eq('employee_status', 'aktif');

    // Today's attendance
    const { count: todayAttendance } = await supabaseAdmin
      .from('attendances')
      .select('id', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .eq('date', today)
      .in('status', ['hadir', 'terlambat']);

    // Today's late
    const { count: todayLate } = await supabaseAdmin
      .from('attendances')
      .select('id', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .eq('date', today)
      .eq('is_late', true);

    // Pending leaves
    const { data: branchEmployees } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('branch_id', branchId);

    const employeeIds = branchEmployees?.map((e) => e.id) || [];

    let pendingLeaves = 0;
    if (employeeIds.length > 0) {
      const { count } = await supabaseAdmin
        .from('leave_requests')
        .select('id', { count: 'exact', head: true })
        .in('employee_id', employeeIds)
        .eq('status', 'pending');
      pendingLeaves = count || 0;
    }

    // Recent log
    const { data: recentLog } = await supabaseAdmin
      .from('attendances')
      .select('*, profiles!attendances_employee_id_fkey(full_name)')
      .eq('branch_id', branchId)
      .eq('date', today)
      .order('check_in_time', { ascending: false })
      .limit(10);

    // Branch info
    const { data: branchInfo } = await supabaseAdmin
      .from('branches')
      .select('*')
      .eq('id', branchId)
      .single();

    return res.json({
      total_employees: totalEmployees || 0,
      today_attendance: todayAttendance || 0,
      today_late: todayLate || 0,
      not_checked_in: (totalEmployees || 0) - (todayAttendance || 0),
      pending_leaves: pendingLeaves,
      recent_log: recentLog || [],
      branch: branchInfo,
    });
  } catch (err) {
    console.error('AC Dashboard error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Gagal memuat dashboard.' });
  }
});

/**
 * GET /api/dashboard/karyawan
 * Dashboard data for Employee
 */
router.get('/karyawan', async (req, res) => {
  try {
    const profile = req.user.profile;
    const today = req.query.date || new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const startOfMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const endMonth = currentMonth + 2;
    const endYear = endMonth > 12 ? currentYear + 1 : currentYear;
    const endMonthStr = endMonth > 12 ? '01' : String(endMonth).padStart(2, '0');
    const endOfMonth = `${endYear}-${endMonthStr}-01`;

    // Today's attendance
    const { data: todayAttendance } = await supabaseAdmin
      .from('attendances')
      .select('*, shifts(name, shift_type, start_time, end_time)')
      .eq('employee_id', profile.id)
      .eq('date', today)
      .maybeSingle();

    // Today's shift
    const { data: todayShift } = await supabaseAdmin
      .from('shift_assignments')
      .select('*, shifts(name, shift_type, start_time, end_time)')
      .eq('employee_id', profile.id)
      .eq('date', today)
      .maybeSingle();

    // Monthly stats
    const { data: monthlyAttendances } = await supabaseAdmin
      .from('attendances')
      .select('status, is_late')
      .eq('employee_id', profile.id)
      .gte('date', startOfMonth)
      .lt('date', endOfMonth);

    const stats = {
      hadir: 0,
      terlambat: 0,
      izin: 0,
      sakit: 0,
      alpa: 0,
    };

    (monthlyAttendances || []).forEach((a) => {
      stats[a.status] = (stats[a.status] || 0) + 1;
      if (a.is_late) stats.terlambat++;
    });

    // Active announcements
    const { data: announcements } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .or(`is_global.eq.true,branch_id.eq.${profile.branch_id}`)
      .order('created_at', { ascending: false })
      .limit(5);

    return res.json({
      profile,
      today_attendance: todayAttendance,
      today_shift: todayShift,
      monthly_stats: stats,
      announcements: announcements || [],
    });
  } catch (err) {
    console.error('Karyawan Dashboard error:', err);
    return res.status(500).json({ error: 'Gagal memuat dashboard.' });
  }
});

export default router;
