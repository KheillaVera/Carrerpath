const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Translates errors raised by the framework — not just our own ApiError — into
 * the same response shape. Without this, a client that sends a body over the
 * size limit or malformed JSON gets a 500 and the server logs a stack trace for
 * what is really a bad request.
 */
function normalize(err) {
  if (err instanceof ApiError) {
    return { status: err.status, code: err.code, message: err.message, details: err.details };
  }

  // body-parser: request entity larger than the configured limit.
  if (err.type === 'entity.too.large') {
    return {
      status: 413,
      code: 'payload_too_large',
      message: 'That request was too large. Reduce the amount of text and try again.',
    };
  }

  // body-parser: the request claimed JSON but did not contain valid JSON.
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return { status: 400, code: 'malformed_json', message: 'The request body is not valid JSON.' };
  }

  if (err.type === 'entity.parse.failed') {
    return { status: 400, code: 'malformed_json', message: 'The request body could not be parsed.' };
  }

  // Any other error that already carries a client-error status is honoured.
  const status = err.status || err.statusCode;
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return { status, code: err.code || 'bad_request', message: err.message || 'Bad request.' };
  }

  return {
    status: 500,
    code: 'internal_error',
    message: env.nodeEnv === 'production'
      ? 'An unexpected error occurred.'
      : err.message || 'Internal server error',
  };
}

function errorHandler(err, req, res, _next) {
  const { status, code, message, details } = normalize(err);

  // Only genuine faults are logged with their stack; client mistakes are noise.
  if (status >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  } else if (env.nodeEnv === 'development' && status !== 401 && status !== 404) {
    console.warn(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${status} ${code}`);
  }

  const body = { error: { code, message } };
  if (details) body.error.details = details;

  res.status(status).json(body);
}

module.exports = { notFoundHandler, errorHandler };
