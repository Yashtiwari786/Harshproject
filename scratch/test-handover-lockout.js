const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      if (typeof data === 'string') {
        req.write(data);
      } else {
        req.write(JSON.stringify(data));
      }
    }
    req.end();
  });
}

async function login(email, password = 'Password123!') {
  const res = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email, password }
  );
  const token = res.data && (res.data.token || (res.data.data && res.data.data.token));
  const user = res.data && (res.data.data || res.data.user);
  if (!token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return { token, user };
}

async function run() {
  console.log('🧪 Starting Multi-Claim & Handover Lockout Lifecycle Test...\n');

  // 1. Login Admin, Staff, Student 1, Student 2, Student 3
  console.log('1️⃣ Logging in test users...');
  const admin = await login('admin@college.edu');
  const staff = await login('staff@college.edu');
  const student1 = await login('student@college.edu'); // Priya Verma
  console.log(`   Admin logged in: ${admin.user.name}`);
  console.log(`   Staff logged in: ${staff.user.name}`);
  console.log(`   Student 1 logged in: ${student1.user.name}`);

  // Register Student 2 if not present, or login
  let student2;
  try {
    student2 = await login('aarav@college.edu');
  } catch (e) {
    const regRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Aarav Gupta',
        email: 'aarav@college.edu',
        password: 'Password123!',
        collegeId: '2024-BCA-042',
        phone: '9876543212',
        department: 'Computer Science & Applications',
        year: '2nd Year',
      }
    );
    if (regRes.data && regRes.data.data && regRes.data.data.token) {
      student2 = { token: regRes.data.data.token, user: regRes.data.data.user };
    } else {
      student2 = await login('aarav@college.edu');
    }
  }
  console.log(`   Student 2 logged in: ${student2.user.name}`);

  // Register Student 3 if not present
  let student3;
  try {
    student3 = await login('rohit@college.edu');
  } catch (e) {
    const regRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Rohit Sharma',
        email: 'rohit@college.edu',
        password: 'Password123!',
        collegeId: '2024-BTECH-108',
        phone: '9876543213',
        department: 'Mechanical Engineering',
        year: '3rd Year',
      }
    );
    if (regRes.data && regRes.data.data && regRes.data.data.token) {
      student3 = { token: regRes.data.data.token, user: regRes.data.data.user };
    } else {
      student3 = await login('rohit@college.edu');
    }
  }
  console.log(`   Student 3 logged in: ${student3.user.name}`);

  // 2. Report a new test Found Item by Staff
  console.log('\n2️⃣ Creating a new test Found Item ("Titan Neo Analog Watch")...');
  const createItemRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/found',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staff.token}`,
      },
    },
    {
      title: 'Titan Neo Analog Watch Test',
      category: 'Watches',
      description: 'Silver steel strap analog watch found on bench near library ground floor.',
      color: 'Silver',
      brand: 'Titan',
      location: 'Library - Ground Floor',
      dateFound: new Date().toISOString(),
      condition: 'Excellent',
      currentStorageLocation: 'Security Office Locker C1',
      uniqueDetails: 'Scratch on the back dial and roman numeral 12',
    }
  );

  if (createItemRes.status !== 201 || !createItemRes.data.data) {
    throw new Error(`Failed to create found item: ${JSON.stringify(createItemRes.data)}`);
  }
  const testItem = createItemRes.data.data;
  console.log(`   Item created with ID: ${testItem._id}, status: ${testItem.status}`);

  // 3. Student 1 submits Claim 1 on the item
  console.log('\n3️⃣ Student 1 ("Priya") submits Claim 1 for the watch...');
  const claim1Res = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/claims',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student1.token}`,
      },
    },
    {
      itemId: testItem._id,
      itemModel: 'FoundItem',
      reason: 'I forgot it on the reading table around 2 PM.',
      ownershipDetails: 'It has a silver strap with Titan logo and small mark on back.',
    }
  );
  console.log(`   Claim 1 status: ${claim1Res.status}, Claim ID: ${claim1Res.data.data ? claim1Res.data.data._id : 'N/A'}`);
  if (claim1Res.status !== 201) {
    throw new Error(`Claim 1 failed: ${JSON.stringify(claim1Res.data)}`);
  }
  const claim1 = claim1Res.data.data;

  // 4. Student 2 submits Claim 2 on the SAME item
  console.log('\n4️⃣ Student 2 ("Aarav") submits Claim 2 on the SAME watch (testing multi-student claim)...');
  const claim2Res = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/claims',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student2.token}`,
      },
    },
    {
      itemId: testItem._id,
      itemModel: 'FoundItem',
      reason: 'I also lost my Titan watch in library yesterday.',
      ownershipDetails: 'Purchased on Amazon, silver strap.',
    }
  );
  console.log(`   Claim 2 status: ${claim2Res.status}, Claim ID: ${claim2Res.data.data ? claim2Res.data.data._id : 'N/A'}`);
  if (claim2Res.status !== 201) {
    throw new Error(`Claim 2 failed: ${JSON.stringify(claim2Res.data)}`);
  }
  const claim2 = claim2Res.data.data;
  console.log('✅ SUCCESS: Multiple students can claim the same item concurrently!');

  // 5. Staff reviews and approves Claim 1 (Priya's claim), generating handover code
  console.log('\n5️⃣ Staff reviews and APPROVES Claim 1 (Priya Verma)...');
  const approveRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/claims/${claim1._id}/review`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staff.token}`,
      },
    },
    {
      action: 'APPROVED',
      reviewNotes: 'Verified against intake receipt and scratch description.',
    }
  );
  console.log(`   Approve response: ${approveRes.status}, Handover Code: ${approveRes.data.data.handoverCode}`);
  const handoverCode = approveRes.data.data.handoverCode;

  // 6. Staff verifies Handover Code and completes Handover to Student 1
  console.log('\n6️⃣ Staff enters Handover Code to complete physical return to Student 1...');
  const handoverRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/claims/${claim1._id}/handover`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staff.token}`,
      },
    },
    {
      handoverCode: handoverCode,
    }
  );
  console.log(`   Handover status: ${handoverRes.status}, Message: ${handoverRes.data.message}`);
  if (handoverRes.status !== 200) {
    throw new Error(`Handover failed: ${JSON.stringify(handoverRes.data)}`);
  }
  console.log('✅ SUCCESS: Handover completed!');

  // 7. Verify Item Status is now HANDED_OVER on the portal
  console.log('\n7️⃣ Inspecting Item on public portal /api/found/:id...');
  const itemCheckRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/found/${testItem._id}`,
    method: 'GET',
  });
  console.log(`   Item status on portal: ${itemCheckRes.data.data.status}`);
  if (itemCheckRes.data.data.status !== 'HANDED_OVER') {
    throw new Error(`Expected item status HANDED_OVER, got: ${itemCheckRes.data.data.status}`);
  }
  console.log('✅ SUCCESS: Item status is HANDED_OVER on the portal!');

  // 8. Verify Claim 2 (Student 2's claim) was automatically closed/rejected
  console.log('\n8️⃣ Checking status of Student 2\'s Claim 2...');
  const claim2CheckRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/claims/${claim2._id}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${student2.token}`,
    },
  });
  console.log(`   Claim 2 status: ${claim2CheckRes.data.data.status}`);
  console.log(`   Claim 2 reviewNotes: ${claim2CheckRes.data.data.reviewNotes}`);
  if (claim2CheckRes.data.data.status !== 'REJECTED') {
    throw new Error(`Expected Claim 2 status REJECTED, got: ${claim2CheckRes.data.data.status}`);
  }
  console.log('✅ SUCCESS: Competing claim automatically closed/rejected once item was handed over!');

  // 9. Student 3 attempts to submit Claim 3 on the handed-over item -> Must be REJECTED
  console.log('\n9️⃣ Student 3 attempts to submit a NEW claim on the handed-over watch...');
  const claim3Res = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/claims',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student3.token}`,
      },
    },
    {
      itemId: testItem._id,
      itemModel: 'FoundItem',
      reason: 'This was my watch.',
      ownershipDetails: 'Titan watch.',
    }
  );
  console.log(`   Claim 3 HTTP Status: ${claim3Res.status}`);
  console.log(`   Response Message: ${claim3Res.data.message}`);
  if (claim3Res.status !== 400 || !claim3Res.data.message.includes('handed over')) {
    throw new Error(`Expected 400 rejection for new claim on handed over item, got: ${claim3Res.status} ${JSON.stringify(claim3Res.data)}`);
  }
  console.log('✅ SUCCESS: New claims are strictly rejected ("No claim is accepted") once item is handed over!');

  console.log('\n🎉 ALL MULTI-CLAIM & HANDOVER LOCKOUT TESTS PASSED 100%!');
}

run().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
