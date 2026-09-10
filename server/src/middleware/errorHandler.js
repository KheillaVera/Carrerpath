const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, _next) {
  const isApiError = err instanceof ApiError;
  const status = isApiError ? err.status : 500;
  const code = isApiError ? err.code : 'internal_error';
  const message = isApiError
    ? err.message
    : env.nodeEnv === 'production'
      ? 'An unexpected error occurred.'
      : err.message || 'Internal server error';

  if (!isApiError || status >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  }

  const body = { error: { code, message } };
  if (isApiError && err.details) body.error.details = err.details;

  res.status(status).json(body);
}

module.exports = { notFoundHandler, errorHandler };
