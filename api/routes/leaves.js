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
 * GET /api/leaves
 * Get leave requests (filtered by role)
 */
router.get('/', async (req, res) => {
  try {
    const { status, employee_id } = req.query;
    const userRole = req.user.profile.role;

    let query = supabaseAdmin
      .from('leave_requests')
      .select('*, profiles!leave_requests_employee_id_fkey(full_name, nik, branch_id, branches(name)), reviewer:profiles!leave_requests_reviewed_by_fkey(full_name)')
      .order('created_at', { ascending: false });

    // Role-based filtering
    if (userRole === 'karyawan') {
      query = query.eq('employee_id', req.user.profile.id);
    } else if (userRole === 'admin_cabang') {
      // Admin sees leave requests from employees in their branch
      const { data: branchEmployees } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('branch_id', req.user.profile.branch_id);

      const employeeIds = branchEmployees?.map((e) => e.id) || [];
      if (employeeIds.length > 0) {
        query = query.in('employee_id', employeeIds);
      }
    }

    if (status) query = query.eq('status', status);
    if (employee_id && userRole !== 'karyawan') query = query.eq('employee_id', employee_id);

    const { data, error } = await query;

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Get leaves error:', err);
    return res.status(500).json({ error: 'Gagal memuat data izin/cuti.' });
  }
});

/**
 * POST /api/leaves
 * Submit a new leave request
 */
router.post('/', async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason, attachment, latitude, longitude } = req.body;

    if (!leave_type || !start_date || !end_date) {
      return res.status(400).json({ error: 'Jenis izin, tanggal mulai, dan tanggal selesai wajib diisi.' });
    }

    let finalAttachmentUrl = null;
    if (attachment) {
      try {
        const fileName = `izin_${req.user.profile.full_name}_${new Date().getTime()}.jpg`;
        finalAttachmentUrl = await uploadToDrive(fileName, 'image/jpeg', attachment);
      } catch (uploadErr) {
        console.error('Failed to upload leave attachment to GDrive:', uploadErr);
        // Continue without attachment if upload fails, or return error?
        // For leave proofs, it might be better to return error
        return res.status(500).json({ error: 'Gagal mengunggah bukti izin ke Google Drive.' });
      }
    }

    // Validate date range
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'Tanggal selesai harus setelah tanggal mulai.' });
    }

    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .insert({
        employee_id: req.user.profile.id,
        leave_type,
        start_date,
        end_date,
        reason,
        attachment_url: finalAttachmentUrl,
        latitude,
        longitude,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      message: 'Pengajuan izin berhasil dikirim.',
      leave: data,
    });
  } catch (err) {
    console.error('Create leave error:', err);
    return res.status(500).json({ error: 'Gagal mengajukan izin.' });
  }
});

/**
 * PUT /api/leaves/:id/review
 * Approve/reject a leave request (Admin only)
 */
router.put('/:id/review', async (req, res) => {
  try {
    authorizeRole(req.user, 'admin_cabang', 'super_admin');

    const { status, review_notes } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status harus approved atau rejected.' });
    }

    const { data, error } = await supabaseAdmin
      .from('leave_requests')
      .update({
        status,
        review_notes,
        reviewed_by: req.user.profile.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*, profiles!leave_requests_employee_id_fkey(full_name, branch_id)')
      .single();

    if (error) throw error;

    // If approved, create attendance records with 'izin' or 'sakit' status
    if (status === 'approved') {
      const leaveData = data;
      const start = new Date(leaveData.start_date);
      const end = new Date(leaveData.end_date);
      const attendanceRecords = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        attendanceRecords.push({
          employee_id: leaveData.employee_id,
          branch_id: leaveData.profiles?.branch_id,
          date: dateStr,
          status: leaveData.leave_type === 'pulang_cepat' ? 'pulang_cepat' : (leaveData.leave_type === 'sakit' ? 'sakit' : 'izin'),
          notes: `${leaveData.leave_type}: ${leaveData.reason || '-'}`,
        });
      }

      if (attendanceRecords.length > 0) {
        await supabaseAdmin
          .from('attendances')
          .upsert(attendanceRecords, { onConflict: 'employee_id,date' });
      }
    }

    return res.json({
      message: status === 'approved' ? 'Izin disetujui.' : 'Izin ditolak.',
      leave: data,
    });
  } catch (err) {
    console.error('Review leave error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Gagal memproses izin.' });
  }
});

/**
 * DELETE /api/leaves/:id
 * Cancel a pending leave request (employee can cancel own)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { data: leave } = await supabaseAdmin
      .from('leave_requests')
      .select('employee_id, status')
      .eq('id', req.params.id)
      .single();

    if (!leave) return res.status(404).json({ error: 'Pengajuan izin tidak ditemukan.' });

    // Only the owner can cancel, and only if still pending
    if (leave.employee_id !== req.user.profile.id && req.user.profile.role === 'karyawan') {
      return res.status(403).json({ error: 'Anda tidak memiliki akses.' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Hanya pengajuan berstatus pending yang bisa dibatalkan.' });
    }

    const { error } = await supabaseAdmin
      .from('leave_requests')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    return res.json({ message: 'Pengajuan izin berhasil dibatalkan.' });
  } catch (err) {
    console.error('Delete leave error:', err);
    return res.status(500).json({ error: 'Gagal membatalkan izin.' });
  }
});

export default router;
