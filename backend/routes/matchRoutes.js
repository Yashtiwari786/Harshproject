const express = require('express');
const router = express.Router();
const { getItemMatches } = require('../controllers/matchController');

router.get('/:itemId', getItemMatches);

module.exports = router;
