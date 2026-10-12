const mongoose = require('mongoose');

const users = [
  'dvvnlmdoffice',
  'dvvnlm',
  'Harshvardhan786',
  'harshvardhan786',
  'harshvardhan',
  'dvvnlmdoffice_db',
  'yash543194',
  'admin',
  'user',
  'lost2found',
];

async function run() {
  for (const u of users) {
    const uri = `mongodb+srv://${u}:Harshvardhan786@cluster0.gy30quf.mongodb.net/?authSource=admin&tlsAllowInvalidCertificates=true`;
    try {
      await mongoose.disconnect();
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000, tlsAllowInvalidCertificates: true });
      console.log(`🎉🎉🎉 CONNECTED! Username is: "${u}"`);
      await mongoose.disconnect();
      return u;
    } catch (e) {
      // ignore
    }
  }
  console.log('None of the alternative usernames matched with password Harshvardhan786.');
}

run();
