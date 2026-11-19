const pool = require('../config/db');

const SELECT_APPOINTMENTS = `
  SELECT a.id, a.patient_id, p.full_name AS patient_name,
         a.doctor_id, d.full_name AS doctor_name, d.room,
         a.appt_datetime, a.amount_paid, a.status,
         a.booked_at, a.cancelled_at, a.refund_amount
  FROM appointments a
  JOIN patients p ON p.id = a.patient_id
  JOIN doctors d ON d.id = a.doctor_id`;

const lockDoctor = (connection, doctorId) =>
  connection.execute('SELECT id FROM doctors WHERE id = ? FOR UPDATE', [doctorId]);

const countBookedOnDay = async (connection, doctorId, apptDatetime, excludeId = 0) => {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS total FROM appointments
     WHERE doctor_id = ? AND status = 'booked'
       AND DATE(appt_datetime) = DATE(?) AND id <> ?`,
    [doctorId, apptDatetime, excludeId]
  );
  return rows[0].total;
};

exports.findAll = async () => {
  const [rows] = await pool.execute(`${SELECT_APPOINTMENTS} ORDER BY a.appt_datetime`);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await pool.execute(`${SELECT_APPOINTMENTS} WHERE a.id = ?`, [id]);
  return rows[0];
};

exports.book = async (appointment, maxPerDay) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await lockDoctor(connection, appointment.doctor_id);

    const total = await countBookedOnDay(connection, appointment.doctor_id, appointment.appt_datetime);
    if (total >= maxPerDay) {
      await connection.rollback();
      return { isDayFull: true };
    }

    const [result] = await connection.execute(
      'INSERT INTO appointments (patient_id, doctor_id, appt_datetime, amount_paid) VALUES (?, ?, ?, ?)',
      [
        appointment.patient_id,
        appointment.doctor_id,
        appointment.appt_datetime,
        appointment.amount_paid,
      ]
    );

    await connection.commit();
    return { isDayFull: false, appointmentId: result.insertId };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

exports.reschedule = async (id, doctorId, newDatetime, maxPerDay) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await lockDoctor(connection, doctorId);

    const [rows] = await connection.execute(
      'SELECT status FROM appointments WHERE id = ? FOR UPDATE',
      [id]
    );
    if (rows[0].status !== 'booked') {
      await connection.rollback();
      return { isCancelled: true };
    }

    const total = await countBookedOnDay(connection, doctorId, newDatetime, id);
    if (total >= maxPerDay) {
      await connection.rollback();
      return { isDayFull: true };
    }

    await connection.execute('UPDATE appointments SET appt_datetime = ? WHERE id = ?', [
      newDatetime,
      id,
    ]);

    await connection.commit();
    return { isCancelled: false, isDayFull: false };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

exports.cancel = async (id, refundAmount) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      'SELECT status FROM appointments WHERE id = ? FOR UPDATE',
      [id]
    );
    if (rows.length === 0 || rows[0].status !== 'booked') {
      await connection.rollback();
      return false;
    }

    await connection.execute(
      `UPDATE appointments
       SET status = 'cancelled', cancelled_at = NOW(), refund_amount = ?
       WHERE id = ?`,
      [refundAmount, id]
    );

    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};