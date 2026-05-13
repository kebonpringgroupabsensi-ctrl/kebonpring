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
    console.error('Vercel Auth Error:', error?.message || 'User not found');
    const err = new Error(`Auth Error: ${error?.message || 'User not found'}`);
    err.statusCode = 401;
    throw err;
  }

  // Fetch user profile
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*, branches(name, latitude, longitude, radius_meters)')
    .eq('id', user.id);

  if (profileError) {
    console.error(`Vercel Profile Fetch Error for user ${user.id}:`, profileError.message);
    const err = new Error(`Profile Fetch Error: ${profileError.message}`);
    err.statusCode = 500;
    throw err;
  }

  const profile = profiles && profiles.length > 0 ? profiles[0] : null;

  if (!profile) {
    console.error(`Profile not found in database for auth user ${user.id}`);
    const err = new Error(`Profile Not Found in Database (User ID: ${user.id})`);
    err.statusCode = 401; // Keep 401 to force re-auth if profile is missing
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
