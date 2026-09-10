#!/usr/bin/env node
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const env = require('../config/env');

const ROLES = [
  { code: 'job_seeker', name: 'Job Seeker', description: 'Students, graduates, skilled youth seeking work.' },
  { code: 'employer', name: 'Employer', description: 'Companies posting jobs and internships.' },
  { code: 'training_provider', name: 'Training Provider', description: 'Organizations offering courses.' },
  { code: 'mentor', name: 'Mentor', description: 'Individuals mentoring job seekers.' },
  { code: 'admin', name: 'Administrator', description: 'Platform administrator.' },
];

const PERMISSIONS = [
  { code: 'jobs.create', description: 'Create job/internship postings' },
  { code: 'jobs.manage_own', description: 'Manage own postings' },
  { code: 'jobs.manage_all', description: 'Manage any posting (admin)' },
  { code: 'applications.submit', description: 'Apply to opportunities' },
  { code: 'applications.review', description: 'Review applications for own postings' },
  { code: 'admin.access', description: 'Access admin dashboard' },
  { code: 'admin.verify_employer', description: 'Verify employer accounts' },
];

const ROLE_PERMISSIONS = {
  job_seeker: ['applications.submit'],
  employer: ['jobs.create', 'jobs.manage_own', 'applications.review'],
  training_provider: [],
  mentor: [],
  admin: ['admin.access', 'admin.verify_employer', 'jobs.manage_all'],
};

// Demonstration data only, per spec §59. Simple credentials so they're easy to type.
const DEMO_USERS = [
  { email: 'seeker@demo.rw', password: 'Demo1234', full_name: 'Demo Job Seeker', role: 'job_seeker' },
  { email: 'employer@demo.rw', password: 'Demo1234', full_name: 'Demo Employer', role: 'employer' },
  { email: 'admin@demo.rw', password: 'Demo1234', full_name: 'Demo Administrator', role: 'admin' },
];

async function upsertRoles(conn) {
  for (const r of ROLES) {
    await conn.query(
      'INSERT INTO roles (code, name, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)',
      [r.code, r.name, r.description]
    );
  }
}

async function upsertPermissions(conn) {
  for (const p of PERMISSIONS) {
    await conn.query(
      'INSERT INTO permissions (code, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description)',
      [p.code, p.description]
    );
  }
}

async function linkRolePermissions(conn) {
  const [roles] = await conn.query('SELECT id, code FROM roles');
  const [perms] = await conn.query('SELECT id, code FROM permissions');
  const roleId = Object.fromEntries(roles.map((r) => [r.code, r.id]));
  const permId = Object.fromEntries(perms.map((p) => [p.code, p.id]));

  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    for (const permCode of permCodes) {
      await conn.query(
        'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
        [roleId[roleCode], permId[permCode]]
      );
    }
  }
}

async function upsertDemoUsers(conn) {
  const [roles] = await conn.query('SELECT id, code FROM roles');
  const roleId = Object.fromEntries(roles.map((r) => [r.code, r.id]));

  for (const u of DEMO_USERS) {
    const hash = await bcrypt.hash(u.password, env.bcryptRounds);
    // Always refresh password_hash + full_name so re-running the seed resets demo accounts to a known state.
    await conn.query(
      `INSERT INTO users (email, password_hash, full_name, is_active)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash),
                               full_name = VALUES(full_name),
                               is_active = 1`,
      [u.email, hash, u.full_name]
    );
    const [rows] = await conn.query('SELECT id FROM users WHERE email = ?', [u.email]);
    const userId = rows[0].id;

    await conn.query(
      'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [userId, roleId[u.role]]
    );
    if (u.role === 'job_seeker') {
      await conn.query(
        'INSERT IGNORE INTO job_seeker_profiles (user_id) VALUES (?)',
        [userId]
      );
    }
  }
}

