const express = require('express');
const router = express.Router();
const { createLostItem, getLostItems, getLostItemById, updateLostItem, deleteLostItem } = require('../controllers/lostController');
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate, lostReportRules } = require('../utils/validators');

router.get('/', optionalAuth, getLostItems);
router.get('/:id', optionalAuth, getLostItemById);
router.post('/', protect, upload.array('images', 5), validate(lostReportRules), createLostItem);
router.put('/:id', protect, upload.array('images', 5), updateLostItem);
router.delete('/:id', protect, deleteLostItem);

module.exports = router;
