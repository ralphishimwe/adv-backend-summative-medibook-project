const express = require('express');
const patientController = require('../controllers/patientController');
const checkId = require('../utils/checkId');

const router = express.Router();

router.param('id', checkId);

router
  .route('/')
  .get(patientController.getAllPatients)
  .post(patientController.createPatient);

router
  .route('/:id')
  .get(patientController.getPatient)
  .patch(patientController.updatePatient)
  .delete(patientController.deletePatient);

module.exports = router;