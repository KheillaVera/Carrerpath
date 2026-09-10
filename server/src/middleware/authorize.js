const ApiError = require('../utils/ApiError');

function requireRole(...roles) {
  const required = roles.flat();
  return function (req, _res, next) {
    if (!req.auth) return next(ApiError.unauthorized());
    const has = required.some((r) => req.auth.roles.includes(r));
    if (!has) return next(ApiError.forbidden('You do not have the required role.'));
    next();
  };
}

function requirePermission(...permissions) {
  const required = permissions.flat();
  return function (req, _res, next) {
    if (!req.auth) return next(ApiError.unauthorized());
    const has = required.every((p) => req.auth.permissions.includes(p));
    if (!has) return next(ApiError.forbidden('You do not have the required permission.'));
    next();
  };
}

module.exports = { requireRole, requirePermission };
