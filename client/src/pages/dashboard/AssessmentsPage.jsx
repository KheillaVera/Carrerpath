import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award, BadgeCheck, CheckCircle2, ChevronLeft, ChevronRight, Clock,
  Loader2, RotateCcw, Timer, XCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import ErrorAlert from '../../components/ErrorAlert';
import Modal from '../../components/Modal';
import Segmented from '../../components/Segmented';
import { SkeletonCards } from '../../components/Skeleton';

const LEVEL_BADGE = {
  beginner: 'badge-muted',
  elementary: 'badge-muted',
  intermediate: 'badge-info',
  advanced: 'badge-info',
  expert: 'badge-success',
};

function formatClock(seconds) {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Counts down to the attempt's deadline and submits when it runs out. */
function useCountdown(expiresAt, onExpire) {
  const [remaining, setRemaining] = useState(null);
  const fired = useRef(false);

  useEffect(() => {
    if (!expiresAt) return undefined;
    const deadline = new Date(String(expiresAt).replace(' ', 'T')).getTime();

    const tick = () => {
      const left = Math.round((deadline - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0 && !fired.current) {
        fired.current = true;
        onExpire?.();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  return remaining;
}

function AttemptRunner({ session, onFinished, onCancel }) {
  const { assessment, questions, attempt } = session;
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = useCallback(async (auto = false) => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = questions.map((question) => ({
        questionId: question.id,
        selectedOptionIds: answers[question.id] || [],
      }));
      const { data } = await api.post(`/assessments/attempts/${attempt.id}/submit`, { answers: payload });
      onFinished(data, auto);
    } catch (err) {
      setError(err.details?.[0]?.message || err.message);
      setSubmitting(false);
    }
  }, [answers, questions, attempt.id, onFinished]);

  const remaining = useCountdown(attempt.expiresAt, () => submit(true));
  const question = questions[index];
  const answered = Object.values(answers).filter((v) => v.length > 0).length;
  const isMulti = question.questionType === 'multiple_choice';

  const toggle = (optionId) => {
    setAnswers((prev) => {
      const current = prev[question.id] || [];
      if (isMulti) {
        return {
          ...prev,
          [question.id]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      }
      return { ...prev, [question.id]: [optionId] };
    });
  };

  const selected = answers[question.id] || [];
  const low = remaining !== null && remaining <= 60;

  return (
    <div>
      {/* Progress and time remaining stay visible throughout. */}
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <span className="text-xs text-muted">
          Question <span className="font-medium text-ink">{index + 1}</span> of {questions.length}
          <span className="text-faint"> · {answered} answered</span>
        </span>
        {remaining !== null && (
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium tabular-nums ${low ? 'text-danger' : 'text-muted'}`}>
            <Timer className="h-3.5 w-3.5" aria-hidden />
            {formatClock(remaining)}
          </span>
        )}
      </div>

      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-240 ease-out"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="mt-5">
        <p className="whitespace-pre-line text-base font-medium text-ink text-pretty">{question.questionText}</p>
        <p className="mt-1.5 text-xs text-muted">
          {isMulti ? 'Select every answer that applies.' : 'Select one answer.'}
        </p>

        <ul className="mt-4 space-y-2">
          {question.options.map((option) => {
            const active = selected.includes(option.id);
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => toggle(option.id)}
                  aria-pressed={active}
                  className={`flex w-full items-start gap-3 rounded-md border px-3.5 py-3 text-left text-sm transition-all duration-120 ease-out ${
                    active
                      ? 'border-accent/50 bg-accent-soft text-ink'
                      : 'border-line bg-panel text-ink-soft hover:border-line-strong hover:bg-elevated'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border ${
                      isMulti ? 'rounded' : 'rounded-full'
                    } ${active ? 'border-accent bg-accent text-accent-contrast' : 'border-line-strong'}`}
                    aria-hidden
                  >
                    {active && <CheckCircle2 className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 whitespace-pre-line">{option.optionText}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <ErrorAlert message={error} className="mt-4" />

      <div className="mt-6 flex items-center justify-between gap-2 border-t border-line pt-4">
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Previous
        </button>

        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost btn-sm" onClick={onCancel} disabled={submitting}>
            Leave
          </button>
          {index < questions.length - 1 ? (
            <button type="button" className="btn-primary btn-sm" onClick={() => setIndex((i) => i + 1)}>
              Next <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : (
            <button type="button" className="btn-primary btn-sm" onClick={() => submit(false)} disabled={submitting}>
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              Submit answers
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-2xs text-muted">
        {assessment.passingScore}% is needed to pass. Passing records a verified {assessment.level} level
        for {assessment.skillName} on your profile.
      </p>
    </div>
  );
}

function AttemptResult({ result, onClose, onRetry }) {
  const { attempt, questions } = result;
  const passed = !!attempt.passed;

  return (
    <div>
      <div className={`flex items-start gap-3 rounded-md border px-4 py-3.5 ${
        passed ? 'border-success-line bg-success-bg' : 'border-warn-line bg-warn-bg'
      }`}>
        {passed
          ? <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
          : <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-warn" aria-hidden />}
        <div className="min-w-0">
          <div className={`text-sm font-semibold ${passed ? 'text-success' : 'text-warn'}`}>
            {attempt.percentage}% — {passed ? 'Passed' : 'Not passed'}
            <span className="font-normal"> ({attempt.score} of {attempt.maxScore})</span>
          </div>
          <p className={`mt-1 text-xs ${passed ? 'text-success' : 'text-warn'}`}>
            {passed
              ? `${attempt.skillName} is now verified at ${attempt.level} level on your profile, and counts towards your match scores.`
              : `${attempt.passingScore}% is needed to pass. Review the explanations below and try again when you are ready.`}
          </p>
        </div>
      </div>

      <h3 className="section-label mt-6 mb-3">Every question, with the reasoning</h3>
      <ol className="space-y-3">
        {questions.map((question, index) => (
          <li key={question.id} className="rounded-md border border-line p-3.5">
            <div className="flex items-start gap-2.5">
              {question.isCorrect
                ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />}
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-line text-sm font-medium text-ink">
                  <span className="text-faint">{index + 1}. </span>{question.questionText}
                </p>

                <ul className="mt-2.5 space-y-1">
                  {question.options.map((option) => {
                    const chosen = question.selectedOptionIds.includes(option.id);
                    const tone = option.isCorrect
                      ? 'text-success'
                      : chosen ? 'text-danger line-through' : 'text-muted';
                    return (
                      <li key={option.id} className={`text-xs ${tone}`}>
                        {option.isCorrect ? '✓ ' : chosen ? '✕ ' : '· '}
                        {option.optionText}
                        {chosen && <span className="text-faint"> (your answer)</span>}
                      </li>
                    );
                  })}
                </ul>

                {question.explanation && (
                  <p className="mt-2.5 rounded border border-line bg-elevated/60 px-2.5 py-2 text-xs text-ink-soft">
                    {question.explanation}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
        {!passed && <button className="btn-secondary" onClick={onRetry}>Try again</button>}
        <button className="btn-primary" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

export default function AssessmentsPage() {
  const toast = useToast();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [starting, setStarting] = useState(null);
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/assessments');
      setAssessments(data.assessments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    all: assessments.length,
    passed: assessments.filter((a) => a.bestAttempt?.passed).length,
    untried: assessments.filter((a) => !a.bestAttempt).length,
  }), [assessments]);

  const visible = assessments.filter((a) => {
    if (filter === 'passed') return a.bestAttempt?.passed;
    if (filter === 'untried') return !a.bestAttempt;
    return true;
  });

  const start = async (assessment) => {
    setStarting(assessment.id);
    try {
      const { data } = await api.post(`/assessments/${assessment.id}/attempts`);
      setSession(data);
    } catch (err) {
      toast.error('Could not start the assessment', err.message);
    } finally {
      setStarting(null);
    }
  };

  const handleFinished = (data, auto) => {
    setSession(null);
    setResult(data);
    if (auto) toast.warning('Time ran out', 'Your answers were submitted automatically.');
    else if (data.attempt.passed) {
      toast.success(`Passed — ${data.attempt.percentage}%`, `${data.attempt.skillName} is now verified on your profile.`);
    } else {
      toast.info(`Scored ${data.attempt.percentage}%`, 'Review the explanations and try again when ready.');
    }
    load();
  };

  return (
    <div>
      <PageHeader
        title="Skill assessments"
        description="Passing an assessment records a verified level on your profile, so employers see proof rather than a claim — and your match scores rise."
      >
        {assessments.length > 0 && (
          <Segmented
            ariaLabel="Filter assessments"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'passed', label: 'Passed', count: counts.passed },
              { value: 'untried', label: 'Not attempted', count: counts.untried },
            ]}
          />
        )}
      </PageHeader>

      <ErrorAlert message={error} className="mb-4" />

      {loading ? (
        <SkeletonCards count={4} columns={2} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Award}
          title={assessments.length === 0 ? 'No assessments available yet' : 'Nothing in this view'}
          message={assessments.length === 0
            ? 'Assessments are added per skill. Check back as the catalogue grows.'
            : 'Switch the filter to see the others.'}
        />
      ) : (
        <ul className="stagger grid gap-4 md:grid-cols-2">
          {visible.map((assessment) => {
            const best = assessment.bestAttempt;
            return (
              <li key={assessment.id} className="card card-body flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-ink">{assessment.title}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="badge-outline">{assessment.skillName}</span>
                      <span className={LEVEL_BADGE[assessment.level] || 'badge-muted'}>{assessment.level}</span>
                    </div>
                  </div>
                  {best?.passed && (
                    <span className="badge-success shrink-0">
                      <BadgeCheck className="h-3 w-3" aria-hidden /> Passed
                    </span>
                  )}
                </div>

                {assessment.description && (
                  <p className="mt-3 flex-1 text-sm text-muted text-pretty">{assessment.description}</p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
                  <span>{assessment.questionCount} questions</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-faint" aria-hidden /> {assessment.durationMinutes} min
                  </span>
                  <span>{assessment.passingScore}% to pass</span>
                </div>

                {best && (
                  <div className="mt-3 text-xs text-muted">
                    Best score <span className="font-medium tabular-nums text-ink">{best.percentage}%</span>
                    {' · '}{best.attempts} attempt{best.attempts === 1 ? '' : 's'}
                  </div>
                )}

                <div className="mt-4">
                  <button
                    className={best?.passed ? 'btn-secondary w-full' : 'btn-primary w-full'}
                    onClick={() => start(assessment)}
                    disabled={starting === assessment.id || assessment.questionCount === 0}
                  >
                    {starting === assessment.id && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    {best ? 'Take it again' : 'Start assessment'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={session !== null}
        onClose={() => setSession(null)}
        size="lg"
        title={session?.assessment?.title}
        description={session ? `${session.assessment.skillName} · ${session.assessment.level}` : ''}
      >
        {session && (
          <AttemptRunner
            session={session}
            onFinished={handleFinished}
            onCancel={() => {
              setSession(null);
              toast.info('Attempt left open', 'Resume it from this page before the timer runs out.');
            }}
          />
        )}
      </Modal>

      <Modal
        open={result !== null}
        onClose={() => setResult(null)}
        size="lg"
        title={result ? `${result.attempt.title} — result` : ''}
        description={result ? `${result.attempt.skillName} · ${result.attempt.level}` : ''}
      >
        {result && (
          <AttemptResult
            result={result}
            onClose={() => setResult(null)}
            onRetry={() => {
              const assessment = assessments.find((a) => a.id === result.attempt.assessmentId);
              setResult(null);
              if (assessment) start(assessment);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
