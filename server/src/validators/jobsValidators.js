const { body } = require('express-validator');
const {
  OPPORTUNITY_TYPES, EMPLOYMENT_TYPES, WORK_MODES, EDUCATION_LEVELS,
  JOB_STATUSES, SKILL_IMPORTANCE, SKILL_LEVELS,
} = require('../services/jobsService');

const jobBody = [
  body('title').optional().isString().trim().isLength({ min: 3, max: 200 }),
  body('summary').optional({ nullable: true }).isString().isLength({ max: 500 }),
  body('description').optional({ nullable: true }).isString().isLength({ max: 8000 }),
  body('responsibilities').optional({ nullable: true }).isString().isLength({ max: 8000 }),
  body('opportunityType').optional().isIn(OPPORTUNITY_TYPES),
  body('employmentType').optional().isIn(EMPLOYMENT_TYPES),
  body('workMode').optional().isIn(WORK_MODES),
  body('location').optional({ nullable: true }).isString().isLength({ max: 150 }),
  body('district').optional({ nullable: true }).isString().isLength({ max: 100 }),
  body('minExperienceYears').optional({ nullable: true }).isFloat({ min: 0, max: 50 }),
  body('educationLevel').optional().isIn(EDUCATION_LEVELS),
  body('salaryMin').optional({ nullable: true }).isInt({ min: 0 }),
  body('salaryMax').optional({ nullable: true }).isInt({ min: 0 }),
  body('salaryCurrency').optional().isString().isLength({ min: 3, max: 3 }),
  body('salaryVisible').optional().isBoolean(),
  body('positionsAvailable').optional().isInt({ min: 1, max: 1000 }),
  body('applicationDeadline').optional({ nullable: true }).matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Use YYYY-MM-DD.'),
  body('requiredSkills').optional().isArray({ max: 40 }),
  body('requiredSkills.*.skillId').optional().isInt({ min: 1 }),
  body('requiredSkills.*.importance').optional().isIn(SKILL_IMPORTANCE),
  body('requiredSkills.*.minLevel').optional().isIn(SKILL_LEVELS),
  body('requiredSkills.*.weight').optional().isInt({ min: 1, max: 5 }),
];

const createJobValidator = [
  body('title').isString().trim().isLength({ min: 3, max: 200 }).withMessage('Job title is required.'),
  ...jobBody,
];

const updateJobValidator = jobBody;

const jobStatusValidator = [
  body('status').isIn(JOB_STATUSES).withMessage('Status must be draft, published, closed or archived.'),
];

module.exports = { createJobValidator, updateJobValidator, jobStatusValidator };
