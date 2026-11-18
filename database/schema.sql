
DROP DATABASE IF EXISTS medibook;
CREATE DATABASE medibook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medibook;

CREATE TABLE patients (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  full_name   VARCHAR(100)  NOT NULL,
  email       VARCHAR(255)  NOT NULL,
  phone       VARCHAR(20)   NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_patients        PRIMARY KEY (id),
  CONSTRAINT uq_patients_email  UNIQUE (email),
  CONSTRAINT uq_patients_phone  UNIQUE (phone),
  CONSTRAINT chk_patients_name  CHECK (CHAR_LENGTH(TRIM(full_name)) > 0)
);

CREATE TABLE doctors (
  id                INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  full_name         VARCHAR(100)   NOT NULL,
  specialty         VARCHAR(100)   NOT NULL,
  consultation_fee  DECIMAL(8,2)   NOT NULL,
  room              VARCHAR(10)    NOT NULL,
  created_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_doctors       PRIMARY KEY (id),
  CONSTRAINT chk_doctors_name CHECK (CHAR_LENGTH(TRIM(full_name)) > 0),
  CONSTRAINT chk_doctors_fee  CHECK (consultation_fee >= 0)
);

CREATE TABLE appointments (
  id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  patient_id     INT UNSIGNED   NOT NULL,
  doctor_id      INT UNSIGNED   NOT NULL,
  appt_datetime  DATETIME       NOT NULL,
  amount_paid    DECIMAL(8,2)   NOT NULL,
  status         ENUM('booked','cancelled') NOT NULL DEFAULT 'booked',
  booked_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at   DATETIME       NULL,
  refund_amount  DECIMAL(8,2)   NULL,
  active_slot    DATETIME GENERATED ALWAYS AS (IF(status = 'booked', appt_datetime, NULL)) STORED,

  CONSTRAINT pk_appointments PRIMARY KEY (id),

  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id)
    REFERENCES patients (id) ON DELETE RESTRICT,
  CONSTRAINT fk_appointments_doctor  FOREIGN KEY (doctor_id)
    REFERENCES doctors (id)  ON DELETE RESTRICT,

  CONSTRAINT uq_doctor_active_slot UNIQUE (doctor_id, active_slot),

  CONSTRAINT chk_appt_slot_boundary
    CHECK (MINUTE(appt_datetime) IN (0, 30) AND SECOND(appt_datetime) = 0),

  CONSTRAINT chk_appt_working_hours
    CHECK (TIME(appt_datetime) BETWEEN '09:00:00' AND '16:30:00'),

  CONSTRAINT chk_appt_amount_paid CHECK (amount_paid >= 0),

  CONSTRAINT chk_appt_refund
    CHECK (refund_amount IS NULL OR (refund_amount >= 0 AND refund_amount <= amount_paid)),


  CONSTRAINT chk_appt_cancellation
    CHECK (
      (status = 'booked'    AND cancelled_at IS NULL     AND refund_amount IS NULL) OR
      (status = 'cancelled' AND cancelled_at IS NOT NULL AND refund_amount IS NOT NULL)
    ),

  INDEX idx_appointments_doctor_datetime (doctor_id, appt_datetime),
  INDEX idx_appointments_patient (patient_id)
);