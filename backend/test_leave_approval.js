async function test() {
  const API_URL = 'http://localhost:3001/api';
  
  console.log('1. Logging in as Super Admin...');
  try {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@warungrequest.com', password: 'password123' })
    });
    
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.error('Login failed:', loginData);
      return;
    }
    
    const token = loginData.session.access_token;
    console.log('   ✅ Login success, token acquired.');

    const leaveId = '4b024193-d011-4a82-8f77-b86a2d54ad42';
    console.log(`2. Attempting to approve leave: ${leaveId}...`);
    
    const approveRes = await fetch(`${API_URL}/leaves/${leaveId}/review`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'approved', review_notes: 'Test approval from script' })
    });
    
    const approveData = await approveRes.json();
    console.log(`   Response Status: ${approveRes.status}`);
    console.log('   Response Body:', approveData);

    if (approveRes.ok) {
      console.log('   ✅ Backend Approval Working Correctly!');
    } else {
      console.log('   ❌ Backend Approval FAILED!');
    }
  } catch (err) {
    console.error('Network Error:', err.message);
    console.log('Is the server running on http://localhost:3001?');
  }
}

test();
