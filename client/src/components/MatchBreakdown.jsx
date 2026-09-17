import { Link } from 'react-router-dom';
import { BadgeCheck, CheckCircle2, FolderKanban, Minus, TrendingUp, X } from 'lucide-react';
import MatchScore from './MatchScore';

/**
 * Shows the reasoning behind a match score.
 *
 * Specification §23: the score is never a black box. Every component that fed
 * into it is listed with its own contribution, and the gaps are expressed as
 * actions the candidate can take rather than as reasons they were rejected.
 */
export default function MatchBreakdown({ match, showActions = true }) {
  if (!match) return null;

  const { matched = [], partial = [], missing = [] } = match.skills || {};

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-5">
        <MatchScore score={match.score} band={match.band} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-soft text-pretty">{match.summary}</p>
          <p className="mt-2 text-xs text-muted">
            Calculated from your recorded skills, experience and education — nothing else.
          </p>
        </div>
      </div>

      {/* What produced the number */}
      <section>
        <h3 className="section-label mb-3">How this score is made up</h3>
        <ul className="space-y-2.5">
          {match.components.map((component) => (
            <li key={component.key}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="text-ink-soft">
                  {component.label}
                  <span className="text-faint"> · {component.weight}% of the score</span>
                </span>
                <span className="font-medium tabular-nums text-ink">{component.score}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
                  style={{ width: `${component.score}%` }}
                />
              </div>
              <div className="mt-1 text-2xs text-muted">{component.detail}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* Skills, grouped by whether they were met */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div>
          <h3 className="section-label mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden /> Met ({matched.length})
          </h3>
          <ul className="space-y-1">
            {matched.map((skill) => (
              <li key={skill.skillId} className="flex items-center gap-1.5 text-xs text-ink-soft">
                <span className="truncate">{skill.name}</span>
                {skill.verified && <BadgeCheck className="h-3 w-3 shrink-0 text-success" aria-label="Verified by assessment" />}
                {!skill.verified && skill.projectCount > 0 && (
                  <FolderKanban className="h-3 w-3 shrink-0 text-faint" aria-label="Backed by a project" />
                )}
              </li>
            ))}
            {matched.length === 0 && <li className="text-xs text-faint">None yet.</li>}
          </ul>
        </div>

        <div>
          <h3 className="section-label mb-2 flex items-center gap-1.5">
            <Minus className="h-3.5 w-3.5 text-warn" aria-hidden /> Close ({partial.length})
          </h3>
          <ul className="space-y-1">
            {partial.map((skill) => (
              <li key={skill.skillId} className="text-xs text-ink-soft">
                <span className="truncate">{skill.name}</span>
                <span className="text-faint"> · {skill.candidateLevel} vs {skill.minLevel}</span>
              </li>
            ))}
            {partial.length === 0 && <li className="text-xs text-faint">None.</li>}
          </ul>
        </div>

        <div>
          <h3 className="section-label mb-2 flex items-center gap-1.5">
            <X className="h-3.5 w-3.5 text-danger" aria-hidden /> Missing ({missing.length})
          </h3>
          <ul className="space-y-1">
            {missing.map((skill) => (
              <li key={skill.skillId} className="text-xs text-ink-soft">
                <span className="truncate">{skill.name}</span>
                <span className="text-faint"> · {skill.minLevel}</span>
              </li>
            ))}
            {missing.length === 0 && <li className="text-xs text-faint">None.</li>}
          </ul>
        </div>
      </section>

      {/* Strengths worth leading with */}
      {match.strengths?.length > 0 && (
        <section className="rounded-md border border-success-line bg-success-bg px-3.5 py-3">
          <h3 className="text-xs font-semibold text-success">Your strongest evidence</h3>
          <ul className="mt-1.5 space-y-1">
            {match.strengths.map((strength) => (
              <li key={strength.skillId} className="text-xs text-success">
                <span className="font-medium">{strength.name}</span> — {strength.reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The actionable half: what closes the distance */}
      {match.gaps?.length > 0 && (
        <section>
          <h3 className="section-label mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-accent" aria-hidden /> What would raise this score
          </h3>
          <ol className="space-y-2">
            {match.gaps.slice(0, 4).map((gap, index) => (
              <li
                key={gap.skillId}
                className="flex items-start gap-2.5 rounded-md border border-line px-3 py-2"
              >
                <span className="mt-0.5 font-mono text-2xs text-faint">{String(index + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-ink">{gap.action}</div>
                  <div className="mt-0.5 text-2xs text-muted">
                    {gap.status === 'missing' ? 'Not on your profile yet' : `Currently ${gap.currentLevel}`}
                    {' · '}weight {gap.weight} of 5 for this role
                  </div>
                </div>
                {showActions && (
                  <Link to="/app/assessments" className="btn-ghost btn-sm shrink-0">
                    Assess
                  </Link>
                )}
              </li>
            ))}
          </ol>
          {showActions && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/app/skills" className="btn-secondary btn-sm">Update my skills</Link>
              <Link to="/app/projects" className="btn-ghost btn-sm">Add a project as evidence</Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
