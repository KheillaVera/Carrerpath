const express = require('express');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { requirePermission } = require('../middleware/authorize');
const {
  applyValidator, applicationStatusValidator, scheduleInterviewValidator,
} = require('../validators/applicationsValidators');
const applicationsController = require('../controllers/applicationsController');
const interviewsController = require('../controllers/interviewsController');

const router = express.Router();

router.use(authenticate);

// Job seeker side.
router.get('/mine', applicationsController.listMine);
router.post('/', requirePermission('applications.submit'), applyValidator, validate, applicationsController.apply);
router.patch('/:id/withdraw', applicationsController.withdraw);

// Employer side.
router.get('/employer', requirePermission('applications.review'), applicationsController.listForEmployer);
router.get('/employer/stats', requirePermission('applications.review'), applicationsController.stats);
router.get('/:id/evidence', requirePermission('applications.review'), applicationsController.getEvidence);
router.patch('/:id/status', requirePermission('applications.review'), applicationStatusValidator, validate, applicationsController.setStatus);
router.post('/:id/interviews', requirePermission('applications.review'), scheduleInterviewValidator, validate, interviewsController.schedule);

module.exports = router;
