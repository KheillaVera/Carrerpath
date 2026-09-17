const { body } = require('express-validator');
const { optionalUrl } = require('./common');

const WORK_MODES = ['onsite', 'remote', 'hybrid', 'any'];
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'internship', 'contract', 'freelance', 'any'];

const updateProfileValidator = [
  body('fullName').optional().isString().trim().isLength({ min: 2, max: 150 }),
  body('phone').optional({ nullable: true }).isString().isLength({ max: 30 }),
  body('jobSeeker').optional().isObject(),
  body('jobSeeker.headline').optional({ nullable: true }).isString().isLength({ max: 150 }),
  body('jobSeeker.bio').optional({ nullable: true }).isString().isLength({ max: 4000 }),
  body('jobSeeker.location').optional({ nullable: true }).isString().isLength({ max: 150 }),
  body('jobSeeker.careerInterests').optional({ nullable: true }).isString().isLength({ max: 255 }),
  body('jobSeeker.preferredWorkMode').optional().isIn(WORK_MODES),
  body('jobSeeker.preferredEmploymentType').optional().isIn(EMPLOYMENT_TYPES),
  optionalUrl('jobSeeker.githubUrl'),
  optionalUrl('jobSeeker.linkedinUrl'),
  optionalUrl('jobSeeker.portfolioUrl'),
  optionalUrl('jobSeeker.profilePhotoUrl'),
];

module.exports = { updateProfileValidator };
