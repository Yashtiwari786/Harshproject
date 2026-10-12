const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://dvvnlmdoffice_db_user:Harshvardhan786@cluster0.gy30quf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 8000,
  });

  try {
    console.log('Connecting with MongoClient...');
    await client.connect();
    console.log('✅ Connected successfully to Atlas!');
    const dbs = await client.db().admin().listDatabases();
    console.log('Databases:', dbs.databases.map(d => d.name));
    await client.close();
  } catch (err) {
    console.log('❌ Error Name:', err.name);
    console.log('❌ Error Message:', err.message);
    if (err.reason) {
      console.log('❌ Topology Description Servers:');
      for (const [address, server] of err.reason.servers.entries()) {
        console.log(`- ${address}: type=${server.type}, error=${server.error?.message || 'none'}`);
      }
    }
  }
}

run();
