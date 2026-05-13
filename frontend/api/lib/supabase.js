import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

if (!supabaseServiceKey) {
  console.error('❌ CRITICAL: Missing SUPABASE_SERVICE_ROLE_KEY - admin operations will fail with RLS errors!');
}

// Client for normal authenticated operations (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client that bypasses RLS (for server-side operations like registration)
// IMPORTANT: If service key is missing, this will fallback to anon key and RLS will block writes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Log which mode we're running in
if (supabaseServiceKey) {
  console.log('✅ Supabase Admin client initialized with SERVICE_ROLE_KEY (bypasses RLS)');
} else {
  console.warn('⚠️ Supabase Admin client using ANON_KEY - RLS will apply! Set SUPABASE_SERVICE_ROLE_KEY.');
}

export default supabase;

