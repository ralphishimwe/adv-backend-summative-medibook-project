const express = require('express');
const waitlistController = require('../controllers/waitlistController');

const router = express.Router();

router.route('/').post(waitlistController.joinWaitlist);

module.exports = router;