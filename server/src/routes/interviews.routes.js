const express = require('express');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { updateInterviewValidator } = require('../validators/applicationsValidators');
const interviewsController = require('../controllers/interviewsController');
const { idParam } = require('../validators/common');

const router = express.Router();

router.use(authenticate);

// Employers see interviews they scheduled; applicants see their own.
router.get('/mine', interviewsController.listMine);
router.patch('/:id', idParam('id'), updateInterviewValidator, validate, interviewsController.update);
router.delete('/:id', idParam('id'), validate, interviewsController.remove);

module.exports = router;
