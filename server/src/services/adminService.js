const db = require('../config/db');

/**
 * Counts for the administrator dashboard. Everything here is a live count of
 * real rows — no derived or estimated figures (spec §35: never present a number
 * the platform cannot stand behind).
 */
async function platformStats() {
  const [usersByRole, companiesByStatus, postingsByStatus, applicationsByStatus, totals] = await Promise.all([
    db.query(
      `SELECT r.code AS role, COUNT(ur.user_id) AS count
       FROM roles r
       LEFT JOIN user_roles ur ON ur.role_id = r.id
       LEFT JOIN users u ON u.id = ur.user_id AND u.is_active = 1
       GROUP BY r.code`
    ),
    db.query('SELECT verification_status AS status, COUNT(*) AS count FROM companies GROUP BY verification_status'),
    db.query('SELECT status, COUNT(*) AS count FROM job_postings GROUP BY status'),
    db.query('SELECT status, COUNT(*) AS count FROM applications GROUP BY status'),
    db.query(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE is_active = 1) AS users,
         (SELECT COUNT(*) FROM companies) AS companies,
         (SELECT COUNT(*) FROM job_postings) AS postings,
         (SELECT COUNT(*) FROM applications) AS applications,
         (SELECT COUNT(*) FROM skills WHERE is_active = 1) AS skills`
    ),
  ]);

  const asMap = (rows, key) => Object.fromEntries(rows.map((r) => [r[key], Number(r.count)]));

  return {
    totals: totals[0],
    usersByRole: asMap(usersByRole, 'role'),
    companiesByStatus: asMap(companiesByStatus, 'status'),
    postingsByStatus: asMap(postingsByStatus, 'status'),
    applicationsByStatus: asMap(applicationsByStatus, 'status'),
  };
}

/** The most recent platform activity, for the admin overview. */
async function recentActivity(limit = 8) {
  const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 50);
  return db.query(
    `SELECT a.id, a.action, a.resource_type AS resourceType, a.resource_id AS resourceId,
            a.created_at AS createdAt, u.full_name AS actorName
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.actor_user_id
     ORDER BY a.created_at DESC, a.id DESC
     LIMIT ${safeLimit}`
  );
}

module.exports = { platformStats, recentActivity };
