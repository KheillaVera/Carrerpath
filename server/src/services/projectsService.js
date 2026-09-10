const db = require('../config/db');
const ApiError = require('../utils/ApiError');

const PROJECT_TYPES = ['personal', 'academic', 'professional', 'open_source', 'freelance', 'other'];

const COLUMN = {
  title: 'title',
  description: 'description',
  projectType: 'project_type',
  role: 'role',
  githubUrl: 'github_url',
  liveDemoUrl: 'live_demo_url',
  imageUrl: 'image_url',
  completionDate: 'completion_date',
};

const SELECT_FIELDS = `
  p.id, p.title, p.description,
  p.project_type AS projectType,
  p.role,
  p.github_url AS githubUrl,
  p.live_demo_url AS liveDemoUrl,
  p.image_url AS imageUrl,
  p.completion_date AS completionDate,
  p.created_at AS createdAt,
  p.updated_at AS updatedAt
`;

async function loadSkillsForProjects(projectIds) {
  if (projectIds.length === 0) return new Map();
  const placeholders = projectIds.map(() => '?').join(',');
  const rows = await db.query(
    `SELECT ps.project_id AS projectId, s.id, s.name
     FROM project_skills ps
     JOIN skills s ON s.id = ps.skill_id
     WHERE ps.project_id IN (${placeholders})
     ORDER BY s.name`,
    projectIds
  );
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.projectId)) map.set(row.projectId, []);
    map.get(row.projectId).push({ id: row.id, name: row.name });
  }
  return map;
}

async function listMine(userId) {
  const projects = await db.query(
    `SELECT ${SELECT_FIELDS} FROM projects p WHERE p.user_id = ? ORDER BY p.completion_date DESC, p.id DESC`,
    [userId]
  );
  const skillsMap = await loadSkillsForProjects(projects.map((p) => p.id));
  return projects.map((p) => ({ ...p, skills: skillsMap.get(p.id) || [] }));
}

async function getOwn(userId, projectId) {
  const rows = await db.query(
    `SELECT ${SELECT_FIELDS} FROM projects p WHERE p.id = ? AND p.user_id = ? LIMIT 1`,
    [projectId, userId]
  );
  if (rows.length === 0) throw ApiError.notFound('Project not found.');
  const [proj] = rows;
  const skillsMap = await loadSkillsForProjects([proj.id]);
  return { ...proj, skills: skillsMap.get(proj.id) || [] };
}

function buildInsertColumns(payload) {
  const cols = [];
  const values = [];
  for (const key of Object.keys(payload)) {
    if (!COLUMN[key]) continue;
    cols.push(COLUMN[key]);
    values.push(payload[key] === '' ? null : payload[key]);
  }
  return { cols, values };
}

async function create(userId, payload) {
  if (!payload.title || !payload.title.trim()) throw ApiError.badRequest('Project title is required.');
  const skillIds = Array.isArray(payload.skillIds) ? payload.skillIds : [];

  const projectId = await db.withTransaction(async (conn) => {
    const { cols, values } = buildInsertColumns({
      title: payload.title.trim(),
      description: payload.description || null,
      projectType: PROJECT_TYPES.includes(payload.projectType) ? payload.projectType : 'personal',
      role: payload.role || null,
      githubUrl: payload.githubUrl || null,
      liveDemoUrl: payload.liveDemoUrl || null,
      imageUrl: payload.imageUrl || null,
      completionDate: payload.completionDate || null,
    });
    const sql = `INSERT INTO projects (user_id, ${cols.join(', ')}) VALUES (?, ${cols.map(() => '?').join(', ')})`;
    const [result] = await conn.query(sql, [userId, ...values]);
    const newId = result.insertId;
    await linkSkills(conn, newId, skillIds);
    return newId;
  });

  return getOwn(userId, projectId);
}

async function linkSkills(conn, projectId, skillIds) {
  if (skillIds.length === 0) return;
  const values = [];
  const placeholders = skillIds.map(() => '(?, ?)').join(', ');
  for (const skillId of skillIds) {
    values.push(projectId, Number(skillId));
  }
  await conn.query(
    `INSERT IGNORE INTO project_skills (project_id, skill_id) VALUES ${placeholders}`,
    values
  );
}

async function update(userId, projectId, payload) {
  await assertOwnership(userId, projectId);
  const skillsProvided = Array.isArray(payload.skillIds);

  await db.withTransaction(async (conn) => {
    const sets = [];
    const values = [];
    for (const key of Object.keys(payload)) {
      if (!COLUMN[key]) continue;
      sets.push(`${COLUMN[key]} = ?`);
      values.push(payload[key] === '' ? null : payload[key]);
    }
    if (sets.length > 0) {
      values.push(projectId, userId);
      await conn.query(
        `UPDATE projects SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`,
        values
      );
    }
    if (skillsProvided) {
      await conn.query('DELETE FROM project_skills WHERE project_id = ?', [projectId]);
      await linkSkills(conn, projectId, payload.skillIds);
    }
  });

  return getOwn(userId, projectId);
}

async function remove(userId, projectId) {
  const result = await db.query(
    'DELETE FROM projects WHERE id = ? AND user_id = ?',
    [projectId, userId]
  );
  if (result.affectedRows === 0) throw ApiError.notFound('Project not found.');
}

async function assertOwnership(userId, projectId) {
  const rows = await db.query('SELECT id FROM projects WHERE id = ? AND user_id = ? LIMIT 1', [projectId, userId]);
  if (rows.length === 0) throw ApiError.notFound('Project not found.');
}

module.exports = {
  PROJECT_TYPES,
  listMine,
  getOwn,
  create,
  update,
  remove,
};
