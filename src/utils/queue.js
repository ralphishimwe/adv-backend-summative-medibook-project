const createRedisClient = require('../config/redis');

const JOB_QUEUE = 'medibook:jobs';
const waitlistKey = (doctorId, date) => `medibook:waitlist:${doctorId}:${date}`;

exports.JOB_TYPES = {
  SLOT_FREED: 'SLOT_FREED',
  SEND_CONFIRMATION: 'SEND_CONFIRMATION',
};

let client;

exports.connect = async () => {
  client = await createRedisClient();
};

exports.addToWaitlist = async (doctorId, date, patientId) => {
  const key = waitlistKey(doctorId, date);
  const existingPosition = await client.lPos(key, String(patientId));
  if (existingPosition !== null) return null;

  return client.rPush(key, String(patientId));
};

exports.peekWaitlist = (doctorId, date) => client.lIndex(waitlistKey(doctorId, date), 0);

exports.removeFirstFromWaitlist = (doctorId, date) => client.lPop(waitlistKey(doctorId, date));

exports.enqueueJob = async (type, data) => {
  try {
    await client.rPush(JOB_QUEUE, JSON.stringify({ type, data }));
  } catch (err) {
    console.error(`Could not enqueue ${type} job:`, err.message);
  }
};

exports.waitForJob = async () => {
  const result = await client.blPop(JOB_QUEUE, 0);
  return JSON.parse(result.element);
};