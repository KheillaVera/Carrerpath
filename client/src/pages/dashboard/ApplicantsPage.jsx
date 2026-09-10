import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck, CalendarPlus, ExternalLink, FolderKanban, GraduationCap,
  Loader2, Search, Users,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import ErrorAlert from '../../components/ErrorAlert';
import Modal from '../../components/Modal';
import Avatar from '../../components/Avatar';
import StatusPill from '../../components/StatusPill';
import { SkeletonTable } from '../../components/Skeleton';

const EMPLOYER_STATUSES = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview' },
  { value: 'offered', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Not selected' },
];

/** Matched vs missing skills for this specific posting — the reason to hire, up front. */
function SkillOverlap({ overlap }) {
  const total = overlap.requiredSkills.length;
  const matched = overlap.matchedSkills.length;
  const percent = total === 0 ? 0 : Math.round((matched / total) * 100);

  return (
    <section>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Skills against this posting</h3>
          <p className="mt-0.5 text-xs text-muted">
            A plain overlap. Weighted match scores arrive with the matching engine in Phase 7.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-semibold tabular-nums text-ink">{matched}<span className="text-muted">/{total}</span></div>
          <div className="text-2xs text-muted">required skills</div>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
        <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="section-label mb-2">Matched</div>
          <div className="flex flex-wrap gap-1.5">
            {overlap.matchedSkills.map((s) => <span key={s.id} className="badge-success">{s.name}</span>)}
            {overlap.matchedSkills.length === 0 && <span className="text-xs text-muted">None.</span>}
          </div>
        </div>
        <div>
          <div className="section-label mb-2">Missing</div>
          <div className="flex flex-wrap gap-1.5">
            {overlap.missingSkills.map((s) => <span key={s.id} className="badge-warn">{s.name}</span>)}
            {overlap.missingSkills.length === 0 && <span className="text-xs text-muted">None.</span>}
          </div>
        </div>
      </div>
    </section>
  );
}

