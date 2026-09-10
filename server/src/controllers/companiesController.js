const companiesService = require('../services/companiesService');
const asyncHandler = require('../utils/asyncHandler');

const listPublic = asyncHandler(async (req, res) => {
  const { q, industry, limit, offset } = req.query;
  const result = await companiesService.listPublic({ q, industry, limit, offset });
  res.json(result);
});

const getPublic = asyncHandler(async (req, res) => {
  const company = await companiesService.getPublicBySlug(req.params.slug);
  res.json({ company });
});

const getMine = asyncHandler(async (req, res) => {
  const company = await companiesService.getMine(req.auth.user.id);
  res.json({ company });
});

const create = asyncHandler(async (req, res) => {
  const company = await companiesService.create(req.auth.user.id, req.body);
  res.status(201).json({ company });
});

const update = asyncHandler(async (req, res) => {
  const companyId = Number(req.params.id);
  const company = await companiesService.update(req.auth.user.id, companyId, req.body);
  res.json({ company });
});

module.exports = { listPublic, getPublic, getMine, create, update };
