const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, role, phone } = req.body;
  const { user, token } = await authService.register({ email, password, fullName, role, phone });
  res.status(201).json({ user, token });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login({ email, password });
  res.json({ user, token });
});

const logout = asyncHandler(async (_req, res) => {
  // Stateless JWT: client discards the token. Endpoint provided for symmetry
  // and to allow future token-revocation lists without changing the client.
  res.json({ ok: true });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.loadUserContext(req.auth.user.id);
  res.json({ user, permissions: req.auth.permissions });
});

module.exports = { register, login, logout, me };
