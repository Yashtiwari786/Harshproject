const mongoose = require('mongoose');
const { storage, createModelAdapter } = require('../services/storageEngine');

/**
 * Creates a Hybrid Model that:
 * 1. Uses native Mongoose when MongoDB is connected (readyState === 1).
 * 2. Uses the ultra-fast storageEngine with zero-latency when MongoDB is disconnected/offline.
 */
function createHybridModel(modelName, schema) {
  let mongooseModel;
  try {
    mongooseModel = mongoose.model(modelName);
  } catch (e) {
    mongooseModel = mongoose.model(modelName, schema);
  }

  const fallbackAdapter = createModelAdapter(modelName, storage);

  // Return a transparent proxy
  return new Proxy(mongooseModel, {
    get(target, prop, receiver) {
      const isConnected = (target.db && target.db.readyState === 1) || mongoose.connection.readyState === 1;

      if (!isConnected) {
        if (prop in fallbackAdapter) {
          return fallbackAdapter[prop].bind(fallbackAdapter);
        }
      }

      // If connected, or if method is not in fallback adapter, delegate to Mongoose
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return val.bind(target);
      }
      return val;
    },
  });
}

module.exports = createHybridModel;
