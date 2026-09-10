import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList, ExternalLink, Loader2, MapPin, Phone, Video } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import ErrorAlert from '../../components/ErrorAlert';
import StatusPill from '../../components/StatusPill';
import Avatar from '../../components/Avatar';
import { SkeletonCards } from '../../components/Skeleton';

const MODE_ICON = { online: Video, onsite: MapPin, phone: Phone };
const MODE_LABEL = { online: 'Online', onsite: 'On-site', phone: 'Phone' };

/** Splits a MySQL datetime into calendar parts without pulling in a date library. */
function parseWhen(value) {
  const iso = String(value).replace(' ', 'T');
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { day: '', month: '', time: String(value).slice(11, 16), full: String(value) };
  return {
    day: date.toLocaleDateString(undefined, { day: '2-digit' }),
    month: date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
    weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
    time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    full: date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
    isPast: date < new Date(),
  };
}

function InterviewCard({ interview, isEmployer, onSetStatus, busy }) {
  const Icon = MODE_ICON[interview.mode] || Video;
  const when = parseWhen(interview.scheduledAt);

  return (
    <li className="card">
      <div className="flex gap-4 p-5">
        {/* Calendar chip — the date is the thing you scan for. */}
        <div className="hidden shrink-0 flex-col items-center justify-center rounded-md border border-line bg-elevated px-3 py-2 sm:flex">
          <span className="text-2xs font-semibold tracking-wide text-accent">{when.month}</span>
          <span className="text-xl font-semibold tabular-nums text-ink">{when.day}</span>
          <span className="text-2xs text-muted">{when.weekday}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-ink">{interview.jobTitle}</h3>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                <Avatar name={isEmployer ? interview.applicantName : interview.companyName} size="sm" />
                <span className="truncate">
                  {isEmployer ? interview.applicantName : interview.companyName}
                </span>
              </div>
            </div>
            <StatusPill status={interview.status} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-faint" aria-hidden /> {when.full}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-faint" aria-hidden /> {MODE_LABEL[interview.mode]}
            </span>
            <span>{interview.durationMinutes} min</span>
            {interview.location && <span>{interview.location}</span>}
          </div>

          {interview.note && (
            <p className="mt-3 rounded-md border border-line bg-elevated/50 px-3 py-2 text-xs text-ink-soft">
              {interview.note}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {interview.meetingUrl && interview.status === 'scheduled' && (
              <a href={interview.meetingUrl} target="_blank" rel="noreferrer" className="btn-primary btn-sm">
                Join <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
            {isEmployer && interview.status === 'scheduled' && (
              <>
                <button className="btn-secondary btn-sm" disabled={busy} onClick={() => onSetStatus(interview, 'completed')}>
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                  Mark completed
                </button>
                <button className="btn-ghost btn-sm text-muted hover:text-danger" disabled={busy} onClick={() => onSetStatus(interview, 'cancelled')}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export default function InterviewsPage() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const isEmployer = hasRole('employer') || hasRole('admin');
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/interviews/mine');
        if (!cancelled) setInterviews(data.interviews);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setStatus = async (interview, status) => {
    setBusyId(interview.id);
    try {
      const { data } = await api.patch(`/interviews/${interview.id}`, { status });
      setInterviews((prev) => prev.map((i) => (i.id === interview.id ? data.interview : i)));
      toast.success(status === 'completed' ? 'Interview marked completed' : 'Interview cancelled');
    } catch (err) {
      toast.error('Could not update interview', err.message);
    } finally {
      setBusyId(null);
    }
  };

  const upcoming = interviews.filter((i) => i.status === 'scheduled');
  const past = interviews.filter((i) => i.status !== 'scheduled');

  return (
    <div>
      <PageHeader
        title="Interviews"
        description={isEmployer
          ? 'Interviews you have scheduled with candidates. Scheduling one moves that application into the interview stage.'
          : 'Interviews employers have scheduled with you.'}
        actions={isEmployer ? <Link to="/app/applicants" className="btn-secondary">Go to applicants</Link> : null}
      />

      <ErrorAlert message={error} className="mb-4" />

      {loading ? (
        <SkeletonCards count={2} columns={1} />
      ) : interviews.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No interviews yet"
          message={isEmployer
            ? 'Shortlist a candidate and schedule an interview from the applicants page.'
            : 'When an employer schedules an interview with you, it appears here with the joining details.'}
          action={isEmployer ? <Link to="/app/applicants" className="btn-primary">Review applicants</Link> : null}
        />
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="section-label mb-3">Scheduled · {upcoming.length}</h2>
              <ul className="stagger grid gap-3">
                {upcoming.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    isEmployer={isEmployer}
                    onSetStatus={setStatus}
                    busy={busyId === interview.id}
                  />
                ))}
              </ul>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="section-label mb-3">Past · {past.length}</h2>
              <ul className="grid gap-3">
                {past.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    isEmployer={isEmployer}
                    onSetStatus={setStatus}
                    busy={busyId === interview.id}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
