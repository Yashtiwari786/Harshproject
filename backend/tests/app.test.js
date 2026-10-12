const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { calculateMatchingScore } = require('../services/matchingService');
const { generateOTP, generateHandoverCode, hashString } = require('../utils/generateCode');

test('1. OTP & Handover Code Generation Test', () => {
  const otp = generateOTP();
  assert.equal(otp.length, 6, 'OTP must be 6 digits');
  assert.match(otp, /^\d{6}$/, 'OTP must contain only numbers');

  const code = generateHandoverCode();
  assert.match(code, /^L2F-\d{4}$/, 'Handover code must follow L2F-XXXX format');

  const hashedStr = hashString('123456');
  assert.equal(hashedStr.length, 64, 'SHA-256 hash must be 64 characters long');
});

test('2. Password Hashing & Verification Test', async () => {
  const rawPassword = 'Password123!';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(rawPassword, salt);

  const isMatch = await bcrypt.compare(rawPassword, hash);
  assert.equal(isMatch, true, 'Password bcrypt match should succeed');

  const isInvalid = await bcrypt.compare('WrongPassword', hash);
  assert.equal(isInvalid, false, 'Password mismatch should fail');
});

test('3. JWT Token Generation & Verification Test', () => {
  const secret = 'test_secret_key_123';
  const userId = '6615b3c4a25e119420000001';
  const token = jwt.sign({ id: userId }, secret, { expiresIn: '1h' });

  const decoded = jwt.verify(token, secret);
  assert.equal(decoded.id, userId, 'Decoded JWT payload ID must match target user ID');
});

test('4. Smart Matching Engine Weighted Scoring Test', () => {
  const lostItem = {
    title: 'Black HP Pavilion Laptop',
    category: 'Electronics',
    description: 'Black HP Pavilion 15 inch laptop with sticker',
    color: 'Black',
    brand: 'HP',
    location: 'Computer Lab 3',
    dateLost: new Date('2026-10-08'),
  };

  const foundItem = {
    title: 'Black HP Laptop',
    category: 'Electronics',
    description: 'Found black HP laptop in computer lab',
    color: 'Black',
    brand: 'HP',
    location: 'Computer Lab 3',
    dateFound: new Date('2026-10-08'),
  };

  const { matchScore, matchingFactors } = calculateMatchingScore(lostItem, foundItem);

  assert.ok(matchScore >= 80, `Match score should be high (>=80%), calculated: ${matchScore}%`);
  assert.ok(matchingFactors.length >= 4, 'Must identify at least 4 matching factors');
});

test('5. Non-Matching Items Scoring Test', () => {
  const lostItem = {
    title: 'Gold Ring',
    category: 'Jewellery & Accessories',
    description: 'Gold wedding ring',
    color: 'Gold',
    location: 'Sports Ground',
    dateLost: new Date('2026-05-01'),
  };

  const foundItem = {
    title: 'Blue Water Bottle',
    category: 'Other',
    description: 'Milton water bottle',
    color: 'Blue',
    location: 'Canteen',
    dateFound: new Date('2026-10-08'),
  };

  const { matchScore } = calculateMatchingScore(lostItem, foundItem);
  assert.ok(matchScore < 30, `Match score for unrelated items must be low (<30%), calculated: ${matchScore}%`);
});
