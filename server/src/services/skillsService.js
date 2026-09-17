const db = require('../config/db');
const ApiError = require('../utils/ApiError');

const LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'];

async function listCatalogue({ q, category } = {}) {
  const clauses = ['s.is_active = 1'];
  const params = [];
  if (q) {
    clauses.push('s.name LIKE ?');
    params.push(`%${q}%`);
  }
  if (category) {
    clauses.push('sc.code = ?');
    params.push(category);
  }
  const rows = await db.query(
    `SELECT s.id, s.name, sc.code AS category, sc.name AS categoryName
     FROM skills s
     LEFT JOIN skill_categories sc ON sc.id = s.category_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY s.name
     LIMIT 500`,
    params
  );
  return rows;
}

async function listCategories() {
  return db.query('SELECT id, code, name FROM skill_categories ORDER BY name');
}

async function listUserSkills(userId) {
  return db.query(
    `SELECT us.skill_id AS id, s.name, sc.code AS category, sc.name AS categoryName,
            us.self_level AS selfLevel, us.years_experience AS yearsExperience, us.notes,
            us.verified_level AS verifiedLevel, us.verified_score AS verifiedScore,
            us.verified_at AS verifiedAt,
            us.created_at AS createdAt
     FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     LEFT JOIN skill_categories sc ON sc.id = s.category_id
     WHERE us.user_id = ?
     ORDER BY s.name`,
    [userId]
  );
}

async function addUserSkill(userId, { skillId, selfLevel, yearsExperience, notes }) {
  if (!skillId) throw ApiError.badRequest('skillId is required.');
  const level = LEVELS.includes(selfLevel) ? selfLevel : 'intermediate';

  const rows = await db.query('SELECT id FROM skills WHERE id = ? AND is_active = 1 LIMIT 1', [skillId]);
  if (rows.length === 0) throw ApiError.badRequest('Unknown skill.');

  await db.query(
    `INSERT INTO user_skills (user_id, skill_id, self_level, years_experience, notes)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE self_level = VALUES(self_level),
                             years_experience = VALUES(years_experience),
                             notes = VALUES(notes)`,
    [userId, skillId, level, yearsExperience ?? null, notes ?? null]
  );

  return listUserSkills(userId);
}

async function removeUserSkill(userId, skillId) {
  const result = await db.query(
    'DELETE FROM user_skills WHERE user_id = ? AND skill_id = ?',
    [userId, skillId]
  );
  if (result.affectedRows === 0) throw ApiError.notFound('Skill not found on your profile.');
  return listUserSkills(userId);
}

module.exports = {
  LEVELS,
  listCatalogue,
  listCategories,
  listUserSkills,
  addUserSkill,
  removeUserSkill,
};
