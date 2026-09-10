/**
 * One place that decides how every status in the product looks. Application
 * stages, posting states, verification and interviews all resolve here, so the
 * same state never appears in two different colours on two different screens.
 */
const STATUS = {
  // Applications
  submitted: { label: 'Submitted', className: 'badge-neutral' },
  under_review: { label: 'Under review', className: 'badge-neutral' },
  shortlisted: { label: 'Shortlisted', className: 'badge-info' },
  interview: { label: 'Interview', className: 'badge-info' },
  offered: { label: 'Offer', className: 'badge-success' },
  hired: { label: 'Hired', className: 'badge-success' },
  rejected: { label: 'Not selected', className: 'badge-danger' },
  withdrawn: { label: 'Withdrawn', className: 'badge-muted' },

  // Job postings
  draft: { label: 'Draft', className: 'badge-muted' },
  published: { label: 'Published', className: 'badge-success' },
  closed: { label: 'Closed', className: 'badge-warn' },
  archived: { label: 'Archived', className: 'badge-muted' },

  // Verification / certifications
  pending: { label: 'Pending', className: 'badge-warn' },
  verified: { label: 'Verified', className: 'badge-success' },

  // Interviews
  scheduled: { label: 'Scheduled', className: 'badge-neutral' },
  completed: { label: 'Completed', className: 'badge-success' },
  cancelled: { label: 'Cancelled', className: 'badge-muted' },
};

export function statusLabel(status) {
  return STATUS[status]?.label || String(status || '').replace(/_/g, ' ');
}

export default function StatusPill({ status, label, withDot = true, className = '' }) {
  const config = STATUS[status] || { label: statusLabel(status), className: 'badge-muted' };
  return (
    <span className={`${config.className} ${className}`}>
      {withDot && <span className="status-dot" aria-hidden />}
      {label || config.label}
    </span>
  );
}
