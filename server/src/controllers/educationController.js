const educationService = require('../services/educationService');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const education = await educationService.listMine(req.auth.user.id);
  res.json({ education });
});

const create = asyncHandler(async (req, res) => {
  const item = await educationService.create(req.auth.user.id, req.body);
  res.status(201).json({ item });
});

const update = asyncHandler(async (req, res) => {
  const item = await educationService.update(req.auth.user.id, Number(req.params.id), req.body);
  res.json({ item });
});

const remove = asyncHandler(async (req, res) => {
  await educationService.remove(req.auth.user.id, Number(req.params.id));
  res.status(204).send();
});

module.exports = { list, create, update, remove };
