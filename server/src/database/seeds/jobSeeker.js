/**
 * A realistic starting profile for the demonstration job seeker.
 *
 * Without skills, projects and history on the profile, the matching engine has
 * nothing to score and every opportunity reads 2%. This gives the demo account
 * the kind of profile a real graduate would have a few months in — enough to
 * produce a genuine mix of matched skills, partial matches and gaps.
 */
const PROFILE = {
  headline: 'Junior frontend developer · IT graduate',
  bio: 'Recent IT graduate from Kigali. I build web interfaces with React and enjoy '
    + 'turning designs into accessible, responsive pages. Looking for a first full-time role.',
  location: 'Kigali',
  careerInterests: 'Frontend development, UI engineering',
  preferredWorkMode: 'hybrid',
  preferredEmploymentType: 'full_time',
};

const SKILLS = [
  ['JavaScript', 'intermediate', 1.5],
  ['HTML', 'advanced', 2],
  ['CSS', 'advanced', 2],
  ['React', 'elementary', 1],
  ['Git', 'intermediate', 1.5],
  ['English communication', 'advanced', null],
];

const EDUCATION = [
  {
    institution: 'Rwanda Polytechnic',
    qualification: 'Diploma in Information Technology',
    fieldOfStudy: 'Information Technology',
    startDate: '2022-09-01',
    endDate: '2025-07-01',
    isCurrent: 0,
    description: 'Software development, databases and networking.',
  },
];

const EXPERIENCE = [
  {
    company: 'Kigali Tech Hub',
    role: 'Frontend intern',
    employmentType: 'internship',
    location: 'Kigali',
    startDate: '2025-02-01',
    endDate: '2025-08-01',
    isCurrent: 0,
    description: 'Built internal dashboards with React, working to designs from the product team.',
  },
];

const PROJECTS = [
  {
    title: 'School report management system',
    description: 'A web application for a secondary school to record marks and generate term reports. '
      + 'Built the whole interface and the report export.',
    projectType: 'academic',
    role: 'Frontend developer',
    githubUrl: 'https://github.com/example/school-reports',
    completionDate: '2025-06-15',
    skills: ['JavaScript', 'HTML', 'CSS'],
  },
  {
    title: 'Kigali bus timetable',
    description: 'A small React app showing bus routes and departure times, usable on a phone with a weak connection.',
    projectType: 'personal',
    role: 'Developer',
    githubUrl: 'https://github.com/example/bus-timetable',
    completionDate: '2025-09-01',
    skills: ['React', 'JavaScript', 'CSS'],
  },
];

async function seedJobSeekerDemo(conn) {
  const [users] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', ['seeker@demo.rw']);
  if (users.length === 0) return 0;
  const userId = users[0].id;

  await conn.query(
    `INSERT INTO job_seeker_profiles
       (user_id, headline, bio, location, career_interests, preferred_work_mode, preferred_employment_type)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE headline = VALUES(headline), bio = VALUES(bio),
                             location = VALUES(location), career_interests = VALUES(career_interests),
                             preferred_work_mode = VALUES(preferred_work_mode),
                             preferred_employment_type = VALUES(preferred_employment_type)`,
    [userId, PROFILE.headline, PROFILE.bio, PROFILE.location, PROFILE.careerInterests,
     PROFILE.preferredWorkMode, PROFILE.preferredEmploymentType]
  );

  const [skillRows] = await conn.query('SELECT id, name FROM skills');
  const skillId = Object.fromEntries(skillRows.map((s) => [s.name, s.id]));

  for (const [name, level, years] of SKILLS) {
    if (!skillId[name]) continue;
    await conn.query(
      `INSERT INTO user_skills (user_id, skill_id, self_level, years_experience)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE self_level = VALUES(self_level), years_experience = VALUES(years_experience)`,
      [userId, skillId[name], level, years]
    );
  }

  // Replaced wholesale so re-seeding is idempotent rather than cumulative.
  await conn.query('DELETE FROM education WHERE user_id = ?', [userId]);
  for (const e of EDUCATION) {
    await conn.query(
      `INSERT INTO education (user_id, institution, qualification, field_of_study, start_date, end_date, is_current, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, e.institution, e.qualification, e.fieldOfStudy, e.startDate, e.endDate, e.isCurrent, e.description]
    );
  }

  await conn.query('DELETE FROM experience WHERE user_id = ?', [userId]);
  for (const x of EXPERIENCE) {
    await conn.query(
      `INSERT INTO experience (user_id, company, role, employment_type, location, start_date, end_date, is_current, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, x.company, x.role, x.employmentType, x.location, x.startDate, x.endDate, x.isCurrent, x.description]
    );
  }

  await conn.query('DELETE FROM projects WHERE user_id = ?', [userId]);
  for (const p of PROJECTS) {
    const [inserted] = await conn.query(
      `INSERT INTO projects (user_id, title, description, project_type, role, github_url, completion_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, p.title, p.description, p.projectType, p.role, p.githubUrl, p.completionDate]
    );
    for (const name of p.skills) {
      if (!skillId[name]) continue;
      await conn.query(
        'INSERT IGNORE INTO project_skills (project_id, skill_id) VALUES (?, ?)',
        [inserted.insertId, skillId[name]]
      );
    }
  }

  return SKILLS.length;
}

module.exports = { seedJobSeekerDemo };
