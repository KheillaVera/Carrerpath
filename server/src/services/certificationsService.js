const db = require('../config/db');
const ApiError = require('../utils/ApiError');

const COLUMN = {
  name: 'name',
  issuer: 'issuer',
  issueDate: 'issue_date',
  expiryDate: 'expiry_date',
  credentialId: 'credential_id',
  verificationUrl: 'verification_url',
};

const SELECT_FIELDS = `
  id, name, issuer,
  issue_date AS issueDate,
  expiry_date AS expiryDate,
  credential_id AS credentialId,
  verification_url AS verificationUrl,
  status,
  verified_at AS verifiedAt,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

async function listMine(userId) {
  return db.query(
    `SELECT ${SELECT_FIELDS} FROM certifications WHERE user_id = ? ORDER BY COALESCE(issue_date, created_at) DESC, id DESC`,
    [userId]
  );
}

function normalise(payload) {
  const out = {};
  for (const key of Object.keys(payload)) {
    if (!COLUMN[key]) continue;
    const v = payload[key] === '' ? null : payload[key];
    out[COLUMN[key]] = v;
  }
  return out;
}

async function create(userId, payload) {
  if (!payload.name || !payload.issuer) throw ApiError.badRequest('Name and issuer are required.');
  const cols = normalise(payload);
  const columns = ['user_id', ...Object.keys(cols)];
  const values = [userId, ...Object.values(cols)];
  const placeholders = columns.map(() => '?').join(', ');
  // status defaults to 'pending' at the DB level; user cannot self-verify.
  const [result] = await db.pool.execute(
    `INSERT INTO certifications (${columns.join(', ')}) VALUES (${placeholders})`,
    values
  );
  return getOwn(userId, result.insertId);
}

async function update(userId, id, payload) {
  const cols = normalise(payload);
  const sets = Object.keys(cols).map((c) => `${c} = ?`);
  const values = Object.values(cols);
  if (sets.length === 0) return getOwn(userId, id);
  // Editing a certification resets it to pending, since evidence changed.
  sets.push("status = 'pending'", 'verified_by = NULL', 'verified_at = NULL');
  values.push(id, userId);
  const [result] = await db.pool.execute(
    `UPDATE certifications SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );
  if (result.affectedRows === 0) throw ApiError.notFound('Certification not found.');
  return getOwn(userId, id);
}

async function getOwn(userId, id) {
  const rows = await db.query(`SELECT ${SELECT_FIELDS} FROM certifications WHERE id = ? AND user_id = ? LIMIT 1`, [id, userId]);
  if (rows.length === 0) throw ApiError.notFound('Certification not found.');
  return rows[0];
}

async function remove(userId, id) {
  const result = await db.query('DELETE FROM certifications WHERE id = ? AND user_id = ?', [id, userId]);
  if (result.affectedRows === 0) throw ApiError.notFound('Certification not found.');
}

module.exports = { listMine, create, update, remove };
