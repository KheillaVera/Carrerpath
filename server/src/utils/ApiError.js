class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, 'bad_request', message, details);
  }
  static unauthorized(message = 'Not authenticated') {
    return new ApiError(401, 'unauthorized', message);
  }
  static forbidden(message = 'Not authorized') {
    return new ApiError(403, 'forbidden', message);
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'not_found', message);
  }
  static conflict(message, details) {
    return new ApiError(409, 'conflict', message, details);
  }
  static validation(details) {
    return new ApiError(422, 'validation_error', 'Validation failed', details);
  }
  static tooMany(message = 'Too many requests') {
    return new ApiError(429, 'rate_limited', message);
  }
}

module.exports = ApiError;
