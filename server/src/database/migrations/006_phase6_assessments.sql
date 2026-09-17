-- Phase 6: Skill assessments
--
-- Assessments turn a self-declared skill into evidence. A passed attempt writes a
-- verified level back onto user_skills, which the Phase 7 matching engine trusts
-- ahead of the level a candidate claimed for themselves.

CREATE TABLE IF NOT EXISTS assessments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  skill_id INT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  description VARCHAR(1000) NULL,
  level ENUM('beginner','elementary','intermediate','advanced','expert') NOT NULL DEFAULT 'intermediate',
  duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  passing_score TINYINT UNSIGNED NOT NULL DEFAULT 70,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assessments_skill_level (skill_id, level),
  KEY idx_assessments_active (is_active),
  CONSTRAINT fk_assessments_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  CONSTRAINT fk_assessments_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_questions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  assessment_id INT UNSIGNED NOT NULL,
  question_text VARCHAR(1000) NOT NULL,
  question_type ENUM('single_choice','multiple_choice','true_false') NOT NULL DEFAULT 'single_choice',
  explanation VARCHAR(1000) NULL,
  points TINYINT UNSIGNED NOT NULL DEFAULT 1,
  position SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_assessment_questions_assessment (assessment_id, position),
  CONSTRAINT fk_assessment_questions_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_options (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  question_id BIGINT UNSIGNED NOT NULL,
  option_text VARCHAR(500) NOT NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  position SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_assessment_options_question (question_id, position),
  CONSTRAINT fk_assessment_options_question FOREIGN KEY (question_id) REFERENCES assessment_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  assessment_id INT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('in_progress','submitted','expired') NOT NULL DEFAULT 'in_progress',
  score SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  max_score SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  percentage TINYINT UNSIGNED NOT NULL DEFAULT 0,
  passed TINYINT(1) NOT NULL DEFAULT 0,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  submitted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_assessment_attempts_user (user_id, assessment_id),
  KEY idx_assessment_attempts_status (status),
  CONSTRAINT fk_assessment_attempts_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  CONSTRAINT fk_assessment_attempts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_answers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  attempt_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  selected_option_ids JSON NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  points_awarded TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assessment_answers_attempt_question (attempt_id, question_id),
  KEY idx_assessment_answers_question (question_id),
  CONSTRAINT fk_assessment_answers_attempt FOREIGN KEY (attempt_id) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_assessment_answers_question FOREIGN KEY (question_id) REFERENCES assessment_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A skill a candidate has actually passed an assessment for is no longer merely claimed.
ALTER TABLE user_skills
  ADD COLUMN verified_level ENUM('beginner','elementary','intermediate','advanced','expert') NULL AFTER self_level,
  ADD COLUMN verified_score TINYINT UNSIGNED NULL AFTER verified_level,
  ADD COLUMN verified_at TIMESTAMP NULL AFTER verified_score,
  ADD COLUMN verified_attempt_id BIGINT UNSIGNED NULL AFTER verified_at,
  ADD CONSTRAINT fk_user_skills_attempt FOREIGN KEY (verified_attempt_id) REFERENCES assessment_attempts(id) ON DELETE SET NULL;
