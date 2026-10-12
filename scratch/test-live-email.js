async function testLiveEmail() {
  console.log('Testing live email delivery to yash543194@gmail.com...');
  const res = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Yash Vardhan Tiwari',
      email: 'yash543194@gmail.com',
      collegeId: 'YVT-2026',
      phone: '9876543210',
      department: 'Computer Applications (BCA)',
      password: 'Password123!',
    }),
  });

  const data = await res.json();
  console.log('Registration Response:', JSON.stringify(data, null, 2));
}

testLiveEmail().catch(console.error);
