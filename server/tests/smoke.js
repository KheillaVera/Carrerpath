#!/usr/bin/env node
/**
 * End-to-end smoke test for PathAura phases 1-5.
 *
 * Run against a DISPOSABLE database only — it creates postings and applications.
 *   npm run db:reset && npm run dev   (in one terminal)
 *   npm run test:smoke                (in another)
 * Exercises the real HTTP API: auth, company profile, verification, postings,
 * marketplace search, saving, applying, applicant review and interviews.
 */
const BASE = process.env.SMOKE_BASE_URL || "http://localhost:4000/api";

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${JSON.stringify(detail)}` : ''}`);
  }
}

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch (_) { data = text; }
  }
  return { status: res.status, data };
}

async function main() {
  console.log('\n== health ==');
  const health = await call('GET', '/health');
  check('health returns ok', health.status === 200 && health.data.status === 'ok', health.data);

  console.log('\n== auth ==');
  const seekerLogin = await call('POST', '/auth/login', { body: { email: 'seeker@demo.rw', password: 'Demo1234' } });
  check('seeker logs in', seekerLogin.status === 200 && !!seekerLogin.data.token, seekerLogin.data);
  const seeker = seekerLogin.data.token;

  const employerLogin = await call('POST', '/auth/login', { body: { email: 'employer@demo.rw', password: 'Demo1234' } });
  check('employer logs in', employerLogin.status === 200 && !!employerLogin.data.token, employerLogin.data);
  const employer = employerLogin.data.token;

  const adminLogin = await call('POST', '/auth/login', { body: { email: 'admin@demo.rw', password: 'Demo1234' } });
  check('admin logs in', adminLogin.status === 200 && !!adminLogin.data.token, adminLogin.data);
  const admin = adminLogin.data.token;

  const badLogin = await call('POST', '/auth/login', { body: { email: 'seeker@demo.rw', password: 'wrong' } });
  check('wrong password rejected', badLogin.status === 401, badLogin.data);

  console.log('\n== phase 3: company ==');
  const mineCompany = await call('GET', '/companies/mine', { token: employer });
  check('employer has the seeded company', mineCompany.status === 200 && !!mineCompany.data.company, mineCompany.data);
  const companyId = mineCompany.data.company?.id;
  const companySlug = mineCompany.data.company?.slug;

  const publicCompany = await call('GET', `/companies/${companySlug}`);
  check('company public page works', publicCompany.status === 200 && publicCompany.data.company.name, publicCompany.data);

  const patched = await call('PATCH', `/companies/${companyId}`, {
    token: employer,
    body: { tagline: 'Updated by the smoke test.' },
  });
  check('employer updates own company', patched.status === 200 && patched.data.company.tagline === 'Updated by the smoke test.', patched.data);

  const seekerPatch = await call('PATCH', `/companies/${companyId}`, { token: seeker, body: { tagline: 'hijack' } });
  check('non-member cannot update company', seekerPatch.status === 404, seekerPatch.data);

  const directory = await call('GET', '/companies');
  check('public company directory lists companies', directory.status === 200 && directory.data.companies.length > 0, directory.data);

  console.log('\n== phase 3: admin verification ==');
  const queue = await call('GET', '/admin/companies?status=verified', { token: admin });
  check('admin sees verification queue', queue.status === 200 && Array.isArray(queue.data.companies), queue.data);

  const seekerQueue = await call('GET', '/admin/companies', { token: seeker });
  check('non-admin blocked from admin routes', seekerQueue.status === 403, seekerQueue.data);

  const verify = await call('PATCH', `/admin/companies/${companyId}/verification`, {
    token: admin, body: { status: 'verified', note: 'Checked by smoke test.' },
  });
  check('admin verifies a company', verify.status === 200 && verify.data.company.verificationStatus === 'verified', verify.data);

  console.log('\n== phase 3: postings ==');
  const created = await call('POST', '/jobs', {
    token: employer,
    body: {
      title: 'Smoke Test Engineer',
      summary: 'Created by the automated smoke test.',
      opportunityType: 'job',
      employmentType: 'full_time',
      workMode: 'remote',
      location: 'Kigali',
      district: 'Nyarugenge',
      requiredSkills: [
        { skillId: 1, importance: 'required', minLevel: 'advanced', weight: 5 },
        { skillId: 2, importance: 'preferred', minLevel: 'beginner', weight: 2 },
      ],
    },
  });
  check('employer creates a posting', created.status === 201 && created.data.job.id, created.data);
  const jobId = created.data.job?.id;
  check('required skills stored', created.data.job?.requiredSkills?.length === 2, created.data.job?.requiredSkills);
  check('new posting starts as draft', created.data.job?.status === 'draft', created.data.job?.status);

  const seekerCreate = await call('POST', '/jobs', { token: seeker, body: { title: 'Should not exist' } });
  check('job seeker cannot create postings', seekerCreate.status === 403, seekerCreate.data);

  const draftInSearch = await call('GET', `/jobs?q=Smoke Test Engineer`);
  check('draft is hidden from public search', draftInSearch.status === 200 && draftInSearch.data.total === 0, draftInSearch.data);

  const published = await call('PATCH', `/jobs/${jobId}/status`, { token: employer, body: { status: 'published' } });
  check('employer publishes the posting', published.status === 200 && published.data.job.status === 'published', published.data);

  console.log('\n== phase 4: marketplace ==');
  const search = await call('GET', '/jobs?q=Smoke');
  check('published posting appears in search', search.status === 200 && search.data.total === 1, search.data);

  const seededSearch = await call('GET', '/jobs');
  check('seeded postings are searchable', seededSearch.data.total >= 3, seededSearch.data.total);

  const typeFilter = await call('GET', '/jobs?opportunityType=internship');
  check('opportunity type filter works',
    typeFilter.data.jobs.every((j) => j.opportunityType === 'internship') && typeFilter.data.total >= 1,
    typeFilter.data.total);

  const modeFilter = await call('GET', '/jobs?workMode=remote');
  check('work mode filter works', modeFilter.data.jobs.every((j) => j.workMode === 'remote'), modeFilter.data.total);

  const facets = await call('GET', '/jobs/filters');
  check('filter facets returned', facets.status === 200 && Array.isArray(facets.data.districts), facets.data);

  const detail = await call('GET', `/jobs/${jobId}`);
  check('public posting detail works', detail.status === 200 && detail.data.job.title === 'Smoke Test Engineer', detail.data);

  const saved = await call('POST', `/jobs/${jobId}/save`, { token: seeker });
  check('seeker saves an opportunity', saved.status === 204, saved.data);

  const savedList = await call('GET', '/jobs/saved', { token: seeker });
  check('saved list contains it', savedList.data.jobs.some((j) => j.id === jobId), savedList.data);

  const detailAuthed = await call('GET', `/jobs/${jobId}`, { token: seeker });
  check('detail reports isSaved for the viewer', detailAuthed.data.job.isSaved === true, detailAuthed.data.job.isSaved);

  const unsaved = await call('DELETE', `/jobs/${jobId}/save`, { token: seeker });
  const savedAfter = await call('GET', '/jobs/saved', { token: seeker });
  check('seeker unsaves an opportunity', unsaved.status === 204 && !savedAfter.data.jobs.some((j) => j.id === jobId), savedAfter.data);

  console.log('\n== phase 5: applications ==');
  const applied = await call('POST', '/applications', {
    token: seeker, body: { jobId, coverLetter: 'I would like to apply.' },
  });
  check('seeker applies', applied.status === 201 && applied.data.application.status === 'submitted', applied.data);
  const applicationId = applied.data.application?.id;
  check('application timeline seeded', applied.data.application?.timeline?.length === 1, applied.data.application?.timeline);

  const duplicate = await call('POST', '/applications', { token: seeker, body: { jobId } });
  check('duplicate application rejected', duplicate.status === 409, duplicate.data);

  const employerApply = await call('POST', '/applications', { token: employer, body: { jobId } });
  check('employer lacks applications.submit', employerApply.status === 403, employerApply.data);

  const mineApps = await call('GET', '/applications/mine', { token: seeker });
  check('seeker sees own applications', mineApps.data.applications.length === 1, mineApps.data);

  const employerApps = await call('GET', '/applications/employer', { token: employer });
  check('employer sees the applicant', employerApps.data.applications.some((a) => a.id === applicationId), employerApps.data);

  const otherEmployer = await call('GET', `/applications/${applicationId}/evidence`, { token: seeker });
  check('seeker cannot read employer evidence view', otherEmployer.status === 403, otherEmployer.status);

  const evidence = await call('GET', `/applications/${applicationId}/evidence`, { token: employer });
  check('employer reads skills evidence',
    evidence.status === 200 && evidence.data.skillOverlap && Array.isArray(evidence.data.evidence.projects),
    evidence.data);
  check('skill overlap computed',
    evidence.data.skillOverlap.requiredSkills.length === 2,
    evidence.data.skillOverlap);

  const statusChange = await call('PATCH', `/applications/${applicationId}/status`, {
    token: employer, body: { status: 'shortlisted', note: 'Strong project evidence.' },
  });
  check('employer shortlists the applicant', statusChange.status === 200 && statusChange.data.application.status === 'shortlisted', statusChange.data);

  const timeline = await call('GET', '/applications/mine', { token: seeker });
  check('status change appears on the seeker timeline',
    timeline.data.applications[0].timeline.some((e) => e.toStatus === 'shortlisted'),
    timeline.data.applications[0].timeline);

  const stats = await call('GET', '/applications/employer/stats', { token: employer });
  check('employer stats count applications', stats.status === 200 && stats.data.total === 1, stats.data);

  console.log('\n== phase 5: interviews ==');
  const interview = await call('POST', `/applications/${applicationId}/interviews`, {
    token: employer,
    body: { scheduledAt: '2026-10-01 14:30', durationMinutes: 45, mode: 'online', meetingUrl: 'https://example.rw/meet' },
  });
  check('employer schedules an interview', interview.status === 201 && interview.data.interview.id, interview.data);
  const interviewId = interview.data.interview?.id;

  const appAfterInterview = await call('GET', '/applications/mine', { token: seeker });
  check('scheduling moves the application to interview stage',
    appAfterInterview.data.applications[0].status === 'interview',
    appAfterInterview.data.applications[0].status);

  const seekerInterviews = await call('GET', '/interviews/mine', { token: seeker });
  check('applicant sees their interview', seekerInterviews.data.interviews.length === 1, seekerInterviews.data);

  const employerInterviews = await call('GET', '/interviews/mine', { token: employer });
  check('employer sees the interview they scheduled', employerInterviews.data.interviews.length === 1, employerInterviews.data);

  const completed = await call('PATCH', `/interviews/${interviewId}`, { token: employer, body: { status: 'completed' } });
  check('employer completes the interview', completed.status === 200 && completed.data.interview.status === 'completed', completed.data);

  console.log('\n== withdrawal ==');
  const withdrawn = await call('PATCH', `/applications/${applicationId}/withdraw`, { token: seeker });
  check('seeker withdraws', withdrawn.status === 200 && withdrawn.data.application.status === 'withdrawn', withdrawn.data);

  const statusAfterWithdraw = await call('PATCH', `/applications/${applicationId}/status`, {
    token: employer, body: { status: 'hired' },
  });
  check('employer cannot revive a withdrawn application', statusAfterWithdraw.status === 400, statusAfterWithdraw.data);

  console.log('\n== auth guards ==');
  const noToken = await call('GET', '/applications/mine');
  check('protected route needs a token', noToken.status === 401, noToken.data);

  const badToken = await call('GET', '/applications/mine', { token: 'not-a-real-token' });
  check('invalid token rejected', badToken.status === 401, badToken.data);

  const publicWithBadToken = await call('GET', '/jobs', { token: 'not-a-real-token' });
  check('public listing still works with a bad token', publicWithBadToken.status === 200, publicWithBadToken.status);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('smoke test crashed:', err);
  process.exit(1);
});