function EvidencePanel({ data }) {
  const { evidence, skillOverlap, application } = data;
  return (
    <div className="space-y-7">
      <SkillOverlap overlap={skillOverlap} />

      {application.coverLetter && (
        <section>
          <h3 className="text-sm font-semibold text-ink">Their message</h3>
          <p className="mt-2 whitespace-pre-line rounded-md border border-line bg-elevated/50 px-3.5 py-3 text-sm text-ink-soft">
            {application.coverLetter}
          </p>
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold text-ink">All declared skills ({evidence.skills.length})</h3>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {evidence.skills.map((s) => (
            <span key={s.id} className="badge-outline">{s.name}<span className="text-faint"> · {s.selfLevel}</span></span>
          ))}
          {evidence.skills.length === 0 && <span className="text-xs text-muted">No skills listed.</span>}
        </div>
      </section>

      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <FolderKanban className="h-4 w-4 text-faint" aria-hidden /> Projects ({evidence.projects.length})
        </h3>
        <ul className="mt-2.5 space-y-2">
          {evidence.projects.map((p) => (
            <li key={p.id} className="rounded-md border border-line p-3">
              <div className="text-sm font-medium text-ink">{p.title}</div>
              {p.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{p.description}</p>}
              <div className="mt-2 flex gap-3 text-xs">
                {p.githubUrl && (
                  <a className="link inline-flex items-center gap-1" href={p.githubUrl} target="_blank" rel="noreferrer">
                    Code <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                )}
                {p.liveDemoUrl && (
                  <a className="link inline-flex items-center gap-1" href={p.liveDemoUrl} target="_blank" rel="noreferrer">
                    Demo <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                )}
              </div>
            </li>
          ))}
          {evidence.projects.length === 0 && <li className="text-xs text-muted">No projects listed.</li>}
        </ul>
      </section>

      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <BadgeCheck className="h-4 w-4 text-faint" aria-hidden /> Certifications ({evidence.certifications.length})
        </h3>
        <ul className="mt-2.5 space-y-1.5">
          {evidence.certifications.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-ink-soft">{c.name} — <span className="text-muted">{c.issuer}</span></span>
              <StatusPill status={c.status} />
            </li>
          ))}
          {evidence.certifications.length === 0 && <li className="text-xs text-muted">No certifications listed.</li>}
        </ul>
      </section>

      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <GraduationCap className="h-4 w-4 text-faint" aria-hidden /> Education &amp; experience
        </h3>
        <ul className="mt-2.5 space-y-1.5 text-sm text-ink-soft">
          {evidence.education.map((e) => (
            <li key={`edu-${e.id}`}>{e.qualification} — <span className="text-muted">{e.institution}</span></li>
          ))}
          {evidence.experience.map((e) => (
            <li key={`exp-${e.id}`}>{e.role} at <span className="text-muted">{e.company}</span></li>
          ))}
          {evidence.education.length === 0 && evidence.experience.length === 0 && (
            <li className="text-xs text-muted">Nothing listed.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function InterviewForm({ application, onScheduled, onCancel }) {
  const [form, setForm] = useState({
    scheduledAt: '', durationMinutes: 45, mode: 'online', location: '', meetingUrl: '', note: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = { ...form, scheduledAt: form.scheduledAt.replace('T', ' ') };
      const { data } = await api.post(`/applications/${application.id}/interviews`, payload);
      onScheduled(data.interview);
    } catch (err) {
      setError(err.details?.[0]?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="scheduledAt">Date and time</label>
          <input id="scheduledAt" type="datetime-local" className="input" value={form.scheduledAt}
                 onChange={(e) => set('scheduledAt', e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="durationMinutes">Duration (minutes)</label>
          <input id="durationMinutes" type="number" min="5" max="480" className="input" value={form.durationMinutes}
                 onChange={(e) => set('durationMinutes', Number(e.target.value))} />
        </div>
        <div>
          <label className="label" htmlFor="mode">Mode</label>
          <select id="mode" className="input" value={form.mode} onChange={(e) => set('mode', e.target.value)}>
            <option value="online">Online</option>
            <option value="onsite">On-site</option>
            <option value="phone">Phone</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="location">Location</label>
          <input id="location" className="input" placeholder="Office, room…" value={form.location}
                 onChange={(e) => set('location', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="meetingUrl">Meeting link</label>
          <input id="meetingUrl" className="input" placeholder="https://…" value={form.meetingUrl}
                 onChange={(e) => set('meetingUrl', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="note">Note for the candidate</label>
          <textarea id="note" rows={3} className="input" value={form.note} onChange={(e) => set('note', e.target.value)} />
          <p className="hint">Scheduling also moves this application into the interview stage.</p>
        </div>
      </div>
      <ErrorAlert message={error} />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Schedule interview
        </button>
      </div>
    </form>
  );
}

export default function ApplicantsPage() {
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobFilter, setJobFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [scheduling, setScheduling] = useState(null);

  useEffect(() => {
    api.get('/jobs/mine').then(({ data }) => setJobs(data.jobs)).catch(() => setJobs([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (jobFilter) params.jobId = jobFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/applications/employer', { params });
      setApplications(data.applications);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [jobFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const visible = applications.filter((a) => {
    if (!query) return true;
    const term = query.toLowerCase();
    return a.applicantName?.toLowerCase().includes(term)
      || a.jobTitle?.toLowerCase().includes(term)
      || a.applicantHeadline?.toLowerCase().includes(term);
  });

  const changeStatus = async (application, status) => {
    setBusyId(application.id);
    try {
      const { data } = await api.patch(`/applications/${application.id}/status`, { status });
      setApplications((prev) => prev.map((a) => (a.id === application.id ? { ...a, ...data.application } : a)));
      toast.success('Status updated', `${application.applicantName} → ${status.replace('_', ' ')}`);
    } catch (err) {
      toast.error('Could not update status', err.message);
    } finally {
      setBusyId(null);
    }
  };

  const openEvidence = async (application) => {
    setEvidence({ loading: true, application });
    try {
      const { data } = await api.get(`/applications/${application.id}/evidence`);
      setEvidence({ loading: false, application, data });
    } catch (err) {
      toast.error('Could not load evidence', err.message);
      setEvidence(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Applicants"
        description="Review candidates by the skills they can prove — projects, certifications and experience sit beside every application."
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden />
            <input
              className="input pl-9"
              placeholder="Search applicants…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search applicants"
            />
          </div>
          <select className="input w-auto" value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} aria-label="Filter by posting">
            <option value="">All postings</option>
            {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
          </select>
          <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {EMPLOYER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </PageHeader>

      <ErrorAlert message={error} className="mb-4" />

      {loading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title={applications.length === 0 ? 'No applications yet' : 'No applicants match'}
          message={applications.length === 0
            ? 'Applicants appear here as soon as someone applies to one of your published postings.'
            : 'Try a different search term or clear the filters.'}
          action={applications.length === 0
            ? <Link to="/app/jobs-manage" className="btn-primary">Manage postings</Link>
            : null}
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Candidate</th>
                  <th scope="col" className="hidden md:table-cell">Applied for</th>
                  <th scope="col" className="hidden sm:table-cell">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={application.applicantName} size="sm" />
                        <div className="min-w-0">
                          <div className="cell-primary truncate">{application.applicantName}</div>
                          <div className="mt-0.5 truncate text-xs text-muted">
                            {application.applicantHeadline || 'No headline'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className="block max-w-[14rem] truncate">{application.jobTitle}</span>
                    </td>
                    <td className="hidden whitespace-nowrap text-xs tabular-nums text-muted sm:table-cell">
                      {String(application.createdAt).slice(0, 10)}
                    </td>
                    <td><StatusPill status={application.status} /></td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <button className="btn-secondary btn-sm" onClick={() => openEvidence(application)}>
                          Evidence
                        </button>
                        <button
                          className="btn-ghost btn-icon btn-sm"
                          onClick={() => setScheduling(application)}
                          disabled={application.status === 'withdrawn'}
                          aria-label={`Schedule interview with ${application.applicantName}`}
                          title="Schedule interview"
                        >
                          <CalendarPlus className="h-4 w-4" aria-hidden />
                        </button>
                        <select
                          className="input w-auto py-1 text-xs"
                          value={application.status}
                          disabled={busyId === application.id || application.status === 'withdrawn'}
                          onChange={(e) => changeStatus(application, e.target.value)}
                          aria-label={`Status for ${application.applicantName}`}
                        >
                          {EMPLOYER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          {application.status === 'withdrawn' && <option value="withdrawn">Withdrawn</option>}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">{visible.length} applicant{visible.length === 1 ? '' : 's'}</p>
        </>
      )}

      <Modal
        open={evidence !== null}
        onClose={() => setEvidence(null)}
        size="lg"
        title={evidence ? evidence.application.applicantName : ''}
        description={evidence ? `Applied for ${evidence.application.jobTitle}` : ''}
      >
        {evidence?.loading && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading evidence…
          </div>
        )}
        {evidence?.data && <EvidencePanel data={evidence.data} />}
      </Modal>

      <Modal
        open={scheduling !== null}
        onClose={() => setScheduling(null)}
        title="Schedule interview"
        description={scheduling ? `${scheduling.applicantName} — ${scheduling.jobTitle}` : ''}
      >
        {scheduling && (
          <InterviewForm
            application={scheduling}
            onCancel={() => setScheduling(null)}
            onScheduled={() => {
              setScheduling(null);
              toast.success('Interview scheduled', 'The candidate can see it on their interviews page.');
              load();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
