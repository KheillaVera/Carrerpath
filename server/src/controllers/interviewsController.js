const interviewsService = require('../services/interviewsService');
const asyncHandler = require('../utils/asyncHandler');

const listMine = asyncHandler(async (req, res) => {
  const isEmployer = req.auth.roles.includes('employer') || req.auth.roles.includes('admin');
  const interviews = isEmployer
    ? await interviewsService.listForEmployer(req.auth.user.id)
    : await interviewsService.listForApplicant(req.auth.user.id);
  res.json({ interviews });
});

const schedule = asyncHandler(async (req, res) => {
  const interview = await interviewsService.schedule(
    req.auth.user.id,
    Number(req.params.id),
    req.body
  );
  res.status(201).json({ interview });
});

const update = asyncHandler(async (req, res) => {
  const interview = await interviewsService.update(req.auth.user.id, Number(req.params.id), req.body);
  res.json({ interview });
});

const remove = asyncHandler(async (req, res) => {
  await interviewsService.remove(req.auth.user.id, Number(req.params.id));
  res.status(204).send();
});

module.exports = { listMine, schedule, update, remove };
