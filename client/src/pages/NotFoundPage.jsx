import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import Logo from '../components/Logo';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="container-app py-6">
        <Link to="/" aria-label="PathAura home"><Logo /></Link>
      </div>

      <div className="container-app flex flex-1 items-center justify-center pb-24">
        <div className="max-w-md text-center animate-fade-up">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-lg border border-line bg-elevated text-muted">
            <Compass className="h-5 w-5" aria-hidden />
          </span>
          <p className="mt-6 font-mono text-xs tracking-widest text-accent">404</p>
          <h1 className="mt-2 text-3xl text-ink text-balance">This page took a different path.</h1>
          <p className="mt-3 text-base text-muted text-pretty">
            The page you were looking for does not exist, or it may have moved.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn-primary">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back home
            </Link>
            <Link to="/jobs" className="btn-secondary">Browse opportunities</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
