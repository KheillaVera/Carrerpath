-- SQLite schema for local development.
--
-- Mirrors the MySQL migrations in migrations/, which remain the authority for
-- production. Differences are dialect only:
--   * ENUM becomes TEXT with a CHECK constraint
--   * BIGINT UNSIGNED AUTO_INCREMENT becomes INTEGER PRIMARY KEY AUTOINCREMENT
--   * TINYINT(1) becomes INTEGER holding 0 or 1
--   * JSON becomes TEXT (SQLite's json1 functions read TEXT)
--   * ON UPDATE CURRENT_TIMESTAMP has no equivalent, so updated_at is set by
--     the application where it matters
--
-- The feature suite (npm run test:smoke) runs against whichever client is
-- configured, so passing it on SQLite is what proves the two stay in step.

PRAGMA foreign_keys = ON;

-- ---------- Phase 1: foundation ----------
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  email_verified_at TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS job_seeker_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  headline TEXT,
  bio TEXT,
  location TEXT,
  career_interests TEXT,
  preferred_work_mode TEXT NOT NULL DEFAULT 'any'
    CHECK (preferred_work_mode IN ('onsite','remote','hybrid','any')),
  preferred_employment_type TEXT NOT NULL DEFAULT 'any'
    CHECK (preferred_employment_type IN ('full_time','part_time','internship','contract','freelance','any')),
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  profile_photo_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Phase 2: job seeker profile ----------
CREATE TABLE IF NOT EXISTS skill_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category_id INTEGER REFERENCES skill_categories(id) ON DELETE SET NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category_id);

CREATE TABLE IF NOT EXISTS user_skills (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  self_level TEXT NOT NULL DEFAULT 'intermediate'
    CHECK (self_level IN ('beginner','elementary','intermediate','advanced','expert')),
  verified_level TEXT
    CHECK (verified_level IS NULL OR verified_level IN ('beginner','elementary','intermediate','advanced','expert')),
  verified_score INTEGER,
  verified_at TEXT,
  verified_attempt_id INTEGER,
  years_experience REAL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS education (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  qualification TEXT NOT NULL,
  field_of_study TEXT,
  start_date TEXT,
  end_date TEXT,
  is_current INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_education_user ON education(user_id);

CREATE TABLE IF NOT EXISTS experience (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  employment_type TEXT NOT NULL DEFAULT 'full_time'
    CHECK (employment_type IN ('full_time','part_time','internship','freelance','contract','volunteer')),
  location TEXT,
  start_date TEXT,
  end_date TEXT,
  is_current INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_experience_user ON experience(user_id);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL DEFAULT 'personal'
    CHECK (project_type IN ('personal','academic','professional','open_source','freelance','other')),
  role TEXT,
  github_url TEXT,
  live_demo_url TEXT,
  image_url TEXT,
  completion_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

CREATE TABLE IF NOT EXISTS project_skills (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, skill_id)
);

CREATE TABLE IF NOT EXISTS certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date TEXT,
  expiry_date TEXT,
  credential_id TEXT,
  verification_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_certifications_user ON certifications(user_id);

-- ---------- Phase 3: employers ----------
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT,
  description TEXT,
  industry TEXT,
  company_size TEXT CHECK (company_size IS NULL OR company_size IN ('1-10','11-50','51-200','201-500','500+')),
  founded_year INTEGER,
  website_url TEXT,
  logo_url TEXT,
  location TEXT,
  district TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','verified','rejected')),
  verification_note TEXT,
  verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_user_id);

CREATE TABLE IF NOT EXISTS company_members (
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_role TEXT NOT NULL DEFAULT 'recruiter' CHECK (member_role IN ('owner','recruiter')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id, user_id)
);

CREATE TABLE IF NOT EXISTS job_postings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  posted_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  responsibilities TEXT,
  opportunity_type TEXT NOT NULL DEFAULT 'job'
    CHECK (opportunity_type IN ('job','internship','apprenticeship','volunteer')),
  employment_type TEXT NOT NULL DEFAULT 'full_time'
    CHECK (employment_type IN ('full_time','part_time','internship','contract','freelance','volunteer')),
  work_mode TEXT NOT NULL DEFAULT 'onsite' CHECK (work_mode IN ('onsite','remote','hybrid')),
  location TEXT,
  district TEXT,
  min_experience_years REAL NOT NULL DEFAULT 0,
  education_level TEXT NOT NULL DEFAULT 'none'
    CHECK (education_level IN ('none','secondary','tvet','certificate','diploma','bachelor','master','phd')),
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT NOT NULL DEFAULT 'RWF',
  salary_visible INTEGER NOT NULL DEFAULT 0,
  positions_available INTEGER NOT NULL DEFAULT 1,
  application_deadline TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','closed','archived')),
  published_at TEXT,
  closed_at TEXT,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_job_postings_company ON job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);

CREATE TABLE IF NOT EXISTS job_required_skills (
  job_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  importance TEXT NOT NULL DEFAULT 'required' CHECK (importance IN ('required','preferred')),
  min_level TEXT NOT NULL DEFAULT 'intermediate'
    CHECK (min_level IN ('beginner','elementary','intermediate','advanced','expert')),
  weight INTEGER NOT NULL DEFAULT 3,
  PRIMARY KEY (job_id, skill_id)
);

-- ---------- Phase 4: marketplace ----------
CREATE TABLE IF NOT EXISTS job_bookmarks (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS job_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  query TEXT,
  filters TEXT,
  results_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Phase 5: applications ----------
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  applicant_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','under_review','shortlisted','interview','offered','hired','rejected','withdrawn')),
  employer_note TEXT,
  withdrawn_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (job_id, applicant_user_id)
);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications(applicant_user_id);

CREATE TABLE IF NOT EXISTS application_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_application_events_application ON application_events(application_id);

CREATE TABLE IF NOT EXISTS interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  scheduled_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  mode TEXT NOT NULL DEFAULT 'online' CHECK (mode IN ('onsite','online','phone')),
  location TEXT,
  meeting_url TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_interviews_application ON interviews(application_id);

-- ---------- Phase 6: assessments ----------
CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL DEFAULT 'intermediate'
    CHECK (level IN ('beginner','elementary','intermediate','advanced','expert')),
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  passing_score INTEGER NOT NULL DEFAULT 70,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (skill_id, level)
);

CREATE TABLE IF NOT EXISTS assessment_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'single_choice'
    CHECK (question_type IN ('single_choice','multiple_choice','true_false')),
  explanation TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON assessment_questions(assessment_id, position);

CREATE TABLE IF NOT EXISTS assessment_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_assessment_options_question ON assessment_options(question_id, position);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','expired')),
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0,
  passed INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  submitted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user ON assessment_attempts(user_id, assessment_id);

CREATE TABLE IF NOT EXISTS assessment_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  selected_option_ids TEXT,
  is_correct INTEGER NOT NULL DEFAULT 0,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (attempt_id, question_id)
);
