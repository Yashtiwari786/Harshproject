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
  console.log('🧪 Testing Abuse Report Blocking & Portal Removal...');
  // 1. Login admin
  const login = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@college.edu', password: 'Password123!' });
  const adminToken = login.data.token;

  // 2. Check Priya's wallet (lost_002) in public portal
  const before = await request({ hostname: 'localhost', port: 5000, path: '/api/lost', method: 'GET' });
  const hasWalletBefore = (before.data.data || []).some(i => i._id === 'lost_002');
  console.log('   Priya wallet (lost_002) in portal before abuse block:', hasWalletBefore);

  // 3. Block Priya via report rep_001 (which reports lost_002)
  const blockRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/reports/rep_001/block-user', method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('   Block user API result:', blockRes.status, blockRes.data?.message);

  // 4. Verify Priya's wallet removed from public portal
  const after = await request({ hostname: 'localhost', port: 5000, path: '/api/lost', method: 'GET' });
  const hasWalletAfter = (after.data.data || []).some(i => i._id === 'lost_002');
  console.log('   Priya wallet in portal AFTER abuse block:', hasWalletAfter);

  // 5. Verify Priya's wallet STILL in Admin Items Queue
  const adminItems = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/items', method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const walletInAdmin = (adminItems.data.data || []).find(i => i._id === 'lost_002');
  console.log('   Priya wallet still present in Admin Panel:', Boolean(walletInAdmin));
  console.log('   Wallet isSuspendedFromPortal in Admin:', walletInAdmin?.isSuspendedFromPortal);

  // 6. Reset Priya back to ACTIVE
  await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/users/usr_stud002/status', method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
  }, { status: 'ACTIVE' });

  if (hasWalletBefore && !hasWalletAfter && walletInAdmin) {
    console.log('🎉 ABUSE REPORT SUSPENSION TEST PASSED 100%!');
  } else {
    console.error('❌ Abuse report suspension test failed!');
    process.exit(1);
  }
}

run().catch(console.error);
