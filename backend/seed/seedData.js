const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const Claim = require('../models/Claim');
const Category = require('../models/Category');
const Location = require('../models/Location');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const defaultCategories = [
  { name: 'Electronics', icon: 'fa-laptop', description: 'Laptops, tablets, readers, powerbanks' },
  { name: 'Mobile Phones', icon: 'fa-mobile-screen', description: 'Smartphones, feature phones, cases' },
  { name: 'Wallets & Purses', icon: 'fa-wallet', description: 'Leather wallets, cardholders, purses' },
  { name: 'ID Cards & Badges', icon: 'fa-id-card', description: 'College IDs, library cards, hall tickets' },
  { name: 'Keys', icon: 'fa-key', description: 'Room keys, vehicle keys, keychains' },
  { name: 'Bags & Backpacks', icon: 'fa-bag-shopping', description: 'Backpacks, handbag, laptop bags' },
  { name: 'Books & Notes', icon: 'fa-book', description: 'Textbooks, lab manuals, notebooks' },
  { name: 'Earphones & Audio', icon: 'fa-headphones', description: 'Earbuds, headphones, Bluetooth speakers' },
  { name: 'Watches', icon: 'fa-clock', description: 'Smartwatches, analog watches' },
  { name: 'Chargers & Cables', icon: 'fa-plug', description: 'Phone chargers, adapter bricks, cables' },
  { name: 'Stationery', icon: 'fa-pen', description: 'Calculators, pen sets, geometry boxes' },
  { name: 'Clothing & Jackets', icon: 'fa-shirt', description: 'Jackets, sweaters, lab coats, caps' },
  { name: 'Jewellery & Accessories', icon: 'fa-gem', description: 'Rings, chains, glasses, sunglasses' },
  { name: 'Documents & Certificates', icon: 'fa-file-lines', description: 'Folders, marksheet copies, receipts' },
  { name: 'Other', icon: 'fa-box-archive', description: 'Miscellaneous campus personal belongings' },
];

