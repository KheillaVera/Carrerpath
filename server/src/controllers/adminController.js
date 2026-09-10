const companiesService = require('../services/companiesService');
const adminService = require('../services/adminService');
const asyncHandler = require('../utils/asyncHandler');

const listCompanies = asyncHandler(async (req, res) => {
  const companies = await companiesService.listForAdmin({ status: req.query.status });
  res.json({ companies });
});

const setCompanyVerification = asyncHandler(async (req, res) => {
  const company = await companiesService.setVerification(
    req.auth.user.id,
    Number(req.params.id),
    req.body.status,
    req.body.note
  );
  res.json({ company });
});

const stats = asyncHandler(async (_req, res) => {
  const result = await adminService.platformStats();
  res.json(result);
});

const activity = asyncHandler(async (req, res) => {
  const events = await adminService.recentActivity(req.query.limit);
  res.json({ events });
});

module.exports = { listCompanies, setCompanyVerification, stats, activity };
