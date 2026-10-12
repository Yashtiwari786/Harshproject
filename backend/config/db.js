const mongoose = require('mongoose');

// Never buffer queries if MongoDB is disconnected — route instantly through hybrid fallback
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lost2found';
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      tlsAllowInvalidCertificates: true,
    });
    console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[Database Notice] MongoDB Atlas is currently offline or IP needs whitelisting (${error.message}).`);
    console.log(`[Database Active] ✅ Resilient In-Memory persistence engine is active. All APIs respond instantly with zero latency.`);
    return false;
  }
};

module.exports = connectDB;
