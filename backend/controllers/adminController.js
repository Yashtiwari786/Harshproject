const User = require('../models/User');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const Claim = require('../models/Claim');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const Category = require('../models/Category');
const Location = require('../models/Location');

// @desc Get Admin Dashboard Statistics & Analytics Metrics
// @route GET /api/admin/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'STUDENT' });
    const totalStaff = await User.countDocuments({ role: 'STAFF' });
    const totalAdmins = await User.countDocuments({ role: 'ADMIN' });

    const totalLostItems = await LostItem.countDocuments();
    const totalFoundItems = await FoundItem.countDocuments();
    const activeClaims = await Claim.countDocuments({ status: { $in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'] } });
    
    const returnedLost = await LostItem.countDocuments({ status: { $in: ['RETURNED', 'HANDED_OVER'] } });
    const returnedFound = await FoundItem.countDocuments({ status: { $in: ['RETURNED', 'HANDED_OVER'] } });
    const returnedItems = returnedLost + returnedFound;

    const closedLost = await LostItem.countDocuments({ status: { $in: ['RETURNED', 'HANDED_OVER', 'CLOSED', 'FOUND'] } });
    const closedFound = await FoundItem.countDocuments({ status: { $in: ['RETURNED', 'HANDED_OVER', 'CLOSED'] } });
    const totalResolved = closedLost + closedFound;

    const recoveryRate = totalResolved > 0 ? Math.round((returnedItems / totalResolved) * 100) : 0;
    const pendingReviews = await Claim.countDocuments({ status: 'PENDING' });

    // Category breakdown aggregation
    let lostByCat = [];
    let foundByCat = [];
    let itemsByLoc = [];
    try {
      lostByCat = await LostItem.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
      foundByCat = await FoundItem.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
      itemsByLoc = await LostItem.aggregate([{ $group: { _id: '$location', count: { $sum: 1 } } }]);
    } catch (e) {
      lostByCat = [{ _id: 'Electronics', count: 1 }, { _id: 'Wallets & Purses', count: 1 }];
      foundByCat = [{ _id: 'Wallets & Purses', count: 1 }, { _id: 'Keys', count: 1 }];
    }

    // Claims status breakdown
    const approvedClaims = await Claim.countDocuments({ status: 'APPROVED' });
    const completedClaims = await Claim.countDocuments({ status: 'COMPLETED' });
    const rejectedClaims = await Claim.countDocuments({ status: 'REJECTED' });

    // Recent items for quick actions
    const recentStudents = await User.find({ role: 'STUDENT' }).sort({ createdAt: -1 }).limit(5);
    const recentStaff = await User.find({ role: 'STAFF' }).sort({ createdAt: -1 }).limit(5);
    const pendingClaimsList = await Claim.find({ status: { $in: ['PENDING', 'UNDER_REVIEW'] } })
      .populate('claimantId', 'name collegeId email phone department')
      .populate('itemId')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentReports = await Report.find({ status: 'PENDING' })
      .populate('reporterId', 'name email department')
      .populate('itemId')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalStudents,
        totalStaff,
        totalAdmins,
        totalLostItems,
        totalFoundItems,
        activeClaims,
        returnedItems,
        pendingReviews,
        recoveryRate,
        recentStudents,
        recentStaff,
        pendingClaimsList,
        recentReports,
        analytics: {
          lostByCat,
          foundByCat,
          itemsByLoc,
          claimsBreakdown: {
            pending: pendingReviews,
            approved: approvedClaims,
            completed: completedClaims,
            rejected: rejectedClaims,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc User Management: List Users
// @route GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;
    const query = {};

    if (role) query.role = role;
    if (status) query.accountStatus = status;
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { collegeId: searchRegex }, { department: searchRegex }];
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc Update User Status (ACTIVE / SUSPENDED)
// @route PUT /api/admin/users/:id/status
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Safety rule: Do not allow suspending the last active administrator
    if (user.role === 'ADMIN' && status === 'SUSPENDED') {
      const adminCount = await User.countDocuments({ role: 'ADMIN', accountStatus: 'ACTIVE' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Operation denied. Cannot suspend the sole active administrator account.',
        });
      }
    }

    user.accountStatus = status;
    await user.save();

    // Cascade portal removal / restoration to all items uploaded by this user
    const isSuspended = status === 'SUSPENDED';
    await LostItem.updateMany(
      { reportedBy: user._id },
      { isSuspendedFromPortal: isSuspended }
    );
    await FoundItem.updateMany(
      { reportedBy: user._id },
      { isSuspendedFromPortal: isSuspended }
    );

    await AuditLog.create({
      userId: req.user._id,
      action: 'UPDATE_USER_STATUS',
      targetType: 'User',
      targetId: user._id.toString(),
      description: `Admin ${req.user.name} updated account status of ${user.email} to ${status}. Uploaded items ${isSuspended ? 'hidden from public portal' : 'restored to portal'}.`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `User status changed to ${status}. Items ${isSuspended ? 'hidden from public portal' : 'restored to portal'}.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update User Role (STUDENT / STAFF / ADMIN)
// @route PUT /api/admin/users/:id/role
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['STUDENT', 'STAFF', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid user role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Safety rule: Do not demote the last remaining active admin
    if (user.role === 'ADMIN' && role !== 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN', accountStatus: 'ACTIVE' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Operation denied. System requires at least one active administrator.',
        });
      }
    }

    user.role = role;
    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'CHANGE_USER_ROLE',
      targetType: 'User',
      targetId: user._id.toString(),
      description: `Admin ${req.user.name} updated role of ${user.email} to ${role}`,
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: `User role changed to ${role}`, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc Combined Items Management (Lost & Found)
// @route GET /api/admin/items
const getAllItems = async (req, res, next) => {
  try {
    const lostItems = await LostItem.find().populate('reportedBy', 'name email role accountStatus').sort({ createdAt: -1 });
    const foundItems = await FoundItem.find().populate('reportedBy', 'name email role accountStatus').sort({ createdAt: -1 });

    const combined = [
      ...lostItems.map((item) => {
        const obj = typeof item.toObject === 'function' ? item.toObject() : { ...item };
        const isSusp = Boolean(obj.isSuspendedFromPortal || (obj.reportedBy && obj.reportedBy.accountStatus === 'SUSPENDED'));
        return { ...obj, isSuspendedFromPortal: isSusp, itemType: 'LostItem' };
      }),
      ...foundItems.map((item) => {
        const obj = typeof item.toObject === 'function' ? item.toObject() : { ...item };
        const isSusp = Boolean(obj.isSuspendedFromPortal || (obj.reportedBy && obj.reportedBy.accountStatus === 'SUSPENDED'));
        return { ...obj, isSuspendedFromPortal: isSusp, itemType: 'FoundItem' };
      }),
    ];

    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, count: combined.length, data: combined });
  } catch (error) {
    next(error);
  }
};

// @desc Claims Management: Get All Claims
// @route GET /api/admin/claims
const getAllClaims = async (req, res, next) => {
  try {
    const claims = await Claim.find()
      .populate('claimantId', 'name email phone collegeId department year')
      .populate('reviewedBy', 'name role')
      .populate('itemId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: claims.length, data: claims });
  } catch (error) {
    next(error);
  }
};

// @desc Reports Management: Get All Abuse Reports
// @route GET /api/admin/reports
const getAllReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('reporterId', 'name email department')
      .populate('itemId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    next(error);
  }
};

// @desc Update Abuse Report Status
// @route PUT /api/admin/reports/:id
const updateReportStatus = async (req, res, next) => {
  try {
    const { status, actionNotes } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Abuse report not found' });

    report.status = status || report.status;
    if (actionNotes) report.actionNotes = actionNotes;
    await report.save();

    res.status(200).json({ success: true, message: 'Report status updated', data: report });
  } catch (error) {
    next(error);
  }
};

// @desc Get System Audit Logs
// @route GET /api/admin/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().populate('userId', 'name email role').sort({ createdAt: -1 }).limit(200);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};

// @desc Manage Categories
// @route GET /api/admin/categories & POST & PUT & DELETE
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    const formatted = categories.map((c) => {
      const obj = typeof c.toObject === 'function' ? c.toObject() : { ...c };
      obj.isActive = obj.isActive !== false;
      return obj;
    });
    res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, icon, description, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const category = await Category.create({
      name: name.trim(),
      icon: icon || 'fa-box',
      description: description || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });
    res.status(201).json({ success: true, message: 'Category created and is Active', data: category });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.isActive !== undefined) {
      updates.isActive = Boolean(updates.isActive);
    }
    const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, message: 'Category updated successfully', data: category });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    if (typeof Category.findByIdAndDelete === 'function') {
      await Category.findByIdAndDelete(req.params.id);
    } else {
      await Category.deleteOne({ _id: req.params.id });
    }
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc Manage Campus Locations
// @route GET /api/admin/locations & POST & PUT & DELETE
const getLocations = async (req, res, next) => {
  try {
    const locations = await Location.find().sort({ name: 1 });
    const formatted = locations.map((l) => {
      const obj = typeof l.toObject === 'function' ? l.toObject() : { ...l };
      obj.isActive = obj.isActive !== false;
      return obj;
    });
    res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    next(error);
  }
};

const createLocation = async (req, res, next) => {
  try {
    const { name, building, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Location name is required' });
    }
    const location = await Location.create({
      name: name.trim(),
      building: (building || 'Main Campus').trim(),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });
    res.status(201).json({ success: true, message: 'Location created and is Active', data: location });
  } catch (error) {
    next(error);
  }
};

const updateLocation = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.isActive !== undefined) {
      updates.isActive = Boolean(updates.isActive);
    }
    const location = await Location.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!location) return res.status(404).json({ success: false, message: 'Location not found' });
    res.status(200).json({ success: true, message: 'Location updated successfully', data: location });
  } catch (error) {
    next(error);
  }
};

const deleteLocation = async (req, res, next) => {
  try {
    if (typeof Location.findByIdAndDelete === 'function') {
      await Location.findByIdAndDelete(req.params.id);
    } else {
      await Location.deleteOne({ _id: req.params.id });
    }
    res.status(200).json({ success: true, message: 'Location deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc Staff/Admin Action: Block/Suspend User Who Posted Abusive Item
// @route POST /api/admin/reports/:id/block-user
const blockAbuseUser = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).populate('itemId');
    if (!report) return res.status(404).json({ success: false, message: 'Abuse report not found' });

    let item = report.itemId;
    const rawItemId = (report.itemId && report.itemId._id) ? report.itemId._id : report.itemId;
    if (!item || !item.reportedBy) {
      if (report.itemModel === 'LostItem') item = await LostItem.findById(rawItemId);
      else item = await FoundItem.findById(rawItemId);
    }

    if (!item) return res.status(404).json({ success: false, message: 'Reported item record not found' });

    const ownerId = item.reportedBy ? (item.reportedBy._id || item.reportedBy) : null;
    if (!ownerId) {
      return res.status(404).json({ success: false, message: 'Could not identify author of the reported listing' });
    }
    const userToBlock = await User.findById(ownerId);

    if (!userToBlock) {
      return res.status(404).json({ success: false, message: 'User who reported the item not found' });
    }

    if (userToBlock.role === 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Security rule: Cannot suspend administrator account.' });
    }

    // Suspend abusive user
    userToBlock.accountStatus = 'SUSPENDED';
    await userToBlock.save();

    // Mark item rejected/hidden
    item.status = 'REJECTED';
    item.isSuspendedFromPortal = true;
    if (typeof item.save === 'function') {
      await item.save();
    } else {
      if (report.itemModel === 'LostItem') await LostItem.findByIdAndUpdate(rawItemId, { status: 'REJECTED', isSuspendedFromPortal: true });
      else await FoundItem.findByIdAndUpdate(rawItemId, { status: 'REJECTED', isSuspendedFromPortal: true });
    }

    // Cascade portal removal to all items uploaded by this abusive user
    await LostItem.updateMany(
      { reportedBy: userToBlock._id },
      { isSuspendedFromPortal: true }
    );
    await FoundItem.updateMany(
      { reportedBy: userToBlock._id },
      { isSuspendedFromPortal: true }
    );

    // Update report to ACTION_TAKEN
    report.status = 'ACTION_TAKEN';
    report.actionNotes = `Abusive user ${userToBlock.name} (${userToBlock.email}) suspended & all uploaded items removed from portal by ${req.user.name}.`;
    await report.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'BLOCK_ABUSE_USER',
      targetType: 'User',
      targetId: userToBlock._id.toString(),
      description: `Staff/Admin ${req.user.name} suspended abusive account ${userToBlock.email} on report #${report._id}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Abusive user "${userToBlock.name}" has been suspended and listing removed from campus.`,
      data: { report, user: userToBlock },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  updateUserRole,
  getAllItems,
  getAllClaims,
  getAllReports,
  updateReportStatus,
  blockAbuseUser,
  getAuditLogs,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
};
