const authenticate = require('./authenticate');

/**
 * Runs the normal authentication for requests that carry a token, but lets
 * anonymous requests through untouched. Public marketplace endpoints use this so
 * a signed-in job seeker sees their saved opportunities while visitors still get
 * the same listing without an account.
 */
function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization;
  const hasBearer = header && header.startsWith('Bearer ');
  const hasCookie = req.cookies && req.cookies.token;
  if (!hasBearer && !hasCookie) return next();

  authenticate(req, res, (err) => {
    // An invalid or expired token should not block public content.
    if (err) {
      req.auth = undefined;
      return next();
    }
    return next();
  });
}

module.exports = optionalAuthenticate;
