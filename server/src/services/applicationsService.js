const db = require('../config/db');
const ApiError = require('../utils/ApiError');

const APPLICATION_STATUSES = [
  'submitted', 'under_review', 'shortlisted', 'interview',
  'offered', 'hired', 'rejected', 'withdrawn',
];

// Statuses an employer may set. Applicants withdraw through their own endpoint.
const EMPLOYER_STATUSES = ['submitted', 'under_review', 'shortlisted', 'interview', 'offered', 'hired', 'rejected'];

const SELECT_FIELDS = `
  a.id, a.job_id AS jobId, a.applicant_user_id AS applicantUserId,
  a.cover_letter AS coverLetter, a.status,
  a.employer_note AS employerNote,
  a.created_at AS createdAt, a.updated_at AS updatedAt
`;

const JOB_FIELDS = `
  j.title AS jobTitle,
  j.opportunity_type AS opportunityType,
  j.employment_type AS employmentType,
  j.work_mode AS workMode,
  j.location AS jobLocation,
  j.status AS jobStatus,
  c.id AS companyId,
  c.name AS companyName,
  c.slug AS companySlug
`;

const APPLICANT_FIELDS = `
  u.full_name AS applicantName,
  u.email AS applicantEmail,
  p.headline AS applicantHeadline,
  p.location AS applicantLocation
`;

async function loadEvents(applicationIds) {
  if (applicationIds.length === 0) return new Map();
  const placeholders = applicationIds.map(() => '?').join(',');
  const rows = await db.query(
    `SELECT e.application_id AS applicationId, e.from_status AS fromStatus, e.to_status AS toStatus,
            e.note, e.created_at AS createdAt, u.full_name AS actorName
     FROM application_events e
     LEFT JOIN users u ON u.id = e.actor_user_id
     WHERE e.application_id IN (${placeholders})
     ORDER BY e.created_at ASC, e.id ASC`,
    applicationIds
  );
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.applicationId)) map.set(row.applicationId, []);
    map.get(row.applicationId).push(row);
  }
  return map;
}

async function attachEvents(applications) {
  const map = await loadEvents(applications.map((a) => a.id));
  return applications.map((a) => ({ ...a, timeline: map.get(a.id) || [] }));
}

// The applicant's own view of everything they have applied to.
async function listMine(userId) {
  const rows = await db.query(
    `SELECT ${SELECT_FIELDS}, ${JOB_FIELDS}
     FROM applications a
     JOIN job_postings j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     WHERE a.applicant_user_id = ?
     ORDER BY a.created_at DESC`,
    [userId]
  );
  return attachEvents(rows);
}

async function getMine(userId, applicationId) {
  const rows = await db.query(
    `SELECT ${SELECT_FIELDS}, ${JOB_FIELDS}
     FROM applications a
     JOIN job_postings j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     WHERE a.id = ? AND a.applicant_user_id = ? LIMIT 1`,
    [applicationId, userId]
  );
  if (rows.length === 0) throw ApiError.notFound('Application not found.');
  const [application] = await attachEvents(rows);
  return application;
}

async function apply(userId, { jobId, coverLetter }) {
  const jobs = await db.query(
    `SELECT j.id, j.status, j.application_deadline AS deadline
     FROM job_postings j WHERE j.id = ? LIMIT 1`,
    [jobId]
  );
  if (jobs.length === 0) throw ApiError.notFound('Job posting not found.');
  const job = jobs[0];
  if (job.status !== 'published') throw ApiError.badRequest('This opportunity is not accepting applications.');
  if (job.deadline && new Date(job.deadline) < new Date(new Date().toDateString())) {
    throw ApiError.badRequest('The application deadline for this opportunity has passed.');
  }

  const existing = await db.query(
    'SELECT id, status FROM applications WHERE job_id = ? AND applicant_user_id = ? LIMIT 1',
    [jobId, userId]
  );
  if (existing.length > 0) throw ApiError.conflict('You have already applied to this opportunity.');

  const applicationId = await db.withTransaction(async (conn) => {
    const [result] = await conn.query(
      `INSERT INTO applications (job_id, applicant_user_id, cover_letter) VALUES (?, ?, ?)`,
      [jobId, userId, coverLetter || null]
    );
    const newId = result.insertId;
    await conn.query(
      `INSERT INTO application_events (application_id, actor_user_id, from_status, to_status, note)
       VALUES (?, ?, NULL, 'submitted', 'Application submitted.')`,
      [newId, userId]
    );
    return newId;
  });

  return getMine(userId, applicationId);
}

