-- Phase 3: Employers (company profiles, verification, job/internship postings)

CREATE TABLE IF NOT EXISTS companies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL,
  tagline VARCHAR(255) NULL,
  description TEXT NULL,
  industry VARCHAR(120) NULL,
  company_size ENUM('1-10','11-50','51-200','201-500','500+') NULL,
  founded_year SMALLINT UNSIGNED NULL,
  website_url VARCHAR(255) NULL,
  logo_url VARCHAR(255) NULL,
  location VARCHAR(150) NULL,
  district VARCHAR(100) NULL,
  contact_email VARCHAR(255) NULL,
  contact_phone VARCHAR(30) NULL,
  verification_status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  verification_note VARCHAR(500) NULL,
  verified_by BIGINT UNSIGNED NULL,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_companies_slug (slug),
  KEY idx_companies_owner (owner_user_id),
  KEY idx_companies_verification (verification_status),
  CONSTRAINT fk_companies_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_companies_verified_by FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Extra recruiters on a company. The owner is also stored here for uniform permission checks.
CREATE TABLE IF NOT EXISTS company_members (
  company_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  member_role ENUM('owner','recruiter') NOT NULL DEFAULT 'recruiter',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id, user_id),
  KEY idx_company_members_user (user_id),
  CONSTRAINT fk_company_members_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_company_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS job_postings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  posted_by_user_id BIGINT UNSIGNED NULL,
  title VARCHAR(200) NOT NULL,
  summary VARCHAR(500) NULL,
  description TEXT NULL,
  responsibilities TEXT NULL,
  opportunity_type ENUM('job','internship','apprenticeship','volunteer') NOT NULL DEFAULT 'job',
  employment_type ENUM('full_time','part_time','internship','contract','freelance','volunteer') NOT NULL DEFAULT 'full_time',
  work_mode ENUM('onsite','remote','hybrid') NOT NULL DEFAULT 'onsite',
  location VARCHAR(150) NULL,
  district VARCHAR(100) NULL,
  min_experience_years DECIMAL(4,1) NOT NULL DEFAULT 0,
  education_level ENUM('none','secondary','tvet','certificate','diploma','bachelor','master','phd') NOT NULL DEFAULT 'none',
  salary_min INT UNSIGNED NULL,
  salary_max INT UNSIGNED NULL,
  salary_currency CHAR(3) NOT NULL DEFAULT 'RWF',
  salary_visible TINYINT(1) NOT NULL DEFAULT 0,
  positions_available SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  application_deadline DATE NULL,
  status ENUM('draft','published','closed','archived') NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL,
  views_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_job_postings_company (company_id),
  KEY idx_job_postings_status (status),
  KEY idx_job_postings_type (opportunity_type),
  KEY idx_job_postings_deadline (application_deadline),
  CONSTRAINT fk_job_postings_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_job_postings_posted_by FOREIGN KEY (posted_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The skills a posting asks for. This is the table the Phase 7 matching engine scores
-- a job seeker's profile against, so importance/min_level/weight are captured up front.
CREATE TABLE IF NOT EXISTS job_required_skills (
  job_id BIGINT UNSIGNED NOT NULL,
  skill_id INT UNSIGNED NOT NULL,
  importance ENUM('required','preferred') NOT NULL DEFAULT 'required',
  min_level ENUM('beginner','elementary','intermediate','advanced','expert') NOT NULL DEFAULT 'intermediate',
  weight TINYINT UNSIGNED NOT NULL DEFAULT 3,
  PRIMARY KEY (job_id, skill_id),
  KEY idx_job_required_skills_skill (skill_id),
  CONSTRAINT fk_job_required_skills_job FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
  CONSTRAINT fk_job_required_skills_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
