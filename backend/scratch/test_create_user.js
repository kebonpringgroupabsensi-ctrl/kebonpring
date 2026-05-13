import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  console.log('Creating user...');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: 'test' + Date.now() + '@example.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: { full_name: 'Test User', role: 'karyawan' },
  });

  if (authError) {
    console.error('Create User Error:', authError);
    return;
  }

  console.log('User created:', authData.user.id);

  console.log('Selecting profile...');
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id);

  console.log('Profile Data:', profileData);
  console.log('Profile Error:', profileError);

  if (profileData && profileData.length > 0) {
    console.log('Updating profile...');
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        employment_status: 'kontrak',
        role: 'karyawan'
      })
      .eq('id', authData.user.id)
      .select('*, branches(id, name)');
    
    console.log('Update Data:', updateData);
    console.log('Update Error:', updateError);
  }

  // Cleanup
  await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
}

test();
