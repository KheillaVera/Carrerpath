const experienceService = require('../services/experienceService');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const experience = await experienceService.listMine(req.auth.user.id);
  res.json({ experience });
});

const create = asyncHandler(async (req, res) => {
  const item = await experienceService.create(req.auth.user.id, req.body);
  res.status(201).json({ item });
});

const update = asyncHandler(async (req, res) => {
  const item = await experienceService.update(req.auth.user.id, Number(req.params.id), req.body);
  res.json({ item });
});

const remove = asyncHandler(async (req, res) => {
  await experienceService.remove(req.auth.user.id, Number(req.params.id));
  res.status(204).send();
});

module.exports = { list, create, update, remove };
