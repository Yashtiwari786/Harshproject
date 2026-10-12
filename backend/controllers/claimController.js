const Claim = require('../models/Claim');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { uploadImages } = require('../services/cloudinaryService');
const { generateHandoverCode } = require('../utils/generateCode');
const { sendHandoverEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

// @desc Submit a Claim for an Item
// @route POST /api/claims
const createClaim = async (req, res, next) => {
  try {
    const { itemId, itemModel, reason, ownershipDetails } = req.body;

    let targetItem;
    if (itemModel === 'LostItem') {
      targetItem = await LostItem.findById(itemId);
    } else {
      targetItem = await FoundItem.findById(itemId);
    }

    if (!targetItem) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (targetItem.isSuspendedFromPortal) {
      return res.status(400).json({
        success: false,
        message: 'This item is not available for claim because the listing author is suspended.',
      });
    }

    // Prevent claims if item is already handed over or returned
    if (['HANDED_OVER', 'RETURNED', 'CLOSED'].includes(targetItem.status)) {
      return res.status(400).json({
        success: false,
        message: 'This item has already been handed over to its verified owner. No further claims are accepted.',
      });
    }

    // Prevent claimant claiming their own reported item
    const reportedById = targetItem.reportedBy ? (targetItem.reportedBy._id || targetItem.reportedBy).toString() : '';
    if (reportedById && reportedById === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot submit a claim for an item you reported.' });
    }

    // Prevent duplicate active claims by same user for same item
    const existingClaim = await Claim.findOne({
      itemId,
      claimantId: req.user._id,
      status: { $in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'] },
    });

    if (existingClaim) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active pending or approved claim for this item.',
      });
    }

    let proofImages = [];
    if (req.files && req.files.length > 0) {
      proofImages = await uploadImages(req.files, 'lost2found/claims');
    }

    const claim = await Claim.create({
      itemId,
      itemModel: itemModel || (targetItem.currentStorageLocation !== undefined ? 'FoundItem' : 'LostItem'),
      claimantId: req.user._id,
      reason,
      ownershipDetails,
      proofImages,
      status: 'PENDING',
    });

    // Update item status to UNDER_VERIFICATION if it is in an initial active state
    if (['LOST', 'FOUND', 'MATCHED'].includes(targetItem.status)) {
      targetItem.status = 'UNDER_VERIFICATION';
      await targetItem.save();
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'SUBMIT_CLAIM',
      targetType: 'Claim',
      targetId: claim._id.toString(),
      description: `User ${req.user.name} submitted ownership claim for ${itemModel || 'Item'} "${targetItem.title}"`,
      ipAddress: req.ip,
    });

    await createNotification({
      userId: req.user._id,
      title: 'Item Claim Submitted',
      message: `Your ownership claim for "${targetItem.title}" has been received and is pending staff verification.`,
      type: 'CLAIM_SUBMITTED',
      link: `/dashboard.html#claims`,
    });

    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully! Campus staff will review your ownership details.',
      data: claim,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Claims for Current User
// @route GET /api/claims/my
const getMyClaims = async (req, res, next) => {
  try {
    const claims = await Claim.find({ claimantId: req.user._id })
      .populate({ path: 'itemId', select: 'title category location images status' })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: claims.length,
      data: claims,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Single Claim Details
// @route GET /api/claims/:id
const getClaimById = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('claimantId', 'name email phone collegeId department year profileImage')
      .populate('reviewedBy', 'name role')
      .populate('itemId');

    if (!claim) return res.status(404).json({ success: false, message: 'Claim record not found' });

    const isClaimant = claim.claimantId._id.toString() === req.user._id.toString();
    const isStaffOrAdmin = req.user.role === 'STAFF' || req.user.role === 'ADMIN';

    if (!isClaimant && !isStaffOrAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this claim details' });
    }

    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    next(error);
  }
};

