// Vercel Serverless Function entry point with detailed error diagnostics
let app;
let initError = null;

try {
  app = require('../backend/server');
} catch (err) {
  initError = err;
  console.error('[Vercel Boot Error]:', err);
}

module.exports = (req, res) => {
  if (initError) {
    return res.status(500).json({
      success: false,
      error: 'Backend Initialization Error',
      message: initError.message,
      stack: initError.stack,
    });
  }
  return app(req, res);
};
