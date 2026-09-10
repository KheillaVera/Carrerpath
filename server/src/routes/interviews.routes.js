const express = require('express');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { updateInterviewValidator } = require('../validators/applicationsValidators');
const interviewsController = require('../controllers/interviewsController');

const router = express.Router();

router.use(authenticate);

// Employers see interviews they scheduled; applicants see their own.
router.get('/mine', interviewsController.listMine);
router.patch('/:id', updateInterviewValidator, validate, interviewsController.update);
router.delete('/:id', interviewsController.remove);

module.exports = router;
