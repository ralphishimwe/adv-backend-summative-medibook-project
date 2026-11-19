const pool = require('../config/db');

exports.findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT a.id, a.patient_id, p.full_name AS patient_name,
            a.doctor_id, d.full_name AS doctor_name, d.room,
            a.appt_datetime, a.amount_paid, a.status,
            a.booked_at, a.cancelled_at, a.refund_amount
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN doctors d ON d.id = a.doctor_id
     WHERE a.id = ?`,
    [id]
  );
  return rows[0];
};

exports.book = async (appointment, maxPerDay) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute('SELECT id FROM doctors WHERE id = ? FOR UPDATE', [
      appointment.doctor_id,
    ]);

    const [rows] = await connection.execute(
      `SELECT COUNT(*) AS total FROM appointments
       WHERE doctor_id = ? AND status = 'booked' AND DATE(appt_datetime) = DATE(?)`,
      [appointment.doctor_id, appointment.appt_datetime]
    );
    if (rows[0].total >= maxPerDay) {
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