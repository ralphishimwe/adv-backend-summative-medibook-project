const { SLOT_MINUTES, OPENING_HOUR, CLOSING_HOUR } = require('../config/constants');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\- ]{7,20}$/;

exports.PATIENT_FIELDS = ['full_name', 'email', 'phone'];
exports.DOCTOR_FIELDS = ['full_name', 'specialty', 'consultation_fee', 'room'];
exports.APPOINTMENT_FIELDS = ['patient_id', 'doctor_id', 'appt_datetime'];
exports.RESCHEDULE_FIELDS = ['appt_datetime'];
exports.WAITLIST_FIELDS = ['patient_id', 'doctor_id', 'date'];

exports.checkUnknownFields = (body, allowedFields) => {
  const unknownFields = Object.keys(body).filter((field) => !allowedFields.includes(field));
  if (unknownFields.length > 0) {
    return `Unknown field(s): ${unknownFields.join(', ')}. Allowed fields: ${allowedFields.join(', ')}`;
  }
  return null;
};

const isFilledString = (value, maxLength) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;

exports.isValidId = (id) => /^[1-9][0-9]*$/.test(id);

exports.validatePatient = (patient) => {
  if (!isFilledString(patient.full_name, 100)) {
    return 'full_name is required and must be at most 100 characters';
  }
  if (!isFilledString(patient.email, 255) || !EMAIL_PATTERN.test(patient.email)) {
    return 'email must be a valid email address';
  }
  if (typeof patient.phone !== 'string' || !PHONE_PATTERN.test(patient.phone)) {
    return 'phone must be 7-20 characters using digits, spaces, + or -';
  }
  return null;
};

exports.validateDoctor = (doctor) => {
  if (!isFilledString(doctor.full_name, 100)) {
    return 'full_name is required and must be at most 100 characters';
  }
  if (!isFilledString(doctor.specialty, 100)) {
    return 'specialty is required and must be at most 100 characters';
  }
  const fee = doctor.consultation_fee;
  if (typeof fee !== 'number' || !Number.isFinite(fee) || fee < 0 || fee > 999999.99) {
    return 'consultation_fee must be a number between 0 and 999999.99';
  }
  if (!isFilledString(doctor.room, 10)) {
    return 'room is required and must be at most 10 characters';
  }
  return null;
};

const DATETIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;

exports.parseDateTime = (value) => {
  const match = typeof value === 'string' ? value.match(DATETIME_PATTERN) : null;
  if (!match) return null;

  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day, hour, minute);

  const isRealDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute;

  return isRealDate ? date : null;
};

exports.validateAppointmentTime = (value, now = new Date()) => {
  const date = exports.parseDateTime(value);
  if (!date) {
    return { statusCode: 400, message: 'appt_datetime must be a real date in the format YYYY-MM-DD HH:MM' };
  }
  if (date <= now) {
    return { statusCode: 422, message: 'Appointments can only be booked in the future' };
  }
  if (date.getMinutes() % SLOT_MINUTES !== 0) {
    return { statusCode: 422, message: 'Appointments must start on a 30-minute boundary (:00 or :30)' };
  }

  const startMinutes = date.getHours() * 60 + date.getMinutes();
  const isWithinHours =
    startMinutes >= OPENING_HOUR * 60 && startMinutes + SLOT_MINUTES <= CLOSING_HOUR * 60;
  if (!isWithinHours) {
    return { statusCode: 422, message: 'Appointments must be within working hours 09:00-17:00 (last slot starts at 16:30)' };
  }

  return null;
};


exports.validateWaitlistDate = (value, now = new Date()) => {
  const date = exports.parseDateTime(`${value} 00:00`);
  if (!date) {
    return { statusCode: 400, message: 'date must be a real date in the format YYYY-MM-DD' };
  }

  const lastSlotStart = new Date(date);
  lastSlotStart.setHours(CLOSING_HOUR, -SLOT_MINUTES);
  if (lastSlotStart <= now) {
    return { statusCode: 422, message: 'You can only join the waitlist for a future day' };
  }

  return null;
};