async function seedSkillCatalogue(conn) {
  // Phase 2 tables may not exist yet; seed catalogue only if they do.
  const [tables] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'skills'"
  );
  if (tables[0].c === 0) return;

  const CATEGORIES = [
    'programming', 'web_development', 'mobile_development', 'database', 'networking',
    'cybersecurity', 'embedded_systems', 'data', 'ai', 'design', 'business', 'marketing',
    'finance', 'communication', 'leadership', 'other',
  ];
  const CATEGORY_LABELS = {
    programming: 'Programming', web_development: 'Web Development',
    mobile_development: 'Mobile Development', database: 'Database', networking: 'Networking',
    cybersecurity: 'Cybersecurity', embedded_systems: 'Embedded Systems', data: 'Data',
    ai: 'AI', design: 'Design', business: 'Business', marketing: 'Marketing',
    finance: 'Finance', communication: 'Communication', leadership: 'Leadership', other: 'Other',
  };

  for (const code of CATEGORIES) {
    await conn.query(
      'INSERT INTO skill_categories (code, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
      [code, CATEGORY_LABELS[code]]
    );
  }

  const SKILLS = [
    ['JavaScript', 'programming'], ['TypeScript', 'programming'], ['Python', 'programming'],
    ['Java', 'programming'], ['C', 'programming'], ['C++', 'programming'], ['C#', 'programming'],
    ['Go', 'programming'], ['Rust', 'programming'], ['PHP', 'programming'],
    ['HTML', 'web_development'], ['CSS', 'web_development'], ['React', 'web_development'],
    ['Vue.js', 'web_development'], ['Angular', 'web_development'], ['Next.js', 'web_development'],
    ['Node.js', 'web_development'], ['Express.js', 'web_development'], ['Django', 'web_development'],
    ['Laravel', 'web_development'], ['Tailwind CSS', 'web_development'], ['REST APIs', 'web_development'],
    ['Flutter', 'mobile_development'], ['React Native', 'mobile_development'], ['Kotlin', 'mobile_development'],
    ['Swift', 'mobile_development'], ['Android', 'mobile_development'], ['iOS', 'mobile_development'],
    ['MySQL', 'database'], ['PostgreSQL', 'database'], ['MongoDB', 'database'],
    ['SQLite', 'database'], ['Redis', 'database'], ['SQL', 'database'],
    ['TCP/IP', 'networking'], ['Linux administration', 'networking'], ['Cisco networking', 'networking'],
    ['Network security', 'cybersecurity'], ['Penetration testing', 'cybersecurity'],
    ['OWASP Top 10', 'cybersecurity'], ['Cryptography basics', 'cybersecurity'],
    ['Arduino', 'embedded_systems'], ['Raspberry Pi', 'embedded_systems'],
    ['Data analysis', 'data'], ['Excel', 'data'], ['Power BI', 'data'], ['Tableau', 'data'],
    ['Pandas', 'data'], ['NumPy', 'data'],
    ['Machine learning basics', 'ai'], ['Prompt engineering', 'ai'], ['TensorFlow', 'ai'],
    ['UI design', 'design'], ['UX research', 'design'], ['Figma', 'design'],
    ['Adobe Illustrator', 'design'], ['Adobe Photoshop', 'design'],
    ['Project management', 'business'], ['Business analysis', 'business'],
    ['Digital marketing', 'marketing'], ['SEO', 'marketing'], ['Social media marketing', 'marketing'],
    ['Accounting basics', 'finance'], ['Financial analysis', 'finance'],
    ['English communication', 'communication'], ['French communication', 'communication'],
    ['Kinyarwanda communication', 'communication'], ['Technical writing', 'communication'],
    ['Public speaking', 'communication'],
    ['Team leadership', 'leadership'], ['Mentoring', 'leadership'],
    ['Git', 'programming'], ['Docker', 'programming'], ['CI/CD basics', 'programming'],
  ];

  const [catRows] = await conn.query('SELECT id, code FROM skill_categories');
  const catId = Object.fromEntries(catRows.map((c) => [c.code, c.id]));

  for (const [name, cat] of SKILLS) {
    await conn.query(
      `INSERT INTO skills (name, category_id, is_active) VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE category_id = VALUES(category_id), is_active = 1`,
      [name, catId[cat]]
    );
  }
}

