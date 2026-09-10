import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Briefcase, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { SkeletonCards } from '../../components/Skeleton';
import ErrorAlert from '../../components/ErrorAlert';
import Modal from '../../components/Modal';

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'contract', label: 'Contract' },
  { value: 'volunteer', label: 'Volunteer' },
];

function labelFor(v) {
  return EMPLOYMENT_TYPES.find((t) => t.value === v)?.label || v;
}

function ExperienceForm({ initial, onCancel, onSaved }) {
  const editing = !!initial?.id;
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      company: initial?.company || '',
      role: initial?.role || '',
      employmentType: initial?.employmentType || 'full_time',
      location: initial?.location || '',
      startDate: initial?.startDate || '',
      endDate: initial?.endDate || '',
      isCurrent: !!initial?.isCurrent,
      description: initial?.description || '',
    },
  });
  const [error, setError] = useState(null);
  const isCurrent = watch('isCurrent');

  const onSubmit = async (values) => {
    setError(null);
    try {
      const payload = { ...values };
      if (payload.isCurrent) payload.endDate = null;
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) payload.endDate = null;
      const { data } = editing
        ? await api.patch(`/profile/experience/${initial.id}`, payload)
        : await api.post('/profile/experience', payload);
      onSaved(data.item);
    } catch (err) {
      setError(err.details?.[0]?.message || err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="company">Company</label>
          <input id="company" className="input" {...register('company', { required: 'Company is required.' })} />
          {errors.company && <p className="field-error">{errors.company.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="role">Role</label>
          <input id="role" className="input" {...register('role', { required: 'Role is required.' })} />
          {errors.role && <p className="field-error">{errors.role.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="employmentType">Type</label>
          <select id="employmentType" className="input" {...register('employmentType')}>
            {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="location">Location</label>
          <input id="location" className="input" placeholder="Kigali" {...register('location')} />
        </div>
        <div>
          <label className="label" htmlFor="startDate">Start date</label>
          <input id="startDate" type="date" className="input" {...register('startDate')} />
        </div>
        <div>
          <label className="label" htmlFor="endDate">End date</label>
          <input id="endDate" type="date" className="input" disabled={isCurrent} {...register('endDate')} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" {...register('isCurrent')} />
        I currently work here
      </label>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" rows={4} className="input"
          placeholder="What you did, what you built, what you learned."
          {...register('description')} />
      </div>

      <ErrorAlert message={error} />

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {editing ? 'Save changes' : 'Add experience'}
        </button>
      </div>
    </form>
  );
}

export default function ExperiencePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/profile/experience');
        if (!cancelled) setItems(data.experience);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSaved = (item) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      if (idx === -1) return [item, ...prev];
      const next = [...prev];
      next[idx] = item;
      return next;
    });
    setEditing(null);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/profile/experience/${pendingDelete.id}`);
      setItems((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      toast.success('Deleted', pendingDelete.role);
    } catch (err) {
      toast.error('Could not delete', err.message);
    }
  };

  const showSkeleton = loading;

  return (
    <div>
      <PageHeader
        title="Experience"
        description="Jobs, internships, freelance work — anything that shows you have applied your skills."
        actions={
          <button className="btn-primary" onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" aria-hidden />
            Add experience
          </button>
        }
      />
      <ErrorAlert message={error} />

      {showSkeleton ? (
        <SkeletonCards count={3} columns={1} />
      ) : items.length === 0 ? (
        <EmptyState icon={Briefcase} title="No experience added yet" message="Add your first role — even internships or volunteer work count." />
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id} className="card card-body flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold text-ink">{it.role} <span className="text-muted font-normal">· {it.company}</span></div>
                <div className="text-xs text-muted mt-0.5">
                  {labelFor(it.employmentType)}{it.location && <> · {it.location}</>} · {it.startDate || '—'} → {it.isCurrent ? 'Present' : it.endDate || '—'}
                </div>
                {it.description && <p className="mt-2 text-sm text-muted whitespace-pre-wrap">{it.description}</p>}
              </div>
              <div className="flex gap-1">
                <button className="btn-ghost p-1.5" onClick={() => setEditing(it)} aria-label="Edit"><Pencil className="h-4 w-4" aria-hidden /></button>
                <button className="btn-ghost p-1.5 text-muted hover:text-danger" onClick={() => setPendingDelete(it)} aria-label="Delete"><Trash2 className="h-4 w-4" aria-hidden /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? 'Edit experience' : 'Add experience'}>
        {editing !== null && <ExperienceForm initial={editing} onCancel={() => setEditing(null)} onSaved={handleSaved} />}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete experience entry?"
        body={pendingDelete ? `“${pendingDelete.role} at ${pendingDelete.company}” will be permanently deleted.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}
