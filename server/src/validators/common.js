const { body, param, query } = require('express-validator');

/**
 * Shared validation building blocks.
 *
 * Every route that takes an id validates it, and every field that ends up in an
 * href is restricted to http/https — a `javascript:` URL stored here would run
 * in the browser of whoever views that profile.
 */

const URL_OPTIONS = {
  protocols: ['http', 'https'],
  require_protocol: true,
  require_tld: true,
  allow_underscores: true,
};

/** Numeric route parameter, e.g. /api/jobs/:id */
function idParam(name = 'id') {
  return param(name)
    .isInt({ min: 1 })
    .withMessage('Invalid identifier.')
    .toInt();
}

/** Public slug parameter, e.g. /api/companies/:slug */
function slugParam(name = 'slug') {
  return param(name)
    .isString()
    .trim()
    .isLength({ min: 1, max: 220 })
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i)
    .withMessage('Invalid company address.');
}

/** A link a browser will be asked to follow. Anything but http(s) is rejected. */
function optionalUrl(field, { max = 255 } = {}) {
  return body(field)
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max })
    .withMessage(`Links must be ${max} characters or fewer.`)
    .isURL(URL_OPTIONS)
    .withMessage('Enter a full link starting with http:// or https://');
}

/** Same rule, for a field nested under an object such as jobSeeker.githubUrl */
function optionalNestedUrl(field, options) {
  return optionalUrl(field, options);
}

function optionalEmail(field, { max = 255 } = {}) {
  return body(field)
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max })
    .isEmail()
    .withMessage('Enter a valid email address.');
}

function optionalPhone(field, { max = 30 } = {}) {
  return body(field)
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .isLength({ min: 5, max })
    .matches(/^[0-9+()\-.\s]+$/)
    .withMessage('Enter a valid phone number.');
}

/** Paging parameters, bounded so a request cannot ask for the whole table. */
const pagingQuery = [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0, max: 100000 }).toInt(),
  query('q').optional().isString().trim().isLength({ max: 120 }),
];

module.exports = {
  URL_OPTIONS,
  idParam,
  slugParam,
  optionalUrl,
  optionalNestedUrl,
  optionalEmail,
  optionalPhone,
  pagingQuery,
};
