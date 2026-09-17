const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const companiesService = require('./companiesService');

const OPPORTUNITY_TYPES = ['job', 'internship', 'apprenticeship', 'volunteer'];
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'internship', 'contract', 'freelance', 'volunteer'];
const WORK_MODES = ['onsite', 'remote', 'hybrid'];
const EDUCATION_LEVELS = ['none', 'secondary', 'tvet', 'certificate', 'diploma', 'bachelor', 'master', 'phd'];
const JOB_STATUSES = ['draft', 'published', 'closed', 'archived'];
const SKILL_IMPORTANCE = ['required', 'preferred'];
const SKILL_LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'];

const COLUMN = {
  title: 'title',
  summary: 'summary',
  description: 'description',
  responsibilities: 'responsibilities',
  opportunityType: 'opportunity_type',
  employmentType: 'employment_type',
  workMode: 'work_mode',
  location: 'location',
  district: 'district',
  minExperienceYears: 'min_experience_years',
  educationLevel: 'education_level',
  salaryMin: 'salary_min',
  salaryMax: 'salary_max',
  salaryCurrency: 'salary_currency',
  salaryVisible: 'salary_visible',
  positionsAvailable: 'positions_available',
  applicationDeadline: 'application_deadline',
};

const SELECT_FIELDS = `
  j.id, j.company_id AS companyId, j.title, j.summary, j.description, j.responsibilities,
  j.opportunity_type AS opportunityType,
  j.employment_type AS employmentType,
  j.work_mode AS workMode,
  j.location, j.district,
  j.min_experience_years AS minExperienceYears,
  j.education_level AS educationLevel,
  j.salary_min AS salaryMin,
  j.salary_max AS salaryMax,
  j.salary_currency AS salaryCurrency,
  j.salary_visible AS salaryVisible,
  j.positions_available AS positionsAvailable,
  j.application_deadline AS applicationDeadline,
  j.status,
  j.published_at AS publishedAt,
  j.closed_at AS closedAt,
  j.views_count AS viewsCount,
  j.created_at AS createdAt,
  j.updated_at AS updatedAt
`;

const COMPANY_FIELDS = `
  c.name AS companyName,
  c.slug AS companySlug,
  c.logo_url AS companyLogoUrl,
  c.location AS companyLocation,
  c.industry AS companyIndustry,
  c.verification_status AS companyVerificationStatus
`;

async function loadSkillsForJobs(jobIds) {
  if (jobIds.length === 0) return new Map();
  const placeholders = jobIds.map(() => '?').join(',');
  const rows = await db.query(
    `SELECT jrs.job_id AS jobId, s.id AS skillId, s.name,
            jrs.importance, jrs.min_level AS minLevel, jrs.weight
     FROM job_required_skills jrs
     JOIN skills s ON s.id = jrs.skill_id
     WHERE jrs.job_id IN (${placeholders})
     ORDER BY FIELD(jrs.importance, 'required', 'preferred'), s.name`,
    jobIds
  );
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.jobId)) map.set(row.jobId, []);
    map.get(row.jobId).push({
      skillId: row.skillId,
      name: row.name,
      importance: row.importance,
      minLevel: row.minLevel,
      weight: row.weight,
    });
  }
  return map;
}

async function attachSkills(jobs) {
  const map = await loadSkillsForJobs(jobs.map((j) => j.id));
  return jobs.map((job) => ({ ...job, requiredSkills: map.get(job.id) || [] }));
}

// Salary is only exposed when the employer chose to publish it.
function maskSalary(job) {
  if (job.salaryVisible) return job;
  return { ...job, salaryMin: null, salaryMax: null };
}

async function listMine(userId) {
  const company = await companiesService.getMine(userId);
  if (!company) return { company: null, jobs: [] };
  const jobs = await db.query(
    `SELECT ${SELECT_FIELDS} FROM job_postings j WHERE j.company_id = ? ORDER BY j.created_at DESC`,
    [company.id]
  );
  return { company, jobs: await attachSkills(jobs) };
}

