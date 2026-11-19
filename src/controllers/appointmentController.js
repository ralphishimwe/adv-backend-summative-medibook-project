const Appointment = require('../models/appointmentModel');
const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');
const AppError = require('../utils/AppError');
const { MAX_APPOINTMENTS_PER_DAY } = require('../config/constants');
const {
  APPOINTMENT_FIELDS,
  checkUnknownFields,
  isValidId,
  validateAppointmentTime,
} = require('../utils/validators');

exports.bookAppointment = async (req, res, next) => {
  try {
    const body = req.body || {};
    const fieldsError = checkUnknownFields(body, APPOINTMENT_FIELDS);
    if (fieldsError) throw new AppError(fieldsError, 400);

    if (!isValidId(String(body.patient_id)) || !isValidId(String(body.doctor_id))) {
      throw new AppError('patient_id and doctor_id must be positive whole numbers', 400);
    }

    const timeError = validateAppointmentTime(body.appt_datetime);
    if (timeError) throw new AppError(timeError.message, timeError.statusCode);

    const patient = await Patient.findById(body.patient_id);
    if (!patient) throw new AppError('No patient found with that id', 404);

    const doctor = await Doctor.findById(body.doctor_id);
    if (!doctor) throw new AppError('No doctor found with that id', 404);

    const result = await Appointment.book(
      {
        patient_id: patient.id,
        doctor_id: doctor.id,
        appt_datetime: `${body.appt_datetime}:00`,
        amount_paid: doctor.consultation_fee,
      },
      MAX_APPOINTMENTS_PER_DAY
    );

    if (result.isDayFull) {
      throw new AppError(
        `${doctor.full_name} already has ${MAX_APPOINTMENTS_PER_DAY} appointments on that day`,
        409
      );
    }

    const appointment = await Appointment.findById(result.appointmentId);
    res.status(201).json({ status: 'success', data: { appointment } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return next(new AppError('This doctor already has an appointment at that time', 409));
    }
    next(err);
  }
};