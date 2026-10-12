const FoundItem = require('../models/FoundItem');
const LostItem = require('../models/LostItem');
const AuditLog = require('../models/AuditLog');
const { uploadImages } = require('../services/cloudinaryService');
const { calculateMatchingScore } = require('../services/matchingService');
const { createNotification } = require('../services/notificationService');

// @desc Report a Found Item
// @route POST /api/found
const createFoundItem = async (req, res, next) => {
  try {
    const { title, category, description, color, brand, location, dateFound, timeFound, condition, currentStorageLocation, uniqueDetails } = req.body;

    let images = [];
    if (req.files && req.files.length > 0) {
      images = await uploadImages(req.files, 'lost2found/items');
    }

    const foundItem = await FoundItem.create({
      reportedBy: req.user._id,
      title,
      category,
      description,
      color,
      brand: brand || '',
      location,
      dateFound: dateFound || new Date(),
      timeFound: timeFound || '',
      condition: condition || 'Good',
      currentStorageLocation: currentStorageLocation || 'Campus Security Office',
      uniqueDetails: uniqueDetails || '',
      images,
      status: 'FOUND',
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'CREATE_FOUND_REPORT',
      targetType: 'FoundItem',
      targetId: foundItem._id.toString(),
      description: `Reported found item: "${title}" deposited at ${currentStorageLocation}`,
      ipAddress: req.ip,
    });

    await createNotification({
      userId: req.user._id,
      title: 'Found Item Report Submitted',
      message: `Thank you for reporting "${title}"! It is listed on Lost2Found so the rightful owner can claim it.`,
      type: 'REPORT_SUBMITTED',
      link: `/item.html?type=found&id=${foundItem._id}`,
    });

    // Check for potential active Lost Item matches immediately
    const threshold = parseInt(process.env.MATCH_THRESHOLD || '70', 10);
    const activeLostItems = await LostItem.find({ status: { $in: ['LOST', 'MATCHED'] } });

    for (const lostItem of activeLostItems) {
      const { matchScore } = calculateMatchingScore(lostItem, foundItem);
      if (matchScore >= threshold) {
        await createNotification({
          userId: lostItem.reportedBy,
          title: `Possible Match Found (${matchScore}%)`,
          message: `A found item "${foundItem.title}" at ${foundItem.location} matches your reported lost item "${lostItem.title}".`,
          type: 'POSSIBLE_MATCH',
          link: `/item.html?type=found&id=${foundItem._id}`,
        });

        await createNotification({
          userId: req.user._id,
          title: `Possible Match Found (${matchScore}%)`,
          message: `Your reported found item "${foundItem.title}" matches a lost item report for "${lostItem.title}".`,
          type: 'POSSIBLE_MATCH',
          link: `/item.html?type=lost&id=${lostItem._id}`,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Found item reported successfully!',
      data: foundItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get All Found Items (Filters, Search, Sorting)
// @route GET /api/found
const getFoundItems = async (req, res, next) => {
  try {
    const { category, location, status, search, startDate, endDate, sort } = req.query;

    const query = {};
    if (category) query.category = category;
    if (location) query.location = location;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.dateFound = {};
      if (startDate) query.dateFound.$gte = new Date(startDate);
      if (endDate) query.dateFound.$lte = new Date(endDate);
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

    const items = await FoundItem.find(query)
      .populate('reportedBy', 'name department year profileImage accountStatus')
      .sort(sortOption);

    // Remove items belonging to suspended users from the public portal
    const activeItems = items.filter((item) => {
      if (item.isSuspendedFromPortal) return false;
      const ownerStatus = item.reportedBy && typeof item.reportedBy === 'object' ? item.reportedBy.accountStatus : null;
      if (ownerStatus === 'SUSPENDED') return false;
      return true;
    });

    // Sanitize: Hide hidden verification details in public list
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

// @desc Get Single Found Item
// @route GET /api/found/:id
const getFoundItemById = async (req, res, next) => {
  try {
    const item = await FoundItem.findById(req.params.id).populate('reportedBy', 'name department year profileImage accountStatus');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Found item report not found.' });
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

// @desc Update Found Item
// @route PUT /api/found/:id
const updateFoundItem = async (req, res, next) => {
  try {
    let item = await FoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Found item not found' });

    const isOwner = item.reportedBy.toString() === req.user._id.toString();
    const isStaffOrAdmin = req.user.role === 'STAFF' || req.user.role === 'ADMIN';

    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this report' });
    }

    const fieldsToUpdate = ['title', 'category', 'description', 'color', 'brand', 'location', 'dateFound', 'condition', 'currentStorageLocation', 'uniqueDetails', 'status'];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) item[field] = req.body[field];
    });

    if (req.files && req.files.length > 0) {
      const newImages = await uploadImages(req.files, 'lost2found/items');
      item.images = [...item.images, ...newImages];
    }

    await item.save();
    res.status(200).json({ success: true, message: 'Found item updated successfully', data: item });
  } catch (error) {
    next(error);
  }
};

// @desc Delete Found Item
// @route DELETE /api/found/:id
const deleteFoundItem = async (req, res, next) => {
  try {
    const item = await FoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Found item not found' });

    const isOwner = item.reportedBy.toString() === req.user._id.toString();
    const isStaffOrAdmin = req.user.role === 'STAFF' || req.user.role === 'ADMIN';

    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this report' });
    }

    await item.deleteOne();
    res.status(200).json({ success: true, message: 'Found item report deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFoundItem,
  getFoundItems,
  getFoundItemById,
  updateFoundItem,
  deleteFoundItem,
};
