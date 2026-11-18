USE medibook;

SET @past      = CURDATE() - INTERVAL 5 DAY;
SET @yesterday = CURDATE() - INTERVAL 1 DAY;
SET @day1      = CURDATE() + INTERVAL 1 DAY;
SET @day3      = CURDATE() + INTERVAL 3 DAY;

-- ---------------- patients ----------------
INSERT INTO patients (full_name, email, phone) VALUES
  ('Ama Mensah',    'ama@mail.com',     '0244-111-222'),
  ('Kojo Owusu',    'kojo@mail.com',    '0555-333-444'),
  ('Uwacu Oriane',   'oriane@mail.com',    '0277-555-666'),
  ('Keza Doreen',     'doreen@mail.com',     '0201-777-888'),
  ('Teta Ketts',  'ketts@mail.com',  '0243-999-000'),
  ('Mukunzi Calvin',  'calvin@mail.com', '0266-121-314');

INSERT INTO doctors (full_name, specialty, consultation_fee, room) VALUES
  ('Dr. Boateng', 'Dermatology', 150.00, 'R-12'),
  ('Dr. Adjei',   'Paediatrics', 100.00, 'R-03'),
  ('Dr. Kevin',   'Cardiology',  200.00, 'R-07');

INSERT INTO appointments (patient_id, doctor_id, appt_datetime, amount_paid, booked_at) VALUES
  (1, 1, TIMESTAMP(@past, '09:00:00'), 150.00, @past - INTERVAL 10 DAY),
  (2, 1, TIMESTAMP(@past, '09:30:00'), 120.00, @past - INTERVAL 9 DAY),
  (1, 2, TIMESTAMP(@past, '10:00:00'), 100.00, @past - INTERVAL 8 DAY);

INSERT INTO appointments (patient_id, doctor_id, appt_datetime, amount_paid) VALUES
  (4, 2, TIMESTAMP(@day1, '10:00:00'), 100.00);

INSERT INTO appointments
  (patient_id, doctor_id, appt_datetime, amount_paid, status, booked_at, cancelled_at, refund_amount) VALUES
  (3, 2, TIMESTAMP(@day1, '11:00:00'), 100.00, 'cancelled',
   @past, TIMESTAMP(@yesterday, '12:00:00'), 50.00);

INSERT INTO appointments (patient_id, doctor_id, appt_datetime, amount_paid) VALUES
  (1, 1, TIMESTAMP(@day3, '09:00:00'), 150.00),
  (2, 1, TIMESTAMP(@day3, '09:30:00'), 150.00),
  (3, 1, TIMESTAMP(@day3, '10:00:00'), 150.00),
  (4, 1, TIMESTAMP(@day3, '10:30:00'), 150.00),
  (5, 1, TIMESTAMP(@day3, '11:00:00'), 150.00),
  (6, 1, TIMESTAMP(@day3, '11:30:00'), 150.00),
  (1, 1, TIMESTAMP(@day3, '12:00:00'), 150.00),
  (2, 1, TIMESTAMP(@day3, '12:30:00'), 150.00),
  (3, 1, TIMESTAMP(@day3, '13:00:00'), 150.00),
  (4, 1, TIMESTAMP(@day3, '13:30:00'), 150.00),
  (5, 1, TIMESTAMP(@day3, '14:00:00'), 150.00);