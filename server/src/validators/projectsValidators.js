const { body } = require('express-validator');
const { PROJECT_TYPES } = require('../services/projectsService');
const { optionalUrl } = require('./common');

const projectBody = [
  body('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('description').optional({ nullable: true }).isString().isLength({ max: 4000 }),
  body('projectType').optional().isIn(PROJECT_TYPES),
  body('role').optional({ nullable: true }).isString().isLength({ max: 150 }),
  optionalUrl('githubUrl'),
  optionalUrl('liveDemoUrl'),
  optionalUrl('imageUrl'),
  body('completionDate').optional({ nullable: true }).matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Use YYYY-MM-DD.'),
  body('skillIds').optional().isArray({ max: 30 }),
  body('skillIds.*').optional().isInt({ min: 1 }),
];

const createProjectValidator = [
  body('title').isString().trim().isLength({ min: 1, max: 200 }).withMessage('Title is required.'),
  ...projectBody,
];

const updateProjectValidator = projectBody;

module.exports = { createProjectValidator, updateProjectValidator };
