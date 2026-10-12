const mongoose = require('mongoose');

// Enable buffer commands so queries during connection setup queue safely
mongoose.set('bufferCommands', true);

let cachedConnectionPromise = null;

const DEFAULT_ATLAS_URI = 'mongodb+srv://dvvnlmdoffice_db_user:tIOBLubR83JVDj02@cluster0.gy30quf.mongodb.net/lost2found?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async (retries = 2) => {
  // If already connected, reuse existing connection immediately
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  // If a connection attempt is currently in progress, wait for it
  if (cachedConnectionPromise) {
    try {
      await cachedConnectionPromise;
      return mongoose.connection.readyState === 1;
    } catch (e) {
      cachedConnectionPromise = null;
    }
  }

  const mongoUri = process.env.MONGO_URI || DEFAULT_ATLAS_URI;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      cachedConnectionPromise = mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 15000,
        tlsAllowInvalidCertificates: true,
      });

      const conn = await cachedConnectionPromise;
      console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}`);
      return true;
    } catch (error) {
      cachedConnectionPromise = null;
      console.warn(`[Database Notice] Connection attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, 1000));
      } else {
        console.warn(`[Database Notice] MongoDB Atlas is currently unreachable (${error.message}). Resilient fallback active.`);
        return false;
      }
    }
  }

  return false;
};

module.exports = connectDB;
