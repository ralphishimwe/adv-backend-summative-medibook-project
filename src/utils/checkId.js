const AppError = require('./AppError');
const { isValidId } = require('./validators');

module.exports = (req, res, next, id) => {
  if (!isValidId(id)) {
    return next(new AppError('id must be a positive whole number', 400));
  }
  next();
};