async function withdraw(userId, applicationId) {
  const application = await getMine(userId, applicationId);
  if (application.status === 'withdrawn') return application;
  if (['hired', 'rejected'].includes(application.status)) {
    throw ApiError.badRequest('This application is already closed.');
  }

  await db.withTransaction(async (conn) => {
    await conn.query(
      `UPDATE applications SET status = 'withdrawn', withdrawn_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [applicationId]
    );
    await conn.query(
      `INSERT INTO application_events (application_id, actor_user_id, from_status, to_status, note)
       VALUES (?, ?, ?, 'withdrawn', 'Withdrawn by the applicant.')`,
      [applicationId, userId, application.status]
    );
  });

  return getMine(userId, applicationId);
}

// Employer side: every application to any posting of the user's company.
async function listForEmployer(userId, { jobId, status } = {}) {
  const where = ['(c.owner_user_id = ? OR c.id IN (SELECT company_id FROM company_members WHERE user_id = ?))'];
  const params = [userId, userId];
  if (jobId) {
    where.push('a.job_id = ?');
    params.push(Number(jobId));
  }
  if (status && APPLICATION_STATUSES.includes(status)) {
    where.push('a.status = ?');
    params.push(status);
  }

  const rows = await db.query(
    `SELECT ${SELECT_FIELDS}, ${JOB_FIELDS}, ${APPLICANT_FIELDS}
     FROM applications a
     JOIN job_postings j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     JOIN users u ON u.id = a.applicant_user_id
     LEFT JOIN job_seeker_profiles p ON p.user_id = a.applicant_user_id
     WHERE ${where.join(' AND ')}
     ORDER BY a.created_at DESC`,
    params
  );
  return attachEvents(rows);
}

async function getForEmployer(userId, applicationId) {
  const rows = await db.query(
    `SELECT ${SELECT_FIELDS}, ${JOB_FIELDS}, ${APPLICANT_FIELDS}
     FROM applications a
     JOIN job_postings j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     JOIN users u ON u.id = a.applicant_user_id
     LEFT JOIN job_seeker_profiles p ON p.user_id = a.applicant_user_id
     WHERE a.id = ?
       AND (c.owner_user_id = ? OR c.id IN (SELECT company_id FROM company_members WHERE user_id = ?))
     LIMIT 1`,
    [applicationId, userId, userId]
  );
  if (rows.length === 0) throw ApiError.notFound('Application not found.');
  const [application] = await attachEvents(rows);
  return application;
}

// The skills evidence an employer reviews alongside the application (spec: candidates
// are judged on what they can do, not only on a CV).
async function getApplicantEvidence(userId, applicationId) {
  const application = await getForEmployer(userId, applicationId);
  const applicantId = application.applicantUserId;

  const [skills, projects, certifications, education, experience] = await Promise.all([
    db.query(
      `SELECT s.id, s.name, us.self_level AS selfLevel, us.years_experience AS yearsExperience
       FROM user_skills us JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ? ORDER BY s.name`,
      [applicantId]
    ),
    db.query(
      `SELECT id, title, description, project_type AS projectType, github_url AS githubUrl,
              live_demo_url AS liveDemoUrl, completion_date AS completionDate
       FROM projects WHERE user_id = ? ORDER BY completion_date DESC, id DESC`,
      [applicantId]
    ),
    db.query(
      `SELECT id, name, issuer, status, issue_date AS issueDate, verification_url AS verificationUrl
       FROM certifications WHERE user_id = ? ORDER BY issue_date DESC, id DESC`,
      [applicantId]
    ),
    db.query(
      `SELECT id, institution, qualification, field_of_study AS fieldOfStudy,
              start_date AS startDate, end_date AS endDate, is_current AS isCurrent
       FROM education WHERE user_id = ? ORDER BY end_date DESC, id DESC`,
      [applicantId]
    ),
    db.query(
      `SELECT id, company, role, employment_type AS employmentType, location,
              start_date AS startDate, end_date AS endDate, is_current AS isCurrent
       FROM experience WHERE user_id = ? ORDER BY end_date DESC, id DESC`,
      [applicantId]
    ),
  ]);

  const requiredSkills = await db.query(
    `SELECT s.id, s.name, jrs.importance, jrs.min_level AS minLevel
     FROM job_required_skills jrs JOIN skills s ON s.id = jrs.skill_id
     WHERE jrs.job_id = ?`,
    [application.jobId]
  );

  // A plain, transparent overlap — the weighted match score itself arrives in Phase 7.
  const applicantSkillIds = new Set(skills.map((s) => s.id));
  const matchedSkills = requiredSkills.filter((s) => applicantSkillIds.has(s.id));
  const missingSkills = requiredSkills.filter((s) => !applicantSkillIds.has(s.id));

  return {
    application,
    evidence: { skills, projects, certifications, education, experience },
    skillOverlap: { requiredSkills, matchedSkills, missingSkills },
  };
}

async function setStatus(userId, applicationId, status, note) {
  if (!EMPLOYER_STATUSES.includes(status)) throw ApiError.badRequest('Unknown application status.');
  const application = await getForEmployer(userId, applicationId);
  if (application.status === 'withdrawn') throw ApiError.badRequest('This application was withdrawn by the applicant.');
  if (application.status === status && !note) return application;

  await db.withTransaction(async (conn) => {
    await conn.query(
      'UPDATE applications SET status = ?, employer_note = ? WHERE id = ?',
      [status, note || application.employerNote || null, applicationId]
    );
    await conn.query(
      `INSERT INTO application_events (application_id, actor_user_id, from_status, to_status, note)
       VALUES (?, ?, ?, ?, ?)`,
      [applicationId, userId, application.status, status, note || null]
    );
  });

  return getForEmployer(userId, applicationId);
}

async function statsForEmployer(userId) {
  const rows = await db.query(
    `SELECT a.status, COUNT(*) AS count
     FROM applications a
     JOIN job_postings j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     WHERE c.owner_user_id = ? OR c.id IN (SELECT company_id FROM company_members WHERE user_id = ?)
     GROUP BY a.status`,
    [userId, userId]
  );
  const byStatus = Object.fromEntries(rows.map((r) => [r.status, r.count]));
  const total = rows.reduce((sum, r) => sum + Number(r.count), 0);
  return { total, byStatus };
}

module.exports = {
  APPLICATION_STATUSES,
  EMPLOYER_STATUSES,
  listMine,
  getMine,
  apply,
  withdraw,
  listForEmployer,
  getForEmployer,
  getApplicantEvidence,
  setStatus,
  statsForEmployer,
};
