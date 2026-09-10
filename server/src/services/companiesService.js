const db = require('../config/db');
const ApiError = require('../utils/ApiError');

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];
const VERIFICATION_STATUSES = ['pending', 'verified', 'rejected'];

const COLUMN = {
  name: 'name',
  tagline: 'tagline',
  description: 'description',
  industry: 'industry',
  companySize: 'company_size',
  foundedYear: 'founded_year',
  websiteUrl: 'website_url',
  logoUrl: 'logo_url',
  location: 'location',
  district: 'district',
  contactEmail: 'contact_email',
  contactPhone: 'contact_phone',
};

const SELECT_FIELDS = `
  c.id, c.name, c.slug, c.tagline, c.description, c.industry,
  c.company_size AS companySize,
  c.founded_year AS foundedYear,
  c.website_url AS websiteUrl,
  c.logo_url AS logoUrl,
  c.location, c.district,
  c.contact_email AS contactEmail,
  c.contact_phone AS contactPhone,
  c.verification_status AS verificationStatus,
  c.verification_note AS verificationNote,
  c.verified_at AS verifiedAt,
  c.owner_user_id AS ownerUserId,
  c.created_at AS createdAt,
  c.updated_at AS updatedAt
`;

function slugify(name) {
  const base = String(name)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
  return base || 'company';
}

// Slugs are public URLs, so they must be unique; append -2, -3 … on collision.
async function uniqueSlug(conn, name, excludeCompanyId = null) {
  const base = slugify(name);
  let candidate = base;
  for (let suffix = 2; suffix < 100; suffix += 1) {
    const [rows] = await conn.query(
      'SELECT id FROM companies WHERE slug = ? AND (? IS NULL OR id <> ?) LIMIT 1',
      [candidate, excludeCompanyId, excludeCompanyId]
    );
    if (rows.length === 0) return candidate;
    candidate = `${base}-${suffix}`;
  }
  throw ApiError.conflict('Could not generate a unique company URL. Try a different name.');
}

async function findByOwner(userId) {
  const rows = await db.query(
    `SELECT ${SELECT_FIELDS} FROM companies c
     WHERE c.owner_user_id = ?
        OR c.id IN (SELECT company_id FROM company_members WHERE user_id = ?)
     ORDER BY c.id LIMIT 1`,
    [userId, userId]
  );
  return rows[0] || null;
}

async function getMine(userId) {
  return findByOwner(userId);
}

async function getById(companyId) {
  const rows = await db.query(`SELECT ${SELECT_FIELDS} FROM companies c WHERE c.id = ? LIMIT 1`, [companyId]);
  if (rows.length === 0) throw ApiError.notFound('Company not found.');
  return rows[0];
}

async function getPublicBySlug(slug) {
  const rows = await db.query(`SELECT ${SELECT_FIELDS} FROM companies c WHERE c.slug = ? LIMIT 1`, [slug]);
  if (rows.length === 0) throw ApiError.notFound('Company not found.');
  const company = rows[0];
  const counts = await db.query(
    `SELECT COUNT(*) AS openPositions FROM job_postings WHERE company_id = ? AND status = 'published'`,
    [company.id]
  );
  return { ...company, openPositions: counts[0].openPositions };
}

