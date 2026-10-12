const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  const uri = process.env.MONGO_URI;
  console.log('Connecting to:', uri);
  try {
    await mongoose.connect(uri, {
      tlsAllowInvalidCertificates: true,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected! Host:', mongoose.connection.host);

    const testSchema = new mongoose.Schema({ name: String, createdAt: { type: Date, default: Date.now } });
    const TestModel = mongoose.model('TestDoc', testSchema);

    const doc = await TestModel.create({ name: 'Hello Atlas' });
    console.log('✅ Document inserted to Atlas:', doc._id, doc.name);

    const found = await TestModel.findById(doc._id);
    console.log('✅ Document read back from Atlas:', found.name);

    await TestModel.deleteMany({});
    console.log('✅ Document cleaned up from Atlas.');

    await mongoose.disconnect();
    console.log('✅ Complete test passed!');
  } catch (err) {
    console.error('❌ Error during test:', err);
  }
}

run();
