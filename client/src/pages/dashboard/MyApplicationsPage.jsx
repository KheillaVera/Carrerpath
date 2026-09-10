import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronDown, Clock, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import ErrorAlert from '../../components/ErrorAlert';
import Segmented from '../../components/Segmented';
import StatusPill, { statusLabel } from '../../components/StatusPill';
import Avatar from '../../components/Avatar';
import ConfirmDialog from '../../components/ConfirmDialog';
import { SkeletonCards } from '../../components/Skeleton';

const CLOSED = ['withdrawn', 'rejected'];

function Timeline({ events }) {
  if (!events || events.length === 0) {
    return <p className="text-xs text-muted">No updates recorded yet.</p>;
  }
  return (
    <ol className="relative space-y-4 pl-5">
      {/* The rail sits behind the markers rather than being drawn per item. */}
      <span className="absolute left-[3px] top-1.5 h-[calc(100%-0.75rem)] w-px bg-line" aria-hidden />
      {events.map((event, index) => {
        const last = index === events.length - 1;
        return (
          <li key={index} className="relative">
            <span
              className={`absolute -left-5 top-1 h-[7px] w-[7px] rounded-full ring-4 ring-panel ${
                last ? 'bg-accent' : 'bg-line-strong'
              }`}
              aria-hidden
            />
            <div className="text-xs font-medium text-ink">{statusLabel(event.toStatus)}</div>
            <div className="mt-0.5 text-2xs text-muted">
              {String(event.createdAt).replace('T', ' ').slice(0, 16)}
              {event.actorName && <> · {event.actorName}</>}
            </div>
            {event.note && <p className="mt-1 text-xs text-ink-soft">{event.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}

function ApplicationCard({ application, onWithdraw }) {
  const [open, setOpen] = useState(false);
  const canWithdraw = !['withdrawn', 'hired', 'rejected'].includes(application.status);

  return (
    <li className="card">
      <div className="flex items-start gap-4 p-5">
        <Avatar name={application.companyName} className="hidden sm:flex" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Link to={`/jobs/${application.jobId}`} className="text-base font-semibold text-ink hover:text-accent">
                {application.jobTitle}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-faint" aria-hidden /> {application.companyName}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-faint" aria-hidden />
                  Applied {String(application.createdAt).slice(0, 10)}
                </span>
              </div>
            </div>
            <StatusPill status={application.status} />
          </div>

          {application.employerNote && (
            <div className="mt-3 rounded-md border border-line bg-elevated/60 px-3 py-2 text-xs text-ink-soft">
              <span className="text-muted">Employer note: </span>{application.employerNote}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              className="btn-ghost btn-sm -ml-2.5"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-180 ${open ? 'rotate-180' : ''}`}
                aria-hidden
              />
              Progress · {application.timeline?.length || 0} update{application.timeline?.length === 1 ? '' : 's'}
            </button>
            {canWithdraw && (
              <button className="btn-ghost btn-sm text-muted hover:text-danger" onClick={() => onWithdraw(application)}>
                Withdraw
              </button>
            )}
          </div>

          {open && (
            <div className="mt-4 border-t border-line pt-4 animate-fade-in">
              <Timeline events={application.timeline} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export default function MyApplicationsPage() {
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('active');
  const [pendingWithdraw, setPendingWithdraw] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/applications/mine');
        if (!cancelled) setApplications(data.applications);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const counts = useMemo(() => ({
    active: applications.filter((a) => !CLOSED.includes(a.status)).length,
    closed: applications.filter((a) => CLOSED.includes(a.status)).length,
    all: applications.length,
  }), [applications]);

  const visible = applications.filter((a) => {
    if (filter === 'active') return !CLOSED.includes(a.status);
    if (filter === 'closed') return CLOSED.includes(a.status);
    return true;
  });

  const withdraw = async () => {
    const application = pendingWithdraw;
    try {
      const { data } = await api.patch(`/applications/${application.id}/withdraw`);
      setApplications((prev) => prev.map((a) => (a.id === application.id ? data.application : a)));
      toast.success('Application withdrawn', application.jobTitle);
    } catch (err) {
      toast.error('Could not withdraw', err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="My applications"
        description="Every application you have submitted, with an honest record of what happened to it."
        actions={<Link to="/app/jobs" className="btn-secondary">Find opportunities</Link>}
      >
        {applications.length > 0 && (
          <Segmented
            ariaLabel="Filter applications"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'active', label: 'Active', count: counts.active },
              { value: 'closed', label: 'Closed', count: counts.closed },
              { value: 'all', label: 'All', count: counts.all },
            ]}
          />
        )}
      </PageHeader>

      <ErrorAlert message={error} className="mb-4" />

      {loading ? (
        <SkeletonCards count={3} columns={1} />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          message="Find an opportunity that fits your skills and apply — your profile goes with it automatically."
          action={<Link to="/app/jobs" className="btn-primary">Find opportunities</Link>}
        />
      ) : visible.length === 0 ? (
        <EmptyState compact icon={FileText} title={`Nothing ${filter}`} message="Switch the filter to see your other applications." />
      ) : (
        <ul className="stagger grid gap-3">
          {visible.map((application) => (
            <ApplicationCard key={application.id} application={application} onWithdraw={setPendingWithdraw} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingWithdraw !== null}
        onClose={() => setPendingWithdraw(null)}
        onConfirm={withdraw}
        title="Withdraw application?"
        body={pendingWithdraw
          ? `Your application for “${pendingWithdraw.jobTitle}” at ${pendingWithdraw.companyName} will be marked as withdrawn. You cannot re-apply to the same posting.`
          : ''}
        confirmLabel="Withdraw"
      />
    </div>
  );
}
