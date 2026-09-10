import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const POINTS = [
  'A profile built from skills, projects and certifications',
  'Match scores that show their own reasoning',
  'Named skill gaps, and what closes them',
  'Every application tracked to an honest outcome',
];

/**
 * Shared frame for log in and sign up: the form on the left, a quiet brand panel
 * on the right that collapses away below `lg` so the form owns small screens.
 */
export default function AuthLayout({ title, description, children, footer }) {
  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-2">
      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link to="/" aria-label="PathAura home"><Logo /></Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16 sm:px-10">
          <div className="w-full max-w-[26rem] animate-fade-up">
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to site
            </Link>

            <h1 className="text-2xl text-ink">{title}</h1>
            {description && <p className="mt-2 text-sm text-muted text-pretty">{description}</p>}

            <div className="mt-7">{children}</div>

            {footer && <div className="mt-7 border-t border-line pt-5 text-sm text-muted">{footer}</div>}
          </div>
        </div>
      </div>

      {/* Brand panel — decorative, so it is hidden from assistive technology. */}
      <div className="relative hidden overflow-hidden border-l border-line bg-panel lg:block">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ background: 'radial-gradient(40rem 28rem at 80% 15%, rgb(var(--c-accent)), transparent 65%)' }}
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <div />
          <div>
            <p className="max-w-md text-3xl text-ink text-balance">
              From learning a skill to{' '}
              <span className="font-display font-normal italic text-accent">getting work</span>.
            </p>
            <ul className="mt-9 space-y-3.5">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-faint">
            PathAura · Demonstration project · Kigali, Rwanda
          </p>
        </div>
      </div>
    </div>
  );
}
