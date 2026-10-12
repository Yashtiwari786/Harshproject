const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testQuery() {
  await mongoose.connect(process.env.MONGO_URI, {
    tlsAllowInvalidCertificates: true,
  });

  const LostItem = require('./backend/models/LostItem');
  const User = require('./backend/models/User');

  console.log('Testing LostItem.find().populate()...');
  try {
    const items = await LostItem.find()
      .populate('reportedBy', 'name department year profileImage accountStatus')
      .sort({ createdAt: -1 });

    console.log('Query success! Items found:', items.length);
    items.forEach(it => {
      console.log(`- [${it._id}] "${it.title}" reportedBy: ${it.reportedBy?.name} (${it.reportedBy?.email})`);
    });
  } catch (err) {
    console.error('Query error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testQuery();
