const { body } = require('express-validator');
const { COMPANY_SIZES, VERIFICATION_STATUSES } = require('../services/companiesService');
const { optionalUrl, optionalEmail, optionalPhone, idParam } = require('./common');

const companyBody = [
  body('name').optional().isString().trim().isLength({ min: 2, max: 200 }),
  body('tagline').optional({ nullable: true }).isString().isLength({ max: 255 }),
  body('description').optional({ nullable: true }).isString().isLength({ max: 5000 }),
  body('industry').optional({ nullable: true }).isString().isLength({ max: 120 }),
  body('companySize').optional({ nullable: true }).isIn(COMPANY_SIZES),
  body('foundedYear').optional({ nullable: true }).isInt({ min: 1800, max: 2100 }),
  optionalUrl('websiteUrl'),
  optionalUrl('logoUrl'),
  body('location').optional({ nullable: true }).isString().isLength({ max: 150 }),
  body('district').optional({ nullable: true }).isString().isLength({ max: 100 }),
  optionalEmail('contactEmail'),
  optionalPhone('contactPhone'),
];

const createCompanyValidator = [
  body('name').isString().trim().isLength({ min: 2, max: 200 }).withMessage('Company name is required.'),
  ...companyBody,
];

const updateCompanyValidator = companyBody;

const verifyCompanyValidator = [
  body('status').isIn(VERIFICATION_STATUSES).withMessage('Status must be pending, verified or rejected.'),
  body('note').optional({ nullable: true }).isString().isLength({ max: 500 }),
];

module.exports = { createCompanyValidator, updateCompanyValidator, verifyCompanyValidator };
