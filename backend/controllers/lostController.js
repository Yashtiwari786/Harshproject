const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const AuditLog = require('../models/AuditLog');
const { uploadImages } = require('../services/cloudinaryService');
const { calculateMatchingScore } = require('../services/matchingService');
const { createNotification } = require('../services/notificationService');

// @desc Report a Lost Item
// @route POST /api/lost
const createLostItem = async (req, res, next) => {
  try {
    const { title, category, description, color, brand, location, dateLost, timeLost, uniqueDetails } = req.body;

    let images = [];
    if (req.files && req.files.length > 0) {
      images = await uploadImages(req.files, 'lost2found/items');
    }

    const lostItem = await LostItem.create({
      reportedBy: req.user._id,
      title,
      category,
      description,
      color,
      brand: brand || '',
      location,
      dateLost: dateLost || new Date(),
      timeLost: timeLost || '',
      uniqueDetails: uniqueDetails || '',
      images,
      status: 'LOST',
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'CREATE_LOST_REPORT',
      targetType: 'LostItem',
      targetId: lostItem._id.toString(),
      description: `Reported lost item: "${title}" at ${location}`,
      ipAddress: req.ip,
    });

    await createNotification({
      userId: req.user._id,
      title: 'Lost Item Report Submitted',
      message: `Your lost item report for "${title}" has been published. We will notify you when a match is found.`,
      type: 'REPORT_SUBMITTED',
      link: `/item.html?type=lost&id=${lostItem._id}`,
    });

    // Check for potential active Found Item matches immediately
    const threshold = parseInt(process.env.MATCH_THRESHOLD || '70', 10);
    const activeFoundItems = await FoundItem.find({ status: { $in: ['FOUND', 'MATCHED'] } });

    for (const foundItem of activeFoundItems) {
      const { matchScore } = calculateMatchingScore(lostItem, foundItem);
      if (matchScore >= threshold) {
        // Dispatch match notification to both users
        await createNotification({
          userId: req.user._id,
          title: `Possible Match Found (${matchScore}%)`,
          message: `A found item "${foundItem.title}" at ${foundItem.location} matches your lost "${lostItem.title}".`,
          type: 'POSSIBLE_MATCH',
          link: `/item.html?type=found&id=${foundItem._id}`,
        });

        await createNotification({
          userId: foundItem.reportedBy,
          title: `Possible Match Found (${matchScore}%)`,
          message: `A reported lost item "${lostItem.title}" matches the item "${foundItem.title}" you reported found.`,
          type: 'POSSIBLE_MATCH',
          link: `/item.html?type=lost&id=${lostItem._id}`,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Lost item reported successfully!',
      data: lostItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get All Lost Items (with Filters, Search, Pagination)
// @route GET /api/lost
const getLostItems = async (req, res, next) => {
  try {
    const { category, location, status, search, startDate, endDate, sort } = req.query;

    const query = {};

    if (category) query.category = category;
    if (location) query.location = location;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.dateLost = {};
      if (startDate) query.dateLost.$gte = new Date(startDate);
      if (endDate) query.dateLost.$lte = new Date(endDate);
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { color: searchRegex },
        { location: searchRegex },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    const items = await LostItem.find(query)
      .populate('reportedBy', 'name department year profileImage accountStatus')
      .sort(sortOption);

    // Remove items belonging to suspended users from the public portal
    const activeItems = items.filter((item) => {
      if (item.isSuspendedFromPortal) return false;
      const ownerStatus = item.reportedBy && typeof item.reportedBy === 'object' ? item.reportedBy.accountStatus : null;
      if (ownerStatus === 'SUSPENDED') return false;
      return true;
    });

    // Sanitize: Do not leak private uniqueDetails to public listings
    const sanitizedItems = activeItems.map((item) => {
      const obj = typeof item.toObject === 'function' ? item.toObject() : { ...item };
      const ownerId = item.reportedBy ? (item.reportedBy._id || item.reportedBy).toString() : '';
      const currentUserId = req.user ? req.user._id.toString() : '';
      if (!req.user || (req.user.role === 'STUDENT' && ownerId !== currentUserId)) {
        delete obj.uniqueDetails;
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      count: sanitizedItems.length,
      data: sanitizedItems,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Single Lost Item Details
// @route GET /api/lost/:id
const getLostItemById = async (req, res, next) => {
  try {
    const item = await LostItem.findById(req.params.id).populate('reportedBy', 'name department year profileImage accountStatus');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Lost item report not found.' });
    }

    const obj = typeof item.toObject === 'function' ? item.toObject() : { ...item };
    const ownerId = item.reportedBy ? (item.reportedBy._id || item.reportedBy).toString() : '';
    const currentUserId = req.user ? req.user._id.toString() : '';
    const isOwner = Boolean(ownerId && currentUserId && ownerId === currentUserId);
    const isStaffOrAdmin = req.user && (req.user.role === 'STAFF' || req.user.role === 'ADMIN');

    const isSuspended = Boolean(
      obj.isSuspendedFromPortal ||
      (obj.reportedBy && typeof obj.reportedBy === 'object' && obj.reportedBy.accountStatus === 'SUSPENDED')
    );

    // If item is suspended from portal, only Staff and Admin can view/inspect it
    if (isSuspended && !isStaffOrAdmin) {
      return res.status(404).json({
        success: false,
        message: 'This item report has been removed from the portal because the author account is suspended.',
      });
    }

    if (!isOwner && !isStaffOrAdmin) {
      delete obj.uniqueDetails;
    }

    obj.isSuspendedFromPortal = isSuspended;

    res.status(200).json({
      success: true,
      data: obj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update Lost Item
// @route PUT /api/lost/:id
const updateLostItem = async (req, res, next) => {
  try {
    let item = await LostItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Lost item not found' });

    const isOwner = item.reportedBy.toString() === req.user._id.toString();
    const isStaffOrAdmin = req.user.role === 'STAFF' || req.user.role === 'ADMIN';

    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this report' });
    }

    const fieldsToUpdate = ['title', 'category', 'description', 'color', 'brand', 'location', 'dateLost', 'uniqueDetails', 'status'];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) item[field] = req.body[field];
    });

    if (req.files && req.files.length > 0) {
      const newImages = await uploadImages(req.files, 'lost2found/items');
      item.images = [...item.images, ...newImages];
    }

    await item.save();
    res.status(200).json({ success: true, message: 'Lost item updated successfully', data: item });
  } catch (error) {
    next(error);
  }
};

// @desc Delete Lost Item
// @route DELETE /api/lost/:id
const deleteLostItem = async (req, res, next) => {
  try {
    const item = await LostItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Lost item not found' });

    const isOwner = item.reportedBy.toString() === req.user._id.toString();
    const isStaffOrAdmin = req.user.role === 'STAFF' || req.user.role === 'ADMIN';

    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this report' });
    }

    await item.deleteOne();
    res.status(200).json({ success: true, message: 'Lost item report deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLostItem,
  getLostItems,
  getLostItemById,
  updateLostItem,
  deleteLostItem,
};
