const db = require('../config/db');
const ApiError = require('../utils/ApiError');

/**
 * The matching engine.
 *
 * Scores a candidate's profile against a posting and — just as importantly —
 * explains itself. Specification §23: a match score is never a black box. Every
 * number returned here comes with the skills that produced it, so a candidate
 * can see exactly why they scored what they did and what would raise it.
 *
 * Nothing here rejects anyone. A low score is a starting point for the gap
 * analysis, not a filter that hides opportunities.
 */

const LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'];
const EDUCATION = ['none', 'secondary', 'tvet', 'certificate', 'diploma', 'bachelor', 'master', 'phd'];

// How much each part of the profile contributes. Required skills dominate on
// purpose: this platform is about what someone can actually do.
const WEIGHTS = {
  requiredSkills: 0.62,
  preferredSkills: 0.10,
  experience: 0.16,
  education: 0.12,
};

const levelIndex = (level) => Math.max(0, LEVELS.indexOf(level));
const educationIndex = (level) => Math.max(0, EDUCATION.indexOf(level));

/**
 * How well one skill at one level answers a requirement.
 * Meeting the bar scores full marks; falling short scores partial credit rather
 * than zero, because someone one level away is a real candidate with a gap.
 */
function levelFactor(candidateLevel, requiredLevel) {
  const gap = levelIndex(requiredLevel) - levelIndex(candidateLevel);
  if (gap <= 0) return 1;
  if (gap === 1) return 0.65;
  if (gap === 2) return 0.35;
  return 0.15;
}

function bandFor(score) {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'good';
  if (score >= 40) return 'partial';
  return 'early';
}

/** Total months of recorded experience, counting an open-ended role up to today. */
function totalExperienceYears(entries) {
  let months = 0;
  for (const entry of entries) {
    if (!entry.startDate) continue;
    const start = new Date(entry.startDate);
    const end = entry.isCurrent || !entry.endDate ? new Date() : new Date(entry.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) continue;
    months += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  }
  return Math.max(0, Math.round((months / 12) * 10) / 10);
}

/** Everything about one candidate that matching needs, fetched once. */
async function loadCandidate(userId) {
  const [skills, experience, education, projectSkills] = await Promise.all([
    db.query(
      `SELECT s.id AS skillId, s.name, us.self_level AS selfLevel,
              us.verified_level AS verifiedLevel, us.verified_score AS verifiedScore,
              us.years_experience AS yearsExperience
       FROM user_skills us JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ?`,
      [userId]
    ),
    db.query(
      `SELECT start_date AS startDate, end_date AS endDate, is_current AS isCurrent
       FROM experience WHERE user_id = ?`,
      [userId]
    ),
    db.query('SELECT qualification FROM education WHERE user_id = ?', [userId]),
    db.query(
      `SELECT ps.skill_id AS skillId, COUNT(*) AS projectCount
       FROM project_skills ps JOIN projects p ON p.id = ps.project_id
       WHERE p.user_id = ? GROUP BY ps.skill_id`,
      [userId]
    ),
  ]);

  const evidence = new Map(projectSkills.map((row) => [row.skillId, Number(row.projectCount)]));

  return {
    skills: new Map(skills.map((s) => [s.skillId, s])),
    experienceYears: totalExperienceYears(experience),
    // Education level is inferred from the wording of the qualification, since
    // candidates type it freely rather than picking from a list.
    educationLevel: inferEducationLevel(education),
    evidence,
  };
}

function inferEducationLevel(entries) {
  const text = entries.map((e) => String(e.qualification || '').toLowerCase()).join(' ');
  if (/phd|doctorate/.test(text)) return 'phd';
  if (/master|msc|mba/.test(text)) return 'master';
  if (/bachelor|bsc|ba\b|degree/.test(text)) return 'bachelor';
  if (/diploma/.test(text)) return 'diploma';
  if (/certificate|certification/.test(text)) return 'certificate';
  if (/tvet|vocational/.test(text)) return 'tvet';
  if (/secondary|high school|a-level|o-level/.test(text)) return 'secondary';
  return entries.length > 0 ? 'secondary' : 'none';
}

