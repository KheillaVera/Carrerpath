import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { GraduationCap, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { SkeletonCards } from '../../components/Skeleton';
import ErrorAlert from '../../components/ErrorAlert';
import Modal from '../../components/Modal';

function EducationForm({ initial, onCancel, onSaved }) {
  const editing = !!initial?.id;
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      institution: initial?.institution || '',
      qualification: initial?.qualification || '',
      fieldOfStudy: initial?.fieldOfStudy || '',
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
        ? await api.patch(`/profile/education/${initial.id}`, payload)
        : await api.post('/profile/education', payload);
      onSaved(data.item);
    } catch (err) {
      setError(err.details?.[0]?.message || err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="label" htmlFor="institution">Institution</label>
        <input id="institution" className="input" {...register('institution', { required: 'Institution is required.' })} />
        {errors.institution && <p className="field-error">{errors.institution.message}</p>}
      </div>
      <div>
        <label className="label" htmlFor="qualification">Qualification</label>
        <input id="qualification" className="input" placeholder="Diploma, Bachelor's, Certificate…"
          {...register('qualification', { required: 'Qualification is required.' })} />
        {errors.qualification && <p className="field-error">{errors.qualification.message}</p>}
      </div>
      <div>
        <label className="label" htmlFor="fieldOfStudy">Field of study</label>
        <input id="fieldOfStudy" className="input" placeholder="Software Programming" {...register('fieldOfStudy')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
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
        Currently studying here
      </label>
      <div>
        <label className="label" htmlFor="description">Description (optional)</label>
        <textarea id="description" rows={3} className="input" {...register('description')} />
      </div>

      <ErrorAlert message={error} />

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {editing ? 'Save changes' : 'Add education'}
        </button>
      </div>
    </form>
  );
}

export default function EducationPage() {
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
        const { data } = await api.get('/profile/education');
        if (!cancelled) setItems(data.education);
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
      await api.delete(`/profile/education/${pendingDelete.id}`);
      setItems((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      toast.success('Deleted', pendingDelete.qualification);
    } catch (err) {
      toast.error('Could not delete', err.message);
    }
  };

  const showSkeleton = loading;

  return (
    <div>
      <PageHeader
        title="Education"
        description="Where you have studied. Diplomas, degrees, bootcamps, certificates."
        actions={
          <button className="btn-primary" onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" aria-hidden />
            Add education
          </button>
        }
      />
      <ErrorAlert message={error} />

      {showSkeleton ? (
        <SkeletonCards count={3} columns={1} />
      ) : items.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No education added yet" message="Add your qualifications so employers understand your background." />
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id} className="card card-body flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold text-ink">{it.qualification}</div>
                <div className="text-sm text-ink-soft">{it.institution}</div>
                <div className="text-xs text-muted mt-0.5">
                  {it.fieldOfStudy && <>{it.fieldOfStudy} · </>}
                  {it.startDate || '—'} → {it.isCurrent ? 'Present' : it.endDate || '—'}
                </div>
                {it.description && <p className="mt-2 text-sm text-muted">{it.description}</p>}
              </div>
              <div className="flex gap-1">
                <button className="btn-ghost p-1.5" onClick={() => setEditing(it)} aria-label="Edit"><Pencil className="h-4 w-4" aria-hidden /></button>
                <button className="btn-ghost p-1.5 text-muted hover:text-danger" onClick={() => setPendingDelete(it)} aria-label="Delete"><Trash2 className="h-4 w-4" aria-hidden /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? 'Edit education' : 'Add education'}>
        {editing !== null && <EducationForm initial={editing} onCancel={() => setEditing(null)} onSaved={handleSaved} />}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete education entry?"
        body={pendingDelete ? `“${pendingDelete.qualification} — ${pendingDelete.institution}” will be permanently deleted.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}
