// Vercel Serverless Function entry point
// IMPORTANT: Load env vars FIRST before any other require
const path = require('path');
const dotenv = require('dotenv');

// Load .env from project root (works locally; on Vercel, env vars are injected natively)
dotenv.config({ path: path.join(__dirname, '../.env') });

let app;
let initError = null;

try {
  app = require('../backend/server');
} catch (err) {
  initError = err;
  console.error('[Vercel Boot Error]:', err.message, '\n', err.stack);
}

module.exports = async (req, res) => {
  if (initError) {
    return res.status(500).json({
      success: false,
      error: 'Backend Initialization Error',
      message: initError.message,
    });
  }
  return app(req, res);
};
