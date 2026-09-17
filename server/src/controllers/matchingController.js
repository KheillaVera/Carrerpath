const matchingService = require('../services/matchingService');
const applicationsService = require('../services/applicationsService');
const asyncHandler = require('../utils/asyncHandler');

/** A job seeker's match against one posting, with the full reasoning. */
const matchForJob = asyncHandler(async (req, res) => {
  const match = await matchingService.matchProfileToJob(req.auth.user.id, Number(req.params.id));
  res.json({ match });
});

/** Best-matching open opportunities for the signed-in candidate. */
const recommended = asyncHandler(async (req, res) => {
  const matches = await matchingService.recommendedForUser(req.auth.user.id, req.query.limit);
  res.json({ matches });
});

/**
 * The employer's view of an applicant. Ownership is checked by loading the
 * application through the employer-scoped query first.
 */
const matchForApplication = asyncHandler(async (req, res) => {
  const application = await applicationsService.getForEmployer(req.auth.user.id, Number(req.params.id));
  const match = await matchingService.matchApplicantToJob(application.applicantUserId, application.jobId);
  res.json({ match });
});

module.exports = { matchForJob, recommended, matchForApplication };
