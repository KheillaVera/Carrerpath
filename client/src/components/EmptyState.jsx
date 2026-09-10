/**
 * Empty states explain what the space is for and give one obvious next action,
 * rather than only stating that nothing is here.
 */
export default function EmptyState({ icon: Icon, title, message, action, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong
                  bg-panel/50 text-center ${compact ? 'px-6 py-8' : 'px-6 py-14'}`}
    >
      {Icon && (
        <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-elevated text-muted">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      )}
      <div className="text-sm font-medium text-ink">{title}</div>
      {message && <p className="mt-1.5 max-w-sm text-sm text-muted text-pretty">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
