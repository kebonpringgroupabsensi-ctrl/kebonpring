import { supabase } from './src/config/supabase.js';

async function testConnection() {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('app_settings').select('*');
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
