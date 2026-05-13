import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { authenticateRequest, authorizeRole } from '../lib/auth.js';

const router = Router();

/**
 * GET /api/branches
 * Get all branches (Public for registration)
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('branches')
      .select('id, name')
      .eq('status', 'aktif')
      .order('name');

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Get branches error:', err);
    return res.status(500).json({ error: 'Gagal memuat data cabang.' });
  }
});

/**
 * GET /api/branches/all-admin
 * Get ALL branches with full details (Super Admin only)
 */
router.get('/all-admin', async (req, res) => {
  try {
    const user = await authenticateRequest(req);
    authorizeRole(user, 'super_admin');

    const { data, error } = await supabaseAdmin
      .from('branches')
      .select('*')
      .order('name');

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Get all branches error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Gagal memuat data cabang.' });
  }
});

/**
 * GET /api/branches/:id
 * Get single branch with employee count
 */
router.get('/:id', async (req, res) => {
  try {
    await authenticateRequest(req);

    const { data: branch, error } = await supabaseAdmin
      .from('branches')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    // Get employee count for this branch
    const { count } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('branch_id', req.params.id)
      .eq('employee_status', 'aktif');

    return res.json({ ...branch, employee_count: count || 0 });
  } catch (err) {
    console.error('Get branch error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Gagal memuat data cabang.' });
  }
});

/**
 * POST /api/branches
 * Create new branch (Super Admin only)
 */
router.post('/', async (req, res) => {
  try {
    const user = await authenticateRequest(req);
    authorizeRole(user, 'super_admin');

    const { name, address, latitude, longitude, radius_meters, admin_name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nama cabang wajib diisi.' });
    }

    const { data, error } = await supabaseAdmin
      .from('branches')
      .insert({ name, address, latitude, longitude, radius_meters, admin_name })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    console.error('Create branch error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Gagal membuat cabang baru.' });
  }
});

/**
 * PUT /api/branches/:id
 * Update branch (Super Admin only)
 */
router.put('/:id', async (req, res) => {
  try {
    const user = await authenticateRequest(req);
    authorizeRole(user, 'super_admin');

    const { name, address, latitude, longitude, radius_meters, admin_name, status } = req.body;

    const { data, error } = await supabaseAdmin
      .from('branches')
      .update({ name, address, latitude, longitude, radius_meters, admin_name, status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Update branch error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Gagal mengupdate cabang.' });
  }
});

/**
 * DELETE /api/branches/:id
 * Delete branch (Super Admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const user = await authenticateRequest(req);
    authorizeRole(user, 'super_admin');

    const { error } = await supabaseAdmin
      .from('branches')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    return res.json({ message: 'Cabang berhasil dihapus.' });
  } catch (err) {
    console.error('Delete branch error:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Gagal menghapus cabang.' });
  }
});

export default router;
