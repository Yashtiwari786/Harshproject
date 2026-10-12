const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    senderRole: {
      type: String,
      default: '',
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'STUDENTS', 'STAFF', 'INDIVIDUAL'],
      default: 'INDIVIDUAL',
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'URGENT'],
      default: 'NORMAL',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'REGISTER_SUCCESS',
        'EMAIL_VERIFIED',
        'REPORT_SUBMITTED',
        'REPORT_APPROVED',
        'REPORT_REJECTED',
        'POSSIBLE_MATCH',
        'CLAIM_SUBMITTED',
        'CLAIM_UNDER_REVIEW',
        'CLAIM_APPROVED',
        'CLAIM_REJECTED',
        'HANDOVER_READY',
        'ITEM_RETURNED',
        'CAMPUS_BROADCAST',
        'STAFF_ANNOUNCEMENT',
        'SECURITY_ALERT',
        'SYSTEM',
      ],
      default: 'SYSTEM',
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const createHybridModel = require('../config/hybridModel');
module.exports = createHybridModel('Notification', notificationSchema);
