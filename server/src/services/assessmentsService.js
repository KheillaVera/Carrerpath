const db = require('../config/db');
const ApiError = require('../utils/ApiError');

const SKILL_LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'];
const QUESTION_TYPES = ['single_choice', 'multiple_choice', 'true_false'];

const ASSESSMENT_FIELDS = `
  a.id, a.skill_id AS skillId, a.title, a.description, a.level,
  a.duration_minutes AS durationMinutes,
  a.passing_score AS passingScore,
  a.is_active AS isActive,
  s.name AS skillName
`;

/** Catalogue of assessments, annotated with the viewer's best result for each. */
async function listAvailable(userId, { skillId, q } = {}) {
  const where = ['a.is_active = 1'];
  const params = [];
  if (skillId) {
    where.push('a.skill_id = ?');
    params.push(Number(skillId));
  }
  if (q) {
    where.push('(a.title LIKE ? OR s.name LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }

  const assessments = await db.query(
    `SELECT ${ASSESSMENT_FIELDS},
            (SELECT COUNT(*) FROM assessment_questions qq WHERE qq.assessment_id = a.id) AS questionCount
     FROM assessments a
     JOIN skills s ON s.id = a.skill_id
     WHERE ${where.join(' AND ')}
     ORDER BY s.name, FIELD(a.level, 'beginner','elementary','intermediate','advanced','expert')`,
    params
  );

  if (!userId || assessments.length === 0) {
    return assessments.map((a) => ({ ...a, bestAttempt: null }));
  }

  const best = await db.query(
    `SELECT assessment_id AS assessmentId, MAX(percentage) AS bestPercentage,
            MAX(passed) AS everPassed, COUNT(*) AS attempts
     FROM assessment_attempts
     WHERE user_id = ? AND status = 'submitted'
     GROUP BY assessment_id`,
    [userId]
  );
  const byAssessment = new Map(best.map((row) => [row.assessmentId, row]));

  return assessments.map((a) => {
    const row = byAssessment.get(a.id);
    return {
      ...a,
      bestAttempt: row
        ? { percentage: Number(row.bestPercentage), passed: !!Number(row.everPassed), attempts: Number(row.attempts) }
        : null,
    };
  });
}

async function getById(assessmentId) {
  const rows = await db.query(
    `SELECT ${ASSESSMENT_FIELDS} FROM assessments a JOIN skills s ON s.id = a.skill_id WHERE a.id = ? LIMIT 1`,
    [assessmentId]
  );
  if (rows.length === 0) throw ApiError.notFound('Assessment not found.');
  return rows[0];
}

/**
 * Questions for a live attempt. Correct answers are deliberately not selected —
 * they never leave the database until the attempt has been submitted.
 */
async function loadQuestionsForAttempt(assessmentId) {
  const questions = await db.query(
    `SELECT id, question_text AS questionText, question_type AS questionType, points, position
     FROM assessment_questions WHERE assessment_id = ? ORDER BY position, id`,
    [assessmentId]
  );
  if (questions.length === 0) return [];

  const placeholders = questions.map(() => '?').join(',');
  const options = await db.query(
    `SELECT id, question_id AS questionId, option_text AS optionText, position
     FROM assessment_options WHERE question_id IN (${placeholders}) ORDER BY position, id`,
    questions.map((q) => q.id)
  );

  const byQuestion = new Map();
  for (const option of options) {
    if (!byQuestion.has(option.questionId)) byQuestion.set(option.questionId, []);
    byQuestion.get(option.questionId).push({ id: option.id, optionText: option.optionText });
  }
  return questions.map((question) => ({ ...question, options: byQuestion.get(question.id) || [] }));
}

async function startAttempt(userId, assessmentId) {
  const assessment = await getById(assessmentId);
  if (!assessment.isActive) throw ApiError.badRequest('This assessment is not currently available.');

  const questions = await loadQuestionsForAttempt(assessmentId);
  if (questions.length === 0) throw ApiError.badRequest('This assessment has no questions yet.');

  // Reuse an attempt that is still within its time limit rather than starting a second one.
  const open = await db.query(
    `SELECT id, started_at AS startedAt, expires_at AS expiresAt
     FROM assessment_attempts
     WHERE user_id = ? AND assessment_id = ? AND status = 'in_progress' AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1`,
    [userId, assessmentId]
  );
  if (open.length > 0) {
    return { assessment, attempt: open[0], questions, resumed: true };
  }

  // Anything still open but past its deadline is closed off before starting fresh.
  await db.query(
    `UPDATE assessment_attempts SET status = 'expired'
     WHERE user_id = ? AND assessment_id = ? AND status = 'in_progress'`,
    [userId, assessmentId]
  );

  const maxScore = questions.reduce((sum, question) => sum + question.points, 0);
  const result = await db.query(
    `INSERT INTO assessment_attempts (assessment_id, user_id, max_score, expires_at)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [assessmentId, userId, maxScore, assessment.durationMinutes]
  );

  const attempt = await db.query(
    'SELECT id, started_at AS startedAt, expires_at AS expiresAt FROM assessment_attempts WHERE id = ?',
    [result.insertId]
  );
  return { assessment, attempt: attempt[0], questions, resumed: false };
}

/** Correct option ids per question, used only during scoring. */
async function loadAnswerKey(assessmentId) {
  const rows = await db.query(
    `SELECT q.id AS questionId, q.question_type AS questionType, q.points, q.explanation,
            o.id AS optionId, o.is_correct AS isCorrect
     FROM assessment_questions q
     JOIN assessment_options o ON o.question_id = q.id
     WHERE q.assessment_id = ?`,
    [assessmentId]
  );
  const key = new Map();
  for (const row of rows) {
    if (!key.has(row.questionId)) {
      key.set(row.questionId, {
        questionId: row.questionId,
        questionType: row.questionType,
        points: row.points,
        explanation: row.explanation,
        correct: new Set(),
      });
    }
    if (row.isCorrect) key.get(row.questionId).correct.add(row.optionId);
  }
  return key;
}

function sameSet(a, b) {
  if (a.size !== b.size) return false;
  for (const value of a) if (!b.has(value)) return false;
  return true;
}

/**
 * Scores a submission, records every answer, and — when the candidate passes —
 * writes the verified level back onto their skill.
 */
async function submitAttempt(userId, attemptId, answers) {
  const attempts = await db.query(
    `SELECT a.id, a.assessment_id AS assessmentId, a.user_id AS userId, a.status,
            a.max_score AS maxScore, a.expires_at AS expiresAt
     FROM assessment_attempts a WHERE a.id = ? AND a.user_id = ? LIMIT 1`,
    [attemptId, userId]
  );
  if (attempts.length === 0) throw ApiError.notFound('Attempt not found.');
  const attempt = attempts[0];
  if (attempt.status !== 'in_progress') throw ApiError.badRequest('This attempt has already been submitted.');

  const assessment = await getById(attempt.assessmentId);
  const key = await loadAnswerKey(attempt.assessmentId);
  const submitted = Array.isArray(answers) ? answers : [];

  let score = 0;
  const graded = [];
  for (const [questionId, entry] of key.entries()) {
    const given = submitted.find((answer) => Number(answer.questionId) === questionId);
    const selected = new Set(
      (given?.selectedOptionIds || []).map((id) => Number(id)).filter((id) => Number.isInteger(id))
    );
    const isCorrect = selected.size > 0 && sameSet(selected, entry.correct);
    const points = isCorrect ? entry.points : 0;
    score += points;
    graded.push({ questionId, selected: [...selected], isCorrect, points });
  }

  const maxScore = attempt.maxScore || [...key.values()].reduce((sum, q) => sum + q.points, 0);
  const percentage = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);
  const passed = percentage >= assessment.passingScore;
  // An attempt submitted after its deadline is recorded, but cannot verify a skill.
  const late = attempt.expiresAt && new Date(attempt.expiresAt) < new Date();
  const awardsVerification = passed && !late;

  await db.withTransaction(async (conn) => {
    for (const answer of graded) {
      await conn.query(
        `INSERT INTO assessment_answers (attempt_id, question_id, selected_option_ids, is_correct, points_awarded)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE selected_option_ids = VALUES(selected_option_ids),
                                 is_correct = VALUES(is_correct),
                                 points_awarded = VALUES(points_awarded)`,
        [attemptId, answer.questionId, JSON.stringify(answer.selected), answer.isCorrect ? 1 : 0, answer.points]
      );
    }

    await conn.query(
      `UPDATE assessment_attempts
       SET status = 'submitted', score = ?, max_score = ?, percentage = ?, passed = ?, submitted_at = NOW()
       WHERE id = ?`,
      [score, maxScore, percentage, passed ? 1 : 0, attemptId]
    );

    if (awardsVerification) {
      // Add the skill if the candidate did not already list it, then record the
      // verified level — never downgrading a higher level already earned.
      await conn.query(
        `INSERT INTO user_skills (user_id, skill_id, self_level, verified_level, verified_score, verified_at, verified_attempt_id)
         VALUES (?, ?, ?, ?, ?, NOW(), ?)
         ON DUPLICATE KEY UPDATE
           verified_level = IF(
             FIELD(VALUES(verified_level), 'beginner','elementary','intermediate','advanced','expert')
               > FIELD(COALESCE(verified_level, 'beginner'), 'beginner','elementary','intermediate','advanced','expert')
               OR verified_level IS NULL,
             VALUES(verified_level), verified_level),
           verified_score = GREATEST(COALESCE(verified_score, 0), VALUES(verified_score)),
           verified_at = NOW(),
           verified_attempt_id = VALUES(verified_attempt_id)`,
        [userId, assessment.skillId, assessment.level, assessment.level, percentage, attemptId]
      );

      await conn.query(
        `INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
         VALUES (?, 'assessment.passed', 'assessment', ?, JSON_OBJECT('score', ?, 'level', ?))`,
        [userId, String(assessment.id), percentage, assessment.level]
      );
    }
  });

  return getResult(userId, attemptId);
}

/** Full result, including the correct answers and explanations. */
async function getResult(userId, attemptId) {
  const attempts = await db.query(
    `SELECT t.id, t.assessment_id AS assessmentId, t.status, t.score, t.max_score AS maxScore,
            t.percentage, t.passed, t.started_at AS startedAt, t.submitted_at AS submittedAt,
            a.title, a.level, a.passing_score AS passingScore, s.name AS skillName, s.id AS skillId
     FROM assessment_attempts t
     JOIN assessments a ON a.id = t.assessment_id
     JOIN skills s ON s.id = a.skill_id
     WHERE t.id = ? AND t.user_id = ? LIMIT 1`,
    [attemptId, userId]
  );
  if (attempts.length === 0) throw ApiError.notFound('Attempt not found.');
  const attempt = attempts[0];

  const rows = await db.query(
    `SELECT q.id AS questionId, q.question_text AS questionText, q.question_type AS questionType,
            q.explanation, q.points, q.position,
            o.id AS optionId, o.option_text AS optionText, o.is_correct AS isCorrect,
            ans.selected_option_ids AS selectedOptionIds, ans.is_correct AS answerCorrect,
            ans.points_awarded AS pointsAwarded
     FROM assessment_questions q
     JOIN assessment_options o ON o.question_id = q.id
     LEFT JOIN assessment_answers ans ON ans.question_id = q.id AND ans.attempt_id = ?
     WHERE q.assessment_id = ?
     ORDER BY q.position, q.id, o.position, o.id`,
    [attemptId, attempt.assessmentId]
  );

  const questions = [];
  const index = new Map();
  for (const row of rows) {
    if (!index.has(row.questionId)) {
      const selected = row.selectedOptionIds
        ? (typeof row.selectedOptionIds === 'string' ? JSON.parse(row.selectedOptionIds) : row.selectedOptionIds)
        : [];
      const question = {
        id: row.questionId,
        questionText: row.questionText,
        questionType: row.questionType,
        explanation: row.explanation,
        points: row.points,
        selectedOptionIds: selected.map(Number),
        isCorrect: !!row.answerCorrect,
        pointsAwarded: row.pointsAwarded || 0,
        options: [],
      };
      index.set(row.questionId, question);
      questions.push(question);
    }
    index.get(row.questionId).options.push({
      id: row.optionId,
      optionText: row.optionText,
      isCorrect: !!row.isCorrect,
    });
  }

  return { attempt, questions };
}

async function listMyAttempts(userId) {
  return db.query(
    `SELECT t.id, t.assessment_id AS assessmentId, t.status, t.score, t.max_score AS maxScore,
            t.percentage, t.passed, t.submitted_at AS submittedAt,
            a.title, a.level, s.name AS skillName
     FROM assessment_attempts t
     JOIN assessments a ON a.id = t.assessment_id
     JOIN skills s ON s.id = a.skill_id
     WHERE t.user_id = ? AND t.status = 'submitted'
     ORDER BY t.submitted_at DESC`,
    [userId]
  );
}

module.exports = {
  SKILL_LEVELS,
  QUESTION_TYPES,
  listAvailable,
  getById,
  startAttempt,
  submitAttempt,
  getResult,
  listMyAttempts,
};
