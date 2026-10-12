const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Category = require('../backend/models/Category');
const Location = require('../backend/models/Location');

async function check() {
  await mongoose.connect(process.env.MONGO_URI, {
    tlsAllowInvalidCertificates: true,
  });

  const cats = await Category.find();
  console.log('Categories count:', cats.length);
  cats.forEach(c => {
    console.log(`- ${c.name} | isActive: ${c.isActive}`);
  });

  const locs = await Location.find();
  console.log('\nLocations count:', locs.length);
  locs.forEach(l => {
    console.log(`- ${l.name} | isActive: ${l.isActive}`);
  });

  await mongoose.disconnect();
}

check();
