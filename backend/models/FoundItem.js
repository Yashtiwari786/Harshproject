const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, default: '' },
});

const foundItemSchema = new mongoose.Schema(
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
      required: [true, 'Public description is required'],
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
      required: [true, 'Found location is required'],
      trim: true,
    },
    dateFound: {
      type: Date,
      required: [true, 'Date found is required'],
    },
    timeFound: {
      type: String,
      default: '',
    },
    condition: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Damaged', 'Slightly Used'],
      default: 'Good',
    },
    currentStorageLocation: {
      type: String,
      required: [true, 'Storage location (e.g. Security Office) is required'],
      default: 'Campus Security Office',
    },
    uniqueDetails: {
      type: String,
      default: '',
      trim: true,
      // Private hidden details (e.g., cash amount inside, sticker specs) for claim verification
    },
    images: [imageSchema],
    status: {
      type: String,
      enum: ['FOUND', 'MATCHED', 'CLAIMED', 'UNDER_VERIFICATION', 'APPROVED', 'RETURNED', 'HANDED_OVER', 'CLOSED', 'REJECTED'],
      default: 'FOUND',
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

foundItemSchema.index({ title: 'text', description: 'text', brand: 'text', color: 'text', location: 'text' });

const createHybridModel = require('../config/hybridModel');
module.exports = createHybridModel('FoundItem', foundItemSchema);
