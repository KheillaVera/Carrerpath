const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const REGISTERABLE_ROLES = ['job_seeker', 'employer', 'training_provider', 'mentor'];

function signToken(userId) {
  return jwt.sign({ sub: userId }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

async function loadUserContext(userId) {
  const users = await db.query(
    'SELECT id, email, full_name, phone, is_active, created_at FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  const user = users[0];
  if (!user) throw ApiError.notFound('User not found');
  const roles = await db.query(
    `SELECT r.code FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`,
    [userId]
  );
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    phone: user.phone,
    isActive: !!user.is_active,
    createdAt: user.created_at,
    roles: roles.map((r) => r.code),
  };
}

async function register({ email, password, fullName, role, phone }) {
  const targetRole = REGISTERABLE_ROLES.includes(role) ? role : 'job_seeker';
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
  if (existing.length > 0) throw ApiError.conflict('An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);

  const userId = await db.withTransaction(async (conn) => {
    const [insertResult] = await conn.query(
      `INSERT INTO users (email, password_hash, full_name, phone, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [normalizedEmail, passwordHash, fullName.trim(), phone || null]
    );
    const newId = insertResult.insertId;

    const [roleRows] = await conn.query('SELECT id FROM roles WHERE code = ? LIMIT 1', [targetRole]);
    if (roleRows.length === 0) throw ApiError.badRequest('Requested role does not exist. Run seed first.');
    await conn.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [newId, roleRows[0].id]);

    if (targetRole === 'job_seeker') {
      await conn.query('INSERT INTO job_seeker_profiles (user_id) VALUES (?)', [newId]);
    }

    await conn.query(
      `INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
       VALUES (?, 'user.register', 'user', ?, JSON_OBJECT('role', ?))`,
      [newId, String(newId), targetRole]
    );

    return newId;
  });

  const user = await loadUserContext(userId);
  const token = signToken(userId);
  return { user, token };
}

async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const rows = await db.query(
    'SELECT id, password_hash, is_active FROM users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );
  const record = rows[0];
  const genericMessage = 'Invalid email or password.';
  if (!record) throw ApiError.unauthorized(genericMessage);
  if (!record.is_active) throw ApiError.unauthorized('This account is not active.');
  const ok = await bcrypt.compare(password, record.password_hash);
  if (!ok) throw ApiError.unauthorized(genericMessage);

  await db.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [record.id]);
  await db.query(
    `INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id)
     VALUES (?, 'user.login', 'user', ?)`,
    [record.id, String(record.id)]
  );

  const user = await loadUserContext(record.id);
  const token = signToken(record.id);
  return { user, token };
}

module.exports = {
  register,
  login,
  loadUserContext,
  REGISTERABLE_ROLES,
};
