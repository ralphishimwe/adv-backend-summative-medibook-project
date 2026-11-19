module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message;

  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'This record already exists or the slot is already taken';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 409;
    message = 'This record cannot be deleted because it has appointments';
  } else if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    statusCode = 422;
    message = 'The data breaks a database rule';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body is not valid JSON';
  } else if (statusCode === 500) {
    console.error('ERROR:', err);
    message = 'Something went wrong on the server';
  }

  res.status(statusCode).json({
    status: statusCode < 500 ? 'fail' : 'error',
    message,
  });
};
