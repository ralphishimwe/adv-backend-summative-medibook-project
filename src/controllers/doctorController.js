const Doctor = require('../models/doctorModel');
const AppError = require('../utils/AppError');
const {
  validateDoctor,
  checkUnknownFields,
  DOCTOR_FIELDS,
} = require('../utils/validators');

exports.getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.findAll();
    res
      .status(200)
      .json({ status: 'success', results: doctors.length, data: { doctors } });
  } catch (err) {
    next(err);
  }
};

exports.getDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) throw new AppError('No doctor found with that id', 404);

    res.status(200).json({ status: 'success', data: { doctor } });
  } catch (err) {
    next(err);
  }
};

exports.createDoctor = async (req, res, next) => {
  try {
    const body = req.body || {};
    const newDoctor = {
      full_name: body.full_name,
      specialty: body.specialty,
      consultation_fee: body.consultation_fee,
      room: body.room,
    };

    const error = validateDoctor(newDoctor);
    if (error) throw new AppError(error, 400);

    const id = await Doctor.create(newDoctor);
    const doctor = await Doctor.findById(id);

    res.status(201).json({ status: 'success', data: { doctor } });
  } catch (err) {
    next(err);
  }
};

exports.updateDoctor = async (req, res, next) => {
  try {
    const existing = await Doctor.findById(req.params.id);
    if (!existing) throw new AppError('No doctor found with that id', 404);

    const body = req.body || {};
    if (Object.keys(body).length === 0) {
      throw new AppError('Provide at least one field to update', 400);
    }
    const fieldsError = checkUnknownFields(body, DOCTOR_FIELDS);
    if (fieldsError) throw new AppError(fieldsError, 400);
    const updatedDoctor = {
      full_name: body.full_name ?? existing.full_name,
      specialty: body.specialty ?? existing.specialty,
      consultation_fee:
        body.consultation_fee ?? Number(existing.consultation_fee),
      room: body.room ?? existing.room,
    };

    const error = validateDoctor(updatedDoctor);
    if (error) throw new AppError(error, 400);

    await Doctor.update(req.params.id, updatedDoctor);
    const doctor = await Doctor.findById(req.params.id);

    res.status(200).json({ status: 'success', data: { doctor } });
  } catch (err) {
    next(err);
  }
};

exports.deleteDoctor = async (req, res, next) => {
  try {
    const deletedRows = await Doctor.remove(req.params.id);
    if (deletedRows === 0)
      throw new AppError('No doctor found with that id', 404);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
