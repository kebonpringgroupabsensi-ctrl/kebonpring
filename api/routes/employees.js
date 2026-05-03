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
 * GET /api/employees
 * List employees (filtered by role & branch)
 */
router.get('/', async (req, res) => {
  try {
    const { branch_id, status, position, search } = req.query;
    const userRole = req.user.profile.role;
    const userBranch = req.user.profile.branch_id;

    let query = supabaseAdmin
      .from('profiles')
      .select('*, branches(id, name)')
      .order('full_name');

    // Admin Cabang can only see their branch's employees
    if (userRole === 'admin_cabang') {
      query = query.eq('branch_id', userBranch);
    } else if (branch_id) {
      query = query.eq('branch_id', branch_id);
    }

    if (status) query = query.eq('employee_status', status);
    if (position) query = query.eq('position', position);
    if (search) query = query.or(`full_name.ilike.%${search}%,nik.ilike.%${search}%`);

    const { data, error } = await query;

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Get employees error:', err);
    return res.status(500).json({ error: 'Gagal memuat data karyawan.' });
  }
});

/**
 * GET /api/employees/me
 * Get current user's profile
 */
router.get('/me', async (req, res) => {
  try {
    return res.json(req.user.profile);
  } catch (err) {
    return res.status(500).json({ error: 'Gagal memuat profil.' });
  }
});

/**
 * GET /api/employees/:id
 * Get single employee
 */
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*, branches(id, name, latitude, longitude)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Get employee error:', err);
    return res.status(500).json({ error: 'Gagal memuat data karyawan.' });
  }
});

/**
 * POST /api/employees
 * Create employee (Admin creates account for new employee)
 */
router.post('/', async (req, res) => {
  try {
    authorizeRole(req.user, 'super_admin', 'admin_cabang');

    const {
      full_name, nik, email, phone, password,
      branch_id, position, employment_status, role,
    } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi.' });
    }

    // Admin Cabang can only add employees to their own branch
    const targetBranch = req.user.profile.role === 'admin_cabang'
      ? req.user.profile.branch_id
      : branch_id;

    // Admin Cabang cannot create admin or super_admin
    const targetRole = req.user.profile.role === 'admin_cabang'
      ? 'karyawan'
      : (role || 'karyawan');

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: targetRole },
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        return res.status(400).json({ error: 'Email sudah terdaftar.' });
      }
      return res.status(400).json({ error: authError.message });
    }

    // Update profile
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        nik,
        phone,
        branch_id: targetBranch,
        position,
        employment_status: employment_status || 'kontrak',
        role: targetRole,
      })
      .eq('id', authData.user.id)
      .select('*, branches(id, name)')
      .single();

    if (error) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw error;
    }

    return res.status(201).json({
      message: 'Karyawan berhasil ditambahkan.',
      employee: data,
    });
  } catch (err) {
    console.error('Create employee error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Gagal menambahkan karyawan.' });
  }
});

/**
 * PUT /api/employees/:id
 * Update employee profile
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.profile.role;

    // Only the user themselves, their branch admin, or super admin can update
    if (userRole === 'karyawan' && id !== req.user.profile.id) {
      return res.status(403).json({ error: 'Anda hanya bisa mengubah profil sendiri.' });
    }

    const {
      full_name, nik, phone, position,
      branch_id, employment_status, employee_status, role,
    } = req.body;

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (nik !== undefined) updateData.nik = nik;
    if (phone !== undefined) updateData.phone = phone;
    if (position !== undefined) updateData.position = position;

    // Only admins can change these fields
    if (userRole === 'super_admin') {
      if (branch_id !== undefined) updateData.branch_id = branch_id;
      if (employment_status !== undefined) updateData.employment_status = employment_status;
      if (employee_status !== undefined) updateData.employee_status = employee_status;
      if (role !== undefined) updateData.role = role;
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select('*, branches(id, name)')
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Update employee error:', err);
    return res.status(500).json({ error: 'Gagal mengupdate data karyawan.' });
  }
});

/**
 * DELETE /api/employees/:id
 * Delete employee (Super Admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    authorizeRole(req.user, 'super_admin');

    // Delete auth user (will cascade to profile via trigger)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
    if (error) throw error;

    return res.json({ message: 'Karyawan berhasil dihapus.' });
  } catch (err) {
    console.error('Delete employee error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Gagal menghapus karyawan.' });
  }
});

/**
 * PUT /api/employees/:id/face
 * Update face descriptor data
 */
router.put('/:id/face', async (req, res) => {
  try {
    const { id } = req.params;

    // Only the user themselves can register their face
    if (req.user.profile.role === 'karyawan' && id !== req.user.profile.id) {
      return res.status(403).json({ error: 'Anda hanya bisa mendaftarkan wajah sendiri.' });
    }

    const { face_descriptor } = req.body;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        face_descriptor,
        face_registered: true,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ message: 'Data wajah berhasil disimpan.', data });
  } catch (err) {
    console.error('Face update error:', err);
    return res.status(500).json({ error: 'Gagal menyimpan data wajah.' });
  }
});

export default router;
