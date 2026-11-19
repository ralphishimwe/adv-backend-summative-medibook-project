const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/AppError');
const errorHandler = require('./controllers/errorController');

const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.use((req, res, next) => {
  next(new AppError(`Can't find  ${req.originalUrl} on this server`, 404));
});

app.use(errorHandler);
module.exports = app;
