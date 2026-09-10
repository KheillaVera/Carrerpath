/**
 * A single metric. Deliberately quiet: label, number, one line of context — no
 * icon tile per stat, no coloured background, no chart in a box.
 */
export default function StatTile({ label, value, hint, icon: Icon, tone = 'default' }) {
  const valueTone = tone === 'accent' ? 'text-accent' : 'text-ink';
  return (
    <div className="card px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="section-label">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 text-faint" aria-hidden />}
      </div>
      <div className={`mt-2 text-3xl font-semibold tabular-nums ${valueTone}`}>{value}</div>
      {hint && <div className="mt-1.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}
