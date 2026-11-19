const { validateAppointmentTime } = require('../src/utils/validators');

const now = new Date(2026, 11, 1, 12, 0);

describe('validateAppointmentTime', () => {
  test('accepts a future slot inside working hours', () => {
    expect(validateAppointmentTime('2026-12-10 10:30', now)).toBeNull();
  });

  test('accepts 16:30, the last slot of the day', () => {
    expect(validateAppointmentTime('2026-12-10 16:30', now)).toBeNull();
  });

  test('rejects 17:00 because the slot would end after closing', () => {
    expect(validateAppointmentTime('2026-12-10 17:00', now).statusCode).toBe(422);
  });

  test('rejects 08:30 because it is before opening', () => {
    expect(validateAppointmentTime('2026-12-10 08:30', now).statusCode).toBe(422);
  });

  test('rejects 09:15 because it is not on a 30-minute boundary', () => {
    expect(validateAppointmentTime('2026-12-10 09:15', now).statusCode).toBe(422);
  });

  test('rejects a time in the past', () => {
    expect(validateAppointmentTime('2026-11-30 10:00', now).statusCode).toBe(422);
  });

  test('rejects a malformed date with 400', () => {
    expect(validateAppointmentTime('tomorrow at 10', now).statusCode).toBe(400);
  });

  test('rejects a date that does not exist with 400', () => {
    expect(validateAppointmentTime('2027-02-30 10:00', now).statusCode).toBe(400);
  });
});