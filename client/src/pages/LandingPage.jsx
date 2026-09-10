import { Link } from 'react-router-dom';
import {
  ArrowRight, Target, Route, GraduationCap, Building2, LineChart, Sparkles,
  CheckCircle2, ShieldCheck,
} from 'lucide-react';

const capabilities = [
  {
    icon: Sparkles,
    title: 'A profile made of evidence',
    text: 'Skills, assessments, projects, certifications and experience — structured, not a PDF an employer has to interpret.',
  },
  {
    icon: Target,
    title: 'Match scores you can read',
    text: 'Every score breaks down into matched skills, missing skills and strengths. Never a number without a reason.',
  },
  {
    icon: Route,
    title: 'A roadmap, not a rejection',
    text: 'Where you fall short of a role, PathAura names the gap and what closes it.',
  },
  {
    icon: GraduationCap,
    title: 'Learning tied to the gap',
    text: 'Courses, workshops and project ideas attached to the specific skills a role asks for.',
  },
  {
    icon: Building2,
    title: 'Employers see the work',
    text: 'Applications arrive with projects and verified certifications attached, so capability is visible up front.',
  },
  {
    icon: LineChart,
    title: 'Outcomes recorded honestly',
    text: 'Applied, interviewed, hired, retained — reported only when a real person records it.',
  },
];

const steps = [
  { n: '01', title: 'Prove what you can do', text: 'Add your skills, then back them with projects and certifications.' },
  { n: '02', title: 'See where you fit', text: 'Opportunities are scored against your profile, with the reasoning shown.' },
  { n: '03', title: 'Close the gap, then apply', text: 'Learn what is missing, apply with evidence, and track every stage.' },
];

