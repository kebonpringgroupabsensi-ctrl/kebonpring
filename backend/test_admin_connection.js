import { supabaseAdmin } from './src/config/supabase.js';

async function testConnection() {
  console.log('Testing Supabase connection with Service Role...');
  try {
    const { data, error } = await supabaseAdmin.from('app_settings').select('*');
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    console.log('✅ Connection successful!');
    console.log('Data fetched:', data);
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testConnection();
