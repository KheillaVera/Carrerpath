import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Check, Compass, FileText, FolderKanban, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ErrorAlert from '../../components/ErrorAlert';
import StatTile from '../../components/StatTile';
import StatusPill from '../../components/StatusPill';
import Avatar from '../../components/Avatar';
import { SkeletonStats } from '../../components/Skeleton';
import { MatchBadge } from '../../components/MatchScore';

/** Profile completeness, computed from what the seeker has actually filled in. */
function completeness({ skills, projects, education, experience }) {
  const checks = [
    { label: 'Add 3 skills', done: skills.length >= 3, to: '/app/skills' },
    { label: 'Add a project', done: projects.length >= 1, to: '/app/projects' },
    { label: 'Add education', done: education.length >= 1, to: '/app/education' },
    { label: 'Add experience', done: experience.length >= 1, to: '/app/experience' },
  ];
  const done = checks.filter((c) => c.done).length;
  return { checks, done, percent: Math.round((done / checks.length) * 100) };
}

export default function JobSeekerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [skills, projects, education, experience, applications, jobs] = await Promise.all([
          api.get('/profile/skills'),
          api.get('/profile/projects'),
          api.get('/profile/education'),
          api.get('/profile/experience'),
          api.get('/applications/mine'),
          api.get('/jobs/recommended', { params: { limit: 4 } }),
        ]);
        if (cancelled) return;
        setData({
          skills: skills.data.skills || [],
          projects: projects.data.projects || [],
          education: education.data.education || [],
          experience: experience.data.experience || [],
          applications: applications.data.applications || [],
          jobs: jobs.data.matches || [],
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const firstName = user?.fullName?.split(' ')[0] || 'there';

  if (!data) {
    return (
      <div className="stack">
        <div>
          <h1 className="text-2xl text-ink">Welcome back, {firstName}.</h1>
          <p className="mt-1.5 text-sm text-muted">Loading your profile…</p>
        </div>
        <ErrorAlert message={error} />
        <SkeletonStats />
      </div>
    );
  }

  const progress = completeness(data);
  const active = data.applications.filter((a) => !['withdrawn', 'rejected'].includes(a.status));
  const nextStep = progress.checks.find((c) => !c.done);

  return (
    <div className="stack">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl text-ink">Welcome back, {firstName}.</h1>
          <p className="mt-1.5 text-sm text-muted">
            {nextStep
              ? 'Your profile is what employers match against — a little more makes a real difference.'
              : 'Your profile is complete. Keep it current as you build new things.'}
          </p>
        </div>
        <Link to="/app/jobs" className="btn-primary">
          Find opportunities <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </header>

      <ErrorAlert message={error} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Skills" value={data.skills.length} icon={Award}
                  hint={data.skills.length < 3 ? 'Three unlocks better matching.' : 'Keep your levels honest.'} />
        <StatTile label="Projects" value={data.projects.length} icon={FolderKanban}
                  hint={data.projects.length === 0 ? 'Your strongest evidence.' : 'Linked to the skills they prove.'} />
        <StatTile label="Applications" value={data.applications.length} icon={FileText}
                  hint={`${active.length} still active.`} />
        <StatTile label="Skill gaps" value="—" icon={Compass} hint="Gap analysis arrives in Phase 7." />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* Latest opportunities */}
        <section className="card overflow-hidden">
          <div className="panel-header">
            <div>
              <h2 className="text-sm font-semibold text-ink">Latest opportunities</h2>
              <p className="mt-0.5 text-xs text-muted">Ranked recommendations arrive with matching in Phase 7.</p>
            </div>
            <Link to="/app/jobs" className="btn-ghost btn-sm">View all</Link>
          </div>

          {data.jobs.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">No published opportunities yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.jobs.map((job) => (
                <li key={job.jobId}>
                  <Link
                    to={`/jobs/${job.jobId}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-120 hover:bg-elevated/60"
                  >
                    <Avatar name={job.companyName} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{job.jobTitle}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted">{job.companyName}</span>
                    </span>
                    <MatchBadge score={job.score} band={job.band} />
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-5">
          {/* Profile strength */}
          <section className="card card-body">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-ink">Profile strength</h2>
              <span className="text-sm font-semibold tabular-nums text-accent">{progress.percent}%</span>
            </div>
            <div
              className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-elevated"
              role="progressbar"
              aria-valuenow={progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile completeness"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
                style={{ width: `${progress.percent}%` }}
              />
            </div>

            <ul className="mt-4 space-y-1">
              {progress.checks.map((check) => (
                <li key={check.label}>
                  <Link
                    to={check.to}
                    className="group -mx-2 flex items-center gap-2.5 rounded px-2 py-1.5 transition-colors hover:bg-elevated"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        check.done ? 'border-success bg-success text-panel' : 'border-line-strong'
                      }`}
                      aria-hidden
                    >
                      {check.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                    </span>
                    <span className={`text-sm ${check.done ? 'text-muted line-through' : 'text-ink-soft'}`}>
                      {check.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Recent applications */}
          <section className="card overflow-hidden">
            <div className="panel-header">
              <h2 className="text-sm font-semibold text-ink">Recent applications</h2>
              <Link to="/app/applications" className="btn-ghost btn-sm">All</Link>
            </div>
            {data.applications.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Sparkles className="mx-auto h-5 w-5 text-faint" aria-hidden />
                <p className="mt-2 text-sm text-muted">No applications yet.</p>
                <Link to="/app/jobs" className="btn-secondary btn-sm mt-3">Find something to apply for</Link>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {data.applications.slice(0, 4).map((application) => (
                  <li key={application.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ink">{application.jobTitle}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted">{application.companyName}</span>
                    </span>
                    <StatusPill status={application.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
