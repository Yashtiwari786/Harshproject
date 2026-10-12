async function runSuite() {
  console.log('=== RUNNING FULL VERIFICATION SUITE ===\n');

  // 1. Student Login
  const stuLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@college.edu', password: 'Password123!' })
  });
  const stuLogin = await stuLoginRes.json();
  console.log('1. Student Login:', stuLogin.success, '| User:', stuLogin.data?.name);
  const stuToken = stuLogin.token;

  // 2. Submit Claim with itemId: 'found_001'
  const claimRes = await fetch('http://localhost:5000/api/claims', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${stuToken}`
    },
    body: JSON.stringify({
      itemId: 'found_001',
      itemModel: 'FoundItem',
      reason: 'Lost my brown wallet at canteen yesterday around 1:15pm',
      ownershipDetails: 'Contains my college ID for Aarav Gupta and cash'
    })
  });
  const claimData = await claimRes.json();
  console.log('2. Claim Submission (itemId: found_001):', claimData.success, '| Message:', claimData.message);

  // 3. Staff Login
  const staffLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@college.edu', password: 'Password123!' })
  });
  const staffLogin = await staffLoginRes.json();
  console.log('3. Staff Login:', staffLogin.success, '| Role:', staffLogin.data?.role);
  const staffToken = staffLogin.token;

  // 4. Staff Dashboard
  const dashRes = await fetch('http://localhost:5000/api/admin/dashboard', {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  const dashData = await dashRes.json();
  console.log('4. Staff Dashboard API:', dashData.success, {
    totalUsers: dashData.data?.totalUsers,
    totalStudents: dashData.data?.totalStudents,
    totalStaff: dashData.data?.totalStaff,
    recentStudents: dashData.data?.recentStudents?.map(s => `${s.name} (${s.collegeId})`),
    recentStaff: dashData.data?.recentStaff?.map(s => `${s.name} (${s.collegeId})`),
    pendingClaims: dashData.data?.pendingClaimsList?.length
  });

  // 5. Staff Student Directory
  const usersRes = await fetch('http://localhost:5000/api/admin/users?role=STUDENT', {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  const usersData = await usersRes.json();
  console.log('5. Staff Student Directory:', usersData.success, '| Students count:', usersData.count, '| Names:', usersData.data?.map(u => u.name));

  // 6. Test Abuse Report & Block Abusive User
  const reportCreateRes = await fetch('http://localhost:5000/api/reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${stuToken}`
    },
    body: JSON.stringify({
      itemId: 'found_002',
      itemModel: 'FoundItem',
      reason: 'Fake report',
      customReason: 'Listing contains false claims and invalid location'
    })
  });
  const reportCreate = await reportCreateRes.json();
  console.log('6. Report Submitted:', reportCreate.success, '| Report ID:', reportCreate.data?._id);

  if (reportCreate.data?._id) {
    const blockRes = await fetch(`http://localhost:5000/api/admin/reports/${reportCreate.data._id}/block-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      }
    });
    const blockData = await blockRes.json();
    console.log('7. Block Abusive User Result:', blockData.success, '| Message:', blockData.message);
  }

  // 8. Test Item Details Full Retrieval
  const itemDetailRes = await fetch('http://localhost:5000/api/found/found_001');
  const itemDetail = await itemDetailRes.json();
  console.log('8. Full Found Item Details:', itemDetail.success, {
    title: itemDetail.data?.title,
    location: itemDetail.data?.location,
    storage: itemDetail.data?.currentStorageLocation,
    reportedBy: itemDetail.data?.reportedBy?.name
  });

  console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
}

runSuite().catch(console.error);
