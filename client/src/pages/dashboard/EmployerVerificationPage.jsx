import { useCallback, useEffect, useState } from 'react';
import { Building2, ExternalLink, Loader2, RotateCcw, ShieldCheck, ShieldX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import ErrorAlert from '../../components/ErrorAlert';
import Segmented from '../../components/Segmented';
import StatusPill from '../../components/StatusPill';
import Avatar from '../../components/Avatar';
import Modal from '../../components/Modal';
import { SkeletonTable } from '../../components/Skeleton';

const FILTERS = [
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
  { value: '', label: 'All' },
];

function DecisionDialog({ company, decision, onClose, onDone }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const labels = {
    verified: { title: 'Verify company', action: 'Verify', hint: 'Their postings will carry a verified badge.' },
    rejected: { title: 'Reject verification', action: 'Reject', hint: 'They can still post, labelled as unverified.' },
    pending: { title: 'Reset to pending', action: 'Reset', hint: 'The company returns to the review queue.' },
  }[decision] || {};

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.patch(`/admin/companies/${company.id}/verification`, {
        status: decision,
        note,
      });
      onDone(data.company);
    } catch (err) {
      setError(err.details?.[0]?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={labels.title} description={company.name} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted">{labels.hint}</p>
        <div>
          <label className="label" htmlFor="note">Note (optional)</label>
          <textarea
            id="note"
            rows={3}
            className="input"
            placeholder="What you checked, or why this was rejected."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <p className="hint">The company owner sees this note on their company page.</p>
        </div>
        <ErrorAlert message={error} />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className={decision === 'rejected' ? 'btn-danger' : 'btn-primary'} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {labels.action}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function EmployerVerificationPage() {
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [decision, setDecision] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/companies', { params: status ? { status } : {} });
      setCompanies(data.companies);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const handleDone = (updated) => {
    toast.success('Verification updated', `${updated.name} → ${updated.verificationStatus}`);
    setDecision(null);
    if (status && updated.verificationStatus !== status) {
      setCompanies((prev) => prev.filter((c) => c.id !== updated.id));
    } else {
      setCompanies((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    }
  };

  return (
    <div>
      <PageHeader
        title="Employer verification"
        description="Verified companies carry a badge on their postings. Unverified companies can still post — their listings are labelled rather than hidden."
      >
        <Segmented ariaLabel="Filter by verification status" value={status} onChange={setStatus} options={FILTERS} />
      </PageHeader>

      <ErrorAlert message={error} className="mb-4" />

      {loading ? (
        <SkeletonTable rows={4} columns={4} />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nothing to review"
          message={status === 'pending'
            ? 'Every company has been reviewed. New registrations will appear here.'
            : 'No companies match this filter.'}
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Company</th>
                <th scope="col" className="hidden md:table-cell">Owner</th>
                <th scope="col" className="hidden sm:table-cell">Postings</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={company.name} size="sm" />
                      <div className="min-w-0">
                        <div className="cell-primary flex items-center gap-1.5">
                          <span className="truncate">{company.name}</span>
                          <Link
                            to={`/companies/${company.slug}`}
                            target="_blank"
                            className="text-faint transition-colors hover:text-accent"
                            aria-label={`Open ${company.name} public page`}
                          >
                            <ExternalLink className="h-3 w-3" aria-hidden />
                          </Link>
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted">
                          {company.industry || 'Industry not set'}
                          {company.location && <> · {company.location}</>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell">
                    <div className="min-w-0">
                      <div className="truncate text-sm">{company.ownerName}</div>
                      <div className="mt-0.5 truncate text-xs text-muted">{company.ownerEmail}</div>
                    </div>
                  </td>
                  <td className="hidden tabular-nums sm:table-cell">{company.postingsCount}</td>
                  <td><StatusPill status={company.verificationStatus} /></td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      {company.verificationStatus !== 'verified' && (
                        <button className="btn-secondary btn-sm" onClick={() => setDecision({ company, decision: 'verified' })}>
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Verify
                        </button>
                      )}
                      {company.verificationStatus !== 'rejected' && (
                        <button
                          className="btn-ghost btn-icon btn-sm text-muted hover:text-danger"
                          onClick={() => setDecision({ company, decision: 'rejected' })}
                          aria-label={`Reject ${company.name}`}
                          title="Reject"
                        >
                          <ShieldX className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                      {company.verificationStatus !== 'pending' && (
                        <button
                          className="btn-ghost btn-icon btn-sm"
                          onClick={() => setDecision({ company, decision: 'pending' })}
                          aria-label={`Reset ${company.name} to pending`}
                          title="Reset to pending"
                        >
                          <RotateCcw className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {decision && (
        <DecisionDialog
          company={decision.company}
          decision={decision.decision}
          onClose={() => setDecision(null)}
          onDone={handleDone}
        />
      )}
    </div>
  );
}
