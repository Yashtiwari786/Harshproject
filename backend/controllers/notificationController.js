const Notification = require('../models/Notification');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc Get Notifications for Current User
// @route GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Mark Notification as Read
// @route PUT /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });

    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc Mark All Notifications as Read
// @route PUT /api/notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc Broadcast Notification to Campus Users (Staff & Admin)
// @route POST /api/notifications/broadcast
const broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, targetAudience, priority, link } = req.body;

    if (!title || !title.trim() || !message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Notification title and message are required.' });
    }

    const callerRole = req.user.role; // STAFF or ADMIN
    let audience = (targetAudience || 'STUDENTS').toUpperCase();

    // Role-based Audience Enforcement:
    // - Staff can make notification for: STUDENTS or STAFF
    // - Admin can make notification for: ALL, STAFF, or STUDENTS
    if (callerRole === 'STAFF') {
      if (audience === 'ALL') {
        return res.status(403).json({
          success: false,
          message: 'Staff officers can only broadcast notifications for Students or Staff team.',
        });
      }
      if (!['STUDENTS', 'STAFF'].includes(audience)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target audience for Staff. Allowed options: STUDENTS or STAFF.',
        });
      }
    } else if (callerRole === 'ADMIN') {
      if (!['ALL', 'STUDENTS', 'STAFF'].includes(audience)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target audience for Admin. Allowed options: ALL, STUDENTS, or STAFF.',
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only authorized campus staff and administrators can dispatch broadcast notifications.',
      });
    }

    // Find recipient users
    let filter = { accountStatus: 'ACTIVE' };
    if (audience === 'STUDENTS') {
      filter.role = 'STUDENT';
    } else if (audience === 'STAFF') {
      filter.role = 'STAFF';
    } else if (audience === 'ALL') {
      filter.role = { $in: ['STUDENT', 'STAFF', 'ADMIN'] };
    }

    const recipients = await User.find(filter);
    if (!recipients || recipients.length === 0) {
      return res.status(404).json({ success: false, message: `No active users found in audience category: ${audience}` });
    }

    const notifType = priority === 'URGENT' 
      ? 'SECURITY_ALERT' 
      : (callerRole === 'STAFF' ? 'STAFF_ANNOUNCEMENT' : 'CAMPUS_BROADCAST');

    const createdNotifications = [];
    for (const recipient of recipients) {
      const notif = await Notification.create({
        userId: recipient._id,
        senderId: req.user._id,
        senderRole: callerRole,
        targetAudience: audience,
        priority: priority === 'URGENT' ? 'URGENT' : 'NORMAL',
        title: priority === 'URGENT' ? `🚨 [URGENT] ${title.trim()}` : `📢 ${title.trim()}`,
        message: message.trim(),
        type: notifType,
        link: link || '/notifications.html',
        isRead: false,
      });
      createdNotifications.push(notif);
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'BROADCAST_NOTIFICATION',
      targetType: 'Notification',
      targetId: createdNotifications[0] ? createdNotifications[0]._id.toString() : 'BROADCAST',
      description: `${callerRole} "${req.user.name}" dispatched campus broadcast to ${audience} (${recipients.length} recipients): "${title.trim()}"`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Notification broadcast dispatched successfully to ${recipients.length} ${audience.toLowerCase()} user(s)!`,
      recipientCount: recipients.length,
      audience,
      priority: priority || 'NORMAL',
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Broadcast History Sent by Staff/Admin
// @route GET /api/notifications/broadcasts
const getBroadcastHistory = async (req, res, next) => {
  try {
    const broadcasts = await Notification.find({
      type: { $in: ['CAMPUS_BROADCAST', 'STAFF_ANNOUNCEMENT', 'SECURITY_ALERT'] },
    })
      .populate('senderId', 'name role department')
      .sort({ createdAt: -1 })
      .limit(40);

    // Group unique broadcasts by title, sender, and minute
    const seen = new Set();
    const uniqueBroadcasts = [];

    broadcasts.forEach((b) => {
      const key = `${b.title}_${b.targetAudience}_${new Date(b.createdAt).toISOString().slice(0, 16)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueBroadcasts.push(b);
      }
    });

    res.status(200).json({
      success: true,
      count: uniqueBroadcasts.length,
      data: uniqueBroadcasts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  broadcastNotification,
  getBroadcastHistory,
};
