import { supabaseAdmin } from '../config/supabase.js';

/**
 * Middleware: Authenticate user from Bearer token
 * Attaches req.user with profile data
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error('Supabase auth error:', error?.message || 'User not found');
      return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*, branches(name, latitude, longitude, radius_meters)')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error(`Profile fetch error for user ${user.id}:`, profileError.message);
      return res.status(401).json({ error: 'Profil pengguna tidak ditemukan atau bermasalah.' });
    }

    req.user = { ...user, profile };
    req.token = token;
    next();
  } catch (err) {
    console.error('Auth middleware critical error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan pada autentikasi sistem.' });
  }
}

/**
 * Middleware: Authorize by role(s)
 * Usage: authorize('super_admin', 'admin_cabang')
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user?.profile) {
      return res.status(401).json({ error: 'Tidak terautentikasi.' });
    }

    if (!roles.includes(req.user.profile.role)) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk fitur ini.' });
    }

    next();
  };
}
