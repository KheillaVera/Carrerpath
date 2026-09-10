import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Search, ShieldCheck, X } from 'lucide-react';
import { api } from '../services/api';
import EmptyState from '../components/EmptyState';
import ErrorAlert from '../components/ErrorAlert';
import Avatar from '../components/Avatar';
import Skeleton from '../components/Skeleton';

function CompanyCardSkeleton() {
  return (
    <li className="card card-body">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-2/3" />
    </li>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // Debounced so typing does not fire a request per keystroke.
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/companies', { params: query ? { q: query } : {} });
        if (!cancelled) setCompanies(data.companies);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, query ? 300 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  return (
    <div className="container-app py-10 lg:py-14">
      <header className="border-b border-line pb-6">
        <h1 className="text-3xl text-ink text-balance">Companies hiring on PathAura</h1>
        <p className="mt-2 max-w-prose text-base text-muted text-pretty">
          Employers posting jobs, internships and apprenticeships. Verified companies have had their
          details checked by an administrator.
        </p>
      </header>

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden />
        <input
          className="input pl-9 pr-9"
          placeholder="Search by name, industry or location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search companies"
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

      <div className="mt-8">
        <ErrorAlert message={error} className="mb-4" />

        {loading ? (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <CompanyCardSkeleton key={i} />)}
          </ul>
        ) : companies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={query ? 'No companies match that search' : 'No companies yet'}
            message={query
              ? 'Try a shorter or more general search term.'
              : 'Once employers create their profiles they will be listed here.'}
            action={query ? <button className="btn-secondary" onClick={() => setQuery('')}>Clear search</button> : null}
          />
        ) : (
          <>
            <p className="mb-3 text-xs text-muted" aria-live="polite">
              {companies.length} compan{companies.length === 1 ? 'y' : 'ies'}
            </p>
            <ul className="stagger grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <li key={company.id} className="card-interactive group relative flex flex-col p-5">
                  <div className="flex items-start gap-3">
                    <Avatar name={company.name} />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-semibold text-ink">
                        <Link to={`/companies/${company.slug}`} className="after:absolute after:inset-0 group-hover:text-accent">
                          {company.name}
                        </Link>
                      </h2>
                      <div className="mt-0.5 truncate text-xs text-muted">
                        {company.industry || 'Industry not set'}
                        {company.location && <> · {company.location}</>}
                      </div>
                    </div>
                    {company.verificationStatus === 'verified' && (
                      <ShieldCheck className="h-4 w-4 shrink-0 text-success" aria-label="Verified" />
                    )}
                  </div>

                  {company.tagline && (
                    <p className="mt-3 line-clamp-2 flex-1 text-sm text-muted">{company.tagline}</p>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs">
                    <span className={company.openPositions > 0 ? 'font-medium text-accent' : 'text-muted'}>
                      {company.openPositions} open position{company.openPositions === 1 ? '' : 's'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-faint transition-transform duration-180 group-hover:translate-x-0.5" aria-hidden />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
