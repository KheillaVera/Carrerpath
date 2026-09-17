const BANDS = {
  strong: { label: 'Strong match', text: 'text-success', ring: 'rgb(var(--c-success))' },
  good: { label: 'Good match', text: 'text-accent', ring: 'rgb(var(--c-accent))' },
  partial: { label: 'Partial match', text: 'text-warn', ring: 'rgb(var(--c-warn))' },
  early: { label: 'Early match', text: 'text-muted', ring: 'rgb(var(--c-faint))' },
};

const SIZES = {
  sm: { box: 40, stroke: 3.5, text: 'text-[0.6875rem]' },
  md: { box: 56, stroke: 4, text: 'text-sm' },
  lg: { box: 88, stroke: 5, text: 'text-xl' },
};

/**
 * The match score as a ring. The number is always paired with its band label,
 * because a bare percentage invites the reader to treat it as a verdict.
 */
export default function MatchScore({ score, band = 'good', size = 'md', showLabel = false }) {
  const config = BANDS[band] || BANDS.good;
  const { box, stroke, text } = SIZES[size] || SIZES.md;
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.max(0, Math.min(100, score)) / 100;

  return (
    <div className="inline-flex items-center gap-2.5">
      <div className="relative shrink-0" style={{ width: box, height: box }}>
        <svg width={box} height={box} className="-rotate-90" aria-hidden>
          <circle
            cx={box / 2} cy={box / 2} r={radius}
            fill="none" stroke="rgb(var(--c-elevated))" strokeWidth={stroke}
          />
          <circle
            cx={box / 2} cy={box / 2} r={radius}
            fill="none" stroke={config.ring} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - filled)}
            style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center font-semibold tabular-nums ${text} ${config.text}`}
        >
          {score}
          <span className="text-[0.65em] font-normal">%</span>
        </span>
      </div>
      {showLabel && (
        <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
      )}
      <span className="sr-only">{score}% — {config.label}</span>
    </div>
  );
}

/** Compact inline form for lists and table rows. */
export function MatchBadge({ score, band = 'good' }) {
  const config = BANDS[band] || BANDS.good;
  return (
    <span className={`badge bg-elevated ${config.text} tabular-nums`} title={config.label}>
      <span className="status-dot" aria-hidden />
      {score}% match
    </span>
  );
}
