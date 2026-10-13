const mongoose = require('mongoose');

// Enable buffer commands so queries during connection setup queue safely
mongoose.set('bufferCommands', true);

let connectionPromise = null;

const DEFAULT_ATLAS_URI =
  'mongodb+srv://dvvnlmdoffice_db_user:tIOBLubR83JVDj02@cluster0.gy30quf.mongodb.net/lost2found?retryWrites=true&w=majority&appName=Cluster0';

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

  const mongoUri = process.env.MONGO_URI || DEFAULT_ATLAS_URI;

  console.log(`[Database] Connecting to MongoDB Atlas...`);

  connectionPromise = mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,  // 10 seconds — more generous for Vercel cold starts
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 5,                   // Limit pool for serverless
    minPoolSize: 0,
  });

  try {
    const conn = await connectionPromise;
    console.log(`[Database] ✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    connectionPromise = null;
    console.error(`[Database] ❌ MongoDB connection failed: ${error.message}`);
    throw error; // Propagate so middleware can return 503
  }
};

module.exports = connectDB;
