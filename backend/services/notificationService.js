const Notification = require('../models/Notification');

/**
 * Helper to dispatch in-app notifications to a specified user
 */
const createNotification = async ({ userId, title, message, type = 'SYSTEM', link = '' }) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      link,
    });
    return notification;
  } catch (error) {
    console.error('[Notification Error]:', error.message);
    return null;
  }
};

module.exports = { createNotification };
