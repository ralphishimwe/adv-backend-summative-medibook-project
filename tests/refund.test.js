const { calculateRefund } = require('../src/utils/refund');

const MS_PER_HOUR = 60 * 60 * 1000;
const appointmentTime = new Date(2026, 11, 10, 10, 0);
const hoursBefore = (hours) => new Date(appointmentTime.getTime() - hours * MS_PER_HOUR);

describe('calculateRefund', () => {
  test('more than 48 hours notice gives a 100% refund', () => {
    expect(calculateRefund(150, appointmentTime, hoursBefore(72))).toEqual({
      refundPercent: 100,
      refundAmount: 150,
    });
  });

  test('exactly 48 hours notice gives a 50% refund', () => {
    expect(calculateRefund(150, appointmentTime, hoursBefore(48))).toEqual({
      refundPercent: 50,
      refundAmount: 75,
    });
  });

  test('one minute over 48 hours gives a 100% refund', () => {
    expect(calculateRefund(150, appointmentTime, hoursBefore(48 + 1 / 60)).refundPercent).toBe(100);
  });

  test('between 24 and 48 hours notice gives a 50% refund', () => {
    expect(calculateRefund(120, appointmentTime, hoursBefore(30))).toEqual({
      refundPercent: 50,
      refundAmount: 60,
    });
  });

  test('exactly 24 hours notice gives a 50% refund', () => {
    expect(calculateRefund(100, appointmentTime, hoursBefore(24))).toEqual({
      refundPercent: 50,
      refundAmount: 50,
    });
  });

  test('less than 24 hours notice gives no refund', () => {
    expect(calculateRefund(100, appointmentTime, hoursBefore(23))).toEqual({
      refundPercent: 0,
      refundAmount: 0,
    });
  });
});