async function getOwn(userId, jobId) {
  const rows = await db.query(
    `SELECT ${SELECT_FIELDS} FROM job_postings j
     JOIN companies c ON c.id = j.company_id
     WHERE j.id = ?
       AND (c.owner_user_id = ? OR c.id IN (SELECT company_id FROM company_members WHERE user_id = ?))
     LIMIT 1`,
    [jobId, userId, userId]
  );
  if (rows.length === 0) throw ApiError.notFound('Job posting not found.');
  const [job] = await attachSkills(rows);
  return job;
}

function normalizeSkills(input) {
  if (!Array.isArray(input)) return null;
  return input
    .map((entry) => {
      const skillId = Number(entry.skillId ?? entry.id);
      if (!Number.isInteger(skillId) || skillId < 1) return null;
      return {
        skillId,
        importance: SKILL_IMPORTANCE.includes(entry.importance) ? entry.importance : 'required',
        minLevel: SKILL_LEVELS.includes(entry.minLevel) ? entry.minLevel : 'intermediate',
        weight: Math.min(Math.max(Number(entry.weight) || 3, 1), 5),
      };
    })
    .filter(Boolean);
}

async function replaceSkills(conn, jobId, skills) {
  await conn.query('DELETE FROM job_required_skills WHERE job_id = ?', [jobId]);
  if (skills.length === 0) return;
  const placeholders = skills.map(() => '(?, ?, ?, ?, ?)').join(', ');
  const values = [];
  for (const s of skills) {
    values.push(jobId, s.skillId, s.importance, s.minLevel, s.weight);
  }
  await conn.query(
    `INSERT INTO job_required_skills (job_id, skill_id, importance, min_level, weight) VALUES ${placeholders}`,
    values
  );
}

function buildWritableColumns(payload) {
  const cols = [];
  const values = [];
  for (const [key, column] of Object.entries(COLUMN)) {
    if (payload[key] === undefined) continue;
    cols.push(column);
    values.push(payload[key] === '' ? null : payload[key]);
  }
  return { cols, values };
}

async function create(userId, payload) {
  if (!payload.title || !payload.title.trim()) throw ApiError.badRequest('Job title is required.');
  const company = await companiesService.requireOwnCompany(userId);
  const skills = normalizeSkills(payload.requiredSkills) || [];

  const jobId = await db.withTransaction(async (conn) => {
    const { cols, values } = buildWritableColumns(payload);
    const [result] = await conn.query(
      `INSERT INTO job_postings (company_id, posted_by_user_id${cols.length ? ', ' + cols.join(', ') : ''})
       VALUES (?, ?${cols.length ? ', ' + cols.map(() => '?').join(', ') : ''})`,
      [company.id, userId, ...values]
    );
    const newId = result.insertId;
    await replaceSkills(conn, newId, skills);
    await conn.query(
      `INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id)
       VALUES (?, 'job.create', 'job_posting', ?)`,
      [userId, String(newId)]
    );
    return newId;
  });

  return getOwn(userId, jobId);
}

