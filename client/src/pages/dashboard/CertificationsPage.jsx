import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Award, Plus, Pencil, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { SkeletonCards } from '../../components/Skeleton';
import ErrorAlert from '../../components/ErrorAlert';
import Modal from '../../components/Modal';

const STATUS_STYLE = {
  pending: 'badge-warn',
  verified: 'badge-success',
  rejected: 'badge-danger',
};

function CertificationForm({ initial, onCancel, onSaved }) {
  const editing = !!initial?.id;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: initial?.name || '',
      issuer: initial?.issuer || '',
      issueDate: initial?.issueDate || '',
      expiryDate: initial?.expiryDate || '',
      credentialId: initial?.credentialId || '',
      verificationUrl: initial?.verificationUrl || '',
    },
  });
  const [error, setError] = useState(null);

  const onSubmit = async (values) => {
    setError(null);
    try {
      const payload = { ...values };
      for (const key of ['issueDate', 'expiryDate']) {
        if (!payload[key]) payload[key] = null;
      }
      const { data } = editing
        ? await api.patch(`/profile/certifications/${initial.id}`, payload)
        : await api.post('/profile/certifications', payload);
      onSaved(data.item);
    } catch (err) {
      setError(err.details?.[0]?.message || err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="label" htmlFor="name">Certification name</label>
        <input id="name" className="input" {...register('name', { required: 'Name is required.' })} />
        {errors.name && <p className="field-error">{errors.name.message}</p>}
      </div>
      <div>
        <label className="label" htmlFor="issuer">Issuing organization</label>
        <input id="issuer" className="input" {...register('issuer', { required: 'Issuer is required.' })} />
        {errors.issuer && <p className="field-error">{errors.issuer.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="issueDate">Issue date</label>
          <input id="issueDate" type="date" className="input" {...register('issueDate')} />
        </div>
        <div>
          <label className="label" htmlFor="expiryDate">Expiry date</label>
          <input id="expiryDate" type="date" className="input" {...register('expiryDate')} />
        </div>
        <div>
          <label className="label" htmlFor="credentialId">Credential ID</label>
          <input id="credentialId" className="input" {...register('credentialId')} />
        </div>
        <div>
          <label className="label" htmlFor="verificationUrl">Verification URL</label>
          <input id="verificationUrl" className="input" placeholder="https://…" {...register('verificationUrl')} />
        </div>
      </div>
      <p className="text-xs text-muted">
        Editing a certification resets its status to "pending" — verification is done by an administrator.
      </p>

      <ErrorAlert message={error} />

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {editing ? 'Save changes' : 'Add certification'}
        </button>
      </div>
    </form>
  );
}

export default function CertificationsPage() {
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
        const { data } = await api.get('/profile/certifications');
        if (!cancelled) setItems(data.certifications);
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
      await api.delete(`/profile/certifications/${pendingDelete.id}`);
      setItems((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      toast.success('Deleted', pendingDelete.name);
    } catch (err) {
      toast.error('Could not delete', err.message);
    }
  };

  const showSkeleton = loading;

  return (
    <div>
      <PageHeader
        title="Certifications"
        description="Formal certifications you have earned. Admins verify them independently before they appear as verified."
        actions={
          <button className="btn-primary" onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" aria-hidden />
            Add certification
          </button>
        }
      />
      <ErrorAlert message={error} />

      {showSkeleton ? (
        <SkeletonCards count={3} columns={1} />
      ) : items.length === 0 ? (
        <EmptyState icon={Award} title="No certifications added yet" message="Add certifications you have earned. They will show as pending until verified." />
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id} className="card card-body flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-ink">{it.name}</span>
                  <span className={STATUS_STYLE[it.status] || 'badge-muted'}>{it.status}</span>
                </div>
                <div className="text-sm text-ink-soft">{it.issuer}</div>
                <div className="text-xs text-muted mt-0.5">
                  {it.issueDate ? <>Issued {it.issueDate}</> : 'Issue date not set'}
                  {it.expiryDate && <> · Expires {it.expiryDate}</>}
                  {it.credentialId && <> · ID {it.credentialId}</>}
                </div>
                {it.verificationUrl && (
                  <a href={it.verificationUrl} target="_blank" rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Verification link
                  </a>
                )}
              </div>
              <div className="flex gap-1">
                <button className="btn-ghost p-1.5" onClick={() => setEditing(it)} aria-label="Edit"><Pencil className="h-4 w-4" aria-hidden /></button>
                <button className="btn-ghost p-1.5 text-muted hover:text-danger" onClick={() => setPendingDelete(it)} aria-label="Delete"><Trash2 className="h-4 w-4" aria-hidden /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? 'Edit certification' : 'Add certification'}>
        {editing !== null && <CertificationForm initial={editing} onCancel={() => setEditing(null)} onSaved={handleSaved} />}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete certification?"
        body={pendingDelete ? `“${pendingDelete.name}” from ${pendingDelete.issuer} will be permanently deleted.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}
