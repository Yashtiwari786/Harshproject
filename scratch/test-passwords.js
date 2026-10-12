const mongoose = require('mongoose');

const passwords = [
  'Password123!',
  'dvvnlmdoffice',
  'dvvnlmdoffice@123',
  'dvvnlmdoffice123',
  'dvvnlm@123',
  'dvvnlm123',
  'Cluster0',
  'yash543194',
  'yash@123',
  'admin',
  'admin123',
  'admin@123',
];

async function tryPasswords() {
  for (const pw of passwords) {
    const encodedPw = encodeURIComponent(pw);
    const uri = `mongodb+srv://dvvnlmdoffice_db_user:${encodedPw}@cluster0.gy30quf.mongodb.net/lost2found?retryWrites=true&w=majority&appName=Cluster0`;
    try {
      await mongoose.disconnect();
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      console.log(`🎉 SUCCESS! Password is: "${pw}"`);
      await mongoose.disconnect();
      return pw;
    } catch (e) {
      // ignore bad auth
    }
  }
  console.log('None of the common candidate passwords matched.');
}

tryPasswords();
