const db = require('../config/db');
const ApiError = require('../utils/ApiError');

const COLUMN = {
  institution: 'institution',
  qualification: 'qualification',
  fieldOfStudy: 'field_of_study',
  startDate: 'start_date',
  endDate: 'end_date',
  isCurrent: 'is_current',
  description: 'description',
};

const SELECT_FIELDS = `
  id, institution, qualification,
  field_of_study AS fieldOfStudy,
  start_date AS startDate,
  end_date AS endDate,
  is_current AS isCurrent,
  description,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

async function listMine(userId) {
  return db.query(
    `SELECT ${SELECT_FIELDS} FROM education WHERE user_id = ? ORDER BY COALESCE(end_date, start_date) DESC, id DESC`,
    [userId]
  );
}

function normalise(payload) {
  const out = {};
  for (const key of Object.keys(payload)) {
    if (!COLUMN[key]) continue;
    let v = payload[key];
    if (v === '') v = null;
    if (key === 'isCurrent') v = v ? 1 : 0;
    out[COLUMN[key]] = v;
  }
  return out;
}

async function create(userId, payload) {
  if (!payload.institution || !payload.qualification) {
    throw ApiError.badRequest('Institution and qualification are required.');
  }
  const cols = normalise(payload);
  const columns = ['user_id', ...Object.keys(cols)];
  const values = [userId, ...Object.values(cols)];
  const placeholders = columns.map(() => '?').join(', ');
  const [result] = await db.pool.execute(
    `INSERT INTO education (${columns.join(', ')}) VALUES (${placeholders})`,
    values
  );
  const rows = await db.query(`SELECT ${SELECT_FIELDS} FROM education WHERE id = ? LIMIT 1`, [result.insertId]);
  return rows[0];
}

async function update(userId, id, payload) {
  const cols = normalise(payload);
  const sets = Object.keys(cols).map((c) => `${c} = ?`);
  const values = Object.values(cols);
  if (sets.length === 0) return getOwn(userId, id);
  values.push(id, userId);
  const [result] = await db.pool.execute(
    `UPDATE education SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );
  if (result.affectedRows === 0) throw ApiError.notFound('Education entry not found.');
  return getOwn(userId, id);
}

async function getOwn(userId, id) {
  const rows = await db.query(`SELECT ${SELECT_FIELDS} FROM education WHERE id = ? AND user_id = ? LIMIT 1`, [id, userId]);
  if (rows.length === 0) throw ApiError.notFound('Education entry not found.');
  return rows[0];
}

async function remove(userId, id) {
  const result = await db.query('DELETE FROM education WHERE id = ? AND user_id = ?', [id, userId]);
  if (result.affectedRows === 0) throw ApiError.notFound('Education entry not found.');
}

module.exports = { listMine, create, update, remove };
