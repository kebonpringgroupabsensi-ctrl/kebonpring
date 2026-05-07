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
 * GET /api/shifts
 * List all shifts
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('shifts')
      .select('*')
      .order('start_time');

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Get shifts error:', err);
    return res.status(500).json({ error: 'Gagal memuat data shift.' });
  }
});

/**
 * POST /api/shifts
 * Create new shift (Super Admin only)
 */
router.post('/', async (req, res) => {
  try {
    authorizeRole(req.user, 'super_admin');

    const {
      name, shift_type, start_time, end_time,
      break_start, break_end, late_tolerance_minutes, max_break_minutes,
    } = req.body;

    if (!name || !shift_type || !start_time || !end_time) {
      return res.status(400).json({ error: 'Nama, tipe, jam mulai, dan jam selesai wajib diisi.' });
    }

    const insertData = {
      name, shift_type, start_time, end_time,
      break_start: break_start === '' ? null : break_start,
      break_end: break_end === '' ? null : break_end,
      late_tolerance_minutes: late_tolerance_minutes || 0,
      max_break_minutes: max_break_minutes || 0,
    };

    const { data, error } = await supabaseAdmin
      .from('shifts')
      .insert(insertData)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Berhasil membuat shift tapi gagal mengambil data kembali.');
    
    return res.status(201).json(data);
  } catch (err) {
    console.error('Create shift error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Gagal membuat shift baru.' });
  }
});

/**
 * PUT /api/shifts/:id
 * Update shift (Super Admin only)
 */
router.put('/:id', async (req, res) => {
  try {
    authorizeRole(req.user, 'super_admin');

    const { id, created_at, updated_at, ...updateData } = req.body;

    // Sanitize time fields: convert empty strings to null
    if (updateData.break_start === '') updateData.break_start = null;
    if (updateData.break_end === '') updateData.break_end = null;

    const { data, error } = await supabaseAdmin
      .from('shifts')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Shift tidak ditemukan atau tidak ada perubahan yang disimpan.' });
    
    return res.json(data);
  } catch (err) {
    console.error('Update shift error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Gagal mengupdate shift.' });
  }
});

/**
 * DELETE /api/shifts/:id
 * Delete shift (Super Admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    authorizeRole(req.user, 'super_admin');

    const { error } = await supabaseAdmin
      .from('shifts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    return res.json({ message: 'Shift berhasil dihapus.' });
  } catch (err) {
    console.error('Delete shift error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Gagal menghapus shift.' });
  }
});

// ==========================================
// SHIFT ASSIGNMENTS
// ==========================================

/**
 * GET /api/shifts/assignments
 * Get shift assignments (filtered by month/year/employee)
 */
router.get('/assignments', async (req, res) => {
  try {
    const { month, year, employee_id, branch_id } = req.query;
    const userRole = req.user.profile.role;

    let query = supabaseAdmin
      .from('shift_assignments')
      .select('*, shifts(name, shift_type, start_time, end_time), profiles!inner(full_name, branch_id)')
      .order('date');

    // Filter by branch for Admin Cabang (if no specific employee_id)
    if (userRole === 'admin_cabang') {
      query = query.eq('profiles.branch_id', req.user.profile.branch_id);
    }

    // Filter by employee_id if provided
    if (userRole === 'karyawan') {
      query = query.eq('employee_id', req.user.profile.id);
    } else if (employee_id) {
      query = query.eq('employee_id', employee_id);
    }

    // Filter by month/year
    if (month !== undefined && year) {
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
    console.error('Get assignments error:', err);
    return res.status(500).json({ error: 'Gagal memuat jadwal shift.' });
  }
});

/**
 * POST /api/shifts/assignments/bulk
 * Bulk create/update shift assignments (Super Admin only)
 */
router.post('/assignments/bulk', async (req, res) => {
  try {
    authorizeRole(req.user, 'super_admin');

    const { assignments } = req.body;
    // assignments: [{ employee_id, shift_id, date }]

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: 'Data jadwal tidak valid.' });
    }

    const { data, error } = await supabaseAdmin
      .from('shift_assignments')
      .upsert(assignments, { onConflict: 'employee_id,date' })
      .select();

    if (error) throw error;
    return res.json({ message: `${data.length} jadwal berhasil disimpan.`, data });
  } catch (err) {
    console.error('Bulk assign error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Gagal menyimpan jadwal shift.' });
  }
});

/**
 * DELETE /api/shifts/assignments/bulk
 * Bulk delete shift assignments (Super Admin only)
 */
router.delete('/assignments/bulk', async (req, res) => {
  try {
    authorizeRole(req.user, 'super_admin');

    const { employee_id, dates } = req.body;
    if (!employee_id || !dates || !Array.isArray(dates)) {
      return res.status(400).json({ error: 'Parameter tidak lengkap.' });
    }

    const { error } = await supabaseAdmin
      .from('shift_assignments')
      .delete()
      .eq('employee_id', employee_id)
      .in('date', dates);

    if (error) throw error;
    return res.json({ message: 'Jadwal berhasil dihapus.' });
  } catch (err) {
    console.error('Bulk delete error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Gagal menghapus jadwal.' });
  }
});

export default router;
