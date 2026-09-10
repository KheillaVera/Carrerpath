const projectsService = require('../services/projectsService');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const projects = await projectsService.listMine(req.auth.user.id);
  res.json({ projects });
});

const create = asyncHandler(async (req, res) => {
  const project = await projectsService.create(req.auth.user.id, req.body);
  res.status(201).json({ project });
});

const update = asyncHandler(async (req, res) => {
  const projectId = Number(req.params.id);
  const project = await projectsService.update(req.auth.user.id, projectId, req.body);
  res.json({ project });
});

const remove = asyncHandler(async (req, res) => {
  const projectId = Number(req.params.id);
  await projectsService.remove(req.auth.user.id, projectId);
  res.status(204).send();
});

module.exports = { list, create, update, remove };
