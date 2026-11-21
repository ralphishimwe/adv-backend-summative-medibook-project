const pool = require('../config/db');

const REVENUE = 'COALESCE(SUM(a.amount_paid - COALESCE(a.refund_amount, 0)), 0)';

exports.getDoctorSummary = async (doctorId, maxPerDay, days) => {
  const [rows] = await pool.execute(
    `SELECT
       ${REVENUE} AS revenue_collected,
       COUNT(CASE WHEN a.status = 'booked' AND a.appt_datetime > NOW() THEN 1 END)
         AS upcoming_appointments,
       ROUND(
         COUNT(CASE WHEN a.status = 'booked'
                     AND a.appt_datetime >= CURDATE()
                     AND a.appt_datetime < CURDATE() + INTERVAL ? DAY THEN 1 END)
         / (? * ?) * 100, 1
       ) AS utilization_percent
     FROM appointments a
     WHERE a.doctor_id = ?`,
    [days, maxPerDay, days, doctorId]
  );
  return rows[0];
};

exports.getDoctorDailyCounts = async (doctorId, maxPerDay, days) => {
  const [rows] = await pool.execute(
    `WITH RECURSIVE calendar AS (
       SELECT CURDATE() AS day
       UNION ALL
       SELECT day + INTERVAL 1 DAY FROM calendar
       WHERE day < CURDATE() + INTERVAL ? - 1 DAY
     )
     SELECT calendar.day AS date,
            COUNT(a.id) AS appointments,
            ROUND(COUNT(a.id) / ? * 100, 1) AS utilization_percent
     FROM calendar
     LEFT JOIN appointments a
       ON a.doctor_id = ?
      AND a.status = 'booked'
      AND DATE(a.appt_datetime) = calendar.day
     GROUP BY calendar.day
     ORDER BY calendar.day`,
    [days, maxPerDay, doctorId]
  );
  return rows;
};

exports.getDoctorsReport = async () => {
  const [rows] = await pool.execute(
    `SELECT d.id AS doctor_id, d.full_name, d.specialty,
            COUNT(CASE WHEN a.status = 'booked' THEN 1 END) AS total_appointments,
            COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) AS cancelled_appointments,
            ${REVENUE} AS revenue_collected
     FROM doctors d
     LEFT JOIN appointments a ON a.doctor_id = d.id
     GROUP BY d.id, d.full_name, d.specialty
     ORDER BY revenue_collected DESC, d.id`
  );
  return rows;
};

exports.getBusyDaysReport = async (maxPerDay, threshold) => {
  const [rows] = await pool.execute(
    `SELECT d.id AS doctor_id, d.full_name,
            DATE(a.appt_datetime) AS appt_date,
            COUNT(*) AS booked_appointments,
            ROUND(COUNT(*) / ? * 100, 1) AS utilization_percent
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     WHERE a.status = 'booked'
     GROUP BY d.id, d.full_name, DATE(a.appt_datetime)
     HAVING COUNT(*) > ? * ?
     ORDER BY appt_date, d.id`,
    [maxPerDay, maxPerDay, threshold]
  );
  return rows;
};
