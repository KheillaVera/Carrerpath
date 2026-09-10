import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import {
  Archive, Briefcase, ExternalLink, Eye, Loader2, Pencil, Plus, Search, Send, Trash2, X,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import ErrorAlert from '../../components/ErrorAlert';
import Modal from '../../components/Modal';
import Segmented from '../../components/Segmented';
import StatusPill from '../../components/StatusPill';
import ConfirmDialog from '../../components/ConfirmDialog';
import { SkeletonTable } from '../../components/Skeleton';

const OPPORTUNITY_TYPES = [
  { value: 'job', label: 'Job' },
  { value: 'internship', label: 'Internship' },
  { value: 'apprenticeship', label: 'Apprenticeship' },
  { value: 'volunteer', label: 'Volunteer' },
];

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'volunteer', label: 'Volunteer' },
];

const WORK_MODES = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

const EDUCATION_LEVELS = [
  { value: 'none', label: 'No formal requirement' },
  { value: 'secondary', label: 'Secondary school' },
  { value: 'tvet', label: 'TVET' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelor', label: "Bachelor's degree" },
  { value: 'master', label: "Master's degree" },
  { value: 'phd', label: 'PhD' },
];

const SKILL_LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'];

/** Groups the form into labelled sections so a long form still reads clearly. */
function FormSection({ title, hint, children }) {
  return (
    <section className="border-t border-line pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function RequiredSkillsEditor({ catalogue, value, onChange }) {
  const [filter, setFilter] = useState('');
  const selectedIds = useMemo(() => new Set(value.map((s) => s.skillId)), [value]);
  const matches = useMemo(() => {
    const term = filter.trim().toLowerCase();
    const pool = catalogue.filter((s) => !selectedIds.has(s.id));
    if (!term) return pool.slice(0, 18);
    return pool.filter((s) => s.name.toLowerCase().includes(term)).slice(0, 40);
  }, [filter, catalogue, selectedIds]);

  const addSkill = (skill) => onChange([
    ...value,
    { skillId: skill.id, name: skill.name, importance: 'required', minLevel: 'intermediate', weight: 3 },
  ]);
  const updateSkill = (skillId, patch) =>
    onChange(value.map((s) => (s.skillId === skillId ? { ...s, ...patch } : s)));
  const removeSkill = (skillId) => onChange(value.filter((s) => s.skillId !== skillId));

  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-4 overflow-hidden rounded-md border border-line">
          {value.map((skill, index) => (
            <li
              key={skill.skillId}
              className={`flex flex-wrap items-center gap-2 px-3 py-2.5 ${index > 0 ? 'border-t border-line' : ''}`}
            >
              <span className="min-w-[7rem] flex-1 text-sm font-medium text-ink">{skill.name}</span>
              <select
                className="input w-auto py-1 text-xs"
                value={skill.importance}
                onChange={(e) => updateSkill(skill.skillId, { importance: e.target.value })}
                aria-label={`${skill.name} importance`}
              >
                <option value="required">Required</option>
                <option value="preferred">Preferred</option>
              </select>
              <select
                className="input w-auto py-1 text-xs capitalize"
                value={skill.minLevel}
                onChange={(e) => updateSkill(skill.skillId, { minLevel: e.target.value })}
                aria-label={`${skill.name} minimum level`}
              >
                {SKILL_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
              <select
                className="input w-auto py-1 text-xs"
                value={skill.weight}
                onChange={(e) => updateSkill(skill.skillId, { weight: Number(e.target.value) })}
                aria-label={`${skill.name} weight`}
              >
                {[1, 2, 3, 4, 5].map((w) => <option key={w} value={w}>Weight {w}</option>)}
              </select>
              <button
                type="button"
                className="btn-ghost btn-icon btn-sm text-muted hover:text-danger"
                onClick={() => removeSkill(skill.skillId)}
                aria-label={`Remove ${skill.name}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden />
        <input
          className="input pl-9"
          placeholder="Search skills to add…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Search skills"
        />
      </div>
      <div className="mt-2 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-line bg-elevated/40 p-2">
        {matches.map((skill) => (
          <button key={skill.id} type="button" className="chip" onClick={() => addSkill(skill)}>
            + {skill.name}
          </button>
        ))}
        {matches.length === 0 && <span className="px-1 text-xs text-muted">No matches.</span>}
      </div>
      <p className="hint">{value.length} skill{value.length === 1 ? '' : 's'} attached to this posting.</p>
    </div>
  );
}

function JobForm({ initial, catalogue, onCancel, onSaved }) {
  const editing = !!initial?.id;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: initial?.title || '',
      summary: initial?.summary || '',
      description: initial?.description || '',
      responsibilities: initial?.responsibilities || '',
      opportunityType: initial?.opportunityType || 'job',
      employmentType: initial?.employmentType || 'full_time',
      workMode: initial?.workMode || 'onsite',
      location: initial?.location || '',
      district: initial?.district || '',
      minExperienceYears: initial?.minExperienceYears ?? 0,
      educationLevel: initial?.educationLevel || 'none',
      salaryMin: initial?.salaryMin ?? '',
      salaryMax: initial?.salaryMax ?? '',
      salaryCurrency: initial?.salaryCurrency || 'RWF',
      salaryVisible: !!initial?.salaryVisible,
      positionsAvailable: initial?.positionsAvailable ?? 1,
      applicationDeadline: initial?.applicationDeadline || '',
    },
  });
  const [skills, setSkills] = useState(() => initial?.requiredSkills || []);
  const [error, setError] = useState(null);

  const onSubmit = async (values) => {
    setError(null);
    const payload = {
      ...values,
      salaryVisible: !!values.salaryVisible,
      requiredSkills: skills.map(({ skillId, importance, minLevel, weight }) => ({ skillId, importance, minLevel, weight })),
    };
    // Optional numbers and dates must be omitted rather than sent as empty strings.
    for (const key of ['salaryMin', 'salaryMax', 'applicationDeadline']) {
      if (payload[key] === '' || payload[key] === null) delete payload[key];
    }

    try {
      const { data } = editing
        ? await api.patch(`/jobs/${initial.id}`, payload)
        : await api.post('/jobs', payload);
      onSaved(data.job, editing);
    } catch (err) {
      setError(err.details?.[0]?.message || err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <FormSection title="The role" hint="What a candidate sees first in search results.">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input id="title" className="input" placeholder="Junior Frontend Developer"
                   {...register('title', { required: 'Title is required.' })} aria-invalid={!!errors.title} />
            {errors.title && <p className="field-error">{errors.title.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="summary">Summary</label>
            <input id="summary" className="input" placeholder="One line shown in search results" {...register('summary')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="opportunityType">Opportunity type</label>
              <select id="opportunityType" className="input" {...register('opportunityType')}>
                {OPPORTUNITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="employmentType">Employment type</label>
              <select id="employmentType" className="input" {...register('employmentType')}>
                {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Description">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="description">About the role</label>
            <textarea id="description" rows={5} className="input" {...register('description')} />
          </div>
          <div>
            <label className="label" htmlFor="responsibilities">Responsibilities</label>
            <textarea id="responsibilities" rows={4} className="input" {...register('responsibilities')} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Where and who" hint="Used by candidates to filter the marketplace.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="workMode">Work mode</label>
            <select id="workMode" className="input" {...register('workMode')}>
              {WORK_MODES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="educationLevel">Minimum education</label>
            <select id="educationLevel" className="input" {...register('educationLevel')}>
              {EDUCATION_LEVELS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="location">Location</label>
            <input id="location" className="input" placeholder="Kigali" {...register('location')} />
          </div>
          <div>
            <label className="label" htmlFor="district">District</label>
            <input id="district" className="input" placeholder="Gasabo" {...register('district')} />
          </div>
          <div>
            <label className="label" htmlFor="minExperienceYears">Minimum experience (years)</label>
            <input id="minExperienceYears" type="number" step="0.5" min="0" className="input" {...register('minExperienceYears')} />
          </div>
          <div>
            <label className="label" htmlFor="positionsAvailable">Positions available</label>
            <input id="positionsAvailable" type="number" min="1" className="input" {...register('positionsAvailable')} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="applicationDeadline">Application deadline</label>
            <input id="applicationDeadline" type="date" className="input" {...register('applicationDeadline')} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Compensation" hint="Ranges are hidden from candidates unless you choose to show them.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="salaryMin">From</label>
            <input id="salaryMin" type="number" min="0" className="input" {...register('salaryMin')} />
          </div>
          <div>
            <label className="label" htmlFor="salaryMax">To</label>
            <input id="salaryMax" type="number" min="0" className="input" {...register('salaryMax')} />
          </div>
          <div>
            <label className="label" htmlFor="salaryCurrency">Currency</label>
            <input id="salaryCurrency" className="input" maxLength={3} {...register('salaryCurrency')} />
          </div>
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
          <input type="checkbox" {...register('salaryVisible')} />
          Show this salary range publicly
        </label>
      </FormSection>

      <FormSection
        title="Required skills"
        hint="These drive the match score candidates see. Mark a skill as preferred when it is nice to have."
      >
        <RequiredSkillsEditor catalogue={catalogue} value={skills} onChange={setSkills} />
      </FormSection>

      <ErrorAlert message={error} />

      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {editing ? 'Save changes' : 'Create posting'}
        </button>
      </div>
    </form>
  );
}

export default function JobPostingsPage() {
  const toast = useToast();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [mineRes, skillsRes] = await Promise.all([api.get('/jobs/mine'), api.get('/skills')]);
        if (cancelled) return;
        setCompany(mineRes.data.company);
        setJobs(mineRes.data.jobs);
        setCatalogue(skillsRes.data.skills);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const counts = useMemo(() => ({
    all: jobs.length,
    published: jobs.filter((j) => j.status === 'published').length,
    draft: jobs.filter((j) => j.status === 'draft').length,
    closed: jobs.filter((j) => ['closed', 'archived'].includes(j.status)).length,
  }), [jobs]);

  const visible = jobs.filter((job) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'closed') return ['closed', 'archived'].includes(job.status);
    return job.status === statusFilter;
  });

  const handleSaved = (job, wasEditing) => {
    setJobs((prev) => {
      const idx = prev.findIndex((j) => j.id === job.id);
      if (idx === -1) return [job, ...prev];
      const next = [...prev];
      next[idx] = job;
      return next;
    });
    setEditing(null);
    toast.success(wasEditing ? 'Posting updated' : 'Posting created', wasEditing ? job.title : 'It is saved as a draft until you publish it.');
  };

  const handleStatusChange = async (job, status) => {
    setBusyId(job.id);
    try {
      const { data } = await api.patch(`/jobs/${job.id}/status`, { status });
      setJobs((prev) => prev.map((j) => (j.id === job.id ? data.job : j)));
      toast.success(status === 'published' ? 'Posting published' : 'Posting closed', job.title);
    } catch (err) {
      toast.error('Could not update posting', err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    const job = pendingDelete;
    try {
      await api.delete(`/jobs/${job.id}`);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      toast.success('Posting deleted', job.title);
    } catch (err) {
      toast.error('Could not delete posting', err.message);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Job postings" description="Post jobs, internships and apprenticeships with the skills they require." />
        <SkeletonTable rows={4} columns={5} />
      </div>
    );
  }

  if (!company) {
    return (
      <div>
        <PageHeader title="Job postings" description="Post jobs, internships and apprenticeships with the skills they require." />
        <EmptyState
          icon={Briefcase}
          title="Create your company profile first"
          message="Opportunities are posted on behalf of a company, so PathAura needs your company details before you can post."
          action={<Link to="/app/company" className="btn-primary">Go to company profile</Link>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Job postings"
        description="Every posting lists the skills it requires — that is what powers match scores for candidates."
        actions={
          <button className="btn-primary" onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" aria-hidden /> New posting
          </button>
        }
      >
        {jobs.length > 0 && (
          <Segmented
            ariaLabel="Filter postings by status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'published', label: 'Published', count: counts.published },
              { value: 'draft', label: 'Drafts', count: counts.draft },
              { value: 'closed', label: 'Closed', count: counts.closed },
            ]}
          />
        )}
      </PageHeader>

      <ErrorAlert message={error} className="mb-4" />

      {company.verificationStatus !== 'verified' && (
        <div className="alert-warn mb-5">
          <span>
            Your company is not verified yet, so postings carry an “unverified employer” label for candidates.
          </span>
        </div>
      )}

      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No postings yet"
          message="Create your first opportunity. Drafts stay private until you publish them."
          action={<button className="btn-primary" onClick={() => setEditing({})}>Create posting</button>}
        />
      ) : visible.length === 0 ? (
        <EmptyState compact icon={Briefcase} title="Nothing in this view" message="Switch the filter to see your other postings." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Posting</th>
                <th scope="col" className="hidden lg:table-cell">Skills</th>
                <th scope="col" className="hidden sm:table-cell">Views</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((job) => (
                <tr key={job.id}>
                  <td>
                    <div className="min-w-0">
                      <div className="cell-primary flex items-center gap-1.5">
                        <span className="truncate">{job.title}</span>
                        {job.status === 'published' && (
                          <Link
                            to={`/jobs/${job.id}`}
                            target="_blank"
                            className="text-faint transition-colors hover:text-accent"
                            aria-label={`Open public page for ${job.title}`}
                          >
                            <ExternalLink className="h-3 w-3" aria-hidden />
                          </Link>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted">
                        <span className="capitalize">{job.opportunityType}</span>
                        {' · '}<span className="capitalize">{job.workMode}</span>
                        {job.location && <> · {job.location}</>}
                        {job.applicationDeadline && <> · closes {job.applicationDeadline}</>}
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell">
                    <div className="flex max-w-[16rem] flex-wrap gap-1">
                      {(job.requiredSkills || []).slice(0, 3).map((s) => (
                        <span key={s.skillId} className={s.importance === 'required' ? 'badge-info' : 'badge-outline'}>
                          {s.name}
                        </span>
                      ))}
                      {(job.requiredSkills || []).length > 3 && (
                        <span className="badge-outline">+{job.requiredSkills.length - 3}</span>
                      )}
                      {(job.requiredSkills || []).length === 0 && (
                        <span className="text-xs text-faint">None set</span>
                      )}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-xs tabular-nums text-muted">
                      <Eye className="h-3.5 w-3.5 text-faint" aria-hidden /> {job.viewsCount}
                    </span>
                  </td>
                  <td><StatusPill status={job.status} /></td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {job.status !== 'published' ? (
                        <button
                          className="btn-secondary btn-sm"
                          disabled={busyId === job.id}
                          onClick={() => handleStatusChange(job, 'published')}
                        >
                          {busyId === job.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                            : <Send className="h-3.5 w-3.5" aria-hidden />}
                          Publish
                        </button>
                      ) : (
                        <button
                          className="btn-ghost btn-sm"
                          disabled={busyId === job.id}
                          onClick={() => handleStatusChange(job, 'closed')}
                        >
                          <Archive className="h-3.5 w-3.5" aria-hidden /> Close
                        </button>
                      )}
                      <button
                        className="btn-ghost btn-icon btn-sm"
                        onClick={() => setEditing(job)}
                        aria-label={`Edit ${job.title}`}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        className="btn-ghost btn-icon btn-sm text-muted hover:text-danger"
                        onClick={() => setPendingDelete(job)}
                        aria-label={`Delete ${job.title}`}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        size="lg"
        title={editing?.id ? 'Edit posting' : 'New posting'}
        description={editing?.id ? editing.title : 'It saves as a draft — publish when you are ready.'}
      >
        {editing !== null && (
          <JobForm initial={editing} catalogue={catalogue} onCancel={() => setEditing(null)} onSaved={handleSaved} />
        )}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete posting?"
        body={pendingDelete
          ? `“${pendingDelete.title}” and every application attached to it will be permanently deleted. This cannot be undone.`
          : ''}
        confirmLabel="Delete posting"
      />
    </div>
  );
}
