// Vercel Serverless Function entry point
// Explicitly load environment variables before requiring backend
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

let app;
let initError = null;

try {
  app = require('../backend/server');
} catch (err) {
  initError = err;
  console.error('[Vercel Boot Error]:', err.message, err.stack);
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
