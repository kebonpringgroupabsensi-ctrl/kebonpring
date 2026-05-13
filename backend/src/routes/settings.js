import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/settings
 * Get all app settings
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('*')
      .order('key');

    if (error) throw error;

    // Transform to key-value map for easy frontend usage
    const settings = {};
    data.forEach((s) => {
      settings[s.key] = s.value;
    });

    return res.json(settings);
  } catch (err) {
    console.error('Get settings error:', err);
    return res.status(500).json({ error: 'Gagal memuat pengaturan.' });
  }
});

/**
 * PUT /api/settings
 * Update app settings (Super Admin only)
 * Body: { key: value, key2: value2, ... }
 */
router.put('/', authorize('super_admin'), async (req, res) => {
  try {
    const updates = req.body;

    const promises = Object.entries(updates).map(([key, value]) =>
      supabaseAdmin
        .from('app_settings')
        .upsert(
          { key, value: JSON.stringify(value), updated_by: req.user.profile.id },
          { onConflict: 'key' }
        )
    );

    await Promise.all(promises);

    return res.json({ message: 'Pengaturan berhasil disimpan.' });
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ error: 'Gagal menyimpan pengaturan.' });
  }
});

// ==========================================
// ANNOUNCEMENTS
// ==========================================

/**
 * GET /api/settings/announcements
 * Get active announcements
 */
router.get('/announcements', async (req, res) => {
  try {
    const profile = req.user.profile;

    let query = supabaseAdmin
      .from('announcements')
      .select('*, profiles!announcements_created_by_fkey(full_name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Filter by branch or global
    if (profile.role === 'karyawan' || profile.role === 'admin_cabang') {
      query = query.or(`is_global.eq.true,branch_id.eq.${profile.branch_id}`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Get announcements error:', err);
    return res.status(500).json({ error: 'Gagal memuat pengumuman.' });
  }
});

/**
 * POST /api/settings/announcements
 * Create announcement (Admin only)
 */
router.post('/announcements', authorize('admin_cabang', 'super_admin'), async (req, res) => {
  try {
    const { title, content, branch_id, is_global } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Judul dan isi pengumuman wajib diisi.' });
    }

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert({
        title,
        content,
        created_by: req.user.profile.id,
        branch_id: is_global ? null : (branch_id || req.user.profile.branch_id),
        is_global: is_global || false,
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    console.error('Create announcement error:', err);
    return res.status(500).json({ error: 'Gagal membuat pengumuman.' });
  }
});

/**
 * DELETE /api/settings/announcements/:id
 * Delete announcement
 */
router.delete('/announcements/:id', authorize('admin_cabang', 'super_admin'), async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('announcements')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    return res.json({ message: 'Pengumuman berhasil dihapus.' });
  } catch (err) {
    console.error('Delete announcement error:', err);
    return res.status(500).json({ error: 'Gagal menghapus pengumuman.' });
  }
});

export default router;
