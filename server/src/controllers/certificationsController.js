const certificationsService = require('../services/certificationsService');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const certifications = await certificationsService.listMine(req.auth.user.id);
  res.json({ certifications });
});

const create = asyncHandler(async (req, res) => {
  const item = await certificationsService.create(req.auth.user.id, req.body);
  res.status(201).json({ item });
});

const update = asyncHandler(async (req, res) => {
  const item = await certificationsService.update(req.auth.user.id, Number(req.params.id), req.body);
  res.json({ item });
});

const remove = asyncHandler(async (req, res) => {
  await certificationsService.remove(req.auth.user.id, Number(req.params.id));
  res.status(204).send();
});

module.exports = { list, create, update, remove };
