const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');
const AppError = require('../utils/AppError');
const queue = require('../utils/queue');
const {
  WAITLIST_FIELDS,
  checkUnknownFields,
  isValidId,
  validateWaitlistDate,
} = require('../utils/validators');

exports.joinWaitlist = async (req, res, next) => {
  try {
    const body = req.body || {};
    const fieldsError = checkUnknownFields(body, WAITLIST_FIELDS);
    if (fieldsError) throw new AppError(fieldsError, 400);

    if (!isValidId(String(body.patient_id)) || !isValidId(String(body.doctor_id))) {
      throw new AppError('patient_id and doctor_id must be positive whole numbers', 400);
    }

    const dateError = validateWaitlistDate(body.date);
    if (dateError) throw new AppError(dateError.message, dateError.statusCode);

    const patient = await Patient.findById(body.patient_id);
    if (!patient) throw new AppError('No patient found with that id', 404);

    const doctor = await Doctor.findById(body.doctor_id);
    if (!doctor) throw new AppError('No doctor found with that id', 404);

    const position = await queue.addToWaitlist(doctor.id, body.date, patient.id);
    if (position === null) {
      throw new AppError('This patient is already on the waitlist for that doctor and day', 409);
    }

    res.status(201).json({
      status: 'success',
      message: `${patient.full_name} is number ${position} on the waitlist for ${doctor.full_name} on ${body.date}`,
      data: { patient_id: patient.id, doctor_id: doctor.id, date: body.date, position },
    });
  } catch (err) {
    next(err);
  }
};