async function listPublic({ q, industry, limit = 20, offset = 0 } = {}) {
  const where = [];
  const params = [];
  if (q) {
    where.push('(c.name LIKE ? OR c.industry LIKE ? OR c.location LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (industry) {
    where.push('c.industry = ?');
    params.push(industry);
  }
  const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const companies = await db.query(
    `SELECT ${SELECT_FIELDS},
            (SELECT COUNT(*) FROM job_postings j WHERE j.company_id = c.id AND j.status = 'published') AS openPositions
     FROM companies c
     ${clause}
     ORDER BY (c.verification_status = 'verified') DESC, c.name
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );
  const totalRows = await db.query(`SELECT COUNT(*) AS total FROM companies c ${clause}`, params);
  return { companies, total: totalRows[0].total };
}

async function create(userId, payload) {
  if (!payload.name || !payload.name.trim()) throw ApiError.badRequest('Company name is required.');

  const existing = await findByOwner(userId);
  if (existing) throw ApiError.conflict('You already have a company profile.');

  const companyId = await db.withTransaction(async (conn) => {
    const slug = await uniqueSlug(conn, payload.name);
    const cols = ['owner_user_id', 'slug'];
    const values = [userId, slug];
    for (const [key, column] of Object.entries(COLUMN)) {
      if (payload[key] === undefined) continue;
      cols.push(column);
      values.push(payload[key] === '' ? null : payload[key]);
    }
    const [result] = await conn.query(
      `INSERT INTO companies (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      values
    );
    const newId = result.insertId;

    await conn.query(
      `INSERT INTO company_members (company_id, user_id, member_role) VALUES (?, ?, 'owner')`,
      [newId, userId]
    );
    await conn.query(
      `INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id)
       VALUES (?, 'company.create', 'company', ?)`,
      [userId, String(newId)]
    );
    return newId;
  });

  return getById(companyId);
}

async function update(userId, companyId, payload) {
  await assertCanManage(userId, companyId);

  await db.withTransaction(async (conn) => {
    const sets = [];
    const values = [];
    for (const [key, column] of Object.entries(COLUMN)) {
      if (payload[key] === undefined) continue;
      sets.push(`${column} = ?`);
      values.push(payload[key] === '' ? null : payload[key]);
    }
    // Renaming the company re-derives its public URL.
    if (payload.name !== undefined && payload.name.trim()) {
      sets.push('slug = ?');
      values.push(await uniqueSlug(conn, payload.name, companyId));
    }
    if (sets.length === 0) return;
    values.push(companyId);
    await conn.query(`UPDATE companies SET ${sets.join(', ')} WHERE id = ?`, values);
  });

  return getById(companyId);
}

// Owners and recruiters may manage a company; admins are handled by route-level authorization.
async function assertCanManage(userId, companyId) {
  const rows = await db.query(
    `SELECT id FROM companies
     WHERE id = ?
       AND (owner_user_id = ? OR id IN (SELECT company_id FROM company_members WHERE user_id = ?))
     LIMIT 1`,
    [companyId, userId, userId]
  );
  if (rows.length === 0) throw ApiError.notFound('Company not found.');
}

async function requireOwnCompany(userId) {
  const company = await findByOwner(userId);
  if (!company) throw ApiError.badRequest('Create your company profile first.');
  return company;
}

async function listForAdmin({ status } = {}) {
  const where = [];
  const params = [];
  if (status && VERIFICATION_STATUSES.includes(status)) {
    where.push('c.verification_status = ?');
    params.push(status);
  }
  const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  return db.query(
    `SELECT ${SELECT_FIELDS}, u.email AS ownerEmail, u.full_name AS ownerName,
            (SELECT COUNT(*) FROM job_postings j WHERE j.company_id = c.id) AS postingsCount
     FROM companies c
     JOIN users u ON u.id = c.owner_user_id
     ${clause}
     ORDER BY FIELD(c.verification_status, 'pending', 'verified', 'rejected'), c.created_at DESC`,
    params
  );
}

async function setVerification(adminUserId, companyId, status, note) {
  if (!VERIFICATION_STATUSES.includes(status)) throw ApiError.badRequest('Unknown verification status.');
  await getById(companyId);

  await db.withTransaction(async (conn) => {
    await conn.query(
      `UPDATE companies
       SET verification_status = ?, verification_note = ?, verified_by = ?,
           verified_at = CASE WHEN ? = 'verified' THEN CURRENT_TIMESTAMP ELSE NULL END
       WHERE id = ?`,
      [status, note || null, adminUserId, status, companyId]
    );
    await conn.query(
      `INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
       VALUES (?, 'company.verification', 'company', ?, JSON_OBJECT('status', ?))`,
      [adminUserId, String(companyId), status]
    );
  });

  return getById(companyId);
}

module.exports = {
  COMPANY_SIZES,
  VERIFICATION_STATUSES,
  getMine,
  getById,
  getPublicBySlug,
  listPublic,
  create,
  update,
  assertCanManage,
  requireOwnCompany,
  listForAdmin,
  setVerification,
};
