const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const checkId = require('../utils/checkId');

const router = express.Router();

router.param('id', checkId);

router
  .route('/')
  .get(appointmentController.getAllAppointments)
  .post(appointmentController.bookAppointment);

router
  .route('/:id')
  .get(appointmentController.getAppointment)
  .patch(appointmentController.rescheduleAppointment)
  .delete(appointmentController.cancelAppointment);

module.exports = router;