async function loadJobRequirements(jobId) {
  const jobs = await db.query(
    `SELECT j.id, j.title, j.min_experience_years AS minExperienceYears,
            j.education_level AS educationLevel, j.status,
            c.name AS companyName, c.slug AS companySlug
     FROM job_postings j JOIN companies c ON c.id = j.company_id
     WHERE j.id = ? LIMIT 1`,
    [jobId]
  );
  if (jobs.length === 0) throw ApiError.notFound('Job posting not found.');

  const skills = await db.query(
    `SELECT jrs.skill_id AS skillId, s.name, jrs.importance,
            jrs.min_level AS minLevel, jrs.weight
     FROM job_required_skills jrs JOIN skills s ON s.id = jrs.skill_id
     WHERE jrs.job_id = ?`,
    [jobId]
  );

  return { job: jobs[0], skills };
}

/** Scores one requirement against what the candidate has. */
function scoreSkill(requirement, candidate) {
  const held = candidate.skills.get(requirement.skillId);
  const projectCount = candidate.evidence.get(requirement.skillId) || 0;

  if (!held) {
    return {
      ...requirement,
      status: 'missing',
      factor: 0,
      candidateLevel: null,
      verified: false,
      projectCount,
    };
  }

  // A level proven by assessment is trusted ahead of a self-declared one.
  const verified = !!held.verifiedLevel;
  const effectiveLevel = verified && levelIndex(held.verifiedLevel) >= levelIndex(held.selfLevel)
    ? held.verifiedLevel
    : held.selfLevel;

  let factor = levelFactor(effectiveLevel, requirement.minLevel);

  // Evidence nudges a claim upwards, but can never exceed a full match.
  if (factor < 1 && (verified || projectCount > 0)) {
    factor = Math.min(1, factor + (verified ? 0.15 : 0) + (projectCount > 0 ? 0.1 : 0));
  }

  return {
    ...requirement,
    status: factor >= 1 ? 'matched' : 'partial',
    factor: Math.round(factor * 100) / 100,
    candidateLevel: effectiveLevel,
    selfLevel: held.selfLevel,
    verifiedLevel: held.verifiedLevel,
    verified,
    projectCount,
  };
}

function weightedScore(scored) {
  const totalWeight = scored.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return null;
  const earned = scored.reduce((sum, s) => sum + s.weight * s.factor, 0);
  return earned / totalWeight;
}

/**
 * Produces the score and the reasoning behind it.
 * `candidate` may be passed in when scoring many jobs at once.
 */
