import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Briefcase, MapPin, Clock, Bookmark, BookmarkCheck,
  ShieldCheck, SlidersHorizontal, X, RotateCcw,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import EmptyState from '../components/EmptyState';
import ErrorAlert from '../components/ErrorAlert';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import Segmented from '../components/Segmented';
import { SkeletonCards } from '../components/Skeleton';
import { MatchBadge } from '../components/MatchScore';

const OPPORTUNITY_LABELS = {
  job: 'Job',
  internship: 'Internship',
  apprenticeship: 'Apprenticeship',
  volunteer: 'Volunteer',
};

const EMPLOYMENT_LABELS = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  internship: 'Internship',
  contract: 'Contract',
  freelance: 'Freelance',
  volunteer: 'Volunteer',
};

const WORK_MODE_LABELS = { onsite: 'On-site', remote: 'Remote', hybrid: 'Hybrid' };

const SORTS = [
  { value: 'recent', label: 'Newest' },
  { value: 'deadline', label: 'Closing' },
  { value: 'salary', label: 'Salary' },
];

const EMPTY_FILTERS = {
  opportunityType: '',
  employmentType: '',
  workMode: '',
  district: '',
  verifiedOnly: false,
  sort: 'recent',
};

function formatSalary(job) {
  if (!job.salaryVisible || (!job.salaryMin && !job.salaryMax)) return null;
  const currency = job.salaryCurrency || 'RWF';
  const fmt = (n) => Number(n).toLocaleString();
  if (job.salaryMin && job.salaryMax) return `${currency} ${fmt(job.salaryMin)}–${fmt(job.salaryMax)}`;
  return `${currency} ${fmt(job.salaryMin || job.salaryMax)}`;
}

function daysLeft(deadline) {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  if (diff < 0) return null;
  if (diff === 0) return 'Closes today';
  if (diff === 1) return 'Closes tomorrow';
  if (diff <= 7) return `${diff} days left`;
  return null;
}

