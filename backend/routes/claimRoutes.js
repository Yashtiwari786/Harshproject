const express = require('express');
const router = express.Router();
const { createClaim, getMyClaims, getClaimById, reviewClaim, completeHandover, cancelClaim } = require('../controllers/claimController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const upload = require('../middleware/upload');
const { validate, claimRules } = require('../utils/validators');

router.use(protect);
router.post('/', upload.array('proofImages', 3), validate(claimRules), createClaim);
router.get('/my', getMyClaims);
router.get('/:id', getClaimById);
router.put('/:id/review', authorize('STAFF', 'ADMIN'), reviewClaim);
router.post('/:id/handover', authorize('STAFF', 'ADMIN'), completeHandover);
router.post('/:id/cancel', cancelClaim);

module.exports = router;
