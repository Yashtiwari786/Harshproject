const mongoose = require('mongoose');

const tests = [
  'mongodb+srv://dvvnlmdoffice_db_user:Harshvardhan786@cluster0.gy30quf.mongodb.net/?authSource=admin&tlsAllowInvalidCertificates=true',
  'mongodb+srv://dvvnlmdoffice_db_user:Harshvardhan786@cluster0.gy30quf.mongodb.net/admin?tlsAllowInvalidCertificates=true',
  'mongodb+srv://dvvnlmdoffice_db_user:Harshvardhan786@cluster0.gy30quf.mongodb.net/lost2found?authSource=admin&tlsAllowInvalidCertificates=true',
  'mongodb+srv://dvvnlmdoffice_db_user:%3CHarshvardhan786%3E@cluster0.gy30quf.mongodb.net/?authSource=admin&tlsAllowInvalidCertificates=true',
  'mongodb+srv://dvvnlmdoffice_db_user:harshvardhan786@cluster0.gy30quf.mongodb.net/?authSource=admin&tlsAllowInvalidCertificates=true',
  'mongodb+srv://dvvnlmdoffice_db_user:Harshvardhan@786@cluster0.gy30quf.mongodb.net/?authSource=admin&tlsAllowInvalidCertificates=true',
  'mongodb+srv://dvvnlmdoffice_db_user:Harshvardhan%40786@cluster0.gy30quf.mongodb.net/?authSource=admin&tlsAllowInvalidCertificates=true',
];

async function run() {
  for (const uri of tests) {
    console.log('\nTesting:', uri);
    try {
      await mongoose.disconnect();
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000, tlsAllowInvalidCertificates: true });
      console.log('🎉🎉🎉 CONNECTED! Host:', conn.connection.host);
      await mongoose.disconnect();
      return uri;
    } catch (e) {
      console.log('❌ Error:', e.message);
    }
  }
}

run();
