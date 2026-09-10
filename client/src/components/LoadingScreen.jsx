import { Loader2 } from 'lucide-react';

/**
 * Full-area spinner. Prefer a skeleton that matches the incoming layout; this is
 * for cases where the shape of the content is not known ahead of time.
 */
export default function LoadingScreen({ label = 'Loading…', className = '' }) {
  return (
    <div
      className={`flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin text-accent" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}
