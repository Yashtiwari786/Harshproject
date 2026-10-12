const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('🧪 Testing Category & Location Creation & Active Status Lifecycle...\n');

  // 1. Admin login
  const loginRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@college.edu', password: 'Password123!' });
  const adminToken = loginRes.data.token;
  console.log('1️⃣ Admin logged in.');

  // 2. Create new Category
  console.log('\n2️⃣ Creating new Category "Musical Instruments"...');
  const catRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/categories', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
  }, { name: 'Musical Instruments', icon: 'fa-guitar' });
  console.log('   Response status:', catRes.status);
  console.log('   Created category data:', catRes.data?.data);
  const newCat = catRes.data?.data;
  if (!newCat || newCat.isActive !== true) {
    console.error('❌ FAILED: New category isActive must be TRUE! Got:', newCat?.isActive);
    process.exit(1);
  }
  console.log('✅ SUCCESS: New category created with isActive = TRUE!');

  // 3. Create new Location
  console.log('\n3️⃣ Creating new Campus Location "Auditorium Green Room"...');
  const locRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/locations', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
  }, { name: 'Auditorium Green Room', building: 'Satabdi Bhavan' });
  console.log('   Response status:', locRes.status);
  console.log('   Created location data:', locRes.data?.data);
  const newLoc = locRes.data?.data;
  if (!newLoc || newLoc.isActive !== true) {
    console.error('❌ FAILED: New location isActive must be TRUE! Got:', newLoc?.isActive);
    process.exit(1);
  }
  console.log('✅ SUCCESS: New location created with isActive = TRUE!');

  // 4. Verify they appear in public dropdowns /api/categories and /api/locations
  console.log('\n4️⃣ Checking public dropdown feeds /api/categories and /api/locations...');
  const pubCats = await request({ hostname: 'localhost', port: 5000, path: '/api/categories', method: 'GET' });
  const inPubCats = (pubCats.data?.data || []).some(c => c.name === 'Musical Instruments');
  console.log('   "Musical Instruments" in public /api/categories:', inPubCats);

  const pubLocs = await request({ hostname: 'localhost', port: 5000, path: '/api/locations', method: 'GET' });
  const inPubLocs = (pubLocs.data?.data || []).some(l => l.name === 'Auditorium Green Room');
  console.log('   "Auditorium Green Room" in public /api/locations:', inPubLocs);

  if (!inPubCats || !inPubLocs) {
    console.error('❌ FAILED: Active category or location not found in public dropdowns');
    process.exit(1);
  }
  console.log('✅ SUCCESS: Both appear in public portal dropdowns!');

  // 5. Test Toggling to Disabled
  console.log('\n5️⃣ Testing Toggle Category to Disabled...');
  const disableCat = await request({
    hostname: 'localhost', port: 5000, path: `/api/admin/categories/${newCat._id}`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
  }, { isActive: false });
  console.log('   Disable status:', disableCat.status, 'isActive:', disableCat.data?.data?.isActive);

  // Check it is removed from public dropdown when disabled
  const pubCatsAfterDisable = await request({ hostname: 'localhost', port: 5000, path: '/api/categories', method: 'GET' });
  const inPubCatsAfter = (pubCatsAfterDisable.data?.data || []).some(c => c.name === 'Musical Instruments');
  console.log('   In public dropdown after disable (should be false):', inPubCatsAfter);
  if (inPubCatsAfter) {
    console.error('❌ FAILED: Category should be hidden when disabled');
    process.exit(1);
  }
  console.log('✅ SUCCESS: Category hidden from portal when disabled.');

  // 6. Test Toggling back to Active
  console.log('\n6️⃣ Testing Toggle Category back to Active...');
  const activateCat = await request({
    hostname: 'localhost', port: 5000, path: `/api/admin/categories/${newCat._id}`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
  }, { isActive: true });
  console.log('   Reactivate status:', activateCat.status, 'isActive:', activateCat.data?.data?.isActive);

  const pubCatsAfterReactivate = await request({ hostname: 'localhost', port: 5000, path: '/api/categories', method: 'GET' });
  const inPubCatsAfterRe = (pubCatsAfterReactivate.data?.data || []).some(c => c.name === 'Musical Instruments');
  console.log('   In public dropdown after reactivate (should be true):', inPubCatsAfterRe);
  if (!inPubCatsAfterRe) {
    console.error('❌ FAILED: Category should reappear when reactivated');
    process.exit(1);
  }
  console.log('✅ SUCCESS: Category restored to portal when reactivated.');

  // 7. Cleanup
  console.log('\n7️⃣ Cleaning up test records...');
  await request({
    hostname: 'localhost', port: 5000, path: `/api/admin/categories/${newCat._id}`, method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  await request({
    hostname: 'localhost', port: 5000, path: `/api/admin/locations/${newLoc._id}`, method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('✅ Cleanup completed.');

  console.log('\n🎉 ALL CATEGORY & LOCATION ACTIVE / DISABLE TESTS PASSED 100%!');
}

run().catch(console.error);
