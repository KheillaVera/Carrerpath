import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from './Modal';

/**
 * Replaces window.confirm for destructive actions: themed, keyboard accessible,
 * and able to show progress while the action runs.
 *
 * Usage: const confirm = useConfirm(); … if (await confirm({ title, body })) …
 * is deliberately not offered — the explicit component keeps the pending state
 * visible in the calling screen.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
}) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm?.();
      onClose?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3">
        {tone === 'danger' && (
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-danger-bg text-danger">
            <AlertTriangle className="h-4 w-4" aria-hidden />
          </span>
        )}
        <p className="text-sm text-muted text-pretty">{body}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={tone === 'danger' ? 'btn-danger' : 'btn-primary'}
          onClick={handleConfirm}
          disabled={busy}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
