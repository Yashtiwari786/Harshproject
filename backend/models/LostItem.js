const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, default: '' },
});

const lostItemSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Item title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      trim: true,
    },
    brand: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Campus location is required'],
      trim: true,
    },
    dateLost: {
      type: Date,
      required: [true, 'Date lost is required'],
    },
    timeLost: {
      type: String,
      default: '',
    },
    uniqueDetails: {
      type: String,
      default: '',
      trim: true,
      // Note: Kept private, only accessible to staff/owner during verification
    },
    images: [imageSchema],
    status: {
      type: String,
      enum: ['LOST', 'MATCHED', 'CLAIMED', 'UNDER_VERIFICATION', 'FOUND', 'RETURNED', 'HANDED_OVER', 'CLOSED', 'REJECTED'],
      default: 'LOST',
    },
    handedOverTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    handedOverAt: {
      type: Date,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isSuspendedFromPortal: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

lostItemSchema.index({ title: 'text', description: 'text', brand: 'text', color: 'text', location: 'text' });

const createHybridModel = require('../config/hybridModel');
module.exports = createHybridModel('LostItem', lostItemSchema);
