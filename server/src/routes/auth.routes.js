const express = require('express');
const authController = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidators');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const authRateLimit = require('../middleware/authRateLimit');

const router = express.Router();

router.post('/register', authRateLimit, registerValidator, validate, authController.register);
router.post('/login', authRateLimit, loginValidator, validate, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;
