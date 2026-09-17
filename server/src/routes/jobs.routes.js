const express = require('express');
const authenticate = require('../middleware/authenticate');
const optionalAuthenticate = require('../middleware/optionalAuthenticate');
const validate = require('../middleware/validate');
const { requireRole } = require('../middleware/authorize');
const { createJobValidator, updateJobValidator, jobStatusValidator } = require('../validators/jobsValidators');
const jobsController = require('../controllers/jobsController');
const matchingController = require('../controllers/matchingController');
const { idParam } = require('../validators/common');

const router = express.Router();

// Public marketplace. Optional auth so signed-in seekers see their saved postings.
router.get('/', optionalAuthenticate, jobsController.listPublic);
router.get('/filters', jobsController.listFilters);

// Employer views of their own postings, including drafts. Literal paths first.
router.get('/mine', authenticate, jobsController.listMine);
router.get('/mine/:id', authenticate, idParam('id'), validate, jobsController.getMine);

// Saved opportunities (job seekers).
router.get('/saved', authenticate, jobsController.listSaved);

// Transparent match score for the signed-in candidate.
router.get('/recommended', authenticate, matchingController.recommended);
router.get('/:id/match', authenticate, idParam('id'), validate, matchingController.matchForJob);

router.post('/', authenticate, requireRole('employer', 'admin'), createJobValidator, validate, jobsController.create);
router.patch('/:id', authenticate, idParam('id'), updateJobValidator, validate, jobsController.update);
router.patch('/:id/status', authenticate, idParam('id'), jobStatusValidator, validate, jobsController.setStatus);
router.delete('/:id', authenticate, idParam('id'), validate, jobsController.remove);

router.post('/:id/save', authenticate, idParam('id'), validate, jobsController.save);
router.delete('/:id/save', authenticate, idParam('id'), validate, jobsController.unsave);

router.get('/:id', optionalAuthenticate, idParam('id'), validate, jobsController.getPublic);

module.exports = router;
