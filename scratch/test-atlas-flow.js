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

async function testAtlasFlow() {
  console.log('Testing live MongoDB Atlas flow...');
  // 1. Admin login
  const login = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@college.edu', password: 'Password123!' });
  const adminToken = login.data.token;
  console.log('✅ Admin logged in on real Atlas DB.');

  // 2. Fetch users from real Atlas DB
  const usersRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/users', method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('✅ Real Atlas users count:', usersRes.data.count);
  const student = usersRes.data.data.find(u => u.role === 'STUDENT');
  console.log('   Found student:', student.name, 'ID:', student._id, 'Status:', student.accountStatus);

  // 3. Fetch lost items from real Atlas DB
  const lostRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/lost', method: 'GET'
  });
  console.log('✅ Real Atlas lost items count:', lostRes.data.count);
  console.log('   Sample lost item:', lostRes.data.data[0]?.title, 'ID:', lostRes.data.data[0]?._id);

  // 4. Suspend this student in real Atlas DB
  console.log(`\nSuspending student ${student.name} in real Atlas DB...`);
  const suspRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/admin/users/${student._id}/status`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
  }, { status: 'SUSPENDED' });
  console.log('   Suspend status:', suspRes.status, suspRes.data.message);

  // 5. Check if student items removed from portal
  const afterLost = await request({
    hostname: 'localhost', port: 5000, path: '/api/lost', method: 'GET'
  });
  const studentItemsInPortal = (afterLost.data.data || []).filter(i => (i.reportedBy?._id || i.reportedBy) === student._id);
  console.log('   Student items remaining in portal:', studentItemsInPortal.length);

  // 6. Check if student items retained in Admin items queue
  const adminItems = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/items', method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const studentItemsInAdmin = (adminItems.data.data || []).filter(i => (i.reportedBy?._id || i.reportedBy) === student._id);
  console.log('   Student items retained in Admin Items Queue:', studentItemsInAdmin.length);
  console.log('   IsSuspendedFromPortal on item in Admin:', studentItemsInAdmin[0]?.isSuspendedFromPortal);

  // 7. Reactivate student in real Atlas DB
  console.log(`\nReactivating student in real Atlas DB...`);
  await request({
    hostname: 'localhost', port: 5000, path: `/api/admin/users/${student._id}/status`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
  }, { status: 'ACTIVE' });

  // 8. Verify restored to portal
  const restoredLost = await request({
    hostname: 'localhost', port: 5000, path: '/api/lost', method: 'GET'
  });
  const restoredCount = (restoredLost.data.data || []).filter(i => (i.reportedBy?._id || i.reportedBy) === student._id).length;
  console.log('   Student items restored to portal:', restoredCount);

  if (studentItemsInPortal.length === 0 && studentItemsInAdmin.length > 0 && restoredCount > 0) {
    console.log('\n🎉 ALL REAL MONGODB ATLAS END-TO-END TESTS PASSED 100%!');
  } else {
    console.log('\n❌ Check results above.');
  }
}

testAtlasFlow().catch(console.error);
