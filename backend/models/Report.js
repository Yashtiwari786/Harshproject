const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'itemModel',
    },
    itemModel: {
      type: String,
      required: true,
      enum: ['LostItem', 'FoundItem'],
    },
    reason: {
      type: String,
      enum: ['Fake report', 'Incorrect information', 'Suspicious claim', 'Spam', 'Inappropriate image', 'Other'],
      required: true,
    },
    customReason: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'INVESTIGATING', 'DISMISSED', 'ACTION_TAKEN'],
      default: 'PENDING',
    },
    actionNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const createHybridModel = require('../config/hybridModel');
module.exports = createHybridModel('Report', reportSchema);
