const express = require('express');
const appointmentController = require('../controllers/appointmentController');

const router = express.Router();

router.route('/').post(appointmentController.bookAppointment);

module.exports = router;