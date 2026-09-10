const applicationsService = require('../services/applicationsService');
const asyncHandler = require('../utils/asyncHandler');

const listMine = asyncHandler(async (req, res) => {
  const applications = await applicationsService.listMine(req.auth.user.id);
  res.json({ applications });
});

const apply = asyncHandler(async (req, res) => {
  const application = await applicationsService.apply(req.auth.user.id, {
    jobId: Number(req.body.jobId),
    coverLetter: req.body.coverLetter,
  });
  res.status(201).json({ application });
});

const withdraw = asyncHandler(async (req, res) => {
  const application = await applicationsService.withdraw(req.auth.user.id, Number(req.params.id));
  res.json({ application });
});

const listForEmployer = asyncHandler(async (req, res) => {
  const applications = await applicationsService.listForEmployer(req.auth.user.id, {
    jobId: req.query.jobId,
    status: req.query.status,
  });
  res.json({ applications });
});

const getEvidence = asyncHandler(async (req, res) => {
  const result = await applicationsService.getApplicantEvidence(req.auth.user.id, Number(req.params.id));
  res.json(result);
});

const setStatus = asyncHandler(async (req, res) => {
  const application = await applicationsService.setStatus(
    req.auth.user.id,
    Number(req.params.id),
    req.body.status,
    req.body.note
  );
  res.json({ application });
});

const stats = asyncHandler(async (req, res) => {
  const result = await applicationsService.statsForEmployer(req.auth.user.id);
  res.json(result);
});

module.exports = { listMine, apply, withdraw, listForEmployer, getEvidence, setStatus, stats };
