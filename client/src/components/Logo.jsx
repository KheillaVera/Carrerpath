/**
 * The PathAura mark: an ascending path drawn inside a rounded square. Rendered as
 * inline SVG so it inherits the current theme rather than shipping two bitmaps.
 */
export function LogoMark({ className = 'h-7 w-7' }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md bg-accent text-accent-contrast ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[62%] w-[62%]">
        <path
          d="M4 19c3.6 0 4.6-5.5 7.2-5.5 1.7 0 2.1 2.2 3.4 2.2 2 0 2.4-6.7 5.4-10.2"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="19.6" cy="5.2" r="1.9" fill="currentColor" />
      </svg>
    </span>
  );
}

export default function Logo({ compact = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      {!compact && (
        <span className="text-[0.9375rem] font-semibold tracking-[-0.02em] text-ink">
          PathAura
        </span>
      )}
    </span>
  );
}
