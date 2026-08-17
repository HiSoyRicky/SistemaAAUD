// errorHandler.js

function errorHandler(err, req, res, next) {
  req.log.error(
    {
      err,
      url: req.url,
      method: req.method,
    },
    'Unhandled error'
  );

  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational === true;

  res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : 'Error interno del servidor',
    code: isOperational ? err.code || 'APP_ERROR' : 'SERVER_ERROR',
    details: isOperational ? err.details || null : null,
  });
}

export default errorHandler;
