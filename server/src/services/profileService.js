const db = require('../config/db');
const ApiError = require('../utils/ApiError');

const USER_UPDATABLE = new Set(['fullName', 'phone']);
const SEEKER_UPDATABLE = new Set([
  'headline',
  'bio',
  'location',
  'careerInterests',
  'preferredWorkMode',
  'preferredEmploymentType',
  'githubUrl',
  'linkedinUrl',
  'portfolioUrl',
  'profilePhotoUrl',
]);

const SEEKER_COLUMN = {
  headline: 'headline',
  bio: 'bio',
  location: 'location',
  careerInterests: 'career_interests',
  preferredWorkMode: 'preferred_work_mode',
  preferredEmploymentType: 'preferred_employment_type',
  githubUrl: 'github_url',
  linkedinUrl: 'linkedin_url',
  portfolioUrl: 'portfolio_url',
  profilePhotoUrl: 'profile_photo_url',
};

async function getProfile(userId) {
  const userRows = await db.query(
    `SELECT id, email, full_name AS fullName, phone, is_active AS isActive, created_at AS createdAt
     FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  const user = userRows[0];
  if (!user) throw ApiError.notFound('User not found');

  const roles = await db.query(
    `SELECT r.code FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`,
    [userId]
  );
  user.roles = roles.map((r) => r.code);
  user.isActive = !!user.isActive;

  let jobSeeker = null;
  if (user.roles.includes('job_seeker')) {
    const jsRows = await db.query(
      `SELECT headline, bio, location,
              career_interests AS careerInterests,
              preferred_work_mode AS preferredWorkMode,
              preferred_employment_type AS preferredEmploymentType,
              github_url AS githubUrl,
              linkedin_url AS linkedinUrl,
              portfolio_url AS portfolioUrl,
              profile_photo_url AS profilePhotoUrl,
              created_at AS createdAt,
              updated_at AS updatedAt
       FROM job_seeker_profiles WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    jobSeeker = jsRows[0] || null;
    if (!jobSeeker) {
      await db.query('INSERT IGNORE INTO job_seeker_profiles (user_id) VALUES (?)', [userId]);
      jobSeeker = {
        headline: null, bio: null, location: null, careerInterests: null,
        preferredWorkMode: 'any', preferredEmploymentType: 'any',
        githubUrl: null, linkedinUrl: null, portfolioUrl: null, profilePhotoUrl: null,
      };
    }
  }

  return { user, jobSeeker };
}

async function updateProfile(userId, payload) {
  await db.withTransaction(async (conn) => {
    const userUpdates = [];
    const userValues = [];
    if ('fullName' in payload && USER_UPDATABLE.has('fullName')) {
      userUpdates.push('full_name = ?');
      userValues.push(String(payload.fullName).trim());
    }
    if ('phone' in payload && USER_UPDATABLE.has('phone')) {
      userUpdates.push('phone = ?');
      userValues.push(payload.phone ? String(payload.phone).trim() : null);
    }
    if (userUpdates.length > 0) {
      userValues.push(userId);
      await conn.query(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`, userValues);
    }

    const [roleRows] = await conn.query(
      `SELECT r.code FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`,
      [userId]
    );
    const roles = roleRows.map((r) => r.code);

    if (roles.includes('job_seeker') && payload.jobSeeker) {
      const js = payload.jobSeeker;
      const sets = [];
      const vals = [];
      for (const key of Object.keys(js)) {
        if (!SEEKER_UPDATABLE.has(key)) continue;
        sets.push(`${SEEKER_COLUMN[key]} = ?`);
        vals.push(js[key] === '' ? null : js[key]);
      }
      if (sets.length > 0) {
        await conn.query('INSERT IGNORE INTO job_seeker_profiles (user_id) VALUES (?)', [userId]);
        vals.push(userId);
        await conn.query(
          `UPDATE job_seeker_profiles SET ${sets.join(', ')} WHERE user_id = ?`,
          vals
        );
      }
    }

    await conn.query(
      `INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id)
       VALUES (?, 'profile.update', 'user', ?)`,
      [userId, String(userId)]
    );
  });

  return getProfile(userId);
}

module.exports = { getProfile, updateProfile };
