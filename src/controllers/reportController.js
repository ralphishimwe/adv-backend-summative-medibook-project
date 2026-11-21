const Report = require('../models/reportModel');
const Doctor = require('../models/doctorModel');
const AppError = require('../utils/AppError');
const {
  MAX_APPOINTMENTS_PER_DAY,
  BUSY_DAY_THRESHOLD,
  STATS_DAYS,
} = require('../config/constants');

exports.getDoctorStats = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) throw new AppError('No doctor found with that id', 404);

    const summary = await Report.getDoctorSummary(doctor.id, MAX_APPOINTMENTS_PER_DAY, STATS_DAYS);
    const nextDays = await Report.getDoctorDailyCounts(
      doctor.id,
      MAX_APPOINTMENTS_PER_DAY,
      STATS_DAYS
    );

    res.status(200).json({
      status: 'success',
      data: {
        doctor: { id: doctor.id, full_name: doctor.full_name, specialty: doctor.specialty },
        daily_cap: MAX_APPOINTMENTS_PER_DAY,
        revenue_collected: summary.revenue_collected,
        upcoming_appointments: summary.upcoming_appointments,
        utilization_percent_next_7_days: summary.utilization_percent,
        next_7_days: nextDays,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getDoctorsReport = async (req, res, next) => {
  try {
    const doctors = await Report.getDoctorsReport();
    res.status(200).json({ status: 'success', results: doctors.length, data: { doctors } });
  } catch (err) {
    next(err);
  }
};

exports.getBusyDaysReport = async (req, res, next) => {
  try {
    const busyDays = await Report.getBusyDaysReport(MAX_APPOINTMENTS_PER_DAY, BUSY_DAY_THRESHOLD);
    res.status(200).json({
      status: 'success',
      threshold: `more than ${BUSY_DAY_THRESHOLD * 100}% of ${MAX_APPOINTMENTS_PER_DAY} slots`,
      results: busyDays.length,
      data: { busy_days: busyDays },
    });
  } catch (err) {
    next(err);
  }
};
