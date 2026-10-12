const mongoose = require('mongoose');

const uri = 'mongodb+srv://dvvnlmdoffice_db_user:Harshvardhan786@cluster0.gy30quf.mongodb.net/lost2found?retryWrites=true&w=majority&appName=Cluster0&tlsAllowInvalidCertificates=true';

async function testTLS() {
  console.log('Testing with tlsAllowInvalidCertificates=true...');
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      tlsAllowInvalidCertificates: true,
    });
    console.log('🎉🎉🎉 SUCCESS! CONNECTED TO MONGODB ATLAS!');
    console.log('Host:', conn.connection.host);
    console.log('Database:', conn.connection.name);
    console.log('ReadyState:', conn.connection.readyState);
    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.log('❌ Error:', err.message);
    return false;
  }
}

testTLS();
