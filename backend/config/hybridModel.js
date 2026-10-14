const mongoose = require('mongoose');

/**
 * Simple model registration — always uses real Mongoose/MongoDB.
 * The in-memory fallback has been removed because it caused data loss:
 * each serverless invocation got its own memory space, so data written
 * in one request was invisible to the next request.
 */
function createHybridModel(modelName, schema) {
  try {
    return mongoose.model(modelName);
  } catch (e) {
    return mongoose.model(modelName, schema);
  }
}

module.exports = createHybridModel;
