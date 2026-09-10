const { body } = require('express-validator');
const { EMPLOYMENT_TYPES } = require('../services/experienceService');

const experienceBody = [
  body('company').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('role').optional().isString().trim().isLength({ min: 1, max: 150 }),
  body('employmentType').optional().isIn(EMPLOYMENT_TYPES),
  body('location').optional({ nullable: true }).isString().isLength({ max: 150 }),
  body('startDate').optional({ nullable: true }).matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Use YYYY-MM-DD.'),
  body('endDate').optional({ nullable: true }).matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Use YYYY-MM-DD.'),
  body('isCurrent').optional().isBoolean(),
  body('description').optional({ nullable: true }).isString().isLength({ max: 4000 }),
];

const createExperienceValidator = [
  body('company').isString().trim().isLength({ min: 1, max: 200 }).withMessage('Company is required.'),
  body('role').isString().trim().isLength({ min: 1, max: 150 }).withMessage('Role is required.'),
  ...experienceBody,
];

const updateExperienceValidator = experienceBody;

module.exports = { createExperienceValidator, updateExperienceValidator };
