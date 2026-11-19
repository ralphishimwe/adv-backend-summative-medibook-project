const express = require('express');
const doctorController = require('../controllers/doctorController');
const checkId = require('../utils/checkId');

const router = express.Router();

router.param('id', checkId);

router
  .route('/')
  .get(doctorController.getAllDoctors)
  .post(doctorController.createDoctor);

router
  .route('/:id')
  .get(doctorController.getDoctor)
  .patch(doctorController.updateDoctor)
  .delete(doctorController.deleteDoctor);

module.exports = router;