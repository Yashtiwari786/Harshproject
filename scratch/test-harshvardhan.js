const mongoose = require('mongoose');

const uris = [
  'mongodb+srv://dvvnlmdoffice_db_user:Harshvardhan786@cluster0.gy30quf.mongodb.net/lost2found?retryWrites=true&w=majority&appName=Cluster0',
  'mongodb+srv://dvvnlmdoffice_db_user:Harshvardhan786@cluster0.gy30quf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  'mongodb+srv://dvvnlmdoffice_db_user:%3CHarshvardhan786%3E@cluster0.gy30quf.mongodb.net/lost2found?retryWrites=true&w=majority&appName=Cluster0',
];

async function test() {
  for (const uri of uris) {
    console.log('\nTesting URI:', uri);
    try {
      await mongoose.disconnect();
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('🎉 SUCCESS! Connected to MongoDB Atlas:', conn.connection.host);
      console.log('Database name:', conn.connection.name);
      await mongoose.disconnect();
      return uri;
    } catch (e) {
      console.log('❌ Failed:', e.message);
    }
  }
}

test().then((res) => {
  if (res) console.log('\nWorking URI found:', res);
  else console.log('\nNo working URI found.');
  process.exit(0);
});
