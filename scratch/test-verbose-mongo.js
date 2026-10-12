const mongoose = require('mongoose');

const testCases = [
  'mongodb+srv://dvvnlmdoffice_db_user:dvvnlmdoffice_db_user@cluster0.gy30quf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  'mongodb+srv://dvvnlmdoffice_db_user:dvvnlmdoffice_db_user@cluster0.gy30quf.mongodb.net/lost2found?retryWrites=true&w=majority&appName=Cluster0',
  'mongodb+srv://dvvnlmdoffice_db_user:dvvnlmdoffice_db_user@cluster0.gy30quf.mongodb.net/admin?retryWrites=true&w=majority&appName=Cluster0',
  'mongodb+srv://dvvnlmdoffice_db_user:dvvnlmdoffice_db_user@cluster0.gy30quf.mongodb.net/?authSource=admin&appName=Cluster0',
];

async function run() {
  for (const uri of testCases) {
    console.log('\n--- Testing URI ---');
    console.log(uri);
    try {
      await mongoose.disconnect();
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        tls: true,
        tlsAllowInvalidCertificates: true,
      });
      console.log('✅ CONNECTED SUCCESSFULLY TO:', conn.connection.name);
      await mongoose.disconnect();
      return;
    } catch (err) {
      console.log('❌ Error Name:', err.name);
      console.log('❌ Error Message:', err.message);
      if (err.cause) console.log('❌ Error Cause:', err.cause);
    }
  }
}

run();
