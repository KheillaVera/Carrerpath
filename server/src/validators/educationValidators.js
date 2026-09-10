const { body } = require('express-validator');

const educationBody = [
  body('institution').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('qualification').optional().isString().trim().isLength({ min: 1, max: 150 }),
  body('fieldOfStudy').optional({ nullable: true }).isString().isLength({ max: 150 }),
  body('startDate').optional({ nullable: true }).matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Use YYYY-MM-DD.'),
  body('endDate').optional({ nullable: true }).matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Use YYYY-MM-DD.'),
  body('isCurrent').optional().isBoolean(),
  body('description').optional({ nullable: true }).isString().isLength({ max: 1000 }),
];

const createEducationValidator = [
  body('institution').isString().trim().isLength({ min: 1, max: 200 }).withMessage('Institution is required.'),
  body('qualification').isString().trim().isLength({ min: 1, max: 150 }).withMessage('Qualification is required.'),
  ...educationBody,
];

const updateEducationValidator = educationBody;

module.exports = { createEducationValidator, updateEducationValidator };
