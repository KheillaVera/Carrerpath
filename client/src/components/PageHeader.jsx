/**
 * The standard page opening: optional eyebrow, title, one line of context and
 * the page's primary actions. Every screen uses this so headings, spacing and
 * the divider below them stay identical across the product.
 */
export default function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <header className="mb-6 border-b border-line pb-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
          <h1 className="text-2xl text-ink">{title}</h1>
          {description && (
            <p className="mt-1.5 max-w-prose text-sm text-muted text-pretty">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}
