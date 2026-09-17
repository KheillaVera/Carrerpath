const express = require('express');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');

const { updateProfileValidator } = require('../validators/profileValidators');
const { addSkillValidator } = require('../validators/skillsValidators');
const { createProjectValidator, updateProjectValidator } = require('../validators/projectsValidators');
const { createEducationValidator, updateEducationValidator } = require('../validators/educationValidators');
const { createExperienceValidator, updateExperienceValidator } = require('../validators/experienceValidators');
const { createCertificationValidator, updateCertificationValidator } = require('../validators/certificationsValidators');

const profileController = require('../controllers/profileController');
const skillsController = require('../controllers/skillsController');
const projectsController = require('../controllers/projectsController');
const educationController = require('../controllers/educationController');
const { idParam } = require('../validators/common');
const experienceController = require('../controllers/experienceController');
const certificationsController = require('../controllers/certificationsController');

const router = express.Router();

router.use(authenticate);

router.get('/', profileController.get);
router.patch('/', updateProfileValidator, validate, profileController.update);

// Skills on the profile
router.get('/skills', skillsController.listMine);
router.post('/skills', addSkillValidator, validate, skillsController.addMine);
router.delete('/skills/:skillId', idParam('skillId'), validate, skillsController.removeMine);

// Projects
router.get('/projects', projectsController.list);
router.post('/projects', createProjectValidator, validate, projectsController.create);
router.patch('/projects/:id', idParam('id'), updateProjectValidator, validate, projectsController.update);
router.delete('/projects/:id', idParam('id'), validate, projectsController.remove);

// Education
router.get('/education', educationController.list);
router.post('/education', createEducationValidator, validate, educationController.create);
router.patch('/education/:id', idParam('id'), updateEducationValidator, validate, educationController.update);
router.delete('/education/:id', idParam('id'), validate, educationController.remove);

// Experience
router.get('/experience', experienceController.list);
router.post('/experience', createExperienceValidator, validate, experienceController.create);
router.patch('/experience/:id', idParam('id'), updateExperienceValidator, validate, experienceController.update);
router.delete('/experience/:id', idParam('id'), validate, experienceController.remove);

// Certifications
router.get('/certifications', certificationsController.list);
router.post('/certifications', createCertificationValidator, validate, certificationsController.create);
router.patch('/certifications/:id', idParam('id'), updateCertificationValidator, validate, certificationsController.update);
router.delete('/certifications/:id', idParam('id'), validate, certificationsController.remove);

module.exports = router;
