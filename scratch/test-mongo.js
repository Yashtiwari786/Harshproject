const mongoose = require('mongoose');

const uris = [
  { name: 'Exact from prompt with angle brackets URL-encoded', uri: 'mongodb+srv://dvvnlmdoffice_db_user:%3Cdvvnlmdoffice_db_user%3E@cluster0.gy30quf.mongodb.net/?appName=Cluster0' },
  { name: 'Exact from prompt literal angle brackets', uri: 'mongodb+srv://dvvnlmdoffice_db_user:<dvvnlmdoffice_db_user>@cluster0.gy30quf.mongodb.net/?appName=Cluster0' },
  { name: 'Without angle brackets', uri: 'mongodb+srv://dvvnlmdoffice_db_user:dvvnlmdoffice_db_user@cluster0.gy30quf.mongodb.net/?appName=Cluster0' },
  { name: 'With DB name lost2found', uri: 'mongodb+srv://dvvnlmdoffice_db_user:dvvnlmdoffice_db_user@cluster0.gy30quf.mongodb.net/lost2found?retryWrites=true&w=majority&appName=Cluster0' },
  { name: 'URL-encoded DB name lost2found', uri: 'mongodb+srv://dvvnlmdoffice_db_user:%3Cdvvnlmdoffice_db_user%3E@cluster0.gy30quf.mongodb.net/lost2found?retryWrites=true&w=majority&appName=Cluster0' },
];

async function testAll() {
  for (const item of uris) {
    console.log(`\nTesting: ${item.name}`);
    console.log(`URI: ${item.uri}`);
    try {
      await mongoose.disconnect();
      const conn = await mongoose.connect(item.uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`✅ SUCCESS! Connected to: ${conn.connection.host}`);
      await mongoose.disconnect();
      return item.uri;
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
  }
}

testAll().then(working => {
  if (working) console.log(`\n🎉 WORKING URI FOUND: ${working}`);
  else console.log('\n❌ None of the tested URIs worked.');
  process.exit(0);
});
