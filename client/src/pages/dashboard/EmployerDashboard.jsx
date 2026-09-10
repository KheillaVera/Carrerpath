import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Briefcase, Eye, Plus, ShieldAlert, ShieldCheck, Users,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ErrorAlert from '../../components/ErrorAlert';
import StatTile from '../../components/StatTile';
import StatusPill from '../../components/StatusPill';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import { SkeletonStats } from '../../components/Skeleton';

const PIPELINE = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under review' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interview', label: 'Interview' },
  { key: 'offered', label: 'Offer' },
  { key: 'hired', label: 'Hired' },
];

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ total: 0, byStatus: {} });
  const [applicants, setApplicants] = useState([]);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [jobsRes, statsRes, applicantsRes] = await Promise.all([
          api.get('/jobs/mine'),
          api.get('/applications/employer/stats').catch(() => ({ data: { total: 0, byStatus: {} } })),
          api.get('/applications/employer').catch(() => ({ data: { applications: [] } })),
        ]);
        if (cancelled) return;
        setCompany(jobsRes.data.company);
        setJobs(jobsRes.data.jobs);
        setStats(statsRes.data);
        setApplicants(applicantsRes.data.applications);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const published = jobs.filter((j) => j.status === 'published');
  const drafts = jobs.filter((j) => j.status === 'draft');
  const totalViews = jobs.reduce((sum, j) => sum + (j.viewsCount || 0), 0);
  const verified = company?.verificationStatus === 'verified';
  const pipelineMax = Math.max(1, ...PIPELINE.map((s) => stats.byStatus?.[s.key] || 0));

  if (!loaded) {
    return (
      <div className="stack">
        <h1 className="text-2xl text-ink">Welcome back, {firstName}.</h1>
        <SkeletonStats />
      </div>
    );
  }

  return (
    <div className="stack">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl text-ink">Welcome back, {firstName}.</h1>
          <p className="mt-1.5 text-sm text-muted">
            {company ? company.name : 'Set up your company to start posting opportunities.'}
            {company && (
              <span className={`ml-2 inline-flex items-center gap-1 text-xs ${verified ? 'text-success' : 'text-warn'}`}>
                {verified
                  ? <><ShieldCheck className="h-3 w-3" aria-hidden /> Verified</>
                  : <><ShieldAlert className="h-3 w-3" aria-hidden /> Unverified</>}
              </span>
            )}
          </p>
        </div>
        {company && (
          <Link to="/app/jobs-manage" className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden /> New posting
          </Link>
        )}
      </header>

      <ErrorAlert message={error} />

      {!company && (
        <div className="alert-warn">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <div className="font-medium">No company profile yet</div>
            <div className="mt-0.5">
              <Link to="/app/company" className="underline underline-offset-2">Create your company profile</Link>
              {' '}before posting opportunities.
            </div>
          </div>
        </div>
      )}

      {company && !verified && (
        <div className="alert-warn">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <div className="font-medium">Verification pending</div>
            <div className="mt-0.5">
              You can post now — listings are labelled as coming from an unverified employer until an
              administrator reviews {company.name}.
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Published" value={published.length} icon={Briefcase}
                  hint={drafts.length > 0 ? `${drafts.length} draft${drafts.length === 1 ? '' : 's'} unpublished.` : 'No unpublished drafts.'} />
        <StatTile label="Applicants" value={stats.total} icon={Users}
                  hint={stats.byStatus?.submitted ? `${stats.byStatus.submitted} awaiting review.` : 'No new applications.'} />
        <StatTile label="At interview" value={stats.byStatus?.interview || 0} tone="accent"
                  hint="Scheduled from the applicants page." />
        <StatTile label="Posting views" value={totalViews} icon={Eye} hint="Across all your postings." />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* Hiring pipeline */}
        <section className="card card-body">
          <h2 className="text-sm font-semibold text-ink">Hiring pipeline</h2>
          <p className="mt-0.5 text-xs text-muted">Where every application currently sits.</p>

          {stats.total === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No applications yet. They appear here as soon as someone applies.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {PIPELINE.map((stage) => {
                const count = stats.byStatus?.[stage.key] || 0;
                return (
                  <li key={stage.key} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-muted">{stage.label}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                      <span
                        className="block h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
                        style={{ width: `${(count / pipelineMax) * 100}%` }}
                      />
                    </span>
                    <span className="w-6 shrink-0 text-right text-xs font-medium tabular-nums text-ink">{count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Recent applicants */}
        <section className="card overflow-hidden">
          <div className="panel-header">
            <h2 className="text-sm font-semibold text-ink">Recent applicants</h2>
            <Link to="/app/applicants" className="btn-ghost btn-sm">
              All <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          {applicants.length === 0 ? (
            <div className="p-5">
              <EmptyState
                compact
                icon={Users}
                title="No applicants yet"
                message={published.length === 0
                  ? 'Publish a posting and candidates can start applying.'
                  : 'Your postings are live — applications will appear here.'}
              />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {applicants.slice(0, 5).map((application) => (
                <li key={application.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={application.applicantName} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{application.applicantName}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">{application.jobTitle}</span>
                  </span>
                  <StatusPill status={application.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card card-body">
        <h2 className="text-sm font-semibold text-ink">Get the most out of PathAura</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { n: '01', title: 'Complete your company profile', text: 'Candidates check who they are applying to.', to: '/app/company', done: !!company },
            { n: '02', title: 'List the skills a role needs', text: 'Required and preferred skills drive match scores.', to: '/app/jobs-manage', done: published.length > 0 },
            { n: '03', title: 'Review by evidence', text: 'Projects and certifications sit beside every application.', to: '/app/applicants', done: stats.total > 0 },
          ].map((step) => (
            <li key={step.n}>
              <Link to={step.to} className="group block rounded-md border border-line p-4 transition-colors hover:border-line-strong hover:bg-elevated/50">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xs text-accent">{step.n}</span>
                  {step.done && <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />}
                </div>
                <div className="mt-2.5 text-sm font-medium text-ink">{step.title}</div>
                <p className="mt-1 text-xs text-muted">{step.text}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
