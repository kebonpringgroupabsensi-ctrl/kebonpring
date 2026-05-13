import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .ilike('full_name', '%Suban%');
    
  console.log('Profiles:', profile);
  
  if (profile && profile.length > 0) {
    const { data: assignments } = await supabase
      .from('shift_assignments')
      .select('*, shifts(*)')
      .eq('employee_id', profile[0].id)
      .eq('date', '2026-05-03');
      
    console.log('Assignments for 2026-05-03:', assignments);
  }
}

check();