function JobCard({ job, onToggleSave, canSave, busy, match }) {
  const salary = formatSalary(job);
  const verified = job.companyVerificationStatus === 'verified';
  const urgent = daysLeft(job.applicationDeadline);

  return (
    <li className="card-interactive group relative">
      <div className="flex gap-4 p-5">
        <Avatar name={job.companyName} size="lg" className="hidden sm:flex" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-ink">
                {/* Stretched link keeps the whole card clickable without nesting links. */}
                <Link to={`/jobs/${job.id}`} className="after:absolute after:inset-0 hover:text-accent">
                  {job.title}
                </Link>
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                <span className="font-medium text-ink-soft">{job.companyName}</span>
                {match && <MatchBadge score={match.score} band={match.band} />}
                {verified && (
                  <span className="inline-flex items-center gap-1 text-success">
                    <ShieldCheck className="h-3 w-3" aria-hidden /> Verified
                  </span>
                )}
              </div>
            </div>

            {canSave && (
              <button
                className="relative z-10 btn-ghost btn-icon btn-sm shrink-0"
                onClick={() => onToggleSave(job)}
                disabled={busy}
                aria-label={job.isSaved ? `Remove ${job.title} from saved` : `Save ${job.title}`}
                aria-pressed={!!job.isSaved}
              >
                {job.isSaved
                  ? <BookmarkCheck className="h-4 w-4 text-accent" aria-hidden />
                  : <Bookmark className="h-4 w-4" aria-hidden />}
              </button>
            )}
          </div>

          {job.summary && <p className="mt-2.5 line-clamp-2 text-sm text-muted">{job.summary}</p>}

          {job.requiredSkills?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.requiredSkills.slice(0, 6).map((s) => (
                <span key={s.skillId} className={s.importance === 'required' ? 'badge-info' : 'badge-outline'}>
                  {s.name}
                </span>
              ))}
              {job.requiredSkills.length > 6 && (
                <span className="badge-outline">+{job.requiredSkills.length - 6}</span>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-faint" aria-hidden />
              {OPPORTUNITY_LABELS[job.opportunityType] || job.opportunityType}
              {' · '}
              {EMPLOYMENT_LABELS[job.employmentType] || job.employmentType}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-faint" aria-hidden />
              {WORK_MODE_LABELS[job.workMode]}{job.location ? ` · ${job.location}` : ''}
            </span>
            {urgent && (
              <span className="inline-flex items-center gap-1.5 font-medium text-warn">
                <Clock className="h-3.5 w-3.5" aria-hidden /> {urgent}
              </span>
            )}
            {salary && <span className="font-medium text-ink-soft tabular-nums">{salary}</span>}
          </div>
        </div>
      </div>
    </li>
  );
}

function FilterPanel({ filters, setFilter, facets, fixedType, onReset, hasActive }) {
  return (
    <div className="space-y-6">
      {!fixedType && (
        <div>
          <div className="section-label mb-2.5">Opportunity type</div>
          <div className="flex flex-wrap gap-1.5">
            <button
              className={`chip ${!filters.opportunityType ? 'chip-active' : ''}`}
              onClick={() => setFilter('opportunityType', '')}
              aria-pressed={!filters.opportunityType}
            >
              All
            </button>
            {Object.entries(OPPORTUNITY_LABELS).map(([value, label]) => (
              <button
                key={value}
                className={`chip ${filters.opportunityType === value ? 'chip-active' : ''}`}
                onClick={() => setFilter('opportunityType', value)}
                aria-pressed={filters.opportunityType === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="section-label mb-2.5">Work mode</div>
        <div className="flex flex-wrap gap-1.5">
          <button
            className={`chip ${!filters.workMode ? 'chip-active' : ''}`}
            onClick={() => setFilter('workMode', '')}
            aria-pressed={!filters.workMode}
          >
            Any
          </button>
          {Object.entries(WORK_MODE_LABELS).map(([value, label]) => (
            <button
              key={value}
              className={`chip ${filters.workMode === value ? 'chip-active' : ''}`}
              onClick={() => setFilter('workMode', value)}
              aria-pressed={filters.workMode === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="section-label mb-2 block" htmlFor="filter-employment">Employment type</label>
        <select
          id="filter-employment"
          className="input"
          value={filters.employmentType}
          onChange={(e) => setFilter('employmentType', e.target.value)}
        >
          <option value="">Any</option>
          {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="section-label mb-2 block" htmlFor="filter-district">District</label>
        <select
          id="filter-district"
          className="input"
          value={filters.district}
          onChange={(e) => setFilter('district', e.target.value)}
        >
          <option value="">Anywhere</option>
          {(facets?.districts || []).map((d) => (
            <option key={d.value} value={d.value}>{d.value} ({d.count})</option>
          ))}
        </select>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={filters.verifiedOnly}
          onChange={(e) => setFilter('verifiedOnly', e.target.checked)}
        />
        Verified employers only
      </label>

      {hasActive && (
        <button className="btn-ghost btn-sm -ml-2.5" onClick={onReset}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset filters
        </button>
      )}
    </div>
  );
}

export default function JobsPage({ fixedType = null, embedded = false, title, description }) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [savedOnly, setSavedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [matches, setMatches] = useState({});

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, opportunityType: fixedType || '' });

  useEffect(() => {
    api.get('/jobs/filters').then(({ data }) => setFacets(data)).catch(() => setFacets(null));
  }, []);

  // Match scores are per candidate, so they are fetched once and looked up by job.
  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/jobs/recommended', { params: { limit: 24 } })
      .then(({ data }) => {
        setMatches(Object.fromEntries((data.matches || []).map((m) => [m.jobId, m])));
      })
      .catch(() => setMatches({}));
  }, [isAuthenticated]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (savedOnly) {
        const { data } = await api.get('/jobs/saved');
        setJobs(data.jobs);
        setTotal(data.jobs.length);
        return;
      }
      const params = { sort: filters.sort };
      if (query) params.q = query;
      if (fixedType) params.opportunityType = fixedType;
      else if (filters.opportunityType) params.opportunityType = filters.opportunityType;
      if (filters.employmentType) params.employmentType = filters.employmentType;
      if (filters.workMode) params.workMode = filters.workMode;
      if (filters.district) params.district = filters.district;
      if (filters.verifiedOnly) params.verifiedOnly = 'true';

      const { data } = await api.get('/jobs', { params });
      setJobs(data.jobs);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, filters, fixedType, savedOnly]);

  // Debounce so typing in the search box does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(load, query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const resetFilters = () => setFilters({ ...EMPTY_FILTERS, opportunityType: fixedType || '', sort: filters.sort });

  const activeCount = [
    !fixedType && filters.opportunityType,
    filters.employmentType,
    filters.workMode,
    filters.district,
    filters.verifiedOnly,
  ].filter(Boolean).length;

  const toggleSave = async (job) => {
    setBusyId(job.id);
    try {
      if (job.isSaved) {
        await api.delete(`/jobs/${job.id}/save`);
        toast.info('Removed from saved');
      } else {
        await api.post(`/jobs/${job.id}/save`);
        toast.success('Saved', `${job.title} is in your saved list.`);
      }
      setJobs((prev) =>
        savedOnly && job.isSaved
          ? prev.filter((j) => j.id !== job.id)
          : prev.map((j) => (j.id === job.id ? { ...j, isSaved: !j.isSaved } : j))
      );
    } catch (err) {
      toast.error('Could not update saved list', err.message);
    } finally {
      setBusyId(null);
    }
  };

  const filterPanel = (
    <FilterPanel
      filters={filters}
      setFilter={setFilter}
      facets={facets}
      fixedType={fixedType}
      onReset={resetFilters}
      hasActive={activeCount > 0}
    />
  );

  return (
    <div className={embedded ? '' : 'container-app py-10 lg:py-14'}>
      <header className="mb-7 border-b border-line pb-6">
        <h1 className="text-3xl text-ink text-balance">{title || 'Find opportunities'}</h1>
        <p className="mt-2 max-w-prose text-base text-muted text-pretty">
          {description || 'Jobs, internships and apprenticeships posted by employers on PathAura. Every posting lists the skills it needs.'}
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[14rem_1fr] lg:gap-10">
        {/* Desktop filter rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Filters</span>
              {activeCount > 0 && <span className="badge-info">{activeCount}</span>}
            </div>
            {filterPanel}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden />
              <input
                className="input pl-9 pr-9"
                placeholder="Search by title, company or keyword…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search opportunities"
              />
              {query && (
                <button
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-faint transition-colors hover:text-ink"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              )}
            </div>

            <Segmented
              options={SORTS}
              value={filters.sort}
              onChange={(v) => setFilter('sort', v)}
              ariaLabel="Sort results"
              size="sm"
            />

            <button className="btn-secondary lg:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Filters
              {activeCount > 0 && <span className="badge-info ml-0.5">{activeCount}</span>}
            </button>

            {isAuthenticated && (
              <button
                className={savedOnly ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setSavedOnly((v) => !v)}
                aria-pressed={savedOnly}
              >
                <Bookmark className="h-4 w-4" aria-hidden />
                Saved
              </button>
            )}
          </div>

          <div className="mt-6">
            <ErrorAlert message={error} className="mb-4" />

            {loading ? (
              <SkeletonCards count={4} columns={1} />
            ) : jobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title={savedOnly ? 'Nothing saved yet' : 'No opportunities match your search'}
                message={savedOnly
                  ? 'Save an opportunity from the listings and it will wait for you here.'
                  : 'Try a broader search term, or reset the filters to see everything available.'}
                action={savedOnly
                  ? <button className="btn-secondary" onClick={() => setSavedOnly(false)}>Browse all opportunities</button>
                  : activeCount > 0 ? <button className="btn-secondary" onClick={resetFilters}>Reset filters</button> : null}
              />
            ) : (
              <>
                <p className="mb-3 text-xs text-muted" aria-live="polite">
                  {savedOnly
                    ? `${jobs.length} saved opportunit${jobs.length === 1 ? 'y' : 'ies'}`
                    : `${total} opportunit${total === 1 ? 'y' : 'ies'}`}
                </p>
                <ul className="stagger grid gap-3">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      canSave={isAuthenticated}
                      busy={busyId === job.id}
                      onToggleSave={toggleSave}
                      match={matches[job.id]}
                    />
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" size="sm">
        {filterPanel}
        <div className="mt-6 flex justify-end">
          <button className="btn-primary" onClick={() => setFiltersOpen(false)}>
            Show {total} result{total === 1 ? '' : 's'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
