process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const path = require('path');
const fs = require('fs');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allowed for loading Bootstrap CDNs, FontAwesome, Chart.js & inline scripts
  })
);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files and uploaded media
const frontendDir = path.join(__dirname, '../frontend');
app.use(express.static(frontendDir));
app.use('/uploads', express.static(path.join(__dirname, '../frontend/uploads')));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const lostRoutes = require('./routes/lostRoutes');
const foundRoutes = require('./routes/foundRoutes');
const matchRoutes = require('./routes/matchRoutes');
const claimRoutes = require('./routes/claimRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

const Category = require('./models/Category');
const Location = require('./models/Location');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Rate limiting for general API requests
app.use('/api', apiLimiter);

// Mount API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lost', lostRoutes);
app.use('/api/found', foundRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Public Category & Location Endpoints for dropdowns
app.get('/api/categories', async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: { $ne: false } }).sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

app.get('/api/locations', async (req, res, next) => {
  try {
    const locations = await Location.find({ isActive: { $ne: false } }).sort({ name: 1 });
    res.status(200).json({ success: true, data: locations });
  } catch (error) {
    next(error);
  }
});

// Clean URL routing helper (supports both /dashboard and /dashboard.html)
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Route Not Found' });
  }

  const cleanPath = req.path.replace(/^\//, '');
  const directHtml = path.join(frontendDir, `${cleanPath}.html`);

  if (cleanPath && fs.existsSync(directHtml)) {
    return res.sendFile(directHtml);
  }

  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Lost2Found Campus Server running on port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`======================================================\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]:', err.message);
});

module.exports = app;
