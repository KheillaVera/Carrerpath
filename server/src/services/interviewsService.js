const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const applicationsService = require('./applicationsService');

const INTERVIEW_MODES = ['onsite', 'online', 'phone'];
const INTERVIEW_STATUSES = ['scheduled', 'completed', 'cancelled'];

const SELECT_FIELDS = `
  i.id, i.application_id AS applicationId,
  i.scheduled_at AS scheduledAt,
  i.duration_minutes AS durationMinutes,
  i.mode, i.location,
  i.meeting_url AS meetingUrl,
  i.note, i.status,
  i.created_at AS createdAt,
  j.title AS jobTitle,
  c.name AS companyName,
  u.full_name AS applicantName,
  u.email AS applicantEmail
`;

const FROM_CLAUSE = `
  FROM interviews i
  JOIN applications a ON a.id = i.application_id
  JOIN job_postings j ON j.id = a.job_id
  JOIN companies c ON c.id = j.company_id
  JOIN users u ON u.id = a.applicant_user_id
`;

async function listForEmployer(userId) {
  return db.query(
    `SELECT ${SELECT_FIELDS} ${FROM_CLAUSE}
     WHERE c.owner_user_id = ? OR c.id IN (SELECT company_id FROM company_members WHERE user_id = ?)
     ORDER BY i.scheduled_at DESC`,
    [userId, userId]
  );
}

async function listForApplicant(userId) {
  return db.query(
    `SELECT ${SELECT_FIELDS} ${FROM_CLAUSE}
     WHERE a.applicant_user_id = ?
     ORDER BY i.scheduled_at DESC`,
    [userId]
  );
}

async function getForEmployer(userId, interviewId) {
  const rows = await db.query(
    `SELECT ${SELECT_FIELDS} ${FROM_CLAUSE}
     WHERE i.id = ?
       AND (c.owner_user_id = ? OR c.id IN (SELECT company_id FROM company_members WHERE user_id = ?))
     LIMIT 1`,
    [interviewId, userId, userId]
  );
  if (rows.length === 0) throw ApiError.notFound('Interview not found.');
  return rows[0];
}

// Scheduling an interview also moves the application into the 'interview' stage,
// so the applicant's timeline explains why the interview appeared.
async function schedule(userId, applicationId, payload) {
  const application = await applicationsService.getForEmployer(userId, applicationId);
  if (application.status === 'withdrawn') throw ApiError.badRequest('This application was withdrawn.');
  if (!payload.scheduledAt) throw ApiError.badRequest('An interview date and time is required.');

  const interviewId = await db.withTransaction(async (conn) => {
    const [result] = await conn.query(
      `INSERT INTO interviews (application_id, scheduled_at, duration_minutes, mode, location, meeting_url, note, created_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        applicationId,
        payload.scheduledAt,
        payload.durationMinutes || 45,
        INTERVIEW_MODES.includes(payload.mode) ? payload.mode : 'online',
        payload.location || null,
        payload.meetingUrl || null,
        payload.note || null,
        userId,
      ]
    );
    if (application.status !== 'interview') {
      await conn.query('UPDATE applications SET status = ? WHERE id = ?', ['interview', applicationId]);
      await conn.query(
        `INSERT INTO application_events (application_id, actor_user_id, from_status, to_status, note)
         VALUES (?, ?, ?, 'interview', 'Interview scheduled.')`,
        [applicationId, userId, application.status]
      );
    }
    return result.insertId;
  });

  return getForEmployer(userId, interviewId);
}

async function update(userId, interviewId, payload) {
  await getForEmployer(userId, interviewId);

  const sets = [];
  const values = [];
  const assign = (column, value) => { sets.push(`${column} = ?`); values.push(value); };

  if (payload.scheduledAt !== undefined) assign('scheduled_at', payload.scheduledAt);
  if (payload.durationMinutes !== undefined) assign('duration_minutes', payload.durationMinutes);
  if (payload.mode !== undefined && INTERVIEW_MODES.includes(payload.mode)) assign('mode', payload.mode);
  if (payload.location !== undefined) assign('location', payload.location || null);
  if (payload.meetingUrl !== undefined) assign('meeting_url', payload.meetingUrl || null);
  if (payload.note !== undefined) assign('note', payload.note || null);
  if (payload.status !== undefined && INTERVIEW_STATUSES.includes(payload.status)) assign('status', payload.status);

  if (sets.length > 0) {
    values.push(interviewId);
    await db.query(`UPDATE interviews SET ${sets.join(', ')} WHERE id = ?`, values);
  }
  return getForEmployer(userId, interviewId);
}

async function remove(userId, interviewId) {
  await getForEmployer(userId, interviewId);
  await db.query('DELETE FROM interviews WHERE id = ?', [interviewId]);
}

module.exports = {
  INTERVIEW_MODES,
  INTERVIEW_STATUSES,
  listForEmployer,
  listForApplicant,
  getForEmployer,
  schedule,
  update,
  remove,
};