async function update(userId, jobId, payload) {
  await getOwn(userId, jobId);
  const skills = normalizeSkills(payload.requiredSkills);

  await db.withTransaction(async (conn) => {
    const { cols, values } = buildWritableColumns(payload);
    if (cols.length > 0) {
      await conn.query(
        `UPDATE job_postings SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
        [...values, jobId]
      );
    }
    if (skills) await replaceSkills(conn, jobId, skills);
  });

  return getOwn(userId, jobId);
}

async function setStatus(userId, jobId, status) {
  if (!JOB_STATUSES.includes(status)) throw ApiError.badRequest('Unknown posting status.');
  const job = await getOwn(userId, jobId);

  if (status === 'published' && !job.title) throw ApiError.badRequest('Add a title before publishing.');

  await db.query(
    `UPDATE job_postings
     SET status = ?,
         published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN CURRENT_TIMESTAMP ELSE published_at END,
         closed_at = CASE WHEN ? = 'closed' THEN CURRENT_TIMESTAMP ELSE NULL END
     WHERE id = ?`,
    [status, status, status, jobId]
  );
  return getOwn(userId, jobId);
}

async function remove(userId, jobId) {
  await getOwn(userId, jobId);
  await db.query('DELETE FROM job_postings WHERE id = ?', [jobId]);
}

const SORTS = {
  recent: 'j.published_at DESC, j.id DESC',
  deadline: 'j.application_deadline IS NULL, j.application_deadline ASC',
  salary: 'j.salary_max IS NULL, j.salary_max DESC',
  title: 'j.title ASC',
};

// Shared WHERE builder for the public marketplace, so the listing, the total count
// and the filter facets always agree on what "visible" means.
function buildPublicFilter({ q, opportunityType, employmentType, workMode, district, companySlug, skillIds, verifiedOnly } = {}) {
  const where = ["j.status = 'published'"];
  const params = [];

  if (q) {
    where.push('(j.title LIKE ? OR j.summary LIKE ? OR j.description LIKE ? OR c.name LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (opportunityType && OPPORTUNITY_TYPES.includes(opportunityType)) {
    where.push('j.opportunity_type = ?');
    params.push(opportunityType);
  }
  if (employmentType && EMPLOYMENT_TYPES.includes(employmentType)) {
    where.push('j.employment_type = ?');
    params.push(employmentType);
  }
  if (workMode && WORK_MODES.includes(workMode)) {
    where.push('j.work_mode = ?');
    params.push(workMode);
  }
  if (district) {
    where.push('j.district = ?');
    params.push(district);
  }
  if (companySlug) {
    where.push('c.slug = ?');
    params.push(companySlug);
  }
  if (verifiedOnly) {
    where.push("c.verification_status = 'verified'");
  }

  const skills = (Array.isArray(skillIds) ? skillIds : String(skillIds || '').split(','))
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, 20);
  if (skills.length > 0) {
    where.push(
      `EXISTS (SELECT 1 FROM job_required_skills jrs
               WHERE jrs.job_id = j.id AND jrs.skill_id IN (${skills.map(() => '?').join(',')}))`
    );
    params.push(...skills);
  }

  return { clause: where.join(' AND '), params };
}

// Public listing — the marketplace job seekers search.
async function listPublic(filters = {}) {
  const { clause, params } = buildPublicFilter(filters);
  const safeLimit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
  const safeOffset = Math.max(Number(filters.offset) || 0, 0);
  const order = SORTS[filters.sort] || SORTS.recent;

  const jobs = await db.query(
    `SELECT ${SELECT_FIELDS}, ${COMPANY_FIELDS}
     FROM job_postings j
     JOIN companies c ON c.id = j.company_id
     WHERE ${clause}
     ORDER BY ${order}
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );
  const totalRows = await db.query(
    `SELECT COUNT(*) AS total FROM job_postings j JOIN companies c ON c.id = j.company_id WHERE ${clause}`,
    params
  );

  const withSkills = await attachSkills(jobs);
  const marked = await markBookmarked(withSkills, filters.viewerId);
  return { jobs: marked.map(maskSalary), total: totalRows[0].total, limit: safeLimit, offset: safeOffset };
}

// Facet counts for the filter sidebar, computed over everything currently published.
async function listFilters() {
  const [byType, byMode, byEmployment, byDistrict] = await Promise.all([
    db.query(
      `SELECT j.opportunity_type AS value, COUNT(*) AS count
       FROM job_postings j WHERE j.status = 'published' GROUP BY j.opportunity_type`
    ),
    db.query(
      `SELECT j.work_mode AS value, COUNT(*) AS count
       FROM job_postings j WHERE j.status = 'published' GROUP BY j.work_mode`
    ),
    db.query(
      `SELECT j.employment_type AS value, COUNT(*) AS count
       FROM job_postings j WHERE j.status = 'published' GROUP BY j.employment_type`
    ),
    db.query(
      `SELECT j.district AS value, COUNT(*) AS count
       FROM job_postings j WHERE j.status = 'published' AND j.district IS NOT NULL AND j.district <> ''
       GROUP BY j.district ORDER BY count DESC LIMIT 20`
    ),
  ]);
  return { opportunityTypes: byType, workModes: byMode, employmentTypes: byEmployment, districts: byDistrict };
}

// Flags which of the returned postings the signed-in job seeker has saved.
async function markBookmarked(jobs, viewerId) {
  if (!viewerId || jobs.length === 0) return jobs.map((job) => ({ ...job, isSaved: false }));
  const placeholders = jobs.map(() => '?').join(',');
  const rows = await db.query(
    `SELECT job_id FROM job_bookmarks WHERE user_id = ? AND job_id IN (${placeholders})`,
    [viewerId, ...jobs.map((j) => j.id)]
  );
  const saved = new Set(rows.map((r) => r.job_id));
  return jobs.map((job) => ({ ...job, isSaved: saved.has(job.id) }));
}

async function getPublicById(jobId, viewerId = null) {
  const rows = await db.query(
    `SELECT ${SELECT_FIELDS}, ${COMPANY_FIELDS}
     FROM job_postings j
     JOIN companies c ON c.id = j.company_id
     WHERE j.id = ? AND j.status = 'published'
     LIMIT 1`,
    [jobId]
  );
  if (rows.length === 0) throw ApiError.notFound('Job posting not found.');
  await db.query('UPDATE job_postings SET views_count = views_count + 1 WHERE id = ?', [jobId]);
  const withSkills = await attachSkills(rows);
  const [job] = await markBookmarked(withSkills, viewerId);

  // Tell a signed-in seeker whether they already applied, so the page can show
  // their application status instead of an apply button.
  let application = null;
  if (viewerId) {
    const applied = await db.query(
      'SELECT id, status, created_at AS createdAt FROM applications WHERE job_id = ? AND applicant_user_id = ? LIMIT 1',
      [jobId, viewerId]
    );
    application = applied[0] || null;
  }

  return { ...maskSalary(job), myApplication: application };
}

async function listSaved(userId) {
  const jobs = await db.query(
    `SELECT ${SELECT_FIELDS}, ${COMPANY_FIELDS}
     FROM job_bookmarks b
     JOIN job_postings j ON j.id = b.job_id
     JOIN companies c ON c.id = j.company_id
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC`,
    [userId]
  );
  const withSkills = await attachSkills(jobs);
  return withSkills.map((job) => maskSalary({ ...job, isSaved: true }));
}

async function saveJob(userId, jobId) {
  const rows = await db.query('SELECT id FROM job_postings WHERE id = ? LIMIT 1', [jobId]);
  if (rows.length === 0) throw ApiError.notFound('Job posting not found.');
  await db.query('INSERT IGNORE INTO job_bookmarks (user_id, job_id) VALUES (?, ?)', [userId, jobId]);
}

async function unsaveJob(userId, jobId) {
  await db.query('DELETE FROM job_bookmarks WHERE user_id = ? AND job_id = ?', [userId, jobId]);
}

// Search history is recorded for the analytics phase; failures must never break a search.
async function recordSearch({ userId = null, query = null, filters = {}, resultsCount = 0 }) {
  try {
    await db.query(
      'INSERT INTO job_searches (user_id, query, filters, results_count) VALUES (?, ?, ?, ?)',
      [userId, query || null, JSON.stringify(filters || {}), resultsCount]
    );
  } catch (_err) {
    // Non-critical telemetry.
  }
}

module.exports = {
  OPPORTUNITY_TYPES,
  EMPLOYMENT_TYPES,
  WORK_MODES,
  EDUCATION_LEVELS,
  JOB_STATUSES,
  SKILL_IMPORTANCE,
  SKILL_LEVELS,
  listMine,
  getOwn,
  create,
  update,
  setStatus,
  remove,
  listPublic,
  listFilters,
  getPublicById,
  listSaved,
  saveJob,
  unsaveJob,
  recordSearch,
};
