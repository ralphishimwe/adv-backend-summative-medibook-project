const {
  FULL_REFUND_HOURS,
  HALF_REFUND_HOURS,
  HALF_REFUND_RATE,
} = require('../config/constants');

const MS_PER_HOUR = 60 * 60 * 1000;

exports.calculateRefund = (amountPaid, appointmentTime, cancelTime) => {
  const hoursNotice = (appointmentTime - cancelTime) / MS_PER_HOUR;

  let refundRate = 0;
  if (hoursNotice > FULL_REFUND_HOURS) {
    refundRate = 1;
  } else if (hoursNotice >= HALF_REFUND_HOURS) {
    refundRate = HALF_REFUND_RATE;
  }

  const refundAmount = Math.round(amountPaid * refundRate * 100) / 100;
  return { refundPercent: refundRate * 100, refundAmount };
};