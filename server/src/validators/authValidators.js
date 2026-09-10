const { body } = require('express-validator');
const { REGISTERABLE_ROLES } = require('../services/authService');

const registerValidator = [
  body('email').isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8, max: 100 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Za-z]/).withMessage('Password must include a letter.')
    .matches(/[0-9]/).withMessage('Password must include a number.'),
  body('fullName')
    .isString().trim()
    .isLength({ min: 2, max: 150 }).withMessage('Full name is required.'),
  body('role')
    .optional()
    .isIn(REGISTERABLE_ROLES).withMessage('Invalid role.'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .isString().isLength({ max: 30 }),
];

const loginValidator = [
  body('email').isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').isString().isLength({ min: 1 }).withMessage('Password is required.'),
];

module.exports = { registerValidator, loginValidator };
