const { body } = require('express-validator');
const { EMPLOYER_STATUSES } = require('../services/applicationsService');
const { INTERVIEW_MODES, INTERVIEW_STATUSES } = require('../services/interviewsService');

const applyValidator = [
  body('jobId').isInt({ min: 1 }).withMessage('A job posting is required.'),
  body('coverLetter').optional({ nullable: true }).isString().isLength({ max: 5000 }),
];

const applicationStatusValidator = [
  body('status').isIn(EMPLOYER_STATUSES).withMessage('Unknown application status.'),
  body('note').optional({ nullable: true }).isString().isLength({ max: 1000 }),
];

const scheduleInterviewValidator = [
  body('scheduledAt')
    .matches(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/)
    .withMessage('Use a date and time such as 2026-03-01 14:30.'),
  body('durationMinutes').optional().isInt({ min: 5, max: 480 }),
  body('mode').optional().isIn(INTERVIEW_MODES),
  body('location').optional({ nullable: true }).isString().isLength({ max: 255 }),
  body('meetingUrl').optional({ nullable: true }).isString().isLength({ max: 255 }),
  body('note').optional({ nullable: true }).isString().isLength({ max: 1000 }),
];

const updateInterviewValidator = [
  body('scheduledAt').optional().matches(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/),
  body('durationMinutes').optional().isInt({ min: 5, max: 480 }),
  body('mode').optional().isIn(INTERVIEW_MODES),
  body('status').optional().isIn(INTERVIEW_STATUSES),
  body('location').optional({ nullable: true }).isString().isLength({ max: 255 }),
  body('meetingUrl').optional({ nullable: true }).isString().isLength({ max: 255 }),
  body('note').optional({ nullable: true }).isString().isLength({ max: 1000 }),
];

module.exports = {
  applyValidator,
  applicationStatusValidator,
  scheduleInterviewValidator,
  updateInterviewValidator,
};
