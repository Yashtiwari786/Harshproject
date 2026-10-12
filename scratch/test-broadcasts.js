const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=== TEST 1: Staff Broadcasts ===');
  const staffLogin = await post('/auth/login', {
    email: 'staff@college.edu',
    password: 'Password123!'
  });
  const staffToken = staffLogin.body.token;

  // 1a. Staff -> Students
  const s1 = await post('/notifications/broadcast', {
    title: 'Found Smartwatch Deposited at Desk',
    message: 'An Apple Watch Series 8 was found near the Sports Complex. Please claim at Room 102.',
    targetAudience: 'STUDENTS',
    priority: 'NORMAL'
  }, staffToken);
  console.log('Staff -> Students:', s1.status, s1.body.message);

  // 1b. Staff -> Staff
  const s2 = await post('/notifications/broadcast', {
    title: 'Shift Handover Briefing at 5:00 PM',
    message: 'Security staff on evening duty, please report to Room 102 for custody audit.',
    targetAudience: 'STAFF',
    priority: 'NORMAL'
  }, staffToken);
  console.log('Staff -> Staff:', s2.status, s2.body.message);

  // 1c. Staff -> ALL (Should be rejected)
  const s3 = await post('/notifications/broadcast', {
    title: 'Disallowed Broadcast',
    message: 'Staff trying to broadcast to ALL campus',
    targetAudience: 'ALL',
    priority: 'NORMAL'
  }, staffToken);
  console.log('Staff -> ALL (Blocked):', s3.status, s3.body.message);

  console.log('\n=== TEST 2: Admin Broadcasts ===');
  const adminLogin = await post('/auth/login', {
    email: 'admin@college.edu',
    password: 'Password123!'
  });
  const adminToken = adminLogin.body.token;

  // 2a. Admin -> ALL
  const a1 = await post('/notifications/broadcast', {
    title: 'Campus Lost Property Audit Notice',
    message: 'Semester-end property audit active. Verify your items before 15th.',
    targetAudience: 'ALL',
    priority: 'URGENT'
  }, adminToken);
  console.log('Admin -> ALL:', a1.status, a1.body.message);

  // 2b. Admin -> STAFF
  const a2 = await post('/notifications/broadcast', {
    title: 'Security Desk Locker Inspection',
    message: 'All physical locker logs must be submitted by Friday.',
    targetAudience: 'STAFF',
    priority: 'NORMAL'
  }, adminToken);
  console.log('Admin -> STAFF:', a2.status, a2.body.message);

  // 2c. Admin -> STUDENTS
  const a3 = await post('/notifications/broadcast', {
    title: 'Lost Library Card Clearance',
    message: 'Students with missing library passes can collect temporary vouchers.',
    targetAudience: 'STUDENTS',
    priority: 'NORMAL'
  }, adminToken);
  console.log('Admin -> STUDENTS:', a3.status, a3.body.message);

  console.log('\n=== TEST 3: Broadcast History API ===');
  const hist = await get('/notifications/broadcasts', adminToken);
  console.log('Broadcasts Count:', hist.body.count);
  console.log('History titles:', hist.body.data.map(b => `[${b.targetAudience}] ${b.title}`));

  console.log('\n=== TEST 4: Student Received Alerts ===');
  const studLogin = await post('/auth/login', {
    email: 'student@college.edu',
    password: 'Password123!'
  });
  const studNotifs = await get('/notifications', studLogin.body.token);
  console.log('Student Notifications Count:', studNotifs.body.count);
  console.log('Top Notifications:', studNotifs.body.data.slice(0, 3).map(n => n.title));
}

run().catch(console.error);
