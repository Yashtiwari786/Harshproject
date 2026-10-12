const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testConnection() {
  const uri = process.env.MONGO_URI;
  console.log('Testing connection to:', uri.replace(/:([^:@]+)@/, ':****@'));
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      tlsAllowInvalidCertificates: true,
    });
    console.log('CONNECTED SUCCESSFULLY!', conn.connection.host);
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    for (const c of collections) {
      const count = await conn.connection.db.collection(c.name).countDocuments();
      console.log(` - ${c.name}: ${count} documents`);
    }
    const lostItems = await conn.connection.db.collection('lostitems').find().toArray();
    console.log('Lost items in Atlas:');
    console.log(JSON.stringify(lostItems, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error('CONNECTION FAILED:', err.message);
  }
}

testConnection();
