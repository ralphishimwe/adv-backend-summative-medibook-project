const Patient = require('../models/patientModel');
const AppError = require('../utils/AppError');
const { validatePatient } = require('../utils/validators');

exports.getAllPatients = async (req, res, next) => {
  try {
    const patients = await Patient.findAll();
    res.status(200).json({ status: 'success', results: patients.length, data: { patients } });
  } catch (err) {
    next(err);
  }
};

exports.getPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) throw new AppError('No patient found with that id', 404);

    res.status(200).json({ status: 'success', data: { patient } });
  } catch (err) {
    next(err);
  }
};

exports.createPatient = async (req, res, next) => {
  try {
    const body = req.body || {};
    const newPatient = {
      full_name: body.full_name,
      email: body.email,
      phone: body.phone,
    };

    const error = validatePatient(newPatient);
    if (error) throw new AppError(error, 400);

    const id = await Patient.create(newPatient);
    const patient = await Patient.findById(id);

    res.status(201).json({ status: 'success', data: { patient } });
  } catch (err) {
    next(err);
  }
};

exports.updatePatient = async (req, res, next) => {
  try {
    const existing = await Patient.findById(req.params.id);
    if (!existing) throw new AppError('No patient found with that id', 404);

    const body = req.body || {};
    const updatedPatient = {
      full_name: body.full_name ?? existing.full_name,
      email: body.email ?? existing.email,
      phone: body.phone ?? existing.phone,
    };

    const error = validatePatient(updatedPatient);
    if (error) throw new AppError(error, 400);

    await Patient.update(req.params.id, updatedPatient);
    const patient = await Patient.findById(req.params.id);

    res.status(200).json({ status: 'success', data: { patient } });
  } catch (err) {
    next(err);
  }
};

exports.deletePatient = async (req, res, next) => {
  try {
    const deletedRows = await Patient.remove(req.params.id);
    if (deletedRows === 0) throw new AppError('No patient found with that id', 404);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};