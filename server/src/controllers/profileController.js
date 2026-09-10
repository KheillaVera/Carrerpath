const profileService = require('../services/profileService');
const asyncHandler = require('../utils/asyncHandler');

const get = asyncHandler(async (req, res) => {
  const data = await profileService.getProfile(req.auth.user.id);
  res.json(data);
});

const update = asyncHandler(async (req, res) => {
  const data = await profileService.updateProfile(req.auth.user.id, req.body);
  res.json(data);
});

module.exports = { get, update };
