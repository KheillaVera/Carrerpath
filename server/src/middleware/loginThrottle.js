const ApiError = require('../utils/ApiError');

/**
 * Per-account login throttling.
 *
 * The IP-based limiter on /api/auth stops one machine hammering the service, but
 * it does not stop a distributed attempt at a single account. This tracks failed
 * logins per email address and locks that account's login for a cooling-off
 * period, independent of where the attempts come from.
 *
 * State is held in memory, which is correct for a single instance. Running more
 * than one process would need this moved into the database or a shared cache —
 * noted here so the limitation is not mistaken for coverage it does not have.
 */
const MAX_FAILURES = 6;
const LOCK_MS = 15 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;
const SWEEP_MS = 5 * 60 * 1000;

const attempts = new Map();

function keyFor(email) {
  return String(email || '').trim().toLowerCase();
}

function sweep() {
  const now = Date.now();
  for (const [key, entry] of attempts.entries()) {
    const stale = now - entry.lastFailureAt > WINDOW_MS;
    const unlocked = !entry.lockedUntil || entry.lockedUntil < now;
    if (stale && unlocked) attempts.delete(key);
  }
}

const sweeper = setInterval(sweep, SWEEP_MS);
// Never hold the process open just for housekeeping.
if (typeof sweeper.unref === 'function') sweeper.unref();

/** Blocks the request when this account is inside its cooling-off period. */
function guardLogin(req, _res, next) {
  const key = keyFor(req.body?.email);
  if (!key) return next();

  const entry = attempts.get(key);
  if (entry?.lockedUntil && entry.lockedUntil > Date.now()) {
    const minutes = Math.max(1, Math.ceil((entry.lockedUntil - Date.now()) / 60000));
    return next(
      ApiError.tooMany(`Too many failed attempts for this account. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`)
    );
  }
  return next();
}

function recordFailure(email) {
  const key = keyFor(email);
  if (!key) return;

  const now = Date.now();
  const entry = attempts.get(key) || { failures: 0, lastFailureAt: now, lockedUntil: null };

  // A quiet spell resets the count, so an occasional typo never accumulates.
  if (now - entry.lastFailureAt > WINDOW_MS) entry.failures = 0;

  entry.failures += 1;
  entry.lastFailureAt = now;
  if (entry.failures >= MAX_FAILURES) {
    entry.lockedUntil = now + LOCK_MS;
    entry.failures = 0;
  }
  attempts.set(key, entry);
}

function recordSuccess(email) {
  attempts.delete(keyFor(email));
}

module.exports = { guardLogin, recordFailure, recordSuccess, MAX_FAILURES };
