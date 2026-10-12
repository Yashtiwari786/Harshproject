const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  broadcastNotification,
  getBroadcastHistory,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);
router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

// Campus Broadcasts (Staff & Admin)
router.post('/broadcast', authorize('STAFF', 'ADMIN'), broadcastNotification);
router.get('/broadcasts', authorize('STAFF', 'ADMIN'), getBroadcastHistory);

module.exports = router;
