const pool = require('../config/db');

exports.findAll = async () => {
  const [rows] = await pool.execute(
    'SELECT id, full_name, email, phone, created_at FROM patients ORDER BY id'
  );
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT id, full_name, email, phone, created_at FROM patients WHERE id = ?',
    [id]
  );
  return rows[0];
};

exports.create = async (patient) => {
  const [result] = await pool.execute(
    'INSERT INTO patients (full_name, email, phone) VALUES (?, ?, ?)',
    [patient.full_name, patient.email, patient.phone]
  );
  return result.insertId;
};

exports.update = async (id, patient) => {
  await pool.execute(
    'UPDATE patients SET full_name = ?, email = ?, phone = ? WHERE id = ?',
    [patient.full_name, patient.email, patient.phone, id]
  );
};

exports.remove = async (id) => {
  const [result] = await pool.execute('DELETE FROM patients WHERE id = ?', [id]);
  return result.affectedRows;
};