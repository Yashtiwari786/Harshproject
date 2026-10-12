const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const { calculateMatchingScore } = require('../services/matchingService');

// @desc Get Smart Matches for an Item
// @route GET /api/matches/:itemId?type=lost|found
const getItemMatches = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const itemType = req.query.type || 'lost';

    let targetItem;
    let pool = [];

    if (itemType === 'lost') {
      targetItem = await LostItem.findById(itemId);
      if (!targetItem) return res.status(404).json({ success: false, message: 'Lost item not found' });
      pool = await FoundItem.find({ status: { $ne: 'CLOSED' } }).populate('reportedBy', 'name department accountStatus');
    } else {
      targetItem = await FoundItem.findById(itemId);
      if (!targetItem) return res.status(404).json({ success: false, message: 'Found item not found' });
      pool = await LostItem.find({ status: { $ne: 'CLOSED' } }).populate('reportedBy', 'name department accountStatus');
    }

    // Exclude candidate items belonging to suspended users
    pool = pool.filter((candidate) => {
      if (candidate.isSuspendedFromPortal) return false;
      const ownerStatus = candidate.reportedBy && typeof candidate.reportedBy === 'object' ? candidate.reportedBy.accountStatus : null;
      if (ownerStatus === 'SUSPENDED') return false;
      return true;
    });

    const results = [];
    const threshold = parseInt(process.env.MATCH_THRESHOLD || '70', 10);

    pool.forEach((candidate) => {
      const lostObj = itemType === 'lost' ? targetItem : candidate;
      const foundObj = itemType === 'lost' ? candidate : targetItem;

      const { matchScore, matchingFactors } = calculateMatchingScore(lostObj, foundObj);

      if (matchScore > 30) { // Return potential candidates scored > 30% for listing
        results.push({
          matchedItem: candidate,
          matchScore,
          isHighConfidence: matchScore >= threshold,
          matchingFactors,
        });
      }
    });

    results.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      success: true,
      threshold,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getItemMatches };
