const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 [TEST] Verifying Portal Suspension & Admin Retention System...\n');

  // Step 1: Login as Admin
  console.log('1️⃣ Logging in as Admin...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'admin@college.edu', password: 'Password123!' });

  if (!loginRes.data || !loginRes.data.token) {
    console.error('❌ Admin login failed:', loginRes);
    process.exit(1);
  }
  const adminToken = loginRes.data.token;
  console.log('✅ Admin login successful.');

  // Step 2: Check public portal initially has Aarav\'s laptop (lost_001)
  console.log('\n2️⃣ Checking public /api/lost initially...');
  const initialLost = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/lost',
    method: 'GET',
  });
  const hasAaravInitially = (initialLost.data.data || []).some(item => item._id === 'lost_001');
  console.log(`   Aarav's laptop (lost_001) visible in portal before suspension: ${hasAaravInitially}`);
  if (!hasAaravInitially) {
    console.error('❌ Expected lost_001 to be in public portal initially');
    process.exit(1);
  }

  // Step 3: Suspend student Aarav (usr_stud001)
  console.log('\n3️⃣ Suspending student Aarav (usr_stud001) via Admin API...');
  const suspendRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/users/usr_stud001/status',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
  }, { status: 'SUSPENDED' });
  console.log('   Suspend API response status:', suspendRes.status, suspendRes.data.message);

  // Step 4: Verify public portal /api/lost NO LONGER has Aarav\'s laptop
  console.log('\n4️⃣ Checking public /api/lost AFTER suspension...');
  const afterLost = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/lost',
    method: 'GET',
  });
  const hasAaravAfter = (afterLost.data.data || []).some(item => item._id === 'lost_001');
  console.log(`   Aarav's laptop (lost_001) visible in portal AFTER suspension: ${hasAaravAfter}`);
  if (hasAaravAfter) {
    console.error('❌ FAILED: Aarav\'s laptop is STILL visible in public portal after suspension!');
    process.exit(1);
  }
  console.log('✅ SUCCESS: Aarav\'s item was removed/deleted from public portal feed.');

  // Step 5: Verify public single item access /api/lost/lost_001 returns 404 for guests/students
  console.log('\n5️⃣ Checking public single item view /api/lost/lost_001 as guest...');
  const guestSingleItem = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/lost/lost_001',
    method: 'GET',
  });
  console.log(`   Guest single item HTTP status: ${guestSingleItem.status} (Message: ${guestSingleItem.data?.message})`);
  if (guestSingleItem.status !== 404) {
    console.error('❌ FAILED: Guest should receive 404 for suspended user listing, got:', guestSingleItem.status);
    process.exit(1);
  }
  console.log('✅ SUCCESS: Public guest is blocked with 404 ("removed from portal").');

  // Step 6: Verify Admin panel /api/admin/items STILL has Aarav\'s laptop!
  console.log('\n6️⃣ Checking Admin Items Queue /api/admin/items...');
  const adminItems = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/items',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  const aaravItemInAdmin = (adminItems.data.data || []).find(item => item._id === 'lost_001');
  console.log(`   Item found in Admin Items Queue: ${Boolean(aaravItemInAdmin)}`);
  if (!aaravItemInAdmin) {
    console.error('❌ FAILED: Aarav\'s item was deleted from Admin panel! It MUST NOT be deleted from Admin panel.');
    process.exit(1);
  }
  console.log(`   isSuspendedFromPortal flag on item in Admin: ${aaravItemInAdmin.isSuspendedFromPortal}`);
  console.log(`   Author accountStatus in Admin: ${aaravItemInAdmin.reportedBy?.accountStatus}`);
  if (!aaravItemInAdmin.isSuspendedFromPortal) {
    console.error('❌ FAILED: Expected isSuspendedFromPortal to be true');
    process.exit(1);
  }
  console.log('✅ SUCCESS: Item is safely retained in Admin panel with suspension indicators!');

  // Step 7: Verify Admin CAN inspect the item via /api/lost/lost_001
  console.log('\n7️⃣ Inspecting /api/lost/lost_001 as Admin...');
  const adminInspect = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/lost/lost_001',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  console.log(`   Admin inspect status: ${adminInspect.status}`);
  if (adminInspect.status !== 200) {
    console.error('❌ FAILED: Admin should be able to inspect item details, got status:', adminInspect.status);
    process.exit(1);
  }
  console.log('✅ SUCCESS: Admin successfully inspected suspended user\'s item.');

  // Step 8: Reactivate student Aarav (usr_stud001)
  console.log('\n8️⃣ Reactivating student Aarav (usr_stud001) via Admin API...');
  const activateRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/users/usr_stud001/status',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
  }, { status: 'ACTIVE' });
  console.log('   Activate API response status:', activateRes.status, activateRes.data.message);

  // Step 9: Verify Aarav\'s laptop is restored to public portal /api/lost
  console.log('\n9️⃣ Checking public /api/lost AFTER reactivation...');
  const restoredLost = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/lost',
    method: 'GET',
  });
  const hasAaravRestored = (restoredLost.data.data || []).some(item => item._id === 'lost_001');
  console.log(`   Aarav's laptop (lost_001) visible in portal AFTER reactivation: ${hasAaravRestored}`);
  if (!hasAaravRestored) {
    console.error('❌ FAILED: Item should be restored to public portal after activation!');
    process.exit(1);
  }
  console.log('✅ SUCCESS: Item successfully restored to public portal upon reactivation.');

  console.log('\n🎉 ALL SUSPENSION & RETENTION TESTS PASSED 100%!');
}

runTests().catch(err => {
  console.error('❌ Test failed with exception:', err);
  process.exit(1);
});
