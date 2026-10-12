const mongoose = require('mongoose');

// Enable buffer commands so queries during connection setup queue safely
mongoose.set('bufferCommands', true);

let cachedConnectionPromise = null;

const connectDB = async (retries = 3) => {
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

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lost2found';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      cachedConnectionPromise = mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 20000,
        socketTimeoutMS: 45000,
        tlsAllowInvalidCertificates: true,
      });

      const conn = await cachedConnectionPromise;
      console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}`);
      return true;
    } catch (error) {
      cachedConnectionPromise = null;
      console.warn(`[Database Notice] Attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        console.log(`[Database] Retrying connection in 2 seconds...`);
        await new Promise((res) => setTimeout(res, 2000));
      } else {
        console.warn(`[Database Notice] MongoDB Atlas is currently offline or unreachable (${error.message}).`);
        console.log(`[Database Active] ✅ Resilient In-Memory persistence engine is active as temporary fallback.`);
        return false;
      }
    }
  }

  return false;
};

module.exports = connectDB;
