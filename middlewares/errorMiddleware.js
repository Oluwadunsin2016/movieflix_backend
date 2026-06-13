const isProduction = process.env.NODE_ENV === "production";

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || (err.name === "ValidationError" ? 400 : 500);
  const message = err.message || "Internal server error";

  console.error(`[${req.method} ${req.originalUrl}]`, {
    statusCode,
    message,
    stack: err.stack,
  });

  return res.status(statusCode).json({
    success: false,
    message,
    ...(isProduction ? {} : { error: message, stack: err.stack }),
  });
};

module.exports = {
  errorHandler,
  notFound,
};