async function matchProfileToJob(userId, jobId, preloadedCandidate = null) {
  const candidate = preloadedCandidate || await loadCandidate(userId);
  const { job, skills } = await loadJobRequirements(jobId);

  const required = skills.filter((s) => s.importance === 'required').map((s) => scoreSkill(s, candidate));
  const preferred = skills.filter((s) => s.importance === 'preferred').map((s) => scoreSkill(s, candidate));

  const components = [];

  const requiredScore = weightedScore(required);
  if (requiredScore !== null) {
    const met = required.filter((s) => s.status === 'matched').length;
    components.push({
      key: 'required_skills',
      label: 'Required skills',
      weight: WEIGHTS.requiredSkills,
      score: requiredScore,
      detail: `${met} of ${required.length} required skills fully met`,
    });
  }

  const preferredScore = weightedScore(preferred);
  if (preferredScore !== null) {
    const met = preferred.filter((s) => s.status === 'matched').length;
    components.push({
      key: 'preferred_skills',
      label: 'Preferred skills',
      weight: WEIGHTS.preferredSkills,
      score: preferredScore,
      detail: `${met} of ${preferred.length} preferred skills met`,
    });
  }

  const requiredYears = Number(job.minExperienceYears) || 0;
  const experienceScore = requiredYears === 0
    ? 1
    : Math.min(1, candidate.experienceYears / requiredYears);
  components.push({
    key: 'experience',
    label: 'Experience',
    weight: WEIGHTS.experience,
    score: experienceScore,
    detail: requiredYears === 0
      ? 'No minimum experience required'
      : `${candidate.experienceYears} of ${requiredYears} years required`,
  });

  const requiredEducation = educationIndex(job.educationLevel);
  const educationScore = requiredEducation === 0
    ? 1
    : Math.min(1, (educationIndex(candidate.educationLevel) + 1) / (requiredEducation + 1));
  components.push({
    key: 'education',
    label: 'Education',
    weight: WEIGHTS.education,
    score: educationScore,
    detail: job.educationLevel === 'none'
      ? 'No formal requirement'
      : `${candidate.educationLevel.replace('_', ' ')} against ${job.educationLevel} required`,
  });

  // Re-normalise across the components that actually applied, so a posting with
  // no preferred skills is not silently marked down for it.
  const usedWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const overall = components.reduce((sum, c) => sum + (c.weight / usedWeight) * c.score, 0);
  const score = Math.round(overall * 100);

  const missing = required.filter((s) => s.status === 'missing');
  const partial = required.filter((s) => s.status === 'partial');
  const matched = required.filter((s) => s.status === 'matched');

  return {
    jobId: job.id,
    jobTitle: job.title,
    companyName: job.companyName,
    companySlug: job.companySlug,
    score,
    band: bandFor(score),
    components: components.map((c) => ({
      ...c,
      score: Math.round(c.score * 100),
      weight: Math.round((c.weight / usedWeight) * 100),
    })),
    skills: { matched, partial, missing, preferred },
    // What the candidate should do next, in priority order — heaviest gap first.
    gaps: [...missing, ...partial]
      .sort((a, b) => b.weight - a.weight || levelIndex(b.minLevel) - levelIndex(a.minLevel))
      .map((s) => ({
        skillId: s.skillId,
        name: s.name,
        requiredLevel: s.minLevel,
        currentLevel: s.candidateLevel,
        status: s.status,
        weight: s.weight,
        action: s.status === 'missing'
          ? `Learn ${s.name} to ${s.minLevel} level`
          : `Move ${s.name} from ${s.candidateLevel} to ${s.minLevel}`,
      })),
    strengths: matched
      .filter((s) => s.verified || s.projectCount > 0)
      .map((s) => ({
        skillId: s.skillId,
        name: s.name,
        verified: s.verified,
        projectCount: s.projectCount,
        reason: s.verified
          ? `Verified by assessment at ${s.verifiedLevel} level`
          : `Backed by ${s.projectCount} project${s.projectCount === 1 ? '' : 's'}`,
      })),
    summary: buildSummary(score, matched.length, required.length, missing.length),
  };
}

function buildSummary(score, matchedCount, requiredCount, missingCount) {
  if (requiredCount === 0) return 'This posting does not list required skills, so the score is based on experience and education alone.';
  if (score >= 80) return `Strong match — you meet ${matchedCount} of ${requiredCount} required skills.`;
  if (score >= 60) return `Good match — ${matchedCount} of ${requiredCount} required skills met, with ${missingCount} to close.`;
  if (score >= 40) return `Partial match — worth applying if you can show related work. ${missingCount} required skill${missingCount === 1 ? '' : 's'} missing.`;
  return `Early match — this role needs skills you have not recorded yet. It is a good target to build towards.`;
}

/** Scores many postings for one candidate, loading the profile a single time. */
async function matchProfileToJobs(userId, jobIds) {
  if (jobIds.length === 0) return new Map();
  const candidate = await loadCandidate(userId);
  const results = await Promise.all(
    jobIds.map((jobId) => matchProfileToJob(userId, jobId, candidate).catch(() => null))
  );
  return new Map(results.filter(Boolean).map((r) => [r.jobId, r]));
}

/** The candidate's best-matching open opportunities. */
async function recommendedForUser(userId, limit = 6) {
  const safeLimit = Math.min(Math.max(Number(limit) || 6, 1), 24);
  const open = await db.query(
    `SELECT j.id FROM job_postings j
     WHERE j.status = 'published'
       AND (j.application_deadline IS NULL OR j.application_deadline >= CURDATE())
     ORDER BY j.published_at DESC
     LIMIT 60`
  );
  const matches = await matchProfileToJobs(userId, open.map((row) => row.id));
  return [...matches.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit);
}

/** The employer's view: how one applicant scores against their own posting. */
async function matchApplicantToJob(applicantUserId, jobId) {
  return matchProfileToJob(applicantUserId, jobId);
}

module.exports = {
  LEVELS,
  WEIGHTS,
  matchProfileToJob,
  matchProfileToJobs,
  recommendedForUser,
  matchApplicantToJob,
  totalExperienceYears,
  levelFactor,
};
