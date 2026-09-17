const { body } = require('express-validator');
const { optionalUrl } = require('./common');

const certBody = [
  body('name').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('issuer').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('issueDate').optional({ nullable: true }).matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Use YYYY-MM-DD.'),
  body('expiryDate').optional({ nullable: true }).matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Use YYYY-MM-DD.'),
  body('credentialId').optional({ nullable: true }).isString().isLength({ max: 150 }),
  optionalUrl('verificationUrl'),
];

const createCertificationValidator = [
  body('name').isString().trim().isLength({ min: 1, max: 200 }).withMessage('Certification name is required.'),
  body('issuer').isString().trim().isLength({ min: 1, max: 200 }).withMessage('Issuer is required.'),
  ...certBody,
];

const updateCertificationValidator = certBody;

module.exports = { createCertificationValidator, updateCertificationValidator };
