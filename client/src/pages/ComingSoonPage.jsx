import { Link } from 'react-router-dom';
import { ArrowLeft, Hammer } from 'lucide-react';

/**
 * Placeholder for a feature that belongs to a later build phase. It says which
 * phase and offers somewhere useful to go, rather than being a dead end.
 */
export default function ComingSoonPage({ title, message }) {
  return (
    <div className="container-app py-16 lg:py-24">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-elevated text-muted">
          <Hammer className="h-5 w-5" aria-hidden />
        </span>
        <h1 className="mt-6 text-2xl text-ink text-balance">{title}</h1>
        <p className="mt-3 text-base text-muted text-pretty">
          {message || 'This part of PathAura is still being built. It will appear here once its phase lands.'}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/jobs" className="btn-primary">Browse opportunities</Link>
          <Link to="/" className="btn-secondary">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
