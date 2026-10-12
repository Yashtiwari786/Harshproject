const http = require('http');

async function main() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@college.edu', password: 'Password123!' })
  });
  const loginData = await loginRes.json();
  console.log('Staff Login success:', loginData.success, 'Role:', loginData.user ? loginData.user.role : null);

  const token = loginData.token;
  const usersRes = await fetch('http://localhost:5000/api/admin/users?role=STUDENT', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('GET /api/admin/users HTTP Status:', usersRes.status);
  const usersData = await usersRes.json();
  console.log('Users Response:', JSON.stringify(usersData, null, 2));

  const dashRes = await fetch('http://localhost:5000/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('GET /api/admin/dashboard HTTP Status:', dashRes.status);
  const dashData = await dashRes.json();
  console.log('Dashboard Data Summary:', {
    success: dashData.success,
    totalUsers: dashData.data?.totalUsers,
    totalStudents: dashData.data?.totalStudents,
    totalStaff: dashData.data?.totalStaff,
    recentStudents: dashData.data?.recentStudents?.length,
    recentStaff: dashData.data?.recentStaff?.length,
    recentReports: dashData.data?.recentReports?.length,
    pendingClaims: dashData.data?.pendingClaimsList?.length,
  });

  const foundRes = await fetch('http://localhost:5000/api/found/found_001');
  const foundData = await foundRes.json();
  console.log('Found Item found_001:', {
    success: foundData.success,
    title: foundData.data?.title,
    location: foundData.data?.location,
    currentStorageLocation: foundData.data?.currentStorageLocation,
  });
}

main().catch(console.error);
