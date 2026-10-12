const express = require('express');
const router = express.Router();
const { createFoundItem, getFoundItems, getFoundItemById, updateFoundItem, deleteFoundItem } = require('../controllers/foundController');
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate, foundReportRules } = require('../utils/validators');

router.get('/', optionalAuth, getFoundItems);
router.get('/:id', optionalAuth, getFoundItemById);
router.post('/', protect, upload.array('images', 5), validate(foundReportRules), createFoundItem);
router.put('/:id', protect, upload.array('images', 5), updateFoundItem);
router.delete('/:id', protect, deleteFoundItem);

module.exports = router;
