const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\- ]{7,20}$/;

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