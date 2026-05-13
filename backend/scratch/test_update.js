import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const profileUpdate = {
    nik: null,
    phone: null,
    branch_id: '123e4567-e89b-12d3-a456-426614174000', // Fake UUID
    position: null,
    employment_status: 'kontrak',
    role: 'karyawan',
  };

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(profileUpdate)
    .eq('id', '123e4567-e89b-12d3-a456-426614174000') // Fake UUID
    .select('*, branches(id, name)');

  console.log('Error:', error);
  console.log('Data:', data);
}

test();
