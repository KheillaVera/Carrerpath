import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Building2, FileText, ShieldCheck, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ErrorAlert from '../../components/ErrorAlert';
import StatTile from '../../components/StatTile';
import { SkeletonStats } from '../../components/Skeleton';

const ROLE_LABELS = {
  job_seeker: 'Job seekers',
  employer: 'Employers',
  training_provider: 'Training providers',
  mentor: 'Mentors',
  admin: 'Administrators',
};

function ActionLabel({ action }) {
  const label = String(action).replace(/[._]/g, ' ');
  return <span className="capitalize">{label}</span>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/activity', { params: { limit: 8 } }).catch(() => ({ data: { events: [] } })),
        ]);
        if (cancelled) return;
        setStats(statsRes.data);
        setActivity(activityRes.data.events);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const firstName = user?.fullName?.split(' ')[0] || 'admin';

  if (!stats) {
    return (
      <div className="stack">
        <h1 className="text-2xl text-ink">Platform overview</h1>
        <ErrorAlert message={error} />
        <SkeletonStats />
      </div>
    );
  }

  const pendingVerifications = stats.companiesByStatus?.pending || 0;

  return (
    <div className="stack">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl text-ink">Platform overview</h1>
          <p className="mt-1.5 text-sm text-muted">
            Welcome, {firstName}. Every figure here is a live count — nothing is estimated.
          </p>
        </div>
        {pendingVerifications > 0 && (
          <Link to="/app/admin/employers" className="btn-primary">
            Review {pendingVerifications} pending {pendingVerifications === 1 ? 'employer' : 'employers'}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </header>

      <ErrorAlert message={error} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Active users" value={stats.totals.users} icon={Users}
                  hint={`${stats.usersByRole?.job_seeker || 0} job seekers.`} />
        <StatTile label="Companies" value={stats.totals.companies} icon={Building2}
                  hint={`${stats.companiesByStatus?.verified || 0} verified.`} />
        <StatTile label="Postings" value={stats.totals.postings} icon={Briefcase}
                  hint={`${stats.postingsByStatus?.published || 0} published.`} />
        <StatTile label="Applications" value={stats.totals.applications} icon={FileText}
                  hint={`${stats.applicationsByStatus?.hired || 0} resulted in a hire.`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <section className="card overflow-hidden">
          <div className="panel-header">
            <h2 className="text-sm font-semibold text-ink">Users by role</h2>
            <span className="text-xs tabular-nums text-muted">{stats.totals.users} total</span>
          </div>
          <ul className="divide-y divide-line">
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <li key={role} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-ink-soft">{label}</span>
                <span className="font-medium tabular-nums text-ink">{stats.usersByRole?.[role] || 0}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card overflow-hidden">
          <div className="panel-header">
            <h2 className="text-sm font-semibold text-ink">Recent activity</h2>
            <span className="text-xs text-muted">Audit log</span>
          </div>
          {activity.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">No recorded activity yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {activity.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate text-ink-soft"><ActionLabel action={event.action} /></span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {event.actorName || 'System'}
                      {event.resourceType && <> · {event.resourceType} #{event.resourceId}</>}
                    </span>
                  </span>
                  <span className="shrink-0 text-2xs tabular-nums text-faint">
                    {String(event.createdAt).replace('T', ' ').slice(0, 16)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { to: '/app/admin/employers', icon: ShieldCheck, title: 'Employer verification', hint: `${pendingVerifications} awaiting review` },
          { to: '/app/admin/users', icon: Users, title: 'User management', hint: 'Arrives in Phase 12' },
          { to: '/app/admin/analytics', icon: FileText, title: 'Analytics', hint: 'Arrives in Phase 11' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="card group flex items-center gap-3 px-5 py-4 transition-colors hover:border-line-strong hover:bg-elevated/50"
          >
            <span className="icon-tile"><item.icon className="h-4 w-4" aria-hidden /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink">{item.title}</span>
              <span className="mt-0.5 block truncate text-xs text-muted">{item.hint}</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-faint transition-transform duration-180 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ))}
      </section>
    </div>
  );
}
