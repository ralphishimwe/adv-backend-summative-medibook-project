const Appointment = require('../models/appointmentModel');
const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');
const AppError = require('../utils/AppError');
const writeAuditLog = require('../utils/auditLog');
const queue = require('../utils/queue');
const { calculateRefund } = require('../utils/refund');
const { MAX_APPOINTMENTS_PER_DAY } = require('../config/constants');
const {
  APPOINTMENT_FIELDS,
  RESCHEDULE_FIELDS,
  checkUnknownFields,
  isValidId,
  validateAppointmentTime,
  parseDateTime,
} = require('../utils/validators');

const sendWaitlistOffer = (res, message, body) =>
  res.status(409).json({
    status: 'fail',
    message,
    waitlist_offer: {
      message: 'Join the waitlist to be booked automatically if a slot frees up that day',
      endpoint: 'POST /api/v1/waitlist',
      body: {
        patient_id: body.patient_id,
        doctor_id: body.doctor_id,
        date: body.appt_datetime.slice(0, 10),
      },
    },
  });

exports.getAllAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.findAll();
    res.status(200).json({
      status: 'success',
      results: appointments.length,
      data: { appointments },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) throw new AppError('No appointment found with that id', 404);

    res.status(200).json({ status: 'success', data: { appointment } });
  } catch (err) {
    next(err);
  }
};

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
      return sendWaitlistOffer(
        res,
        `${doctor.full_name} already has ${MAX_APPOINTMENTS_PER_DAY} appointments on that day`,
        body
      );
    }

    const appointment = await Appointment.findById(result.appointmentId);

    writeAuditLog('APPOINTMENT_BOOKED', {
      appointment_id: appointment.id,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      appt_datetime: appointment.appt_datetime,
      amount_paid: appointment.amount_paid,
    });
    queue.enqueueJob(queue.JOB_TYPES.SEND_CONFIRMATION, { appointment_id: appointment.id });

    res.status(201).json({ status: 'success', data: { appointment } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return sendWaitlistOffer(res, 'This doctor already has an appointment at that time', req.body);
    }
    next(err);
  }
};

exports.rescheduleAppointment = async (req, res, next) => {
  try {
    const body = req.body || {};
    const fieldsError = checkUnknownFields(body, RESCHEDULE_FIELDS);
    if (fieldsError) throw new AppError(fieldsError, 400);

    const timeError = validateAppointmentTime(body.appt_datetime);
    if (timeError) throw new AppError(timeError.message, timeError.statusCode);

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) throw new AppError('No appointment found with that id', 404);
    if (appointment.status === 'cancelled') {
      throw new AppError('Cancelled appointments cannot be rescheduled', 409);
    }

    const currentTime = parseDateTime(appointment.appt_datetime.slice(0, 16));
    if (currentTime <= new Date()) {
      throw new AppError('Past appointments cannot be rescheduled', 422);
    }

    const newDatetime = `${body.appt_datetime}:00`;
    if (newDatetime === appointment.appt_datetime) {
      throw new AppError('The appointment is already at that time', 400);
    }

    const result = await Appointment.reschedule(
      appointment.id,
      appointment.doctor_id,
      newDatetime,
      MAX_APPOINTMENTS_PER_DAY
    );
    if (result.isCancelled) {
      throw new AppError('Cancelled appointments cannot be rescheduled', 409);
    }
    if (result.isDayFull) {
      throw new AppError(
        `${appointment.doctor_name} already has ${MAX_APPOINTMENTS_PER_DAY} appointments on that day`,
        409
      );
    }

    queue.enqueueJob(queue.JOB_TYPES.SLOT_FREED, {
      doctor_id: appointment.doctor_id,
      appt_datetime: appointment.appt_datetime,
    });

    const updatedAppointment = await Appointment.findById(appointment.id);
    res.status(200).json({ status: 'success', data: { appointment: updatedAppointment } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return next(new AppError('This doctor already has an appointment at that time', 409));
    }
    next(err);
  }
};

exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) throw new AppError('No appointment found with that id', 404);
    if (appointment.status === 'cancelled') {
      throw new AppError('This appointment is already cancelled', 409);
    }

    const now = new Date();
    const appointmentTime = parseDateTime(appointment.appt_datetime.slice(0, 16));
    if (appointmentTime <= now) {
      throw new AppError('Past appointments cannot be cancelled', 422);
    }

    const { refundPercent, refundAmount } = calculateRefund(
      Number(appointment.amount_paid),
      appointmentTime,
      now
    );

    const isCancelled = await Appointment.cancel(appointment.id, refundAmount);
    if (!isCancelled) throw new AppError('This appointment is already cancelled', 409);

    const cancelledAppointment = await Appointment.findById(appointment.id);

    writeAuditLog('APPOINTMENT_CANCELLED', {
      appointment_id: cancelledAppointment.id,
      patient_id: cancelledAppointment.patient_id,
      doctor_id: cancelledAppointment.doctor_id,
      appt_datetime: cancelledAppointment.appt_datetime,
      refund_percent: refundPercent,
      refund_amount: cancelledAppointment.refund_amount,
    });
    queue.enqueueJob(queue.JOB_TYPES.SLOT_FREED, {
      doctor_id: cancelledAppointment.doctor_id,
      appt_datetime: cancelledAppointment.appt_datetime,
    });

    res.status(200).json({
      status: 'success',
      message: `Appointment cancelled. Refund: ${cancelledAppointment.refund_amount} (${refundPercent}%)`,
      data: { appointment: cancelledAppointment },
    });
  } catch (err) {
    next(err);
  }
};