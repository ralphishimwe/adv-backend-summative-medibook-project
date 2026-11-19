const pool = require('../config/db');

exports.findAll = async () => {
  const [rows] = await pool.execute(
    'SELECT id, full_name, specialty, consultation_fee, room, created_at FROM doctors ORDER BY id'
  );
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT id, full_name, specialty, consultation_fee, room, created_at FROM doctors WHERE id = ?',
    [id]
  );
  return rows[0];
};

exports.create = async (doctor) => {
  const [result] = await pool.execute(
    'INSERT INTO doctors (full_name, specialty, consultation_fee, room) VALUES (?, ?, ?, ?)',
    [doctor.full_name, doctor.specialty, doctor.consultation_fee, doctor.room]
  );
  return result.insertId;
};

exports.update = async (id, doctor) => {
  await pool.execute(
    'UPDATE doctors SET full_name = ?, specialty = ?, consultation_fee = ?, room = ? WHERE id = ?',
    [doctor.full_name, doctor.specialty, doctor.consultation_fee, doctor.room, id]
  );
};

exports.remove = async (id) => {
  const [result] = await pool.execute('DELETE FROM doctors WHERE id = ?', [id]);
  return result.affectedRows;
};