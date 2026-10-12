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
  console.log('--- TEST: Student Login ---');
  const loginRes = await post('/auth/login', {
    email: 'student@college.edu',
    password: 'Password123!'
  });
  console.log('Login Status:', loginRes.status, 'Success:', loginRes.body.success);
  const token = loginRes.body.token;

  console.log('\n--- TEST: View Details for lost_002 ---');
  const lostRes = await get('/lost/lost_002', token);
  console.log('Lost Details Status:', lostRes.status, 'Title:', lostRes.body.data?.title);

  console.log('\n--- TEST: View Details for found_001 ---');
  const foundRes = await get('/found/found_001', token);
  console.log('Found Details Status:', foundRes.status, 'Title:', foundRes.body.data?.title);

  console.log('\n--- TEST: View Matches for lost_002 ---');
  const matchRes = await get('/matches/lost_002?type=lost', token);
  console.log('Matches Status:', matchRes.status, 'Count:', matchRes.body.count, 'Matches:', matchRes.body.data?.map(m => ({
    title: m.matchedItem.title,
    score: m.matchScore,
    factors: m.matchingFactors
  })));

  console.log('\n--- TEST: Claim "found_002" (Honda Bike Key) ---');
  const claimRes = await post('/claims', {
    itemId: 'found_002',
    itemModel: 'FoundItem',
    reason: 'I dropped my bike key near Parking Gate 2 around 11:30 AM after my lecture.',
    ownershipDetails: 'The key has a miniature Spider-Man rubber keychain with a small nick on the back.'
  }, token);
  console.log('Claim Status:', claimRes.status, 'Success:', claimRes.body.success, 'Message:', claimRes.body.message);

  console.log('\n--- TEST: Get My Claims ---');
  const myClaims = await get('/claims/my', token);
  console.log('My Claims Status:', myClaims.status, 'Claims Count:', myClaims.body.count);
  console.log('Recent Claims:', myClaims.body.data?.map(c => ({ id: c._id, item: c.itemId?.title, status: c.status })));
}

run().catch(console.error);
