const { body } = require('express-validator');
const { LEVELS } = require('../services/skillsService');

const addSkillValidator = [
  body('skillId').isInt({ min: 1 }).withMessage('skillId is required.'),
  body('selfLevel').optional().isIn(LEVELS).withMessage('Invalid skill level.'),
  body('yearsExperience').optional({ nullable: true }).isFloat({ min: 0, max: 60 }),
  body('notes').optional({ nullable: true }).isString().isLength({ max: 500 }),
];

module.exports = { addSkillValidator };
