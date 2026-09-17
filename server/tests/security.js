#!/usr/bin/env node
/**
 * Verifies the validation and hardening layer without a database.
 *
 * Every case below is rejected by middleware before any query runs, so the
 * result is meaningful even while MySQL is down.
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const app = require('../src/app');

let passed = 0;
let failed = 0;

function check(name, ok, detail) {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const server = app.listen(0, async () => {
  const base = `http://127.0.0.1:${server.address().port}/api`;

  const call = async (method, path, { body, headers } = {}) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(headers || {}) },
      body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
    });
    let data = null;
    const text = await res.text();
    if (text) { try { data = JSON.parse(text); } catch (_) { data = text; } }
    return { status: res.status, data, headers: res.headers };
  };

  try {
    console.log('\n== security headers ==');
    const head = await call('GET', '/jobs/abc');
    check('X-Frame-Options is DENY', head.headers.get('x-frame-options') === 'DENY',
      head.headers.get('x-frame-options'));
    check('Referrer-Policy is no-referrer', head.headers.get('referrer-policy') === 'no-referrer',
      head.headers.get('referrer-policy'));
    check('CSP locks the API down to default-src none',
      (head.headers.get('content-security-policy') || '').includes("default-src 'none'"),
      head.headers.get('content-security-policy'));
    check('frame-ancestors none',
      (head.headers.get('content-security-policy') || '').includes("frame-ancestors 'none'"));
    check('no HSTS outside production', !head.headers.get('strict-transport-security'));
    check('X-Powered-By hidden', !head.headers.get('x-powered-by'));

    console.log('\n== route parameter validation ==');
    check('GET /jobs/abc is rejected, not a 500', head.status === 422 || head.status === 400,
      `got ${head.status}`);
    const negative = await call('GET', '/jobs/-1');
    check('negative id rejected', negative.status === 422 || negative.status === 400, `got ${negative.status}`);
    const slug = await call('GET', '/companies/not a slug!!');
    check('malformed company slug rejected', slug.status === 422 || slug.status === 400, `got ${slug.status}`);

    console.log('\n== authentication precedes validation ==');
    const protectedBad = await call('PATCH', '/jobs/abc', { body: {} });
    check('protected route with bad id answers 401, not a validation hint',
      protectedBad.status === 401, `got ${protectedBad.status}`);
    const noToken = await call('GET', '/applications/mine');
    check('protected route without a token is 401', noToken.status === 401, `got ${noToken.status}`);
    const badToken = await call('GET', '/applications/mine', { headers: { Authorization: 'Bearer nope' } });
    check('invalid token is 401', badToken.status === 401, `got ${badToken.status}`);

    console.log('\n== input validation ==');
    const badEmail = await call('POST', '/auth/register',
      { body: { email: 'not-an-email', password: 'password1', fullName: 'Test User' } });
    check('invalid email rejected', badEmail.status === 422, `got ${badEmail.status}`);
    const weakPassword = await call('POST', '/auth/register',
      { body: { email: 'a@b.rw', password: 'short', fullName: 'Test User' } });
    check('weak password rejected', weakPassword.status === 422, `got ${weakPassword.status}`);
    check('validation failure names the field',
      Array.isArray(weakPassword.data?.error?.details) && weakPassword.data.error.details[0]?.field,
      JSON.stringify(weakPassword.data));
    const noLetter = await call('POST', '/auth/register',
      { body: { email: 'a@b.rw', password: '12345678', fullName: 'Test User' } });
    check('password without a letter rejected', noLetter.status === 422, `got ${noLetter.status}`);
    const shortName = await call('POST', '/auth/register',
      { body: { email: 'a@b.rw', password: 'password1', fullName: 'x' } });
    check('too-short full name rejected', shortName.status === 422, `got ${shortName.status}`);
    const badRole = await call('POST', '/auth/register',
      { body: { email: 'a@b.rw', password: 'password1', fullName: 'Test User', role: 'admin' } });
    check('self-assigning the admin role rejected', badRole.status === 422, `got ${badRole.status}`);

    console.log('\n== request size limit ==');
    const huge = JSON.stringify({ coverLetter: 'A'.repeat(400000) });
    const big = await call('POST', '/applications', { body: huge });
    check('oversized body rejected (413)', big.status === 413, `got ${big.status}`);

    console.log('\n== error shape ==');
    const missing = await call('GET', '/definitely-not-a-route');
    check('unknown route is a clean 404', missing.status === 404, `got ${missing.status}`);
    check('errors never carry a stack trace',
      !JSON.stringify(missing.data || {}).includes('at '),
      JSON.stringify(missing.data));

    console.log(`\n${passed} passed, ${failed} failed\n`);
  } catch (err) {
    console.error('check run failed:', err);
    failed += 1;
  } finally {
    server.close(() => process.exit(failed === 0 ? 0 : 1));
  }
});
