function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic tint per person, drawn from a small on-brand set rather than a
// random colour, so the same user always looks the same.
const TINTS = [
  'bg-accent-soft text-accent',
  'bg-info-bg text-info',
  'bg-success-bg text-success',
  'bg-warn-bg text-warn',
];

const SIZES = {
  sm: 'h-7 w-7 text-2xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
};

export default function Avatar({ name, size = 'md', className = '' }) {
  const key = String(name || '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const tint = TINTS[key % TINTS.length];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${SIZES[size]} ${tint} ${className}`}
      title={name}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
