require('dotenv').config({ quiet: true });
const queue = require('./utils/queue');
const Appointment = require('./models/appointmentModel');
const Doctor = require('./models/doctorModel');
const writeAuditLog = require('./utils/auditLog');
const { validateAppointmentTime } = require('./utils/validators');
const { MAX_APPOINTMENTS_PER_DAY } = require('./config/constants');

const { JOB_TYPES } = queue;

const sendConfirmation = async ({ appointment_id }) => {
  const appointment = await Appointment.findById(appointment_id);
  if (!appointment) return;

  await writeAuditLog('CONFIRMATION_SENT', {
    appointment_id: appointment.id,
    patient_id: appointment.patient_id,
    message: `Hi ${appointment.patient_name}, your appointment with ${appointment.doctor_name} on ${appointment.appt_datetime} in room ${appointment.room} is confirmed.`,
  });
};

const promoteFromWaitlist = async ({ doctor_id, appt_datetime }) => {
  const date = appt_datetime.slice(0, 10);
  const patientId = await queue.peekWaitlist(doctor_id, date);
  if (!patientId) return;

  const failPromotion = (reason) =>
    writeAuditLog('WAITLIST_PROMOTION_FAILED', {
      patient_id: Number(patientId),
      doctor_id,
      appt_datetime,
      reason,
    });

  const timeError = validateAppointmentTime(appt_datetime.slice(0, 16));
  if (timeError) return failPromotion(timeError.message);

  try {
    const doctor = await Doctor.findById(doctor_id);
    const result = await Appointment.book(
      {
        patient_id: Number(patientId),
        doctor_id,
        appt_datetime,
        amount_paid: doctor.consultation_fee,
      },
      MAX_APPOINTMENTS_PER_DAY
    );
    if (result.isDayFull) return failPromotion('The doctor is fully booked that day');

    await queue.removeFirstFromWaitlist(doctor_id, date);
    await writeAuditLog('WAITLIST_PROMOTED', {
      appointment_id: result.appointmentId,
      patient_id: Number(patientId),
      doctor_id,
      appt_datetime,
    });
    await queue.enqueueJob(JOB_TYPES.SEND_CONFIRMATION, { appointment_id: result.appointmentId });
  } catch (err) {
    await failPromotion(err.message);
  }
};

const handleJob = async (job) => {
  if (job.type === JOB_TYPES.SLOT_FREED) {
    await promoteFromWaitlist(job.data);
  } else if (job.type === JOB_TYPES.SEND_CONFIRMATION) {
    await sendConfirmation(job.data);
  }
};

const startWorker = async () => {
  await queue.connect();
  console.log('Worker connected to Redis, waiting for jobs...');

  while (true) {
    const job = await queue.waitForJob();
    console.log(`Processing ${job.type} job`);
    try {
      await handleJob(job);
    } catch (err) {
      console.error(`${job.type} job failed:`, err.message);
    }
  }
};

startWorker().catch((err) => {
  console.error('Worker could not start:', err.message);
  process.exit(1);
});