const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');
const ApiError = require('../utils/ApiError');

function readToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

async function authenticate(req, _res, next) {
  try {
    const token = readToken(req);
    if (!token) throw ApiError.unauthorized();

    let payload;
    try {
      payload = jwt.verify(token, env.jwt.secret);
    } catch (_) {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const users = await db.query(
      'SELECT id, email, full_name, is_active FROM users WHERE id = ? LIMIT 1',
      [payload.sub]
    );
    const user = users[0];
    if (!user || !user.is_active) throw ApiError.unauthorized('Account not available');

    const roleRows = await db.query(
      `SELECT r.code FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [user.id]
    );
    const permissionRows = await db.query(
      `SELECT DISTINCT p.code FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = ?`,
      [user.id]
    );

    req.auth = {
      user: { id: user.id, email: user.email, fullName: user.full_name },
      roles: roleRows.map((r) => r.code),
      permissions: permissionRows.map((p) => p.code),
    };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