/** A real artifact from the product, not a decorative illustration. */
function MatchPreview() {
  const matched = ['React', 'JavaScript', 'HTML', 'CSS'];
  const missing = ['TypeScript', 'Testing'];
  return (
    <div className="card overflow-hidden shadow-lg">
      <div className="panel-header">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink">Frontend Developer</div>
          <div className="mt-0.5 text-xs text-muted">Kigali · Hybrid · Full-time</div>
        </div>
        <span className="badge-success">
          <ShieldCheck className="h-3 w-3" aria-hidden /> Verified
        </span>
      </div>

      <div className="px-5 py-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="section-label">Match score</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-5xl font-semibold tabular-nums text-ink">87</span>
              <span className="text-lg text-muted">%</span>
            </div>
          </div>
          <div className="text-right text-xs text-muted">
            <div>4 of 6 required skills</div>
            <div className="mt-0.5">2 gaps to close</div>
          </div>
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
          <div className="h-full rounded-full bg-accent" style={{ width: '87%' }} />
        </div>

        <div className="mt-5 space-y-3.5">
          <div>
            <div className="section-label mb-2">Matched</div>
            <div className="flex flex-wrap gap-1.5">
              {matched.map((s) => (
                <span key={s} className="badge-success">
                  <CheckCircle2 className="h-3 w-3" aria-hidden /> {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="section-label mb-2">Missing</div>
            <div className="flex flex-wrap gap-1.5">
              {missing.map((s) => <span key={s} className="badge-warn">{s}</span>)}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-line bg-elevated/40 px-5 py-3 text-2xs text-faint">
        Illustrative example — not a real posting.
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        {/* A single, very quiet radial wash — no gradient soup. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ background: 'radial-gradient(60rem 32rem at 72% -10%, rgb(var(--c-accent)), transparent 70%)' }}
          aria-hidden
        />
        <div className="container-app relative grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="animate-fade-up">
            <span className="chip chip-active cursor-default">
              <span className="status-dot" aria-hidden /> Built in Rwanda, for Rwandan careers
            </span>

            <h1 className="mt-6 text-4xl text-ink text-balance sm:text-5xl lg:text-6xl">
              Turn what you can do into{' '}
              <span className="font-display font-normal italic text-accent">work worth having</span>.
            </h1>

            <p className="mt-5 max-w-xl text-lg text-muted text-pretty">
              PathAura builds a profile from your actual skills, shows exactly how you match each
              opportunity, and tells you what to learn next when you don't.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register" className="btn-primary btn-lg group">
                Create your profile
                <ArrowRight className="h-4 w-4 transition-transform duration-180 group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link to="/jobs" className="btn-secondary btn-lg">Browse opportunities</Link>
            </div>

            <p className="mt-6 text-xs text-faint">
              For job seekers, students, employers, training providers and mentors.
            </p>
          </div>

          <div className="animate-fade-up lg:pl-6" style={{ animationDelay: '80ms' }}>
            <MatchPreview />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-line">
        <div className="container-app py-16 lg:py-20">
          <div className="max-w-2xl">
            <div className="section-label">How it works</div>
            <h2 className="mt-3 text-3xl text-ink text-balance">
              Three steps, and none of them is “upload your CV”.
            </h2>
          </div>

          <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="bg-panel p-6 lg:p-8">
                <span className="font-mono text-xs text-accent">{step.n}</span>
                <h3 className="mt-4 text-base text-ink">{step.title}</h3>
                <p className="mt-2 text-sm text-muted text-pretty">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Capabilities — hairline grid rather than a wall of cards. */}
      <section className="border-b border-line">
        <div className="container-app py-16 lg:py-20">
          <div className="max-w-2xl">
            <div className="section-label">Why it is different</div>
            <h2 className="mt-3 text-3xl text-ink text-balance">More than a job board.</h2>
            <p className="mt-3 text-base text-muted text-pretty">
              A job board lists vacancies. PathAura understands what you can do, verifies it,
              matches it, and shows you the distance to the role you want.
            </p>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, text }) => (
              <div key={title} className="group bg-panel p-6 transition-colors duration-180 hover:bg-elevated/50 lg:p-7">
                <span className="icon-tile icon-tile-accent">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <h3 className="mt-4 text-base text-ink">{title}</h3>
                <p className="mt-2 text-sm text-muted text-pretty">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Employers */}
      <section className="border-b border-line">
        <div className="container-app grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <div className="section-label">For employers</div>
            <h2 className="mt-3 text-3xl text-ink text-balance">
              Hire on demonstrated ability, not on a document.
            </h2>
            <p className="mt-4 text-base text-muted text-pretty">
              Post a role with the skills it genuinely needs. Applications arrive with the
              candidate's projects, certifications and skill overlap already attached — so the
              first review takes minutes, not an afternoon.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Required and preferred skills, each with a minimum level',
                'Applicant evidence next to every application',
                'A pipeline from submitted through to hired, with an honest timeline',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary">Post an opportunity</Link>
              <Link to="/companies" className="btn-secondary">See companies hiring</Link>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="panel-header">
              <span className="text-sm font-semibold text-ink">Applicants</span>
              <span className="badge-muted">3 new</span>
            </div>
            <ul className="divide-y divide-line">
              {[
                { name: 'A. Uwase', role: 'Junior Frontend Developer', matched: 5, total: 6, status: 'Shortlisted', tone: 'badge-info' },
                { name: 'J. Habimana', role: 'Junior Frontend Developer', matched: 4, total: 6, status: 'Under review', tone: 'badge-neutral' },
                { name: 'C. Mukamana', role: 'Data Analysis Intern', matched: 5, total: 5, status: 'Interview', tone: 'badge-info' },
              ].map((row) => (
                <li key={row.name} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">{row.name}</div>
                    <div className="mt-0.5 truncate text-xs text-muted">{row.role}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs tabular-nums text-muted">{row.matched}/{row.total} skills</span>
                    <span className={row.tone}>{row.status}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line bg-elevated/40 px-5 py-3 text-2xs text-faint">
              Illustrative example — not real candidates.
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section>
        <div className="container-app py-16 lg:py-20">
          <div className="card flex flex-col items-start justify-between gap-6 px-7 py-8 sm:flex-row sm:items-center lg:px-10 lg:py-10">
            <div>
              <h2 className="text-2xl text-ink text-balance">Start with one skill you can prove.</h2>
              <p className="mt-2 max-w-lg text-sm text-muted text-pretty">
                Building a profile takes a few minutes. Everything after that — matches, gaps,
                roadmap — follows from it.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link to="/register" className="btn-primary btn-lg">Create profile</Link>
              <Link to="/login" className="btn-secondary btn-lg">Log in</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
