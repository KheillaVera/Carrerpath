const skillsService = require('../services/skillsService');
const asyncHandler = require('../utils/asyncHandler');

const catalogue = asyncHandler(async (req, res) => {
  const skills = await skillsService.listCatalogue({
    q: req.query.q?.trim() || undefined,
    category: req.query.category?.trim() || undefined,
  });
  res.json({ skills });
});

const categories = asyncHandler(async (_req, res) => {
  const categories = await skillsService.listCategories();
  res.json({ categories });
});

const listMine = asyncHandler(async (req, res) => {
  const skills = await skillsService.listUserSkills(req.auth.user.id);
  res.json({ skills });
});

const addMine = asyncHandler(async (req, res) => {
  const skills = await skillsService.addUserSkill(req.auth.user.id, req.body);
  res.status(201).json({ skills });
});

const removeMine = asyncHandler(async (req, res) => {
  const skillId = Number(req.params.skillId);
  const skills = await skillsService.removeUserSkill(req.auth.user.id, skillId);
  res.json({ skills });
});

module.exports = { catalogue, categories, listMine, addMine, removeMine };
