import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FolderKanban, Plus, ExternalLink, Github, Pencil, Trash2, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { SkeletonCards } from '../../components/Skeleton';
import ErrorAlert from '../../components/ErrorAlert';
import Modal from '../../components/Modal';
import { safeUrl } from '../../services/url';
import { urlRule } from '../../services/validation';

const PROJECT_TYPES = [
  { value: 'personal', label: 'Personal' },
  { value: 'academic', label: 'Academic' },
  { value: 'professional', label: 'Professional' },
  { value: 'open_source', label: 'Open source' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'other', label: 'Other' },
];

function ProjectCard({ project, onEdit, onDelete }) {
  return (
    <li className="card card-body">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-ink truncate">{project.title}</div>
          <div className="text-xs text-muted mt-0.5">
            <span className="capitalize">{project.projectType?.replace('_', ' ')}</span>
            {project.role && <> · {project.role}</>}
            {project.completionDate && <> · {project.completionDate}</>}
          </div>
        </div>
        <div className="flex gap-1">
          <button className="btn-ghost p-1.5" onClick={() => onEdit(project)} aria-label="Edit"><Pencil className="h-4 w-4" aria-hidden /></button>
          <button className="btn-ghost p-1.5 text-muted hover:text-danger" onClick={() => onDelete(project)} aria-label="Delete"><Trash2 className="h-4 w-4" aria-hidden /></button>
        </div>
      </div>
      {project.description && <p className="mt-2 text-sm text-muted line-clamp-3">{project.description}</p>}
      {project.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.skills.map((s) => <span key={s.id} className="badge-info">{s.name}</span>)}
        </div>
      )}
      {(project.githubUrl || project.liveDemoUrl) && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {project.githubUrl && (
            <a href={safeUrl(project.githubUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
              <Github className="h-3.5 w-3.5" aria-hidden /> Code
            </a>
          )}
          {project.liveDemoUrl && (
            <a href={safeUrl(project.liveDemoUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Live demo
            </a>
          )}
        </div>
      )}
    </li>
  );
}

function ProjectForm({ initial, catalogue, onCancel, onSaved }) {
  const editing = !!initial?.id;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: initial?.title || '',
      description: initial?.description || '',
      projectType: initial?.projectType || 'personal',
      role: initial?.role || '',
      githubUrl: initial?.githubUrl || '',
      liveDemoUrl: initial?.liveDemoUrl || '',
      completionDate: initial?.completionDate || '',
    },
  });
  const [selected, setSelected] = useState(() => new Set((initial?.skills || []).map((s) => s.id)));
  const [skillFilter, setSkillFilter] = useState('');
  const [error, setError] = useState(null);

  const filtered = useMemo(() => {
    const term = skillFilter.trim().toLowerCase();
    if (!term) return catalogue.slice(0, 40);
    return catalogue.filter((s) => s.name.toLowerCase().includes(term)).slice(0, 60);
  }, [skillFilter, catalogue]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const onSubmit = async (values) => {
    setError(null);
    try {
      const payload = { ...values, skillIds: Array.from(selected) };
      // Convert empty strings to null-friendly values for validators expecting formats
      if (!payload.completionDate) delete payload.completionDate;
      const { data } = editing
        ? await api.patch(`/profile/projects/${initial.id}`, payload)
        : await api.post('/profile/projects', payload);
      onSaved(data.project);
    } catch (err) {
      setError(err.details?.[0]?.message || err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="label" htmlFor="title">Title</label>
        <input id="title" className="input" {...register('title', { required: 'Title is required.' })} />
        {errors.title && <p className="field-error">{errors.title.message}</p>}
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" rows={4} className="input" {...register('description')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="projectType">Type</label>
          <select id="projectType" className="input" {...register('projectType')}>
            {PROJECT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="role">Your role</label>
          <input id="role" className="input" placeholder="Frontend developer" {...register('role')} />
        </div>
        <div>
          <label className="label" htmlFor="completionDate">Completion date</label>
          <input id="completionDate" type="date" className="input" {...register('completionDate')} />
        </div>
        <div>
          <label className="label" htmlFor="githubUrl">GitHub</label>
          <input id="githubUrl" className="input" placeholder="https://github.com/…" {...register('githubUrl', urlRule)} />
          {errors.githubUrl && <p className="field-error">{errors.githubUrl.message}</p>}
        </div>
        <div className="col-span-2">
          <label className="label" htmlFor="liveDemoUrl">Live demo</label>
          <input id="liveDemoUrl" className="input" placeholder="https://…" {...register('liveDemoUrl', urlRule)} />
          {errors.liveDemoUrl && <p className="field-error">{errors.liveDemoUrl.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Skills demonstrated</label>
        <input
          className="input mb-2"
          placeholder="Search skills to link…"
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
        />
        <div className="max-h-40 overflow-y-auto rounded-md border border-line p-2 flex flex-wrap gap-1.5">
          {filtered.map((s) => {
            const on = selected.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className={`badge ${on ? 'badge-info' : 'badge-muted'} cursor-pointer`}
                aria-pressed={on}
              >
                {s.name}
              </button>
            );
          })}
          {filtered.length === 0 && <span className="text-xs text-muted px-1">No matches.</span>}
        </div>
        <p className="mt-1 text-xs text-muted">{selected.size} selected.</p>
      </div>

      <ErrorAlert message={error} />

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {editing ? 'Save changes' : 'Add project'}
        </button>
      </div>
    </form>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const toast = useToast(); // {} for new, {...project} for edit, null closed

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [projRes, skillsRes] = await Promise.all([
          api.get('/profile/projects'),
          api.get('/skills'),
        ]);
        if (cancelled) return;
        setProjects(projRes.data.projects);
        setCatalogue(skillsRes.data.skills);
      } catch (err) {
        setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSaved = (project) => {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === project.id);
      if (idx === -1) return [project, ...prev];
      const next = [...prev];
      next[idx] = project;
      return next;
    });
    setEditing(null);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/profile/projects/${pendingDelete.id}`);
      setProjects((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      toast.success('Deleted', pendingDelete.title);
    } catch (err) {
      toast.error('Could not delete', err.message);
    }
  };

  const showSkeleton = loading;

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Projects are the strongest evidence of your skills. Link the skills each project demonstrates."
        actions={
          <button className="btn-primary" onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" aria-hidden />
            Add project
          </button>
        }
      />

      <ErrorAlert message={error} />

      {showSkeleton ? (
        <SkeletonCards count={4} columns={2} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects added."
          message="Add your first project — even a small one. Hospital management system? Attendance app? Add it here."
        />
      ) : (
        <ul className="mt-2 grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onEdit={setEditing} onDelete={setPendingDelete} />
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit project' : 'Add project'}
      >
        {editing !== null && (
          <ProjectForm
            initial={editing}
            catalogue={catalogue}
            onCancel={() => setEditing(null)}
            onSaved={handleSaved}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete project?"
        body={pendingDelete ? `“${pendingDelete.title}” will be permanently deleted, along with the skills linked to it.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}
