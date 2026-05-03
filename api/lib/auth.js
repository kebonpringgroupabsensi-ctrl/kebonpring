import { supabaseAdmin } from './supabase.js';

/**
 * Authenticate user from Bearer token
 * Returns user profile or throws error
 */
export async function authenticateRequest(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Token tidak ditemukan. Silakan login.');
    err.statusCode = 401;
    throw err;
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    const err = new Error('Token tidak valid atau sudah kedaluwarsa.');
    err.statusCode = 401;
    throw err;
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*, branches(name, latitude, longitude, radius_meters)')
    .eq('id', user.id)
    .single();

  if (profileError) {
    const err = new Error('Profil pengguna tidak ditemukan.');
    err.statusCode = 401;
    throw err;
  }

  return { ...user, profile, token };
}

/**
 * Check if user has required role(s)
 */
export function authorizeRole(user, ...roles) {
  if (!user?.profile) {
    const err = new Error('Tidak terautentikasi.');
    err.statusCode = 401;
    throw err;
  }

  if (!roles.includes(user.profile.role)) {
    const err = new Error('Anda tidak memiliki akses untuk fitur ini.');
    err.statusCode = 403;
    throw err;
  }
}
