const mongoose = require('mongoose');

// Enable buffer commands so queries during connection setup queue safely
mongoose.set('bufferCommands', true);

let connectionPromise = null;

const connectDB = async () => {
  // Already connected — return immediately (critical for serverless reuse)
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  // If a connection attempt is already in progress, wait for it
  if (connectionPromise) {
    try {
      await connectionPromise;
      return mongoose.connection.readyState === 1;
    } catch (e) {
      connectionPromise = null;
    }
  }

  // MONGO_URI must be set via environment variables only — never hardcode credentials in source code
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error(
      'MONGO_URI environment variable is not set. ' +
      'Add it to your .env file locally, or to Vercel Environment Variables in the dashboard.'
    );
  }

  console.log(`[Database] Connecting to MongoDB Atlas...`);

  connectionPromise = mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 5,
    minPoolSize: 0,
  });

  try {
    const conn = await connectionPromise;
    console.log(`[Database] ✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    connectionPromise = null;
    console.error(`[Database] ❌ MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
