const mongoose = require('mongoose');

const uri = 'mongodb+srv://dvvnlmdoffice_db_user:tIOBLubR83JVDj02@cluster0.gy30quf.mongodb.net/lost2found?retryWrites=true&w=majority&appName=Cluster0';

async function test() {
  console.log('Testing MongoDB Atlas connection with new password tIOBLubR83JVDj02...');
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      tlsAllowInvalidCertificates: true,
    });
    console.log('🎉🎉🎉 SUCCESS! Connected to MongoDB Atlas!');
    console.log('Cluster Host:', conn.connection.host);
    console.log('Database Name:', conn.connection.name);
    console.log('Connection readyState:', conn.connection.readyState);
    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
    return false;
  }
}

test();