const defaultLocations = [
  { name: 'Library - Ground Floor', building: 'Academic Block' },
  { name: 'Central Canteen', building: 'Student Center' },
  { name: 'Computer Lab 3', building: 'BCA / IT Building' },
  { name: 'Seminar Hall B', building: 'Satabdi Bhavan' },
  { name: 'Main Sports Ground', building: 'Outdoor Complex' },
  { name: 'Security Main Gate', building: 'Entrance' },
  { name: 'Security Office', building: 'Administrative Block' },
  { name: 'BBA Department Floor 2', building: 'Management Wing' },
  { name: 'Auditorium', building: 'Satabdi Bhavan' },
  { name: 'Boys Hostel Mess', building: 'Hostel Block A' },
  { name: 'Girls Hostel Lounge', building: 'Hostel Block B' },
  { name: 'Parking Gate 2', building: 'Campus Perimeter' },
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lost2found';
    await mongoose.connect(mongoUri, {
      tlsAllowInvalidCertificates: true,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
    console.log('[Seed] Connected to MongoDB Atlas...');

    // Clear existing collections
    await User.deleteMany({});
    await LostItem.deleteMany({});
    await FoundItem.deleteMany({});
    await Claim.deleteMany({});
    await Category.deleteMany({});
    await Location.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('[Seed] Cleared existing records.');

    // Seed Categories & Locations
    const categories = await Category.insertMany(defaultCategories);
    const locations = await Location.insertMany(defaultLocations);

    // Create Password Hash
    const salt = await bcrypt.genSalt(10);
    const commonPasswordHash = await bcrypt.hash('Password123!', salt);

    // Seed Users (Admin, Staff, Student)
    const admin = await User.create({
      name: 'Dr. Rajesh Sharma',
      email: 'admin@college.edu',
      collegeId: 'ADM-001',
      phone: '9876543210',
      department: 'Campus Security & Administration',
      year: 'Faculty / Staff',
      passwordHash: commonPasswordHash,
      role: 'ADMIN',
      isEmailVerified: true,
      accountStatus: 'ACTIVE',
    });

    const staff = await User.create({
      name: 'Suresh Kumar',
      email: 'staff@college.edu',
      collegeId: 'STF-104',
      phone: '9876543211',
      department: 'Central Security Office',
      year: 'Faculty / Staff',
      passwordHash: commonPasswordHash,
      role: 'STAFF',
      isEmailVerified: true,
      accountStatus: 'ACTIVE',
    });

    const student1 = await User.create({
      name: 'Aarav Gupta',
      email: 'student@college.edu',
      collegeId: '2024-BCA-042',
      phone: '9876543212',
      department: 'Computer Applications (BCA)',
      year: '2nd Year',
      passwordHash: commonPasswordHash,
      role: 'STUDENT',
      isEmailVerified: true,
      accountStatus: 'ACTIVE',
    });

    const student2 = await User.create({
      name: 'Priya Verma',
      email: 'priya@college.edu',
      collegeId: '2023-BBA-019',
      phone: '9876543213',
      department: 'Business Administration (BBA)',
      year: '3rd Year',
      passwordHash: commonPasswordHash,
      role: 'STUDENT',
      isEmailVerified: true,
      accountStatus: 'ACTIVE',
    });

    console.log('[Seed] Users created: Admin, Staff, Student');

    // Seed Lost Items
    const lostLaptop = await LostItem.create({
      reportedBy: student1._id,
      title: 'Black HP Pavilion Laptop',
      category: 'Electronics',
      description: 'Black HP Pavilion 15 inch laptop with a silver logo. Has a blue sticker near touchpad.',
      color: 'Black',
      brand: 'HP',
      location: 'Computer Lab 3',
      dateLost: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      timeLost: '02:30 PM',
      uniqueDetails: 'Intel i7 sticker on left palm rest. Serial No Ends with 9482.',
      images: [{ url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80', publicId: 'demo_laptop' }],
      status: 'LOST',
    });

    const lostWallet = await LostItem.create({
      reportedBy: student2._id,
      title: 'Brown Leather WildHorn Wallet',
      category: 'Wallets & Purses',
      description: 'Brown leather bifold wallet lost around canteen area during lunch.',
      color: 'Brown',
      brand: 'WildHorn',
      location: 'Central Canteen',
      dateLost: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      timeLost: '01:15 PM',
      uniqueDetails: 'Contains college ID for Priya Verma, ₹850 in cash, and a metro card.',
      images: [{ url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80', publicId: 'demo_wallet' }],
      status: 'LOST',
    });

    // Seed Found Items
    const foundWallet = await FoundItem.create({
      reportedBy: staff._id,
      title: 'Brown Leather Bifold Wallet',
      category: 'Wallets & Purses',
      description: 'Brown leather wallet deposited at security office. Found near canteen tables.',
      color: 'Brown',
      brand: 'WildHorn',
      location: 'Central Canteen',
      dateFound: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      timeFound: '01:45 PM',
      condition: 'Good',
      currentStorageLocation: 'Security Office Locker B2',
      uniqueDetails: 'Contains student ID card, cash, and metro card.',
      images: [{ url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80', publicId: 'demo_wallet_found' }],
      status: 'FOUND',
    });

    const foundKeys = await FoundItem.create({
      reportedBy: staff._id,
      title: 'Honda Bike Key with Superhero Keychain',
      category: 'Keys',
      description: 'Single ignition key with a metal Batman keychain.',
      color: 'Silver',
      brand: 'Honda',
      location: 'Parking Gate 2',
      dateFound: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      timeFound: '05:10 PM',
      condition: 'Good',
      currentStorageLocation: 'Security Office Desk Box',
      uniqueDetails: 'Small scratch on key grip base.',
      images: [{ url: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&q=80', publicId: 'demo_keys' }],
      status: 'FOUND',
    });

    // Seed Claim
    const claim = await Claim.create({
      itemId: foundWallet._id,
      itemModel: 'FoundItem',
      claimantId: student2._id,
      reason: 'This is my wallet lost yesterday at canteen.',
      ownershipDetails: 'It contains my College ID card (Priya Verma), ₹850 cash, and a blue Metro Card.',
      status: 'UNDER_REVIEW',
    });

    // Seed Audit Log
    await AuditLog.create({
      userId: admin._id,
      action: 'SYSTEM_SEED',
      targetType: 'System',
      targetId: '0',
      description: 'System seed initialized with demo accounts and campus data.',
      ipAddress: '127.0.0.1',
    });

    console.log('\n======================================================');
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('------------------------------------------------------');
    console.log('DEMO ACCOUNTS (Password for all: Password123!):');
    console.log('  1. ADMIN:   admin@college.edu');
    console.log('  2. STAFF:   staff@college.edu');
    console.log('  3. STUDENT: student@college.edu');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDB();
