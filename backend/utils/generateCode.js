const crypto = require('crypto');

/**
 * Generate a 6-digit numeric OTP code
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a secure unique Handover Verification Code (e.g. L2F-8492)
 */
const generateHandoverCode = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `L2F-${randomNum}`;
};

/**
 * Hash strings (such as OTPs) using SHA-256
 */
const hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

module.exports = {
  generateOTP,
  generateHandoverCode,
  hashString,
};