async function seedEmployerDemo(conn) {
  // Phase 3 tables may not exist yet; seed the demo employer only if they do.
  const [tables] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'companies'"
  );
  if (tables[0].c === 0) return;

  const [owners] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', ['employer@demo.rw']);
  if (owners.length === 0) return;
  const ownerId = owners[0].id;

  await conn.query(
    `INSERT INTO companies (owner_user_id, name, slug, tagline, description, industry, company_size,
                            founded_year, website_url, location, district, contact_email, verification_status)
     VALUES (?, 'Kigali Software Works', 'kigali-software-works',
             'Building digital products from Kigali.',
             'A demonstration employer used to exercise PathAura. Kigali Software Works builds web and mobile products for Rwandan businesses.',
             'Software', '11-50', 2019, 'https://example.rw', 'Kigali', 'Gasabo', 'jobs@example.rw', 'verified')
     ON DUPLICATE KEY UPDATE name = VALUES(name), tagline = VALUES(tagline), description = VALUES(description)`,
    [ownerId]
  );
  const [companyRows] = await conn.query('SELECT id FROM companies WHERE slug = ? LIMIT 1', ['kigali-software-works']);
  const companyId = companyRows[0].id;

  await conn.query(
    `INSERT IGNORE INTO company_members (company_id, user_id, member_role) VALUES (?, ?, 'owner')`,
    [companyId, ownerId]
  );

  const POSTINGS = [
    {
      title: 'Junior Frontend Developer',
      summary: 'Build user interfaces for Rwandan business applications with React.',
      description: 'You will work with our product team to turn designs into accessible, responsive interfaces.',
      responsibilities: 'Implement UI components; write tests; review teammates code; take part in sprint planning.',
      opportunity_type: 'job',
      employment_type: 'full_time',
      work_mode: 'hybrid',
      location: 'Kigali',
      district: 'Gasabo',
      min_experience_years: 1,
      education_level: 'diploma',
      skills: [
        ['React', 'required', 'intermediate', 5],
        ['JavaScript', 'required', 'intermediate', 5],
        ['HTML', 'required', 'intermediate', 3],
        ['CSS', 'required', 'intermediate', 3],
        ['Git', 'preferred', 'beginner', 2],
        ['TypeScript', 'preferred', 'beginner', 2],
      ],
    },
    {
      title: 'Data Analysis Intern',
      summary: 'Six-month internship supporting our analytics team.',
      description: 'Support reporting for client projects, clean datasets and prepare dashboards.',
      responsibilities: 'Prepare datasets; build dashboards; document findings for non-technical readers.',
      opportunity_type: 'internship',
      employment_type: 'internship',
      work_mode: 'onsite',
      location: 'Kigali',
      district: 'Kicukiro',
      min_experience_years: 0,
      education_level: 'secondary',
      skills: [
        ['Excel', 'required', 'intermediate', 4],
        ['Data analysis', 'required', 'beginner', 4],
        ['SQL', 'preferred', 'beginner', 3],
        ['Power BI', 'preferred', 'beginner', 2],
        ['English communication', 'required', 'intermediate', 3],
      ],
    },
  ];

  const [skillRows] = await conn.query('SELECT id, name FROM skills');
  const skillId = Object.fromEntries(skillRows.map((s) => [s.name, s.id]));

  for (const posting of POSTINGS) {
    const [existing] = await conn.query(
      'SELECT id FROM job_postings WHERE company_id = ? AND title = ? LIMIT 1',
      [companyId, posting.title]
    );
    let jobId;
    if (existing.length > 0) {
      jobId = existing[0].id;
    } else {
      const [result] = await conn.query(
        `INSERT INTO job_postings (company_id, posted_by_user_id, title, summary, description, responsibilities,
                                   opportunity_type, employment_type, work_mode, location, district,
                                   min_experience_years, education_level, positions_available, status, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'published', CURRENT_TIMESTAMP)`,
        [
          companyId, ownerId, posting.title, posting.summary, posting.description, posting.responsibilities,
          posting.opportunity_type, posting.employment_type, posting.work_mode, posting.location,
          posting.district, posting.min_experience_years, posting.education_level,
        ]
      );
      jobId = result.insertId;
    }

    for (const [name, importance, minLevel, weight] of posting.skills) {
      if (!skillId[name]) continue;
      await conn.query(
        `INSERT INTO job_required_skills (job_id, skill_id, importance, min_level, weight)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE importance = VALUES(importance), min_level = VALUES(min_level), weight = VALUES(weight)`,
        [jobId, skillId[name], importance, minLevel, weight]
      );
    }
  }
}

async function run() {
  await db.withTransaction(async (conn) => {
    await upsertRoles(conn);
    await upsertPermissions(conn);
    await linkRolePermissions(conn);
    await upsertDemoUsers(conn);
    await seedSkillCatalogue(conn);
    await seedEmployerDemo(conn);
  });
  console.log('[db] seed complete. Demo accounts (DEMONSTRATION DATA ONLY):');
  console.log('       email                  password   role');
  for (const u of DEMO_USERS) {
    console.log(`       ${u.email.padEnd(22)} ${u.password.padEnd(10)} ${u.role}`);
  }
  await db.pool.end();
}

run().catch(async (err) => {
  console.error('[db] seed failed:', err.message);
  try { await db.pool.end(); } catch (_) {}
  process.exit(1);
});
