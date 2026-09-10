import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Bookmark, BookmarkCheck, Briefcase, Clock, Eye, GraduationCap,
  Loader2, MapPin, ShieldAlert, ShieldCheck, Users, Wallet,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import ErrorAlert from '../components/ErrorAlert';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import StatusPill from '../components/StatusPill';
import Skeleton, { SkeletonText } from '../components/Skeleton';

const OPPORTUNITY_LABELS = {
  job: 'Job', internship: 'Internship', apprenticeship: 'Apprenticeship', volunteer: 'Volunteer',
};
const EMPLOYMENT_LABELS = {
  full_time: 'Full-time', part_time: 'Part-time', internship: 'Internship',
  contract: 'Contract', freelance: 'Freelance', volunteer: 'Volunteer',
};
const WORK_MODE_LABELS = { onsite: 'On-site', remote: 'Remote', hybrid: 'Hybrid' };
const EDUCATION_LABELS = {
  none: 'No formal requirement', secondary: 'Secondary school', tvet: 'TVET',
  certificate: 'Certificate', diploma: 'Diploma', bachelor: "Bachelor's degree",
  master: "Master's degree", phd: 'PhD',
};

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-faint" aria-hidden />
      <div className="min-w-0">
        <div className="text-2xs uppercase tracking-[0.08em] text-faint">{label}</div>
        <div className="mt-0.5 text-sm text-ink-soft">{value}</div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="container-app py-10">
      <Skeleton className="h-4 w-32" />
      <div className="mt-8 lg:grid lg:grid-cols-[1fr_20rem] lg:gap-10">
        <div>
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="mt-3 h-4 w-40" />
          <div className="mt-8 card card-body"><SkeletonText lines={5} /></div>
          <div className="mt-4 card card-body"><SkeletonText lines={4} /></div>
        </div>
        <div className="mt-6 lg:mt-0"><Skeleton className="h-64 w-full rounded-lg" /></div>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/jobs/${id}`);
        if (!cancelled) setJob(data.job);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const submitApplication = async (event) => {
    event.preventDefault();
    setApplying(true);
    setApplyError(null);
    try {
      const { data } = await api.post('/applications', { jobId: Number(id), coverLetter });
      setJob((prev) => ({
        ...prev,
        myApplication: { id: data.application.id, status: data.application.status },
      }));
      setApplyOpen(false);
      toast.success('Application submitted', 'Track its progress from your applications page.');
    } catch (err) {
      setApplyError(err.details?.[0]?.message || err.message);
    } finally {
      setApplying(false);
    }
  };

  const toggleSave = async () => {
    setSaving(true);
    try {
      if (job.isSaved) {
        await api.delete(`/jobs/${job.id}/save`);
        toast.info('Removed from saved');
      } else {
        await api.post(`/jobs/${job.id}/save`);
        toast.success('Saved');
      }
      setJob((prev) => ({ ...prev, isSaved: !prev.isSaved }));
    } catch (err) {
      toast.error('Could not update saved list', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (error) return <div className="container-prose py-12"><ErrorAlert message={error} /></div>;
  if (!job) return null;

  const verified = job.companyVerificationStatus === 'verified';
  const salaryShown = job.salaryVisible && (job.salaryMin || job.salaryMax);
  const required = (job.requiredSkills || []).filter((s) => s.importance === 'required');
  const preferred = (job.requiredSkills || []).filter((s) => s.importance === 'preferred');

  const applyPanel = (
    <div className="card overflow-hidden">
      {job.myApplication ? (
        <div className="p-5">
          <div className="section-label">Your application</div>
          <div className="mt-2.5"><StatusPill status={job.myApplication.status} /></div>
          <p className="mt-3 text-sm text-muted text-pretty">
            You have applied to this opportunity. Every stage is recorded on your applications page.
          </p>
          <Link to="/app/applications" className="btn-secondary mt-4 w-full">View my applications</Link>
        </div>
      ) : (
        <div className="p-5">
          <div className="section-label">Apply</div>
          <p className="mt-2.5 text-sm text-muted text-pretty">
            {isAuthenticated
              ? 'Your skills, projects and certifications are shared with the employer automatically.'
              : 'Create a profile so employers can see the skills you can prove.'}
          </p>
          <div className="mt-4 space-y-2">
            {isAuthenticated ? (
              <>
                <button className="btn-primary btn-lg w-full" onClick={() => setApplyOpen(true)}>Apply now</button>
                <button className="btn-secondary w-full" onClick={toggleSave} disabled={saving} aria-pressed={!!job.isSaved}>
                  {job.isSaved
                    ? <><BookmarkCheck className="h-4 w-4 text-accent" aria-hidden /> Saved</>
                    : <><Bookmark className="h-4 w-4" aria-hidden /> Save for later</>}
                </button>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary btn-lg w-full">Create a profile</Link>
                <Link to="/login" className="btn-secondary w-full">Log in</Link>
              </>
            )}
          </div>
        </div>
      )}

      <div className="divide-y divide-line border-t border-line">
        <div className="px-5 py-4">
          <Link to={`/companies/${job.companySlug}`} className="flex items-center gap-3 group">
            <Avatar name={job.companyName} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink group-hover:text-accent">
                {job.companyName}
              </span>
              <span className={`mt-0.5 inline-flex items-center gap-1 text-2xs ${verified ? 'text-success' : 'text-warn'}`}>
                {verified
                  ? <><ShieldCheck className="h-3 w-3" aria-hidden /> Verified employer</>
                  : <><ShieldAlert className="h-3 w-3" aria-hidden /> Unverified employer</>}
              </span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 text-2xs text-faint">
          <Eye className="h-3.5 w-3.5" aria-hidden />
          {job.viewsCount} view{job.viewsCount === 1 ? '' : 's'}
          {job.publishedAt && <> · posted {String(job.publishedAt).slice(0, 10)}</>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-app py-8 lg:py-12">
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All opportunities
      </Link>

      <div className="mt-6 lg:grid lg:grid-cols-[1fr_20rem] lg:gap-10">
        <div className="min-w-0 animate-fade-up">
          <header className="border-b border-line pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-info">{OPPORTUNITY_LABELS[job.opportunityType]}</span>
              <span className="badge-outline">{EMPLOYMENT_LABELS[job.employmentType]}</span>
              <span className="badge-outline">{WORK_MODE_LABELS[job.workMode]}</span>
            </div>
            <h1 className="mt-3 text-3xl text-ink text-balance">{job.title}</h1>
            {job.summary && <p className="mt-3 max-w-prose text-base text-muted text-pretty">{job.summary}</p>}
          </header>

          <div className="grid gap-5 border-b border-line py-6 sm:grid-cols-2">
            <Fact
              icon={MapPin}
              label="Location"
              value={`${WORK_MODE_LABELS[job.workMode]}${job.location ? ` · ${job.location}` : ''}${job.district ? `, ${job.district}` : ''}`}
            />
            <Fact icon={GraduationCap} label="Education" value={EDUCATION_LABELS[job.educationLevel]} />
            <Fact
              icon={Briefcase}
              label="Experience"
              value={Number(job.minExperienceYears) > 0 ? `${job.minExperienceYears}+ years` : 'Open to newcomers'}
            />
            <Fact
              icon={Users}
              label="Positions"
              value={`${job.positionsAvailable} available`}
            />
            {job.applicationDeadline && (
              <Fact icon={Clock} label="Deadline" value={job.applicationDeadline} />
            )}
            {salaryShown && (
              <Fact
                icon={Wallet}
                label="Salary"
                value={`${job.salaryCurrency} ${Number(job.salaryMin || job.salaryMax).toLocaleString()}${
                  job.salaryMin && job.salaryMax ? ` – ${Number(job.salaryMax).toLocaleString()}` : ''
                }`}
              />
            )}
          </div>

          {(required.length > 0 || preferred.length > 0) && (
            <section className="border-b border-line py-6">
              <h2 className="text-lg text-ink">Skills this role needs</h2>
              <p className="mt-1.5 text-sm text-muted text-pretty">
                These drive the match score. Anything you are missing becomes a named gap rather than a silent rejection.
              </p>
              {required.length > 0 && (
                <div className="mt-5">
                  <div className="section-label mb-2.5">Required</div>
                  <div className="flex flex-wrap gap-1.5">
                    {required.map((s) => (
                      <span key={s.skillId} className="badge-info">
                        {s.name}
                        <span className="text-accent/70"> · {s.minLevel}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {preferred.length > 0 && (
                <div className="mt-4">
                  <div className="section-label mb-2.5">Preferred</div>
                  <div className="flex flex-wrap gap-1.5">
                    {preferred.map((s) => (
                      <span key={s.skillId} className="badge-outline">
                        {s.name}<span className="text-faint"> · {s.minLevel}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {job.description && (
            <section className="border-b border-line py-6">
              <h2 className="text-lg text-ink">About this opportunity</h2>
              <p className="mt-3 max-w-prose whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {job.description}
              </p>
            </section>
          )}

          {job.responsibilities && (
            <section className="py-6">
              <h2 className="text-lg text-ink">Responsibilities</h2>
              <p className="mt-3 max-w-prose whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {job.responsibilities}
              </p>
            </section>
          )}
        </div>

        {/* Sticky on desktop, inline underneath on smaller screens. */}
        <aside className="mt-8 lg:mt-0">
          <div className="lg:sticky lg:top-24">{applyPanel}</div>
        </aside>
      </div>

      <Modal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title={`Apply — ${job.title}`}
        description={`${job.companyName} will see this message alongside your skills profile.`}
      >
        <form onSubmit={submitApplication} className="space-y-4">
          <div>
            <label className="label" htmlFor="coverLetter">Message to the employer</label>
            <textarea
              id="coverLetter"
              rows={7}
              className="input"
              placeholder="Why you are a good fit, and what you have built that proves it."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
            <p className="hint">
              Optional, but applications with a short, specific message get read first.
            </p>
          </div>

          <div className="rounded-md border border-line bg-elevated/60 px-3.5 py-3 text-xs text-muted">
            Shared automatically: your skills, projects, certifications, education and experience.
          </div>

          <ErrorAlert message={applyError} />

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-secondary" onClick={() => setApplyOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={applying}>
              {applying && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {applying ? 'Submitting…' : 'Submit application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
