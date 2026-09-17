const express = require('express');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { requireRole } = require('../middleware/authorize');
const { createCompanyValidator, updateCompanyValidator } = require('../validators/companiesValidators');
const companiesController = require('../controllers/companiesController');
const { idParam, slugParam } = require('../validators/common');

const router = express.Router();

// Public directory.
router.get('/', companiesController.listPublic);

// Employer-managed company profile. Declared before '/:slug' so the literal path wins.
router.get('/mine', authenticate, companiesController.getMine);
router.post('/', authenticate, requireRole('employer', 'admin'), createCompanyValidator, validate, companiesController.create);
router.patch('/:id', authenticate, idParam('id'), updateCompanyValidator, validate, companiesController.update);

router.get('/:slug', slugParam(), validate, companiesController.getPublic);

module.exports = router;
