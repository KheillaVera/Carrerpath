/**
 * Segmented control for small, mutually exclusive filters — quieter than a row
 * of buttons and clearer than a select when there are only a few options.
 */
export default function Segmented({ options, value, onChange, ariaLabel, size = 'md' }) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-md border border-line bg-elevated/70 p-0.5"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value ?? option.label}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`relative rounded font-medium transition-all duration-120 ease-out ${pad} ${
              active
                ? 'bg-panel text-ink shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            {option.label}
            {option.count != null && (
              <span className={`ml-1.5 tabular-nums ${active ? 'text-muted' : 'text-faint'}`}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
