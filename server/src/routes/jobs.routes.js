const express = require('express');
const authenticate = require('../middleware/authenticate');
const optionalAuthenticate = require('../middleware/optionalAuthenticate');
const validate = require('../middleware/validate');
const { requireRole } = require('../middleware/authorize');
const { createJobValidator, updateJobValidator, jobStatusValidator } = require('../validators/jobsValidators');
const jobsController = require('../controllers/jobsController');

const router = express.Router();

// Public marketplace. Optional auth so signed-in seekers see their saved postings.
router.get('/', optionalAuthenticate, jobsController.listPublic);
router.get('/filters', jobsController.listFilters);

// Employer views of their own postings, including drafts. Literal paths first.
router.get('/mine', authenticate, jobsController.listMine);
router.get('/mine/:id', authenticate, jobsController.getMine);

// Saved opportunities (job seekers).
router.get('/saved', authenticate, jobsController.listSaved);

router.post('/', authenticate, requireRole('employer', 'admin'), createJobValidator, validate, jobsController.create);
router.patch('/:id', authenticate, updateJobValidator, validate, jobsController.update);
router.patch('/:id/status', authenticate, jobStatusValidator, validate, jobsController.setStatus);
router.delete('/:id', authenticate, jobsController.remove);

router.post('/:id/save', authenticate, jobsController.save);
router.delete('/:id/save', authenticate, jobsController.unsave);

router.get('/:id', optionalAuthenticate, jobsController.getPublic);

module.exports = router;
