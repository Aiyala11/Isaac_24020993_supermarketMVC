const express = require('express');
const router = express.Router();
const finesController = require('../controllers/finesController');

// All routes related to student fines are deprecated/removed
router.all('*', finesController.deprecated);

module.exports = router;