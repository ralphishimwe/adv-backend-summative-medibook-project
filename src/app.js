const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/AppError');
const errorHandler = require('./controllers/errorController');
const patientRouter = require('./routes/patientRoutes');
const doctorRouter = require('./routes/doctorRoutes');
const appointmentRouter = require('./routes/appointmentRoutes');
const waitlistRouter = require('./routes/waitlistRoutes');

const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.use('/api/v1/patients', patientRouter);
app.use('/api/v1/doctors', doctorRouter);
app.use('/api/v1/appointments', appointmentRouter);
app.use('/api/v1/waitlist', waitlistRouter);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorHandler);

module.exports = app;