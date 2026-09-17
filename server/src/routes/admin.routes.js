const express = require('express');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { requireRole, requirePermission } = require('../middleware/authorize');
const { verifyCompanyValidator } = require('../validators/companiesValidators');
const { idParam, pagingQuery } = require('../validators/common');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(authenticate, requireRole('admin'));

router.get('/stats', adminController.stats);
router.get('/activity', adminController.activity);
router.get('/companies', adminController.listCompanies);
router.patch(
  '/companies/:id/verification',
  requirePermission('admin.verify_employer'),
  idParam(),
  verifyCompanyValidator,
  validate,
  adminController.setCompanyVerification
);

module.exports = router;