// @desc Staff/Admin Review Claim (Approve / Reject)
// @route PUT /api/claims/:id/review
const reviewClaim = async (req, res, next) => {
  try {
    const { action, reviewNotes } = req.body; // action = 'APPROVED' or 'REJECTED'
    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid review action. Must be APPROVED or REJECTED.' });
    }

    const claim = await Claim.findById(req.params.id).populate('claimantId').populate('itemId');
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });

    let item;
    if (claim.itemModel === 'LostItem') {
      item = await LostItem.findById(claim.itemId._id || claim.itemId);
    } else {
      item = await FoundItem.findById(claim.itemId._id || claim.itemId);
    }

    claim.status = action;
    claim.reviewedBy = req.user._id;
    claim.reviewNotes = reviewNotes || '';

    if (action === 'APPROVED') {
      const handoverCode = generateHandoverCode();
      claim.handoverCode = handoverCode;
      if (item) item.status = 'APPROVED';

      // Send email notification with code
      await sendHandoverEmail(
        claim.claimantId.email,
        claim.claimantId.name,
        item ? item.title : 'Claimed Item',
        handoverCode,
        item ? item.currentStorageLocation || item.location : 'Campus Security Office'
      );

      await createNotification({
        userId: claim.claimantId._id,
        title: '🎉 Claim Approved — Handover Ready',
        message: `Your claim for "${item ? item.title : 'Item'}" was approved! Your handover verification code is ${handoverCode}.`,
        type: 'CLAIM_APPROVED',
        link: `/dashboard.html#claims`,
      });
    } else {
      // Revert or maintain appropriate item status when one claim is rejected
      if (item) {
        const remainingClaims = await Claim.countDocuments({
          itemId: claim.itemId._id || claim.itemId,
          _id: { $ne: claim._id },
          status: { $in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'] },
        });
        if (remainingClaims > 0) {
          item.status = 'UNDER_VERIFICATION';
        } else {
          item.status = claim.itemModel === 'LostItem' ? 'LOST' : 'FOUND';
        }
      }

      await createNotification({
        userId: claim.claimantId._id,
        title: 'Claim Review Update',
        message: `Your claim for "${item ? item.title : 'Item'}" was rejected. Notes: ${reviewNotes || 'Verification unconfirmed.'}`,
        type: 'CLAIM_REJECTED',
        link: `/dashboard.html#claims`,
      });
    }

    await claim.save();
    if (item) await item.save();

    await AuditLog.create({
      userId: req.user._id,
      action: `CLAIM_${action}`,
      targetType: 'Claim',
      targetId: claim._id.toString(),
      description: `Staff ${req.user.name} ${action.toLowerCase()} claim #${claim._id}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Claim successfully ${action.toLowerCase()}`,
      data: claim,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Verify Handover Code & Complete Return (Staff/Admin)
// @route POST /api/claims/:id/handover
const completeHandover = async (req, res, next) => {
  try {
    const { handoverCode } = req.body;
    const claim = await Claim.findById(req.params.id).populate('claimantId').populate('itemId');

    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });
    if (claim.status !== 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Claim is not in APPROVED status.' });
    }

    if (claim.handoverCode.trim().toUpperCase() !== handoverCode.trim().toUpperCase()) {
      return res.status(400).json({ success: false, message: 'Incorrect Handover Verification Code. Handover denied.' });
    }

    // Mark Claim COMPLETED
    claim.status = 'COMPLETED';
    claim.handoverDate = new Date();
    claim.handoverVerifiedBy = req.user._id;
    await claim.save();

    const targetItemId = (claim.itemId && (claim.itemId._id || claim.itemId)) || claim.itemId;
    let item;
    if (claim.itemModel === 'LostItem') {
      item = await LostItem.findById(targetItemId);
    } else {
      item = await FoundItem.findById(targetItemId);
    }

    if (item) {
      item.status = 'HANDED_OVER';
      item.handedOverTo = claim.claimantId._id || claim.claimantId;
      item.handedOverAt = new Date();
      await item.save();
    }

    // Automatically close and reject any other pending claims for this item
    const otherClaims = await Claim.find({
      itemId: targetItemId,
      _id: { $ne: claim._id },
      status: { $in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'] },
    }).populate('claimantId');

    for (const otherClaim of otherClaims) {
      otherClaim.status = 'REJECTED';
      otherClaim.reviewNotes = `Item was verified and handed over to ${claim.claimantId ? (claim.claimantId.name || 'verified owner') : 'verified owner'}. Case closed.`;
      otherClaim.reviewedBy = req.user._id;
      await otherClaim.save();

      const otherUserId = otherClaim.claimantId ? (otherClaim.claimantId._id || otherClaim.claimantId) : null;
      if (otherUserId) {
        await createNotification({
          userId: otherUserId,
          title: 'Claim Closed — Item Handed Over',
          message: `The item "${item ? item.title : 'Item'}" has been verified and handed over to its owner. Your claim has been closed.`,
          type: 'CLAIM_REJECTED',
          link: `/dashboard.html#claims`,
        });
      }
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'ITEM_HANDED_OVER',
      targetType: 'Claim',
      targetId: claim._id.toString(),
      description: `Item "${item ? item.title : 'Item'}" successfully handed over to ${claim.claimantId.name}. Code verified by ${req.user.name}. Item status permanently locked to HANDED_OVER.`,
      ipAddress: req.ip,
    });

    await createNotification({
      userId: claim.claimantId._id,
      title: 'Item Recovered & Returned 🎉',
      message: `Item handover complete! Thank you for using Lost2Found.`,
      type: 'ITEM_RETURNED',
    });

    res.status(200).json({
      success: true,
      message: 'Item handover completed successfully! Item status updated to HANDED_OVER on portal and other pending claims closed.',
      data: claim,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Cancel Claim
// @route POST /api/claims/:id/cancel
const cancelClaim = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });

    if (claim.claimantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this claim' });
    }

    if (['COMPLETED', 'CANCELLED'].includes(claim.status)) {
      return res.status(400).json({ success: false, message: 'Claim cannot be cancelled in its current status' });
    }

    claim.status = 'CANCELLED';
    await claim.save();

    res.status(200).json({ success: true, message: 'Claim cancelled successfully', data: claim });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClaim,
  getMyClaims,
  getClaimById,
  reviewClaim,
  completeHandover,
  cancelClaim,
};
