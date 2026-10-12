process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const dotenv = require('dotenv');
dotenv.config();

const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;

async function testServices() {
  console.log('=== TESTING CLOUDINARY & GMAIL SERVICES ===\n');

  // 1. Cloudinary Test
  console.log('1. Checking Cloudinary Credentials:');
  console.log('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('   API Key:', process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing');
  console.log('   API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    const pingRes = await cloudinary.api.ping();
    console.log('   ✅ Cloudinary Ping Status:', pingRes.status);
  } catch (err) {
    console.warn('   ⚠️ Cloudinary Ping Note:', err.message);
  }

  // 2. Nodemailer Transporter Verify
  console.log('\n2. Checking Gmail Nodemailer Connection:');
  console.log('   Sender Email:', process.env.GMAIL_USER);
  console.log('   App Password:', process.env.GMAIL_APP_PASSWORD ? '16-character key set' : 'Missing');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ''),
    },
  });

  try {
    await transporter.verify();
    console.log('   ✅ Gmail Transporter Verified: Authenticated & Ready to deliver OTP emails!');
  } catch (err) {
    console.error('   ❌ Gmail Verification Error:', err.message);
  }

  // 3. Test Registration API with a Gmail address (e.g. any email)
  console.log('\n3. Testing Registration with a Gmail Address (Any Email):');
  const testEmail = `test_${Date.now()}@gmail.com`;
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohan Sharma',
      email: testEmail,
      collegeId: 'STU-9921',
      phone: '9876501234',
      department: 'Computer Applications (BCA)',
      password: 'Password123!',
    }),
  });

  const regData = await regRes.json();
  console.log('   Registration Result for', testEmail, ':', regData.success, '| Message:', regData.message);

  console.log('\n=== FINISHED SERVICE CHECKS ===');
}

testServices().catch(console.error);
