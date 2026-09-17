const assessmentsService = require('../services/assessmentsService');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const assessments = await assessmentsService.listAvailable(req.auth?.user?.id || null, {
    skillId: req.query.skillId,
    q: req.query.q,
  });
  res.json({ assessments });
});

const get = asyncHandler(async (req, res) => {
  const assessment = await assessmentsService.getById(Number(req.params.id));
  res.json({ assessment });
});

const start = asyncHandler(async (req, res) => {
  const result = await assessmentsService.startAttempt(req.auth.user.id, Number(req.params.id));
  res.status(result.resumed ? 200 : 201).json(result);
});

const submit = asyncHandler(async (req, res) => {
  const result = await assessmentsService.submitAttempt(
    req.auth.user.id,
    Number(req.params.id),
    req.body.answers
  );
  res.json(result);
});

const result = asyncHandler(async (req, res) => {
  const data = await assessmentsService.getResult(req.auth.user.id, Number(req.params.id));
  res.json(data);
});

const myAttempts = asyncHandler(async (req, res) => {
  const attempts = await assessmentsService.listMyAttempts(req.auth.user.id);
  res.json({ attempts });
});

module.exports = { list, get, start, submit, result, myAttempts };
