const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');

// @desc Report a Listing as Abuse / Suspicious
// @route POST /api/reports
const createReport = async (req, res, next) => {
  try {
    const { itemId, itemModel, reason, customReason } = req.body;

    if (!itemId || !itemModel || !reason) {
      return res.status(400).json({ success: false, message: 'Item ID, Item Model, and Reason are required.' });
    }

    const report = await Report.create({
      reporterId: req.user._id,
      itemId,
      itemModel,
      reason,
      customReason: customReason || '',
      status: 'PENDING',
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'REPORT_ABUSE',
      targetType: 'Report',
      targetId: report._id.toString(),
      description: `Reported suspicious listing ${itemModel} #${itemId} for "${reason}"`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you. Your report has been submitted to campus moderators for review.',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReport };
