const express = require('express');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    await db.ping();
    res.json({ status: 'ok', service: 'pathaura-api', time: new Date().toISOString() });
  })
);

module.exports = router;
