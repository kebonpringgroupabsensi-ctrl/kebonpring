import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

/**
 * POST /api/auth/login
 * Login with email/password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi.' });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    // Fetch profile with branch info
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*, branches(id, name, latitude, longitude, radius_meters)')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Gagal memuat profil pengguna.' });
    }

    if (profile.employee_status === 'non_aktif') {
      return res.status(403).json({ error: 'Akun Anda telah dinonaktifkan. Hubungi admin.' });
    }

    return res.json({
      message: 'Login berhasil!',
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        ...profile,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

/**
 * POST /api/auth/register
 * Self-registration for employees
 */
router.post('/register', async (req, res) => {
  try {
    const {
      full_name,
      nik,
      email,
      phone,
      password,
      branch_id,
      position,
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !password || !branch_id || !position) {
      return res.status(400).json({ 
        error: 'Semua field wajib diisi (nama, email, password, cabang, jabatan).' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password minimal 8 karakter.' });
    }

    // Check if NIK already exists
    if (nik) {
      const { data: existingNik } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('nik', nik)
        .single();

      if (existingNik) {
        return res.status(400).json({ error: 'NIK sudah terdaftar di sistem.' });
      }
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'karyawan',
      },
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        return res.status(400).json({ error: 'Email sudah terdaftar.' });
      }
      return res.status(400).json({ error: authError.message });
    }

    // Update profile with additional data (profile is auto-created by trigger)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        nik,
        phone,
        branch_id,
        position,
        role: 'karyawan',
        employment_status: 'kontrak',
        employee_status: 'aktif',
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      // Rollback: delete auth user if profile update fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Gagal menyimpan data profil.' });
    }

    return res.status(201).json({
      message: 'Pendaftaran berhasil! Silakan login dengan akun Anda.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (invalidate session)
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      await supabaseAdmin.auth.admin.signOut(token);
    }
    return res.json({ message: 'Logout berhasil.' });
  } catch (err) {
    return res.json({ message: 'Logout berhasil.' });
  }
});

export default router;
