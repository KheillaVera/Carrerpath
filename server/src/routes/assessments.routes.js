const express = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const optionalAuthenticate = require('../middleware/optionalAuthenticate');
const validate = require('../middleware/validate');
const assessmentsController = require('../controllers/assessmentsController');
const { idParam } = require('../validators/common');

const router = express.Router();

const submitValidator = [
  body('answers').isArray({ max: 200 }).withMessage('Answers must be a list.'),
  body('answers.*.questionId').isInt({ min: 1 }),
  body('answers.*.selectedOptionIds').optional().isArray({ max: 10 }),
  body('answers.*.selectedOptionIds.*').optional().isInt({ min: 1 }),
];

// Catalogue is public; a signed-in viewer also sees their own best result.
router.get('/', optionalAuthenticate, assessmentsController.list);

// Literal paths before '/:id'.
router.get('/attempts/mine', authenticate, assessmentsController.myAttempts);
router.get('/attempts/:id', authenticate, idParam('id'), validate, assessmentsController.result);
router.post('/attempts/:id/submit', authenticate, idParam('id'), submitValidator, validate, assessmentsController.submit);

router.get('/:id', idParam('id'), validate, assessmentsController.get);
router.post('/:id/attempts', authenticate, idParam('id'), validate, assessmentsController.start);

module.exports = router;
