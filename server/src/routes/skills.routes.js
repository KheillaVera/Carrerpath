const express = require('express');
const skillsController = require('../controllers/skillsController');

const router = express.Router();

router.get('/', skillsController.catalogue);
router.get('/categories', skillsController.categories);

module.exports = router;
