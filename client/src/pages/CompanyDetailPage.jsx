import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Briefcase, Calendar, Globe, Mail, MapPin,
  ShieldAlert, ShieldCheck, Users,
} from 'lucide-react';
import { api } from '../services/api';
import EmptyState from '../components/EmptyState';
import ErrorAlert from '../components/ErrorAlert';
import Avatar from '../components/Avatar';
import Skeleton, { SkeletonText } from '../components/Skeleton';
import { safeUrl } from '../services/url';

function Meta({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted">
      <Icon className="h-4 w-4 shrink-0 text-faint" aria-hidden />
      {children}
    </span>
  );
}

export default function CompanyDetailPage() {
  const { slug } = useParams();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/companies/${slug}`);
        if (cancelled) return;
        setCompany(data.company);
        const jobsRes = await api.get('/jobs', { params: { companySlug: slug } });
        if (!cancelled) setJobs(jobsRes.data.jobs);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="container-app py-10">
        <Skeleton className="h-4 w-28" />
        <div className="mt-8 flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>
        </div>
        <div className="mt-8"><SkeletonText lines={4} /></div>
      </div>
    );
  }

  if (error) return <div className="container-prose py-12"><ErrorAlert message={error} /></div>;
  if (!company) return null;

  const verified = company.verificationStatus === 'verified';

  return (
    <div className="container-app py-8 lg:py-12">
      <Link to="/companies" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All companies
      </Link>

      <header className="mt-6 border-b border-line pb-8">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={company.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl text-ink text-balance">{company.name}</h1>
              <span className={verified ? 'badge-success' : 'badge-warn'}>
                {verified
                  ? <><ShieldCheck className="h-3 w-3" aria-hidden /> Verified employer</>
                  : <><ShieldAlert className="h-3 w-3" aria-hidden /> Unverified employer</>}
              </span>
            </div>
            {company.tagline && <p className="mt-2 max-w-prose text-base text-muted text-pretty">{company.tagline}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Meta icon={Briefcase}>{company.industry}</Meta>
              <Meta icon={MapPin}>{[company.location, company.district].filter(Boolean).join(', ')}</Meta>
              <Meta icon={Users}>{company.companySize ? `${company.companySize} employees` : null}</Meta>
              <Meta icon={Calendar}>{company.foundedYear ? `Founded ${company.foundedYear}` : null}</Meta>
              {company.websiteUrl && (
                <a href={safeUrl(company.websiteUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                  <Globe className="h-4 w-4" aria-hidden /> Website
                </a>
              )}
              {company.contactEmail && (
                <a href={`mailto:${company.contactEmail}`} className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                  <Mail className="h-4 w-4" aria-hidden /> {company.contactEmail}
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mt-8 lg:grid lg:grid-cols-[1fr_18rem] lg:gap-10">
        <div className="min-w-0">
          <h2 className="text-lg text-ink">Open opportunities</h2>
          <p className="mt-1 text-sm text-muted">
            {jobs.length} published {jobs.length === 1 ? 'role' : 'roles'} at {company.name}.
          </p>

          <div className="mt-5">
            {jobs.length === 0 ? (
              <EmptyState
                compact
                icon={Briefcase}
                title="No open opportunities"
                message="This company has nothing published right now."
                action={<Link to="/jobs" className="btn-secondary btn-sm">Browse all opportunities</Link>}
              />
            ) : (
              <ul className="stagger grid gap-3">
                {jobs.map((job) => (
                  <li key={job.id} className="card-interactive group relative p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-ink">
                          <Link to={`/jobs/${job.id}`} className="after:absolute after:inset-0 group-hover:text-accent">
                            {job.title}
                          </Link>
                        </h3>
                        <div className="mt-1 text-xs text-muted">
                          <span className="capitalize">{job.opportunityType}</span>
                          {' · '}<span className="capitalize">{job.workMode}</span>
                          {job.location && <> · {job.location}</>}
                          {job.applicationDeadline && <> · closes {job.applicationDeadline}</>}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-faint transition-transform duration-180 group-hover:translate-x-0.5" aria-hidden />
                    </div>

                    {job.summary && <p className="mt-2.5 line-clamp-2 text-sm text-muted">{job.summary}</p>}

                    {job.requiredSkills?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {job.requiredSkills.slice(0, 6).map((s) => (
                          <span key={s.skillId} className={s.importance === 'required' ? 'badge-info' : 'badge-outline'}>
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="mt-10 lg:mt-0">
          {company.description && (
            <section className="card card-body">
              <h2 className="text-sm font-semibold text-ink">About</h2>
              <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {company.description}
              </p>
            </section>
          )}
          <div className="card card-body mt-4">
            <h2 className="text-sm font-semibold text-ink">Hiring here?</h2>
            <p className="mt-1.5 text-sm text-muted text-pretty">
              Build a profile so this employer can see the skills you can prove.
            </p>
            <Link to="/register" className="btn-primary mt-4 w-full">Create your profile</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
