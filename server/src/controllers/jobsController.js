const jobsService = require('../services/jobsService');
const asyncHandler = require('../utils/asyncHandler');

const listPublic = asyncHandler(async (req, res) => {
  const {
    q, opportunityType, employmentType, workMode, district, companySlug,
    skillIds, verifiedOnly, sort, limit, offset,
  } = req.query;
  const filters = {
    q, opportunityType, employmentType, workMode, district, companySlug,
    skillIds, verifiedOnly: verifiedOnly === 'true', sort, limit, offset,
    viewerId: req.auth?.user?.id || null,
  };
  const result = await jobsService.listPublic(filters);
  await jobsService.recordSearch({
    userId: req.auth?.user?.id || null,
    query: q,
    filters: { opportunityType, employmentType, workMode, district, sort },
    resultsCount: result.total,
  });
  res.json(result);
});

const listFilters = asyncHandler(async (_req, res) => {
  const filters = await jobsService.listFilters();
  res.json(filters);
});

const getPublic = asyncHandler(async (req, res) => {
  const job = await jobsService.getPublicById(Number(req.params.id), req.auth?.user?.id || null);
  res.json({ job });
});

const listSaved = asyncHandler(async (req, res) => {
  const jobs = await jobsService.listSaved(req.auth.user.id);
  res.json({ jobs });
});

const save = asyncHandler(async (req, res) => {
  await jobsService.saveJob(req.auth.user.id, Number(req.params.id));
  res.status(204).send();
});

const unsave = asyncHandler(async (req, res) => {
  await jobsService.unsaveJob(req.auth.user.id, Number(req.params.id));
  res.status(204).send();
});

const listMine = asyncHandler(async (req, res) => {
  const result = await jobsService.listMine(req.auth.user.id);
  res.json(result);
});

const getMine = asyncHandler(async (req, res) => {
  const job = await jobsService.getOwn(req.auth.user.id, Number(req.params.id));
  res.json({ job });
});

const create = asyncHandler(async (req, res) => {
  const job = await jobsService.create(req.auth.user.id, req.body);
  res.status(201).json({ job });
});

const update = asyncHandler(async (req, res) => {
  const job = await jobsService.update(req.auth.user.id, Number(req.params.id), req.body);
  res.json({ job });
});

const setStatus = asyncHandler(async (req, res) => {
  const job = await jobsService.setStatus(req.auth.user.id, Number(req.params.id), req.body.status);
  res.json({ job });
});

const remove = asyncHandler(async (req, res) => {
  await jobsService.remove(req.auth.user.id, Number(req.params.id));
  res.status(204).send();
});

module.exports = {
  listPublic, listFilters, getPublic,
  listMine, getMine, create, update, setStatus, remove,
  listSaved, save, unsave,
};
