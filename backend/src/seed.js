import { supabaseAdmin } from './config/supabase.js';

async function seed() {
  console.log('🌱 Starting seed process...\n');

  try {
    // ── 1. Cleanup existing test users ──
    console.log('1. Cleaning up old test users...');
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    
    const testEmails = [
      'superadmin@warungrequest.com',
      'admin.madiun@warungrequest.com',
      'budi@warungrequest.com',
    ];

    for (const email of testEmails) {
      const existing = users.find(u => u.email === email);
      if (existing) {
        // Delete profile first, then auth user
        await supabaseAdmin.from('profiles').delete().eq('id', existing.id);
        await supabaseAdmin.auth.admin.deleteUser(existing.id);
        console.log(`   Deleted old user: ${email}`);
      }
    }

    // ── 2. Create branches ──
    console.log('\n2. Creating branches...');
    
    // Check if branches exist
    const { data: existingBranches } = await supabaseAdmin.from('branches').select('id, name');
    
    let branchMadiun, branchSolo, branchSurabaya;
    
    if (!existingBranches || existingBranches.length === 0) {
      const { data: newBranches, error: branchError } = await supabaseAdmin
        .from('branches')
        .insert([
          { name: 'Cabang Madiun', address: 'Jl. Madiun Raya No. 1', latitude: -7.6298, longitude: 111.5239, radius_meters: 100 },
          { name: 'Cabang Solo', address: 'Jl. Solo Raya No. 2', latitude: -7.5755, longitude: 110.8243, radius_meters: 100 },
          { name: 'Cabang Surabaya', address: 'Jl. Surabaya Raya No. 3', latitude: -7.2575, longitude: 112.7521, radius_meters: 100 },
        ])
        .select();

      if (branchError) throw branchError;
      branchMadiun = newBranches[0];
      branchSolo = newBranches[1];
      branchSurabaya = newBranches[2];
      console.log('   Created 3 branches: Madiun, Solo, Surabaya');
    } else {
      branchMadiun = existingBranches.find(b => b.name.includes('Madiun')) || existingBranches[0];
      branchSolo = existingBranches.find(b => b.name.includes('Solo')) || existingBranches[1] || existingBranches[0];
      branchSurabaya = existingBranches.find(b => b.name.includes('Surabaya')) || existingBranches[2] || existingBranches[0];
      console.log(`   Branches already exist (${existingBranches.length} found)`);
    }

    // ── 3. Create Super Admin ──
    console.log('\n3. Creating Super Admin...');
    const superAdmin = await createUser({
      email: 'superadmin@warungrequest.com',
      password: 'password123',
      full_name: 'Super Admin',
      role: 'super_admin',
      branch_id: null,
      position: 'Owner',
    });
    console.log(`   ✅ Super Admin: superadmin@warungrequest.com / password123`);

    // ── 4. Create Admin Cabang ──
    console.log('\n4. Creating Admin Cabang Madiun...');
    const adminCabang = await createUser({
      email: 'admin.madiun@warungrequest.com',
      password: 'password123',
      full_name: 'Admin Madiun',
      role: 'admin_cabang',
      branch_id: branchMadiun.id,
      position: 'Admin Cabang',
    });
    console.log(`   ✅ Admin Cabang: admin.madiun@warungrequest.com / password123`);

    // ── 5. Create Karyawan ──
    console.log('\n5. Creating Karyawan...');
    const karyawan = await createUser({
      email: 'budi@warungrequest.com',
      password: 'password123',
      full_name: 'Budi Santoso',
      role: 'karyawan',
      branch_id: branchMadiun.id,
      position: 'Kasir',
      nik: 'WRQ-001',
      phone: '081234567890',
    });
    console.log(`   ✅ Karyawan: budi@warungrequest.com / password123`);

    // ── Done ──
    console.log('\n═══════════════════════════════════════');
    console.log('🎉 Seed completed successfully!');
    console.log('═══════════════════════════════════════');
    console.log('\nTest Accounts:');
    console.log('┌─────────────┬─────────────────────────────────┬─────────────┐');
    console.log('│ Role        │ Email                           │ Password    │');
    console.log('├─────────────┼─────────────────────────────────┼─────────────┤');
    console.log('│ Super Admin │ superadmin@warungrequest.com     │ password123 │');
    console.log('│ Admin Cab.  │ admin.madiun@warungrequest.com   │ password123 │');
    console.log('│ Karyawan    │ budi@warungrequest.com           │ password123 │');
    console.log('└─────────────┴─────────────────────────────────┴─────────────┘');

  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    console.error(err);
  }
}

async function createUser({ email, password, full_name, role, branch_id, position, nik, phone }) {
  // Step 1: Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  });

  if (authError) {
    // If trigger-based profile creation failed but auth user was created,
    // we need to handle it
    throw new Error(`Auth error for ${email}: ${authError.message}`);
  }

  // Step 2: Wait a moment for trigger to execute
  await new Promise(resolve => setTimeout(resolve, 500));

  // Step 3: Upsert profile data (in case trigger created it or not)
  const profileData = {
    id: authData.user.id,
    full_name,
    email,
    role,
    branch_id,
    position,
    employee_status: 'aktif',
    employment_status: 'kontrak',
  };
  if (nik) profileData.nik = nik;
  if (phone) profileData.phone = phone;

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' });

  if (profileError) {
    console.error(`   ⚠️ Profile upsert warning for ${email}:`, profileError.message);
  }

  return authData.user;
}

seed();
